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
        
        // Runko (suorakulmio)
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.width / 2.5, this.width, this.width * 0.8);
        
        // Runko reuna (musta)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.width / 2, -this.width / 2.5, this.width, this.width * 0.8);
        
        // Torni (pienempi neliö keskellä)
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -8, 16, 16);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -8, 16, 16);
        
        // Putki (tykin piippu)
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -3, this.width / 2 + 5, 6);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -3, this.width / 2 + 5, 6);
        
        ctx.restore();
        
        // Pelaajan numero
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('P' + this.playerNumber, this.x, this.y - this.width / 2 - 8);
        ctx.fillText('P' + this.playerNumber, this.x, this.y - this.width / 2 - 8);
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
        // Satunnainen talotyyppi
        this.type = Math.random() > 0.5 ? 'brick' : 'concrete';
        
        // Luo ikkunat kerran (ei vilkkumista!)
        this.windows = [];
        const windowsX = Math.floor(this.width / 20);
        const windowsY = Math.floor(this.height / 20);
        
        for (let wy = 0; wy < windowsY; wy++) {
            for (let wx = 0; wx < windowsX; wx++) {
                this.windows.push({
                    x: wx,
                    y: wy,
                    lit: Math.random() > 0.3 // Onko valaistuna?
                });
            }
        }
    }
    
    draw() {
        if (this.type === 'brick') {
            // TIILITALO (oranssi/ruskea)
            ctx.fillStyle = '#A0522D'; // Tiili
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Reunat
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Tiilirivit
            const brickHeight = 12;
            const brickWidth = 20;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            
            for (let row = 0; row * brickHeight < this.height; row++) {
                const offsetX = (row % 2) * (brickWidth / 2);
                for (let col = 0; col * brickWidth < this.width + brickWidth; col++) {
                    const bx = this.x + col * brickWidth - offsetX;
                    const by = this.y + row * brickHeight;
                    if (bx >= this.x && bx < this.x + this.width) {
                        ctx.strokeRect(bx, by, brickWidth, brickHeight);
                    }
                }
            }
            
            // Ikkunat (tallennetut, ei vilkkumista)
            const windowSize = 8;
            const windowsX = Math.floor(this.width / 25);
            const windowsY = Math.floor(this.height / 25);
            
            let windowIndex = 0;
            for (let wy = 0; wy < windowsY; wy++) {
                for (let wx = 0; wx < windowsX; wx++) {
                    const winX = this.x + (wx + 1) * (this.width / (windowsX + 1)) - windowSize / 2;
                    const winY = this.y + (wy + 1) * (this.height / (windowsY + 1)) - windowSize / 2;
                    
                    // Ikkuna (käytä tallennettua tilaa)
                    const window = this.windows[windowIndex] || { lit: false };
                    ctx.fillStyle = window.lit ? '#FFD700' : '#444';
                    ctx.fillRect(winX, winY, windowSize, windowSize);
                    
                    // Ikkunan reuna
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(winX, winY, windowSize, windowSize);
                    
                    windowIndex++;
                }
            }
            
            // Ovi (jos riittävän leveä)
            if (this.width > 40 && this.height > 40) {
                const doorWidth = 15;
                const doorHeight = 25;
                const doorX = this.x + this.width / 2 - doorWidth / 2;
                const doorY = this.y + this.height - doorHeight;
                
                ctx.fillStyle = '#4A2C2A'; // Tumma ruskea ovi
                ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);
            }
            
        } else {
            // BETONITALO (harmaa kerrostalo)
            ctx.fillStyle = '#6B6B6B'; // Betoni
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Reunat
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Ikkunat (tallennetut, ei vilkkumista)
            const windowSize = 8;
            const windowsX = Math.floor(this.width / 20);
            const windowsY = Math.floor(this.height / 20);
            
            let windowIndex = 0;
            for (let wy = 0; wy < windowsY; wy++) {
                for (let wx = 0; wx < windowsX; wx++) {
                    const winX = this.x + (wx + 1) * (this.width / (windowsX + 1)) - windowSize / 2;
                    const winY = this.y + (wy + 1) * (this.height / (windowsY + 1)) - windowSize / 2;
                    
                    // Ikkuna (käytä tallennettua tilaa)
                    const window = this.windows[windowIndex] || { lit: false };
                    ctx.fillStyle = window.lit ? '#87CEEB' : '#333';
                    ctx.fillRect(winX, winY, windowSize, windowSize);
                    
                    // Ikkunan reuna
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(winX, winY, windowSize, windowSize);
                    
                    windowIndex++;
                }
            }
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
    // Luo tankit ENSIN (jotta generateWalls voi käyttää niitä turvavyöhykkeisiin)
    const colors = ['#00FF00', '#FF5722', '#2196F3'];
    const positions = [
        { x: 80, y: canvas.height / 2 },  // Vasen reuna
        { x: canvas.width - 80, y: canvas.height / 2 },  // Oikea reuna
        { x: canvas.width / 2, y: 80 }  // Yläreuna
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
    }
    
    // Generoi seinät TANKKIEN JÄLKEEN (välttää tankkien spawn-pisteitä)
    if (isHost) {
        generateWalls();
    }
    
    // Assignoidaan oma tankki LOPUKSI
    for (let i = 0; i < gameState.tanks.length; i++) {
        if (gameState.tanks[i].playerNumber === myPlayerNumber) {
            myTank = gameState.tanks[i];
            break;
        }
    }
    
    // Aloita game loop
    gameLoop();
}

