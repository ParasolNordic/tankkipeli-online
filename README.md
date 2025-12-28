# 🎮 TANKKIPELI ONLINE

Reaaliaikainen moninpeli tankkipeli WebSocket-yhteydellä. Pelaa ystäviesi kanssa käyttäen QR-koodia tai pelin koodia!

## ✨ Ominaisuudet

- 🌐 **Online-moninpeli** - 2-3 pelaajaa samassa pelissä
- 📱 **QR-koodi liittyminen** - Skannaa ja pelaa
- ⏱️ **Herätysviesti** - Näyttää kun palvelin käynnistyy (Render ilmainen tier)
- 🎯 **Reaaliaikainen** - WebSocket-yhteys (Socket.IO)
- 🔫 **Kimpoavat ammukset** - Valittavissa
- 🏆 **Pisteidenlaskenta** - Eri kierrosten välillä

## 🚀 Asennus Paikallisesti (Testaus)

### 1. Kloonaa projekti tai pura zip
```bash
cd tankkipeli-online
```

### 2. Asenna riippuvuudet
```bash
npm install
```

### 3. Käynnistä palvelin
```bash
npm start
```

### 4. Avaa selaimessa
```
http://localhost:3000
```

## 🌍 Deployment Render.com:iin (ILMAINEN)

### Miksi Render?
- ✅ Ilmainen tier riittää pelaamiseen
- ✅ Automaattinen SSL (HTTPS)
- ✅ Helppo käyttö
- ⚠️ Palvelin nukkuu 15 min inaktiivisuuden jälkeen
  - **Ratkaisu**: Peli näyttää herätysviesti + aikalaskurin
  - Ensimmäinen yhdistäminen kestää ~30 sekuntia

### Vaihe 1: Luo GitHub-repositorio

1. Mene osoitteeseen https://github.com
2. Kirjaudu sisään (tai luo tili)
3. Klikkaa **"New repository"**
4. Anna nimi: `tankkipeli-online`
5. Valitse **Public** (ilmainen Renderillä vaatii julkisen)
6. Klikkaa **"Create repository"**

### Vaihe 2: Lähetä koodi GitHubiin

```bash
# Alusta Git
git init

# Lisää kaikki tiedostot
git add .

# Tee commit
git commit -m "Initial commit - Tankkipeli Online"

# Yhdistä GitHub-repositorioosi (korvaa SINUN-KÄYTTÄJÄ)
git remote add origin https://github.com/SINUN-KÄYTTÄJÄ/tankkipeli-online.git

# Lähetä GitHubiin
git branch -M main
git push -u origin main
```

### Vaihe 3: Luo Render-tili ja deploy

1. **Mene**: https://render.com
2. **Kirjaudu** GitHub-tilillä (suositus)
3. **Klikkaa**: "New +" → "Web Service"
4. **Yhdistä** GitHub-repositoriosi
5. **Valitse** `tankkipeli-online`
6. **Asetukset**:
   - **Name**: `tankkipeli-online` (tai mikä tahansa)
   - **Region**: Frankfurt (lähin Suomeen)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: ✅ **Free** (ilmainen!)
7. **Klikkaa**: "Create Web Service"

### Vaihe 4: Odota deployment

- Render buildaa projektin (~2-5 minuuttia)
- Saat URL-osoitteen: `https://tankkipeli-online-XXXX.onrender.com`
- ✅ Valmis!

### Vaihe 5: Pelaa!

1. **Avaa** URL selaimessa
2. **Luo peli** ja saat QR-koodin
3. **Jaa QR** kavereille WhatsApp/Discord/jne
4. **Pelatkaa** yhdessä!

## 📱 Miten pelata

### Isäntänä (Host):

1. Avaa peli selaimessa
2. Klikkaa **"LUO PELI"**
3. Valitse **pelaajamäärä** (2 tai 3)
4. Valitse **ammukset** (kimpoavat/eivät kimpoa)
5. **QR-koodi** ilmestyy ruudulle
6. **Jaa** QR-koodi tai 4-kirjaiminen koodi kavereille
7. **Odota** että kaikki liittyvät
8. **Pelatkaa!**

