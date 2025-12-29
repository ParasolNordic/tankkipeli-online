// ═══════════════════════════════════════════════════════════
// STAR WARS SPACE BATTLE - PELILOGIIKKA
// ═══════════════════════════════════════════════════════════

// Pelitila
let gameState = {
    ships: [],
    bullets: [],
    obstacles: [],
    explosions: [],
    scores: { p1: 0, p2: 0, p3: 0 },
    gameOver: false,
    stars: []
};

let keys = {};
let myShip = null;

// Generoi tähdet taustalle
function generateStars() {
    gameState.stars = [];
    for (let i = 0; i < 150; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            brightness: Math.random()
        });
    }
}

// Ship-luokka (X-wing, TIE-fighter, Millennium Falcon)
class Ship {
    constructor(x, y, color, playerNumber) {
        this.x = x;
        this.y = y;
        this.width = 45;
        this.angle = playerNumber === 2 ? Math.PI : 0;
        this.speed = 3;
        this.rotationSpeed = 0.05;
        this.color = color;
        this.playerNumber = playerNumber;
        this.alive = true;
        this.lives = 1;
        
        // Määritä aluksen tyyppi pelaajan numeron perusteella
        if (playerNumber === 1) {
            this.type = 'xwing';
            this.name = 'X-Wing';
        } else if (playerNumber === 2) {
            this.type = 'tie';
            this.name = 'TIE Fighter';
        } else {
            this.type = 'falcon';
            this.name = 'Millennium Falcon';
        }
    }
    