// Generoi seinät (vain host lähettää)
function generateWalls() {
    gameState.walls = [];
    const wallCount = 8;
    
    // Suurempi turvavyöhyke tankeille (300x300px)
    const safeZones = gameState.tanks.map(tank => ({
        x: tank.x - 150,
        y: tank.y - 150,
        width: 300,
        height: 300
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
let gameOverHandled = false;

function checkGameOver() {
    const aliveTanks = gameState.tanks.filter(t => t.alive);
    
    if (aliveTanks.length === 1 && !gameOverHandled) {
        gameOverHandled = true;
        gameState.gameOver = true;
        const winner = aliveTanks[0].playerNumber;
        
        document.getElementById('message').textContent = `🎉 Pelaaja ${winner} voitti!`;
        
        // Lähetä tulos palvelimelle (vain kerran!)
        if (isHost) {
            socket.emit('roundEnd', { winner });
        }
        
        // Odota ja aloita uusi kierros (vain kerran!)
        setTimeout(() => {
            const wantNewRound = confirm('Uusi kierros, vassakuu?');
            if (wantNewRound) {
                resetRound();
            }
        }, 2000);
    }
}

// Nollaa kierros
function resetRound() {
    gameOverHandled = false;
    gameState.gameOver = false;
    gameState.bullets = [];
    gameState.explosions = [];
    
    gameState.tanks.forEach(tank => tank.reset());
    
    // Palauta alkuasennot (1000x550 pelialue)
    const positions = [
        { x: 80, y: canvas.height / 2 },
        { x: canvas.width - 80, y: canvas.height / 2 },
        { x: canvas.width / 2, y: 80 }
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
    
    // Väri pelaajan numeron mukaan
    const colors = ['#00FF00', '#FF5722', '#2196F3'];
    const playerColor = colors[myPlayerNumber - 1];
    
    // Luo YKSI ohjain tälle pelaajalle
    controls.innerHTML = `
        <style>
            #controls {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background: transparent;
                gap: 20px;
                height: 140px;
                z-index: 1000;
            }
            
            .shoot-container {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .big-shoot-btn {
                width: 100px;
                height: 100px;
                border: 3px solid ${playerColor};
                border-radius: 50%;
                background: rgba(${hexToRgb(playerColor)}, 0.3);
                color: ${playerColor};
                font-size: 36px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                touch-action: none;
                transition: transform 0.1s, background 0.1s;
            }
            
            .big-shoot-btn:active {
                transform: scale(0.9);
                background: rgba(${hexToRgb(playerColor)}, 0.5);
            }
            
            .dpad-container {
                display: grid;
                grid-template-columns: repeat(3, 55px);
                grid-template-rows: repeat(3, 55px);
                gap: 5px;
            }
            
            .control-btn {
                width: 55px;
                height: 55px;
                border: 2px solid ${playerColor};
                border-radius: 8px;
                background: rgba(${hexToRgb(playerColor)}, 0.2);
                color: ${playerColor};
                font-size: 24px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                touch-action: none;
                transition: background 0.1s;
            }
            
            .control-btn:active {
                background: rgba(${hexToRgb(playerColor)}, 0.5);
            }
            
            .control-btn.empty {
                visibility: hidden;
            }
        </style>
        
        <div class="shoot-container">
            <button class="big-shoot-btn" id="shootBtn">🔥</button>
        </div>
        
        <div class="dpad-container">
            <div class="control-btn empty"></div>
            <div class="control-btn" data-key="up">↑</div>
            <div class="control-btn empty"></div>
            <div class="control-btn" data-key="left">←</div>
            <div class="control-btn empty"></div>
            <div class="control-btn" data-key="right">→</div>
            <div class="control-btn empty"></div>
            <div class="control-btn" data-key="down">↓</div>
            <div class="control-btn empty"></div>
        </div>
    `;
    
    // Lisää tapahtumat
    controls.querySelectorAll('.control-btn:not(.empty)').forEach(btn => {
        btn.addEventListener('touchstart', handleControlPress);
        btn.addEventListener('touchend', handleControlRelease);
        btn.addEventListener('mousedown', handleControlPress);
        btn.addEventListener('mouseup', handleControlRelease);
    });
    
    const shootBtn = document.getElementById('shootBtn');
    shootBtn.addEventListener('click', handleShoot);
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleShoot(e);
    });
    
    controls.style.display = 'flex';
}

// Apufunktio: Muuta hex RGB:ksi
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '255, 255, 255';
}

function handleControlPress(e) {
    e.preventDefault();
    const key = e.target.dataset.key;
    if (key) {
        keys[key] = true;
    }
}

function handleControlRelease(e) {
    e.preventDefault();
    const key = e.target.dataset.key;
    if (key) {
        keys[key] = false;
    }
}

function handleShoot(e) {
    e.preventDefault();
    if (myTank && myTank.alive) {
        console.log('🔫 Ammutaan!');
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

// Rekisteröi pelin socket-eventit (kutsutaan kun peli alkaa)
function setupGameSocketEvents() {
    console.log('🎮 Rekisteröidään pelin socket-eventit...');
    
    // Toinen pelaaja liikkuu
    socket.on('playerUpdate', (data) => {
        console.log('📥 playerUpdate:', data);
        const tank = gameState.tanks.find(t => t.playerNumber === data.playerNumber);
        if (tank && tank.playerNumber !== myPlayerNumber) {
            tank.x = data.data.x;
            tank.y = data.data.y;
            tank.angle = data.data.angle;
        }
    });

    // Ammus ammuttu
    socket.on('bulletFired', (data) => {
        console.log('💥 bulletFired:', data);
        const bullet = new Bullet(data);
        gameState.bullets.push(bullet);
    });

    // Ammus tuhottu
    socket.on('bulletDestroyed', (bulletId) => {
        gameState.bullets = gameState.bullets.filter(b => b.id !== bulletId);
    });

    // Pelaaja osui
    socket.on('playerHit', (data) => {
        console.log('💀 playerHit:', data);
        const tank = gameState.tanks.find(t => t.playerNumber === data.victimId);
        if (tank) {
            gameState.explosions.push(new Explosion(tank.x, tank.y));
            tank.hit();
            checkGameOver();
        }
    });

    // Kierros päättyi
    socket.on('roundEnd', (data) => {
        updateScores(data.scores);
    });

    // Uusi kierros
    socket.on('newRound', (data) => {
        if (data.scores) {
            updateScores(data.scores);
        }
    });

    // Seinät vastaanotettu
    socket.on('wallsGenerated', (walls) => {
        console.log('🧱 Seinät vastaanotettu:', walls.length, 'seinää');
        gameState.walls = walls.map(w => new Wall(w.x, w.y, w.width, w.height));
    });

    // Pelaaja poistui
    socket.on('playerLeft', (data) => {
        document.getElementById('message').textContent = `Pelaaja ${data.playerNumber} poistui pelistä`;
    });
    
    console.log('✅ Pelin socket-eventit rekisteröity!');
}

console.log('🎮 Tankkipeli logiikka ladattu!');
