// ═══════════════════════════════════════════════════════════
// TANKKIPELI ONLINE - PELILOGIIKKA
// ═══════════════════════════════════════════════════════════

// Pelitila
let gameState = {
    tanks: [],
    bullets: [],
    walls: [],
    explosions: [],
    scores: { p1: 0, p2: 0, p3: 0 },
    gameOver: false
};

let keys = {};
let myTank = null;

// Tank-luokka
class Tank {
    constructor(x, y, color, playerNumber) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.angle = playerNumber === 2 ? Math.PI : 0;
        this.speed = 3;
        this.rotationSpeed = 0.05;
        this.color = color;
        this.playerNumber = playerNumber;
        this.alive = true;
        this.lives = 1;
    }
    
    update() {
        if (!this.alive) return;
        
        const oldX = this.x;
        const oldY = this.y;
        
        // Liike (vain oma tankki)
        if (this.playerNumber === myPlayerNumber) {
            if (keys.forward || keys.up) {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
            }
            if (keys.backward || keys.down) {
                this.x -= Math.cos(this.angle) * this.speed;
                this.y -= Math.sin(this.angle) * this.speed;
            }
            if (keys.left) {
                this.angle -= this.rotationSpeed;
            }
            if (keys.right) {
                this.angle += this.rotationSpeed;
            }
            
            // Törmäykset seiniin
            if (this.checkWallCollision()) {
                this.x = oldX;
                this.y = oldY;
            }
            
            // Rajat
            this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
            this.y = Math.max(this.width / 2, Math.min(canvas.height - this.width / 2, this.y));
            
            // Lähetä päivitys palvelimelle
            if (oldX !== this.x || oldY !== this.y || keys.left || keys.right) {
                socket.emit('playerInput', {
                    x: this.x,
                    y: this.y,
                    angle: this.angle
                });
            }
        }
    }
    
    checkWallCollision() {
        for (let wall of gameState.walls) {
            if (this.x - this.width / 2 < wall.x + wall.width &&
                this.x + this.width / 2 > wall.x &&
                this.y - this.width / 2 < wall.y + wall.height &&
                this.y + this.width / 2 > wall.y) {
                return true;
            }
        }
        return false;
    }
    
    shoot() {
        if (!this.alive) return;
        
        const bulletSpeed = 8;
        const bullet = {
            x: this.x + Math.cos(this.angle) * (this.width / 2 + 5),
            y: this.y + Math.sin(this.angle) * (this.width / 2 + 5),
            vx: Math.cos(this.angle) * bulletSpeed,
            vy: Math.sin(this.angle) * bulletSpeed,
            color: this.color,
            shooter: this.playerNumber,
            radius: 5
        };
        
        socket.emit('bulletFired', bullet);
    }
    
    hit() {
        this.alive = false;
        this.lives--;
    }
    
    reset() {
        this.alive = true;
        this.lives = 1;
    }
    
    draw() {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Runko
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.width / 2, this.width, this.width);
        
        // Torni
        ctx.fillRect(-5, -10, 10, 20);
        
        // Putki
        ctx.fillRect(0, -3, this.width / 2, 6);
        
        ctx.restore();
        
        // Pelaajan numero
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('P' + this.playerNumber, this.x, this.y - this.width / 2 - 10);
    }
}