    update() {
        if (!this.alive) return;
        
        const oldX = this.x;
        const oldY = this.y;
        
        // Liike (vain oma alus)
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
            
            // Törmäykset esteisiin
            if (this.checkObstacleCollision()) {
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
    
    checkObstacleCollision() {
        for (let obstacle of gameState.obstacles) {
            const dx = this.x - obstacle.x;
            const dy = this.y - obstacle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.width / 2 + obstacle.radius) {
                return true;
            }
        }
        return false;
    }
    
    shoot() {
        if (!this.alive) return;
        
        const bulletSpeed = 8;
        const bullet = {
            x: this.x + Math.cos(this.angle) * (this.width / 2 + 10),
            y: this.y + Math.sin(this.angle) * (this.width / 2 + 10),
            vx: Math.cos(this.angle) * bulletSpeed,
            vy: Math.sin(this.angle) * bulletSpeed,
            color: this.type === 'tie' ? '#00ff00' : '#ff0000',
            shooter: this.playerNumber,
            radius: 4,
            type: this.type
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
    
    drawXWing() {
        // X-Wing hävittäjä (valkoinen)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 2;
        
        // Runko (pystysuora kara)
        ctx.fillRect(-3, -20, 6, 40);
        ctx.strokeRect(-3, -20, 6, 40);
        
        // Ohjaamo (edessä)
        ctx.beginPath();
        ctx.arc(0, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // S-foils (4 siipeä X-muodossa)
        ctx.fillStyle = '#e0e0e0';
        
        // Ylävasen siipi
        ctx.beginPath();
        ctx.moveTo(-3, -15);
        ctx.lineTo(-20, -25);
        ctx.lineTo(-20, -20);
        ctx.lineTo(-3, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Yläoikea siipi
        ctx.beginPath();
        ctx.moveTo(3, -15);
        ctx.lineTo(20, -25);
        ctx.lineTo(20, -20);
        ctx.lineTo(3, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Alavasen siipi
        ctx.beginPath();
        ctx.moveTo(-3, 15);
        ctx.lineTo(-20, 25);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-3, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Alaoikea siipi
        ctx.beginPath();
        ctx.moveTo(3, 15);
        ctx.lineTo(20, 25);
        ctx.lineTo(20, 20);
        ctx.lineTo(3, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Moottorit siipien päissä (punaiset hehkut)
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(-20, -22.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(20, -22.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-20, 22.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(20, 22.5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTIEFighter() {
        // TIE Fighter (vaalean sinertävä-harmaa)
        ctx.strokeStyle = '#b0c4de';
        ctx.fillStyle = '#708090';
        ctx.lineWidth = 2;
        
        // Keskipallo (ohjaamo)
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Ikkunat keskipallossa
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(2, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Vasen siipi (kuusikulmio)
        ctx.fillStyle = '#708090';
        ctx.strokeStyle = '#b0c4de';
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(-25, -18);
        ctx.lineTo(-25, 18);
        ctx.lineTo(-10, 15);
        ctx.lineTo(-10, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Siiven yksityiskohdat (viivat)
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1;
        for (let i = -12; i < 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(-10, i);
            ctx.lineTo(-25, i);
            ctx.stroke();
        }
        
        // Oikea siipi (kuusikulmio)
        ctx.fillStyle = '#708090';
        ctx.strokeStyle = '#b0c4de';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, -15);
        ctx.lineTo(25, -18);
        ctx.lineTo(25, 18);
        ctx.lineTo(10, 15);
        ctx.lineTo(10, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Siiven yksityiskohdat (viivat)
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 1;
        for (let i = -12; i < 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(10, i);
            ctx.lineTo(25, i);
            ctx.stroke();
        }
    }
    
    drawMillenniumFalcon() {
        // Millennium Falcon (harmaa, pyöreähkö)
        ctx.fillStyle = '#9e9e9e';
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        
        // Päärunko (soikea)
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Ohjaamo (kupoli edessä)
        ctx.fillStyle = '#4a90e2';
        ctx.beginPath();
        ctx.ellipse(-5, -6, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Hyperdrive-säiliöt (sivuilla)
        ctx.fillStyle = '#7a7a7a';
        ctx.strokeStyle = '#555555';
        ctx.fillRect(-18, -10, 8, 5);
        ctx.strokeRect(-18, -10, 8, 5);
        ctx.fillRect(-18, 5, 8, 5);
        ctx.strokeRect(-18, 5, 8, 5);
        
        // Tutkaantenni (sivussa)
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(18, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(18, -8);
        ctx.lineTo(22, -12);
        ctx.stroke();
        
        // Yksityiskohtia (paneelit)
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(10, -8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-15, 8);
        ctx.lineTo(10, 8);
        ctx.stroke();
        
        // Moottoreiden hehku (takana, sininen)
        ctx.fillStyle = '#00bfff';
        ctx.beginPath();
        ctx.arc(22, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(22, 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    draw() {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Piirrä oikea alus tyypin mukaan
        if (this.type === 'xwing') {
            this.drawXWing();
        } else if (this.type === 'tie') {
            this.drawTIEFighter();
        } else if (this.type === 'falcon') {
            this.drawMillenniumFalcon();
        }
        
        ctx.restore();
        
        // Pelaajan numero
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('P' + this.playerNumber, this.x, this.y - this.width / 2 - 8);
        ctx.fillText('P' + this.playerNumber, this.x, this.y - this.width / 2 - 8);
    }
}

// Bullet-luokka (laser-ammukset)
class Bullet {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.vx = data.vx;
        this.vy = data.vy;
        this.color = data.color;
        this.shooter = data.shooter;
        this.radius = data.radius || 4;
        this.id = data.id;
        this.active = true;
        this.bounces = 0;
        this.maxBounces = gameSettings.bounceEnabled ? 3 : 0;
        this.type = data.type || 'xwing';
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
            // Ei kimpoamista
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
                socket.emit('bulletDestroyed', this.id);
            }
        }
        
        // Törmäys esteisiin
        for (let obstacle of gameState.obstacles) {
            if (this.checkObstacleCollision(obstacle)) {
                if (gameSettings.bounceEnabled && this.bounces < this.maxBounces) {
                    // Kimpoa esteestä
                    const dx = this.x - obstacle.x;
                    const dy = this.y - obstacle.y;
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    this.vx = Math.cos(angle) * speed;
                    this.vy = Math.sin(angle) * speed;
                    this.bounces++;
                } else {
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                }
                break;
            }
        }
        
        // Törmäys aluksiin
        for (let ship of gameState.ships) {
            if (ship.alive && ship.playerNumber !== this.shooter) {
                const dx = this.x - ship.x;
                const dy = this.y - ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.radius + ship.width / 2) {
                    // Osuma!
                    this.active = false;
                    socket.emit('bulletDestroyed', this.id);
                    socket.emit('playerHit', {
                        victimId: ship.playerNumber,
                        shooterId: this.shooter
                    });
                    
                    // Luo räjähdys
                    gameState.explosions.push(new Explosion(ship.x, ship.y));
                    break;
                }
            }
        }
    }
    
    checkObstacleCollision(obstacle) {
        const dx = this.x - obstacle.x;
        const dy = this.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + obstacle.radius;
    }
    
    draw() {
        if (!this.active) return;
        
        // Lasersäde tyylinen ammus
        ctx.save();
        
        // Hehku
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // Varsinainen laser
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const angle = Math.atan2(this.vy, this.vx);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillRect(-6, -2, 12, 4);
        ctx.restore();
        
        // Kirkas keskus
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Obstacle-luokka (planeetat ja asteroidit)
class Obstacle {
    constructor(x, y, radius, type) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type || (Math.random() > 0.5 ? 'planet' : 'asteroid');
        this.color = this.generateColor();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }
    
    generateColor() {
        if (this.type === 'planet') {
            const colors = ['#4a90e2', '#e27a4a', '#7a4ae2', '#4ae27a', '#e2e24a'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else {
            return '#888888';
        }
    }
    
    update() {
        this.rotation += this.rotationSpeed;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'planet') {
            // Planeetta (pallo varjostuksella)
            const gradient = ctx.createRadialGradient(-this.radius/3, -this.radius/3, 0, 0, 0, this.radius);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.7, this.darkenColor(this.color, 0.5));
            gradient.addColorStop(1, this.darkenColor(this.color, 0.8));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Planeetan renkaat (joillakin)
            if (Math.random() > 0.7) {
                ctx.strokeStyle = this.color + '80';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // Asteroidi (epäsäännöllinen kivi)
            ctx.fillStyle = '#666666';
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const variance = 0.7 + Math.random() * 0.3;
                const x = Math.cos(angle) * this.radius * variance;
                const y = Math.sin(angle) * this.radius * variance;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Kraatterit
            ctx.fillStyle = '#444444';
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * this.radius * 0.5;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                const size = this.radius * 0.15;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }
}

// Explosion-luokka
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 50;
        this.alpha = 1;
        this.particles = [];
        
        // Luo partikkeleita
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 1,
                alpha: 1
            });
        }
    }
    
    update() {
        this.radius += 2;
        this.alpha -= 0.02;
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
        });
    }
    
    draw() {
        // Pääräjähdys
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Partikkelit
        this.particles.forEach(p => {
            if (p.alpha > 0) {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
    }
    
    isFinished() {
        return this.alpha <= 0;
    }
}

// ═══════════════════════════════════════════════════════════
// PELIN PÄIVITYS & PIIRTO
// ═══════════════════════════════════════════════════════════

function gameLoop() {
    // Päivitä
    gameState.ships.forEach(ship => ship.update());
    gameState.bullets.forEach(bullet => bullet.update());
    gameState.obstacles.forEach(obstacle => obstacle.update());
    gameState.explosions.forEach(explosion => explosion.update());
    
    // Poista vanhat räjähdykset
    gameState.explosions = gameState.explosions.filter(e => !e.isFinished());
    
    // Poista inaktiiviset ammukset
    gameState.bullets = gameState.bullets.filter(b => b.active);
    
    // Piirrä
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    // Tyhjennä tausta (musta avaruus)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Piirrä tähdet
    gameState.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Piirrä esteet (planeetat/asteroidit)
    gameState.obstacles.forEach(obstacle => obstacle.draw());
    
    // Piirrä ammukset
    gameState.bullets.forEach(bullet => bullet.draw());
    
    // Piirrä alukset
    gameState.ships.forEach(ship => ship.draw());
    
    // Piirrä räjähdykset
    gameState.explosions.forEach(explosion => explosion.draw());
}

// ═══════════════════════════════════════════════════════════
// PELIN ALUSTUS
// ═══════════════════════════════════════════════════════════

function initGame(playerNumber, playerCount, bounceEnabled) {
    console.log(`🎮 Alustetaan Star Wars peli: P${playerNumber}/${playerCount}`);
    
    myPlayerNumber = playerNumber;
    gameSettings = { playerCount, bounceEnabled };
    
    // Generoi tähdet
    generateStars();
    
    // Luo alukset
    gameState.ships = [];
    const colors = ['#ffffff', '#708090', '#9e9e9e'];
    
    if (playerCount === 2) {
        gameState.ships.push(new Ship(200, canvas.height / 2, colors[0], 1));
        gameState.ships.push(new Ship(canvas.width - 200, canvas.height / 2, colors[1], 2));
    } else if (playerCount === 3) {
        gameState.ships.push(new Ship(200, canvas.height / 2, colors[0], 1));
        gameState.ships.push(new Ship(canvas.width - 200, canvas.height / 2, colors[1], 2));
        gameState.ships.push(new Ship(canvas.width / 2, 200, colors[2], 3));
    }
    
    // Aseta oma alus
    myShip = gameState.ships.find(s => s.playerNumber === playerNumber);
    
    // Generoi esteet (vain host)
    if (playerNumber === 1) {
        generateObstacles();
        socket.emit('wallsGenerated', gameState.obstacles.map(o => ({
            x: o.x,
            y: o.y,
            radius: o.radius,
            type: o.type
        })));
    }
    
    // Aloita peli
    console.log('✅ Peli alustettu! Aloitetaan game loop...');
    gameLoop();
    setupTouchControls();
}

function generateObstacles() {
    gameState.obstacles = [];
    const obstacleCount = 6;
    const minDistance = 150;
    
    for (let i = 0; i < obstacleCount; i++) {
        let x, y, radius;
        let attempts = 0;
        
        do {
            x = Math.random() * (canvas.width - 200) + 100;
            y = Math.random() * (canvas.height - 200) + 100;
            radius = Math.random() * 30 + 40;
            attempts++;
        } while (attempts < 50 && !isValidObstaclePosition(x, y, radius, minDistance));
        
        if (attempts < 50) {
            gameState.obstacles.push(new Obstacle(x, y, radius));
        }
    }
    
    console.log(`🪐 Generoitu ${gameState.obstacles.length} estettä`);
}

function isValidObstaclePosition(x, y, radius, minDistance) {
    // Tarkista että ei ole liian lähellä muita esteitä
    for (let obstacle of gameState.obstacles) {
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius + obstacle.radius + minDistance) {
            return false;
        }
    }
    
    // Tarkista että ei ole liian lähellä aloituspisteitä
    const startPositions = [
        { x: 200, y: canvas.height / 2 },
        { x: canvas.width - 200, y: canvas.height / 2 },
        { x: canvas.width / 2, y: 200 }
    ];
    
    for (let pos of startPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius + minDistance) {
            return false;
        }
    }
    
    return true;
}

function checkGameOver() {
    const alivePlayers = gameState.ships.filter(s => s.alive);
    
    if (alivePlayers.length === 1) {
        gameState.gameOver = true;
        const winner = alivePlayers[0].playerNumber;
        
        document.getElementById('message').textContent = `${alivePlayers[0].name} voitti!`;
        
        socket.emit('roundEnd', { winner });
        
        setTimeout(() => {
            resetRound();
            socket.emit('newRound');
        }, 3000);
    } else if (alivePlayers.length === 0) {
        gameState.gameOver = true;
        document.getElementById('message').textContent = 'Tasapeli!';
        
        setTimeout(() => {
            resetRound();
            socket.emit('newRound');
        }, 3000);
    }
}

function resetRound() {
    gameState.gameOver = false;
    gameState.bullets = [];
    gameState.explosions = [];
    
    gameState.ships.forEach(ship => {
        ship.reset();
        if (ship.playerNumber === 1) {
            ship.x = 200;
            ship.y = canvas.height / 2;
            ship.angle = 0;
        } else if (ship.playerNumber === 2) {
            ship.x = canvas.width - 200;
            ship.y = canvas.height / 2;
            ship.angle = Math.PI;
        } else if (ship.playerNumber === 3) {
            ship.x = canvas.width / 2;
            ship.y = 200;
            ship.angle = Math.PI / 2;
        }
    });
    
    document.getElementById('message').textContent = '';
}

function updateScores(scores) {
    gameState.scores = scores;
    document.getElementById('score-p1').textContent = scores.p1;
    document.getElementById('score-p2').textContent = scores.p2;
    if (gameSettings.playerCount === 3) {
        document.getElementById('score-p3').textContent = scores.p3;
    }
}

// ═══════════════════════════════════════════════════════════
// KONTROLLIT
// ═══════════════════════════════════════════════════════════

function setupTouchControls() {
    const controls = document.getElementById('controls');
    const colors = ['#ffffff', '#708090', '#9e9e9e'];
    const playerColor = colors[myPlayerNumber - 1];
    
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
                font-size: 30px;
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
            <button class="big-shoot-btn" id="shootBtn">⚡</button>
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
    if (myShip && myShip.alive) {
        console.log('⚡ Laser fired!');
        myShip.shoot();
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
        if (myShip) myShip.shoot();
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

function setupGameSocketEvents() {
    console.log('🎮 Rekisteröidään pelin socket-eventit...');
    
    socket.on('playerUpdate', (data) => {
        const ship = gameState.ships.find(s => s.playerNumber === data.playerNumber);
        if (ship && ship.playerNumber !== myPlayerNumber) {
            ship.x = data.data.x;
            ship.y = data.data.y;
            ship.angle = data.data.angle;
        }
    });

    socket.on('bulletFired', (data) => {
        const bullet = new Bullet(data);
        gameState.bullets.push(bullet);
    });

    socket.on('bulletDestroyed', (bulletId) => {
        gameState.bullets = gameState.bullets.filter(b => b.id !== bulletId);
    });

    socket.on('playerHit', (data) => {
        const ship = gameState.ships.find(s => s.playerNumber === data.victimId);
        if (ship) {
            gameState.explosions.push(new Explosion(ship.x, ship.y));
            ship.hit();
            checkGameOver();
        }
    });

    socket.on('roundEnd', (data) => {
        updateScores(data.scores);
    });

    socket.on('newRound', (data) => {
        if (data.scores) {
            updateScores(data.scores);
        }
    });

    socket.on('wallsGenerated', (obstacles) => {
        console.log('🪐 Esteet vastaanotettu:', obstacles.length);
        gameState.obstacles = obstacles.map(o => new Obstacle(o.x, o.y, o.radius, o.type));
    });

    socket.on('playerLeft', (data) => {
        document.getElementById('message').textContent = `Pelaaja ${data.playerNumber} poistui pelistä`;
    });
    
    console.log('✅ Pelin socket-eventit rekisteröity!');
}

console.log('🚀 Star Wars Space Battle logiikka ladattu!');