### Vieraana (Guest):

**Tapa 1: QR-koodi** (helpoin)
1. Skannaa QR-koodi puhelimella
2. Peli aukeaa automaattisesti
3. Odota hetki että palvelin herää
4. Valmis!

**Tapa 2: Koodi**
1. Avaa peli selaimessa
2. Klikkaa **"LIITY PELIIN"**
3. Kirjoita **4-kirjaiminen koodi**
4. Klikkaa **"LIITY"**
5. Valmis!

### Ohjaimet:

**Näppäimistö:**
- ⬆️⬇️ tai W/S = Eteenpäin/taaksepäin
- ⬅️➡️ tai A/D = Käänny vasemmalle/oikealle
- VÄLILYÖNTI = Ammu

**Touch (tabletti/puhelin):**
- Ruudun alareunassa on ohjaimet jokaiselle pelaajalle
- ⬆️⬇️⬅️➡️ = Liiku
- 💥 = Ammu

## ⚙️ Tekninen toteutus

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + HTML5 Canvas
- **Reaaliaikainen yhteys**: WebSocket (Socket.IO)
- **Deployment**: Render.com
- **QR-koodit**: QRCode.js

## 🐛 Ongelmien ratkaisu

### "Palvelin ei vastaa" / "Connecting..."

**Syy**: Palvelin nukkuu (Render ilmainen tier)
**Ratkaisu**: 
- Odota 30 sekuntia
- Peli näyttää automaattisen aikalaskurin
- Tämä tapahtuu vain ensimmäisellä yhdistämisellä

### "Ei voida liittyä peliin"

**Syy**: Väärä koodi tai peli on jo täynnä
**Ratkaisu**:
- Tarkista että koodi on oikein (4 kirjainta)
- Varmista että pelissä on tilaa

### "Lag" / "Viive"

**Syy**: Hidas internet-yhteys tai palvelin kaukana
**Ratkaisu**:
- Valitse Render regioniksi Frankfurt (lähin Suomeen)
- Tarkista WiFi-yhteys
- Sulje muut ohjelmat

### Palvelin kaatuu usein

**Syy**: Render ilmainen tier rajoitettu
**Ratkaisu**:
- Päivitä Render Starter ($7/kk) - palvelin ei nuku
- TAI käytä Railway.app ($5 krediittiä/kk)

## 💰 Kustannukset

### Ilmainen (Render Free Tier):
- ✅ Toimii hyvin 2-4 pelaajalle
- ⚠️ Nukkuu 15 min jälkeen
- ⚠️ Rajoitetut resurssit
- **Hinta**: 0€/kk

### Tuotantokäyttö (Render Starter):
- ✅ Ei nuku koskaan
- ✅ Enemmän tehoja
- ✅ Parempi tuki
- **Hinta**: $7/kk (~6.50€)

## 🔧 Kehitys

### Muokkaa koodia:

1. Tee muutokset paikallisesti
2. Testaa: `npm start`
3. Commitoi:
   ```bash
   git add .
   git commit -m "Päivitys: ..."
   git push
   ```
4. Render päivittää automaattisesti!

### Hyödyllisiä komentoja:

```bash
# Käynnistä dev-moodi
npm run dev

# Tarkista lokeja Renderissä
# Mene: Dashboard → Service → Logs

# Testaa paikallisesti eri portissa
PORT=3001 npm start
```

## 📞 Tuki

Jos törmäät ongelmiin:

1. Tarkista Render lokeja (Dashboard → Logs)
2. Tarkista selaimesi konsoli (F12 → Console)
3. Varmista että kaikki tiedostot on pushattu GitHubiin

## 🎉 Valmista!

Nyt sinulla on toimiva online-tankkipeli! Jaa URL kavereiden kanssa ja nauttikaa!

**Pro-vinkki**: Tallenna URL puhelimen kotinäytölle → "Add to Home Screen"
