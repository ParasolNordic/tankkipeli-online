# 🚀 YKSITYISKOHTAISET DEPLOYMENT-OHJEET

## Render.com - Askel askeleelta

### ⏰ Mitä tapahtuu Render ilmaisella tierillä?

Render.com:in ilmainen tier:
- ✅ **Täysin ilmainen** - ei luottokorttia vaadita
- ⏱️ **Nukkuu 15 minuutin jälkeen** - jos ei aktiivisuutta
- 🔄 **Herää ~30 sekuntia** - ensimmäinen yhteys kestää
- ✅ **SSL (HTTPS) automaattisesti** - turvallinen
- ✅ **512 MB RAM** - riittää tälle pelille
- ✅ **100 GB kaistaa/kk** - riittää hyvin

### 📋 VAIHE 1: GitHub (jos ei vielä ole tiliä)

1. **Mene**: https://github.com
2. **Klikkaa**: "Sign up"
3. **Täytä**:
   - Sähköposti
   - Salasana
   - Käyttäjänimi
4. **Vahvista** sähköposti
5. ✅ Valmis!

### 📋 VAIHE 2: Luo Repository GitHubissa

1. **Kirjaudu** GitHubiin
2. **Klikkaa** vihreää "New" nappia (tai "+") oikeassa yläkulmassa
3. **Täytä**:
   - Repository name: `tankkipeli-online`
   - Description: "Reaaliaikainen tankkipeli moninpelillä"
   - ✅ **Public** (pakollinen ilmaiselle Renderille)
   - ❌ ÄLÄ valitse "Add README" (meillä on jo)
4. **Klikkaa**: "Create repository"
5. **Kopioi** repository URL (näkyy ruudulla)
   - Muoto: `https://github.com/SINUN-KÄYTTÄJÄ/tankkipeli-online.git`

### 📋 VAIHE 3: Lähetä koodi GitHubiin

**WINDOWS (Git Bash tai PowerShell):**

```bash
# Mene projektin kansioon
cd C:\Users\SINUN-NIMI\tankkipeli-online

# Alusta Git (jos ei vielä tehty)
git init

# Lisää kaikki tiedostot
git add .

# Tarkista mitä lisätään
git status

# Tee commit
git commit -m "Initial commit - Tankkipeli Online"

# Yhdistä GitHub-repositorioosi (KORVAA URL!)
git remote add origin https://github.com/SINUN-KÄYTTÄJÄ/tankkipeli-online.git

# Lähetä
git branch -M main
git push -u origin main
```

**ONGELMA: "git: command not found"?**

→ Asenna Git: https://git-scm.com/download/win

**ONGELMA: Kysyy käyttäjänimeä/salasanaa?**

→ GitHub vaatii Personal Access Tokenin:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Valitse: repo (kaikki)
4. Kopioi token
5. Käytä tokenia salasanana

### 📋 VAIHE 4: Luo Render-tili

1. **Mene**: https://render.com
2. **Klikkaa**: "Get Started for Free"
3. **Valitse**: "Sign up with GitHub" (suositus!)
4. **Hyväksy** GitHubin käyttöoikeudet
5. ✅ Tili luotu automaattisesti!

### 📋 VAIHE 5: Luo Web Service Renderissä

1. **Kirjaudu** Renderiin
2. **Klikkaa**: "New +" (oikeassa yläkulmassa)
3. **Valitse**: "Web Service"
4. **Yhdistä GitHub** (jos ei vielä):
   - Klikkaa "Connect GitHub"
   - Valitse repositoryt joihin Render voi päästä
   - Suositus: Valitse vain `tankkipeli-online`
5. **Näet** listan repositoryistasi
6. **Klikkaa** `tankkipeli-online` vieressä "Connect"

### 📋 VAIHE 6: Konfiguroi Service

**Täytä seuraavat kentät:**

```
Name: tankkipeli-online
(tai mikä tahansa uniikki nimi)

Region: Frankfurt (GER)
(lähin Suomelle, vähiten latenssia)

Branch: main
(oletusarvo, jätä näin)

Root Directory: 
(jätä TYHJÄKSI)

Runtime: Node
(automaattisesti havaitaan)

Build Command: npm install
(Render suorittaa asennuksen)

Start Command: npm start
(käynnistää palvelimen)

Instance Type: Free
(✅ TÄRKEÄ: Valitse tämä!)
```

**Klikkaa**: "Create Web Service" (alhaalla)

### 📋 VAIHE 7: Odota Deploy

Render aloittaa:

```
1. ⏳ Kloonaa koodisi GitHubista
2. ⏳ Suorittaa "npm install"
3. ⏳ Käynnistää "npm start"
4. ✅ Service live!
```

Tämä kestää **2-5 minuuttia**.

**Seuraa**: Dashboard → Service → Logs (näet reaaliaikaisen etenemisen)

### 📋 VAIHE 8: Saat URL:n

Kun valmis, näet:

```
✅ Live

Your service is live at:
https://tankkipeli-online-XXXX.onrender.com
```

**Kopioi URL!** Tämä on peliisi osoite.

### 📋 VAIHE 9: Testaa peli

