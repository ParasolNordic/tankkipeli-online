# 📁 PROJEKTIN RAKENNE

```
tankkipeli-online/
│
├── 📄 package.json          # Node.js riippuvuudet ja skriptit
├── 📄 server.js             # WebSocket-palvelin (Node.js + Socket.IO)
│
├── 📁 public/               # Client-puolen tiedostot (selain)
│   ├── 📄 index.html        # Pääsivu: valikot, herätysviesti, UI
│   └── 📄 game.js           # Pelilogiikka: tankit, ammukset, fysiikka
│
├── 📄 README.md             # Pääohjeet (LUE TÄMÄ ENSIN!)
├── 📄 DEPLOY.md             # Yksityiskohtaiset deployment-ohjeet
├── 📄 QUICK_START.md        # 5 min pika-aloitus
├── 📄 PROJECT_STRUCTURE.md  # Tämä tiedosto
└── 📄 .gitignore            # Git: mitä EI lähetetä GitHubiin

```

## 📄 TIEDOSTOJEN KUVAUKSET

### `package.json`
**Mitä**: Node.js projektin asetukset
**Sisältää**:
- Riippuvuudet: Express, Socket.IO, CORS
- Skriptit: `npm start` käynnistää palvelimen
- Metadata: nimi, versio, jne.

### `server.js` ⭐ PALVELIN
**Mitä**: WebSocket-palvelin joka pyörii Renderissä
**Tehtävät**:
- Luo pelihuoneet (room codes)
- Synkronoi pelaajien liikkeet
- Hallitsee ammuksia
- Lähettää päivitykset kaikille pelaajille
- Seuraa pistetilannetta

**Teknologia**: Node.js + Express + Socket.IO

**Tärkeät osat**:
```javascript
// Luo peli
socket.on('createGame', ...)

// Liity peliin  
socket.on('joinGame', ...)

// Pelaajan input
socket.on('playerInput', ...)

// Ammus ammuttu
socket.on('bulletFired', ...)
```

### `public/index.html` ⭐ CLIENT (UI)
**Mitä**: Käyttöliittymä joka pyörii selaimessa
**Sisältää**:
- 🛌 **Herätysviesti** + aikalaskuri (30s)
- 📱 **Valikot**: Luo peli / Liity
- 🔢 **QR-koodi** generaattori
- 🎮 **Pelinäkymä**: canvas + pisteet
- 🕹️ **Ohjaimet**: touch + näppäimistö

**Tärkeät osat**:
```javascript
// Yhdistä palvelimeen
connectToServer()

// Näytä herätysviesti
showWakeupScreen()

// Luo peli
createGame(bounceEnabled)

// Liity peliin
joinGame()
```

### `public/game.js` ⭐ CLIENT (PELILOGIIKKA)
**Mitä**: Pelin fysiikka ja logiikka selaimessa
**Sisältää**:
- 🚗 **Tank** - Tankki-luokka (liike, osuma, piirto)
- 🔫 **Bullet** - Ammus-luokka (lento, kimpoa, törmäys)
- 🧱 **Wall** - Seinä-luokka (este, piirto)
- 💥 **Explosion** - Räjähdys-animaatio
- 🎮 **gameLoop()** - Pelin pääsilmukka (60 fps)

**Arkkitehtuuri**:
```
Oma tankki → liiku paikallisesti → lähetä palvelimelle
Muut tankit → vastaanota palvelimelta → päivitä

Oma ammus → luo paikallisesti → lähetä palvelimelle
Muut ammukset → vastaanota → luo + animoi
```

### `README.md`
**LUE TÄMÄ ENSIN!**
- Mikä on projekti
- Miten asentaa paikallisesti
- Miten deployta Renderiin
- Miten pelata
- Miten jakaa kavereille
- Ongelmien ratkaisu

### `DEPLOY.md`
**Yksityiskohtaiset deployment-ohjeet**
- GitHub-tilin luonti
- Repository luonti
- Git-komentojen selitykset
- Render-tilin luonti
- Konfiguraatio-asetukset
- Ongelmien diagnosointi

### `QUICK_START.md`
**5 minuutin pika-aloitus**
- Nopein tapa saada peli nettiin
- Minimaaliset selitykset
- Komentoesimerkit

## 🔄 DATAVIRTA