// Bullet-luokka
class Bullet {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.vx = data.vx;
        this.vy = data.vy;
        this.color = data.color;
        this.shooter = data.shooter;
        this.radius = data.radius || 5;
        this.id = data.id;
        this.active = true;
        this.bounces = 0;
        this.maxBounces = gameSettings.bounceEnabled ? 3 : 0;
    }
    
    update() {
        if (!this.active) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Kimpoa reunoista
        if (gameSettings.bounceEnabled) {
            if (this.x <= this.radius || this.x >= canvas.width - this.radius) {
                if (this.bounces < this.maxBounces) {
                    this.vx *= -1;
                    this.bounces++;
                } else {
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                }
            }
            if (this.y <= this.radius || this.y >= canvas.height - this.radius) {
                if (this.bounces < this.maxBounces) {
                    this.vy *= -1;
                    this.bounces++;
                } else {
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                }
            }
        } else {
            // Ei kimpoamista, tuhoa reunoilla
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
                socket.emit('bulletDestroyed', this.id);
            }
        }
        
        // Törmäys seiniin
        for (let wall of gameState.walls) {
            if (this.checkWallCollision(wall)) {
                if (gameSettings.bounceEnabled && this.bounces < this.maxBounces) {
                    // Kimpoa seinästä
                    const centerX = wall.x + wall.width / 2;
                    const centerY = wall.y + wall.height / 2;
                    const dx = this.x - centerX;
                    const dy = this.y - centerY;
                    
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.vx *= -1;
                    } else {
                        this.vy *= -1;
                    }
                    this.bounces++;
                } else {
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                }
                break;
            }
        }
        
        // Törmäys tankkeihin
        for (let tank of gameState.tanks) {
            if (tank.alive && tank.playerNumber !== this.shooter) {
                const dx = this.x - tank.x;
                const dy = this.y - tank.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.radius + tank.width / 2) {
                    // Osuma!
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                    socket.emit('playerHit', {
                        victimId: tank.playerNumber,
                        shooterId: this.shooter
                    });
                    
                    // Luo räjähdys
                    gameState.explosions.push(new Explosion(tank.x, tank.y));
                    tank.hit();
                    
                    // Tarkista onko peli ohi
                    checkGameOver();
                    break;
                }
            }
        }
    }
    
    checkWallCollision(wall) {
        return this.x > wall.x && this.x < wall.x + wall.width &&
               this.y > wall.y && this.y < wall.y + wall.height;
    }
    
    draw() {
        if (!this.active) return;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Wall-luokka
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        ctx.fillStyle = '#555';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Tiiliviivat
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        const brickHeight = this.height / 5;
        for (let i = 1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i * brickHeight);
            ctx.lineTo(this.x + this.width, this.y + i * brickHeight);
            ctx.stroke();
        }
    }
}

// Explosion-luokka
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 60;
        this.speed = 3;
        this.alpha = 1;
    }
    
    update() {
        this.radius += this.speed;
        this.alpha = 1 - (this.radius / this.maxRadius);
    }
    
    isDead() {
        return this.radius >= this.maxRadius;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Ulompi ympyrä (punainen)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Sisempi ympyrä (keltainen)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Alusta peli
function initGame() {
    // Luo tankit
    const colors = ['#00FF00', '#FF5722', '#2196F3'];
    const positions = [
        { x: canvas.width * 0.1, y: canvas.height * 0.5 },
        { x: canvas.width * 0.9, y: canvas.height * 0.5 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1 }
    ];
    
    gameState.tanks = [];
    for (let i = 0; i < gameSettings.playerCount; i++) {
        const tank = new Tank(
            positions[i].x,
            positions[i].y,
            colors[i],
            i + 1
        );
        gameState.tanks.push(tank);
        
        if (i + 1 === myPlayerNumber) {
            myTank = tank;
        }
    }
    
    // Generoi seinät (vain host)
    if (isHost) {
        generateWalls();
    }
    
    // Aloita game loop
    gameLoop();
}

// Generoi seinät (vain host lähettää)
function generateWalls() {
    gameState.walls = [];
    const wallCount = 8;
    
    const safeZones = gameState.tanks.map(tank => ({
        x: tank.x - 100,
        y: tank.y - 100,
        width: 200,
        height: 200
    }));
    
    for (let i = 0; i < wallCount; i++) {
        let validPosition = false;
        let wall;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
            const width = Math.floor(Math.random() * canvas.width * 0.15) + canvas.width * 0.05;
            const height = Math.random() < 0.3 ? 
                Math.floor(Math.random() * canvas.height * 0.17) + canvas.height * 0.1 :
                Math.floor(Math.random() * canvas.height * 0.1) + canvas.height * 0.067;
            
            const x = Math.floor(Math.random() * (canvas.width - width - canvas.width * 0.08)) + canvas.width * 0.04;
            const y = Math.floor(Math.random() * (canvas.height - height - canvas.height * 0.17)) + canvas.height * 0.08;
            
            wall = new Wall(x, y, width, height);
            
            // Tarkista ettei ole tankien turvavyöhykkeillä
            validPosition = safeZones.every(zone => 
                !(x < zone.x + zone.width &&
                  x + width > zone.x &&
                  y < zone.y + zone.height &&
                  y + height > zone.y)
            );
            
            // Tarkista ettei ole liian lähellä muita seiniä
            if (validPosition) {
                validPosition = gameState.walls.every(other =>
                    !(x < other.x + other.width + 30 &&
                      x + width > other.x - 30 &&
                      y < other.y + other.height + 30 &&
                      y + height > other.y - 30)
                );
            }
            
            attempts++;
        }
        
        if (validPosition) {
            gameState.walls.push(wall);
        }
    }
    
    // Lähetä seinät muille pelaajille
    socket.emit('wallsGenerated', gameState.walls.map(w => ({
        x: w.x, y: w.y, width: w.width, height: w.height
    })));
}

