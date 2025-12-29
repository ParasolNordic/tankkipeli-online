const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS asetukset
app.use(cors());
// Servaa kaikki staattiset tiedostot root-hakemistosta
app.use(express.static(__dirname));

// Socket.IO asetukset
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Pelin tila
const games = new Map();
const roomCodes = new Set();

// Apufunktiot
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substr(2, 4).toUpperCase();
    } while (roomCodes.has(code));
    roomCodes.add(code);
    return code;
}

function createGameState(playerCount, bounceEnabled) {
    const canvasWidth = 1200;
    const canvasHeight = 800;
    
    return {
        playerCount,
        bounceEnabled,
        canvasWidth,
        canvasHeight,
        players: {},
        bullets: [],
        walls: [],
        scores: { p1: 0, p2: 0, p3: 0 },
        gameOver: false,
        lastUpdate: Date.now()
    };
}

// Socket.IO yhteyskäsittely
io.on('connection', (socket) => {
    console.log('🟢 Pilot connected:', socket.id);
    
    // Lähetä palvelimen tila (onko hereillä)
    socket.emit('serverAwake', { 
        awake: true, 
        timestamp: Date.now(),
        message: 'Battle station is ready!'
    });
    
    // Luo uusi peli (Host)
    socket.on('createGame', ({ playerCount, bounceEnabled }) => {
        const roomCode = generateRoomCode();
        const gameState = createGameState(playerCount, bounceEnabled);
        
        gameState.hostId = socket.id;
        gameState.players[socket.id] = {
            id: socket.id,
            playerNumber: 1,
            ready: false
        };
        
        games.set(roomCode, gameState);
        socket.join(roomCode);
        socket.gameRoom = roomCode;
        
        console.log(`🎮 Battle created: ${roomCode} (${playerCount} pilots, bounce: ${bounceEnabled})`);
        
        socket.emit('gameCreated', {
            roomCode,
            playerNumber: 1,
            gameState
        });
    });
    
    // Liity peliin
    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase().trim();
        const game = games.get(roomCode);
        
        if (!game) {
            socket.emit('error', { message: 'Battle not found with code: ' + roomCode });
            return;
        }
        
        const playerCount = Object.keys(game.players).length;
        
        if (playerCount >= game.playerCount) {
            socket.emit('error', { message: 'Battle is full!' });
            return;
        }
        
        const playerNumber = playerCount + 1;
        game.players[socket.id] = {
            id: socket.id,
            playerNumber,
            ready: false
        };
        
        socket.join(roomCode);
        socket.gameRoom = roomCode;
        
        console.log(`👥 Pilot ${playerNumber} joined battle ${roomCode}`);
        
        socket.emit('gameJoined', {
            roomCode,
            playerNumber,
            gameState: game
        });
        
        // Ilmoita muille pelaajille
        socket.to(roomCode).emit('playerJoined', {
            playerNumber,
            totalPlayers: Object.keys(game.players).length
        });
        
        // Jos kaikki pelaajat paikalla, aloita peli
        if (Object.keys(game.players).length === game.playerCount) {
            console.log(`✅ ALL PILOTS READY (${Object.keys(game.players).length}/${game.playerCount}) - Sending allPlayersJoined`);
            setTimeout(() => {
                io.to(roomCode).emit('allPlayersJoined');
                console.log(`📡 allPlayersJoined sent to battle ${roomCode}`);
            }, 1000);
        }
    });
    
    // Pelaajan input (liike, kääntyminen)
    socket.on('playerInput', (data) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        // Päivitä pelaajan data
        if (game.players[socket.id]) {
            game.players[socket.id] = {
                ...game.players[socket.id],
                ...data
            };
        }
        
        // Lähetä kaikille muille (ei takaisin lähettäjälle)
        socket.to(roomCode).emit('playerUpdate', {
            playerId: socket.id,
            playerNumber: game.players[socket.id].playerNumber,
            data
        });
    });
    
    // Ammus ammuttu
    socket.on('bulletFired', (bulletData) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        bulletData.id = `bullet_${Date.now()}_${Math.random()}`;
        game.bullets.push(bulletData);
        
        // Lähetä kaikille
        io.to(roomCode).emit('bulletFired', bulletData);
    });
    
    // Ammus tuhottu
    socket.on('bulletDestroyed', (bulletId) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        game.bullets = game.bullets.filter(b => b.id !== bulletId);
        
        // Lähetä kaikille
        io.to(roomCode).emit('bulletDestroyed', bulletId);
    });
    
    // Pelaaja osui
    socket.on('playerHit', ({ victimId, shooterId }) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        io.to(roomCode).emit('playerHit', { victimId, shooterId });
    });
    
    // Kierros päättyi
    socket.on('roundEnd', ({ winner }) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        // Päivitä pisteet
        if (winner === 1) game.scores.p1++;
        else if (winner === 2) game.scores.p2++;
        else if (winner === 3) game.scores.p3++;
        
        io.to(roomCode).emit('roundEnd', { 
            winner,
            scores: game.scores
        });
    });
    
    // Uusi kierros
    socket.on('newRound', () => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        // Nollaa pelitila (paitsi pisteet)
        game.bullets = [];
        game.gameOver = false;
        
        io.to(roomCode).emit('newRound', {
            scores: game.scores
        });
    });
    
    // Seinät generoitu (host lähettää)
    socket.on('wallsGenerated', (walls) => {
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        game.walls = walls;
        
        // Lähetä kaikille muille
        socket.to(roomCode).emit('wallsGenerated', walls);
    });
    
    // Katkaisu
    socket.on('disconnect', () => {
        console.log('🔴 Pilot disconnected:', socket.id);
        
        const roomCode = socket.gameRoom;
        if (!roomCode) return;
        
        const game = games.get(roomCode);
        if (!game) return;
        
        const playerNumber = game.players[socket.id]?.playerNumber;
        delete game.players[socket.id];
        
        // Ilmoita muille
        socket.to(roomCode).emit('playerLeft', {
            playerId: socket.id,
            playerNumber
        });
        
        // Jos host poistui tai ei pelaajia jäljellä, poista peli
        if (socket.id === game.hostId || Object.keys(game.players).length === 0) {
            console.log(`🗑️ Battle deleted: ${roomCode}`);
            games.delete(roomCode);
            roomCodes.delete(roomCode);
        }
    });
});

// Health check endpoint (pitää Renderin hereillä)
app.get('/ping', (req, res) => {
    res.json({ 
        status: 'alive', 
        timestamp: Date.now(),
        activeGames: games.size 
    });
});

// Serveri info
app.get('/info', (req, res) => {
    res.json({
        status: 'online',
        games: games.size,
        uptime: process.uptime()
    });
});

// Palvelin käyntiin
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
🚀 ════════════════════════════════════════
   STAR WARS SPACE BATTLE - SERVER ONLINE
   ════════════════════════════════════════
   📡 Port: ${PORT}
   🌐 URL: http://localhost:${PORT}
   ⏰ Started: ${new Date().toLocaleString('en-US')}
🚀 ════════════════════════════════════════
    `);
});

// Siivoa vanhoja pelejä (jos ei aktiivisuutta 30 min)
setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 30 * 60 * 1000; // 30 min
    
    games.forEach((game, roomCode) => {
        if (now - game.lastUpdate > TIMEOUT) {
            console.log(`🧹 Cleaning old battle: ${roomCode}`);
            games.delete(roomCode);
            roomCodes.delete(roomCode);
        }
    });
}, 5 * 60 * 1000); // Tarkista 5 min välein