1. **Avaa** URL selaimessa
2. **Näet**: Herätysviesti + aikalaskuri (30s)
3. **Odota**: Palvelin käynnistyy
4. **Klikkaa**: "LUO PELI"
5. ✅ **Toimii!**

## 🎮 Jaa peli kavereille

### Tapa 1: QR-koodi (paras!)

1. Luo peli
2. QR-koodi ilmestyy
3. **Ota kuvankaappaus** (Print Screen / Näyttökuva)
4. **Jaa** WhatsApp/Discord/Telegram
5. Kaverit skannaavat puhelimella
6. Pelatkaa!

### Tapa 2: Suora linkki

1. Luo peli
2. Saat koodin esim: "A3F9"
3. **Jaa linkki**:
   ```
   https://sinun-peli.onrender.com?join=A3F9
   ```
4. Kaverit klikkaavat
5. Liittyvät automaattisesti!

### Tapa 3: Pelkkä koodi

1. Luo peli
2. Kerro koodi: "A3F9"
3. Kaverit:
   - Avaa peli
   - Klikkaa "LIITY"
   - Kirjoita A3F9
4. Valmis!

## ⚙️ Render Dashboard käyttö

### Logs (lokitiedostot)

**Mene**: Dashboard → Your Service → Logs

**Näet**:
```
🎮 ════════════════════════════════════════
   TANKKIPELI ONLINE - PALVELIN KÄYNNISSÄ
   ════════════════════════════════════════
   📡 Portti: 10000
   🌐 URL: https://...
🎮 ════════════════════════════════════════
```

**Jos näet virheitä**, ota kuvankaappaus ja tutki.

### Restart Service

**Jos jotain menee pieleen:**

Dashboard → Your Service → Manual Deploy → "Deploy latest commit"

Tai: Settings → Scroll alas → "Delete Web Service" ja luo uusi

### Environment Variables (jos tarvitaan)

Dashboard → Environment → Add Environment Variable

Esim:
```
PORT = 10000
NODE_ENV = production
```

(Tämä peli ei niitä tarvitse, mutta hyvä tietää)

## 🔄 Päivitysten tekeminen

Kun muokkaat koodia:

```bash
# 1. Tee muutokset tiedostoihin
# 2. Tallenna

# 3. Git add
git add .

# 4. Git commit
git commit -m "Lisätty uusi ominaisuus"

# 5. Git push
git push

# 6. Render päivittää AUTOMAATTISESTI!
```

**Seuraa**: Logs-välilehdellä näet uuden deployn etenemisen.

## 💡 Pro-vinkit

### 1. Custom Domain (oma domain)

Jos sinulla on oma domain (esim. `pelit.fi`):

1. Render: Settings → Custom Domains → Add Custom Domain
2. Lisää: `tankkipeli.pelit.fi`
3. Kopioi Render antamat DNS-tiedot
4. Lisää ne domain-rekisteröijällesi
5. Odota 24h
6. ✅ Toimii!

### 2. Keep Alive (pidä hereillä)

**Ilmainen tapa** (ei 100% luotettava):

Käytä UptimeRobot.com:
1. Luo ilmainen tili
2. Lisää monitor: `https://sinun-peli.onrender.com/ping`
3. Interval: 5 min
4. → Render pysyy hereillä!

**Varma tapa**:

Päivitä Render Starter ($7/kk):
- Settings → Instance Type → Starter
- → Ei nuku koskaan!

### 3. Multiple Games (useita pelejä)

Voit ajaa useita pelejä samalla palvelimella:
- Jokainen peli saa oman koodin
- Palvelin hallitsee kaikki automaattisesti
- Ei rajoituksia!

### 4. Pisteiden tallennus

Jos haluat tallentaa pisteet pysyvästi:

1. Lisää Firebase (ilmainen)
2. Tai käytä Render PostgreSQL ($7/kk)

## ❓ Yleisimmät ongelmat

### "Build Failed" Renderissä

**Syy**: package.json puuttuu tai virheellinen

**Ratkaisu**:
```bash
# Tarkista että tiedosto on oikein
cat package.json

# Varmista että on pushattu
git push
```

### "Application Error" kun avaan URL

**Syy**: Palvelin ei käynnistynyt

**Ratkaisu**:
1. Tarkista Logs
2. Varmista että `npm start` toimii paikallisesti
3. Tarkista että PORT on oikein (Render asettaa automaattisesti)

### Näkyy vain "Connecting..."

**Syy**: WebSocket-yhteys ei toimi

**Ratkaisu**:
1. Odota 30 sekuntia (palvelin herää)
2. Tarkista että käytät HTTPS:ää (ei HTTP)
3. Tarkista selaimen konsoli (F12) virheilmoituksia

### Git push ei toimi

**Syy**: Ei oikeuksia

**Ratkaisu**:
```bash
# Tarkista remote
git remote -v

# Jos väärä, vaihda
git remote set-url origin https://github.com/OIKEA-KÄYTTÄJÄ/tankkipeli-online.git

# Yritä uudelleen
git push
```

## 🎉 Valmis!

Nyt sinulla on:
- ✅ Toimiva online-tankkipeli
- ✅ Ilmainen hosting Renderissä
- ✅ QR-koodi jakaminen
- ✅ Automaattinen deployment

**Nauti pelaamisesta!** 🎮