// Piirrä tausta
function drawBackground() {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Katuverkko
    ctx.fillStyle = '#4a4a4a';
    
    for (let y = canvas.height * 0.25; y < canvas.height; y += canvas.height * 0.37) {
        ctx.fillRect(0, y - canvas.height * 0.025, canvas.width, canvas.height * 0.05);
    }
    
    for (let x = canvas.width * 0.17; x < canvas.width; x += canvas.width * 0.23) {
        ctx.fillRect(x - canvas.width * 0.0125, 0, canvas.width * 0.025, canvas.height);
    }
    
    // Katuviivat
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    
    for (let y = canvas.height * 0.25; y < canvas.height; y += canvas.height * 0.37) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    for (let x = canvas.width * 0.17; x < canvas.width; x += canvas.width * 0.23) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

// Pelin päivitys
function checkGameOver() {
    const aliveTanks = gameState.tanks.filter(t => t.alive);
    
    if (aliveTanks.length === 1) {
        gameState.gameOver = true;
        const winner = aliveTanks[0].playerNumber;
        
        document.getElementById('message').textContent = `🎉 Pelaaja ${winner} voitti!`;
        
        // Lähetä tulos palvelimelle
        socket.emit('roundEnd', { winner });
        
        // Odota ja aloita uusi kierros
        setTimeout(() => {
            if (confirm('Uusi kierros?')) {
                resetRound();
            }
        }, 3000);
    }
}

// Nollaa kierros
function resetRound() {
    gameState.gameOver = false;
    gameState.bullets = [];
    gameState.explosions = [];
    
    gameState.tanks.forEach(tank => tank.reset());
    
    // Palauta alkuasennot
    const positions = [
        { x: canvas.width * 0.1, y: canvas.height * 0.5 },
        { x: canvas.width * 0.9, y: canvas.height * 0.5 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1 }
    ];
    
    gameState.tanks.forEach((tank, i) => {
        tank.x = positions[i].x;
        tank.y = positions[i].y;
    });
    
    if (isHost) {
        generateWalls();
    }
    
    socket.emit('newRound');
    document.getElementById('message').textContent = '';
}

// Game loop
function gameLoop() {
    drawBackground();
    
    gameState.walls.forEach(wall => wall.draw());
    
    if (!gameState.gameOver) {
        gameState.tanks.forEach(tank => tank.update());
        gameState.bullets.forEach(bullet => bullet.update());
    }
    
    gameState.explosions.forEach(exp => exp.update());
    gameState.explosions = gameState.explosions.filter(exp => !exp.isDead());
    
    gameState.bullets.forEach(bullet => bullet.draw());
    gameState.explosions.forEach(exp => exp.draw());
    gameState.tanks.forEach(tank => tank.draw());
    
    requestAnimationFrame(gameLoop);
}

// Päivitä pisteet
function updateScores(scores) {
    document.getElementById('p1Score').textContent = scores.p1;
    document.getElementById('p2Score').textContent = scores.p2;
    document.getElementById('p3Score').textContent = scores.p3;
}

// Luo ohjaimet
function createControls() {
    const controls = document.getElementById('controls');
    controls.innerHTML = '';
    
    const colors = ['#00FF00', '#FF5722', '#2196F3'];
    const playerClass = ['player1-controls', 'player2-controls', 'player3-controls'];
    
    for (let i = 0; i < gameSettings.playerCount; i++) {
        const group = document.createElement('div');
        group.className = `control-group ${playerClass[i]}`;
        
        group.innerHTML = `
            <div class="dpad-container">
                <div class="control-btn empty"></div>
                <div class="control-btn" data-player="${i+1}" data-key="up">↑</div>
                <div class="control-btn empty"></div>
                <div class="control-btn" data-player="${i+1}" data-key="left">←</div>
                <button class="shoot-btn" data-player="${i+1}">💥</button>
                <div class="control-btn" data-player="${i+1}" data-key="right">→</div>
                <div class="control-btn empty"></div>
                <div class="control-btn" data-player="${i+1}" data-key="down">↓</div>
                <div class="control-btn empty"></div>
            </div>
        `;
        
        controls.appendChild(group);
    }
    
    // Lisää tapahtumat ohjaimillemme
    controls.querySelectorAll('.control-btn:not(.empty)').forEach(btn => {
        btn.addEventListener('touchstart', handleControlPress);
        btn.addEventListener('touchend', handleControlRelease);
        btn.addEventListener('mousedown', handleControlPress);
        btn.addEventListener('mouseup', handleControlRelease);
    });
    
    controls.querySelectorAll('.shoot-btn').forEach(btn => {
        btn.addEventListener('click', handleShoot);
    });
    
    controls.style.display = 'flex';
}

function handleControlPress(e) {
    e.preventDefault();
    const player = parseInt(e.target.dataset.player);
    const key = e.target.dataset.key;
    
    if (player === myPlayerNumber) {
        keys[key] = true;
    }
}

function handleControlRelease(e) {
    e.preventDefault();
    const player = parseInt(e.target.dataset.player);
    const key = e.target.dataset.key;
    
    if (player === myPlayerNumber) {
        keys[key] = false;
    }
}

function handleShoot(e) {
    e.preventDefault();
    const player = parseInt(e.target.dataset.player);
    
    if (player === myPlayerNumber && myTank) {
        myTank.shoot();
    }
}

// Näppäimistökontrollit
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keys.up = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keys.down = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
        e.preventDefault();
    }
    if (e.key === ' ' || e.key === 'Enter') {
        if (myTank) myTank.shoot();
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// ═══════════════════════════════════════════════════════════
// SOCKET TAPAHTUMAT
// ═══════════════════════════════════════════════════════════

// Toinen pelaaja liikkuu
socket && socket.on('playerUpdate', (data) => {
    const tank = gameState.tanks.find(t => t.playerNumber === data.playerNumber);
    if (tank && tank.playerNumber !== myPlayerNumber) {
        tank.x = data.data.x;
        tank.y = data.data.y;
        tank.angle = data.data.angle;
    }
});

// Ammus ammuttu
socket && socket.on('bulletFired', (data) => {
    const bullet = new Bullet(data);
    gameState.bullets.push(bullet);
});

// Ammus tuhottu
socket && socket.on('bulletDestroyed', (bulletId) => {
    gameState.bullets = gameState.bullets.filter(b => b.id !== bulletId);
});

// Pelaaja osui
socket && socket.on('playerHit', (data) => {
    const tank = gameState.tanks.find(t => t.playerNumber === data.victimId);
    if (tank) {
        gameState.explosions.push(new Explosion(tank.x, tank.y));
        tank.hit();
        checkGameOver();
    }
});

// Kierros päättyi
socket && socket.on('roundEnd', (data) => {
    updateScores(data.scores);
});

// Uusi kierros
socket && socket.on('newRound', (data) => {
    if (data.scores) {
        updateScores(data.scores);
    }
});

// Seinät vastaanotettu
socket && socket.on('wallsGenerated', (walls) => {
    gameState.walls = walls.map(w => new Wall(w.x, w.y, w.width, w.height));
});

// Pelaaja poistui
socket && socket.on('playerLeft', (data) => {
    document.getElementById('message').textContent = `Pelaaja ${data.playerNumber} poistui pelistä`;
    
    // Voit lisätä logiikan pelaajan poistamiseen
});

console.log('🎮 Tankkipeli logiikka ladattu!');