```
┌─────────────┐                    ┌─────────────┐
│  PELAAJA 1  │                    │  PELAAJA 2  │
│  (Selain)   │                    │  (Selain)   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ WebSocket                        │ WebSocket
       │ (Socket.IO)                      │ (Socket.IO)
       │                                  │
       ├──────────────┬───────────────────┤
                      │
              ┌───────▼────────┐
              │   SERVER.JS    │
              │   (Render)     │
              │                │
              │  - Room codes  │
              │  - Game state  │
              │  - Sync data   │
              └────────────────┘

```

**Esimerkki datavirrasta:**

1. **Pelaaja 1 liikkuu** →
   ```javascript
   // game.js
   tank.x += speed
   socket.emit('playerInput', { x, y, angle })
   ```

2. **Palvelin vastaanottaa** →
   ```javascript
   // server.js
   socket.on('playerInput', (data) => {
     game.players[socket.id] = data
     socket.to(roomCode).emit('playerUpdate', data)
   })
   ```

3. **Pelaaja 2 vastaanottaa** →
   ```javascript
   // game.js
   socket.on('playerUpdate', (data) => {
     otherTank.x = data.x
     otherTank.y = data.y
   })
   ```

## 🚀 MITEN KOODI AJETAAN?

### Paikallisesti (dev):
```bash
npm start
→ Node käynnistää server.js
→ Express servaa public/ kansion
→ Avaa: http://localhost:3000
```

### Renderissä (production):
```bash
Render:
1. git clone → kloonaa GitHubista
2. npm install → asentaa riippuvuudet
3. npm start → käynnistää server.js
4. → Palvelin kuuntelee portissa $PORT
5. → Render antaa julkisen URL:n
```

## 🔧 MITEN MUOKATA?

### Muuta pelinopeutta:
```javascript
// public/game.js
class Tank {
  speed = 3;  // ← muuta tätä (1-10)
}
```

### Muuta tankin kokoa:
```javascript
// public/game.js
class Tank {
  width = 40;  // ← muuta tätä (20-80)
}
```

### Muuta seinien määrää:
```javascript
// public/game.js
function generateWalls() {
  const wallCount = 8;  // ← muuta tätä (0-20)
}
```

### Muuta herätysaikaa (herätysviestin aikalaskuri):
```javascript
// public/index.html
const remaining = Math.max(0, 30 - elapsed);
                              // ↑ muuta tätä (sekunteja)
```

### Lisää pelaajia (max 3 tällä hetkellä):
```javascript
// Vaatii muutoksia:
// - server.js (lisää väri ja aloituspaikka)
// - game.js (lisää Tank-instanssi)
// - index.html (lisää pisteet + ohjaimet)
```

## 🐛 DEBUGGAUS

### Tarkista palvelinlokeja:
**Render**: Dashboard → Logs
```
🎮 ════════════════════════════════════════
   TANKKIPELI ONLINE - PALVELIN KÄYNNISSÄ
🎮 ════════════════════════════════════════
🟢 Pelaaja liittyi: xYz123
🎮 Peli luotu: A3F9 (2 pelaajaa, bounce: true)
```

### Tarkista client-lokeja:
**Selain**: F12 → Console
```
✅ Yhdistetty palvelimeen!
🎮 Peli luotu: A3F9
🎮 Peli alkaa! Pelaaja #1
```

### Tarkista WebSocket-yhteys:
**Selain**: F12 → Network → WS (WebSocket)
```
Name: socket.io
Status: 101 Switching Protocols
```

## 💡 HYÖDYLLISIÄ VINKKEJÄ

1. **Testaa paikallisesti** ensin (`npm start`)
2. **Käytä Git** järkevästi (commit usein)
3. **Lue Render lokeja** jos ongelma
4. **Tarkista selain konsoli** (F12) jos bugeja
5. **Käytä Chrome DevTools** debuggaamiseen

## 🎯 SEURAAVAT ASKELEET

Jos haluat laajentaa peliä:

✅ **Lisää aseita** → luo uusia Bullet-tyyppejä
✅ **Lisää power-upit** → luo PowerUp-luokka
✅ **Tallenna pisteet** → lisää Firebase/PostgreSQL
✅ **Lisää karttoja** → generoi erilaisia seinäsetuppeja
✅ **Lisää chat** → käytä Socket.IO:ta viesteihin
✅ **Lisää ääniä** → Web Audio API
✅ **Tee mobiiliystävällisempi** → paremmat touch-ohjaimet

## 📚 LISÄRESURSSEJA

- **Socket.IO docs**: https://socket.io/docs/v4/
- **Node.js docs**: https://nodejs.org/docs/
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Render docs**: https://render.com/docs

---

**Onnea koodaamiseen!** 🚀
