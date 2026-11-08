# ✦ Galaxy – dating app

Galaxy combineert het beste van Tinder, Bumble en Instagram, met een interactieve kaart, live streams en een "Pure"-modus.

Dit is een **werkend klikbaar prototype**: `index.html` (de app) + `places.js` (alle 4.145 steden en dorpen van België en Nederland voor de kaart). Upload beide. Open het in je browser of zet het op GitHub Pages.

## Wat zit erin

| Onderdeel | Functies |
|---|---|
| 🔥 Ontdek | Swipen (slepen of knoppen), like / nope / super like (⭐), terugdraaien, boost, match-scherm |
| ⚡ Pure | Anonieme "nu"-posts die na 60 min verdwijnen, foto pas zichtbaar na wederzijds ja |
| 📸 Feed | Stories (tikken voor volgende, reageren), posts, dubbel tikken om te liken, opslaan |
| 🗺️ Kaart | Slepen, zoomen (knijpen/scrollen), filters Iedereen/Live/Pure/Hotspots, inchecken op hotspots, locatie als zone (privacy) |
| 🔴 Live | Live streams bekijken, chat, cadeautjes met munten, zelf live gaan, speed-date-streams |
| 💬 Chat | Matches, 24u-timer (Bumble-stijl), ijsbrekers, "typt…", meldingen |
| 👤 Profiel | Zoekinstellingen, wie zag jou, incognito, veiligheid, eigen posts |
| 🌠 Uniek | Vallende ster (1 uur), blind date (foto wordt scherper per bericht), geheime vraag, vibe-check, % match |
| 💬 Chat-extra's | AI-datecoach, date plannen (weer + veiligheidscheck), na-date-check, spraak, dit of dat, samen luisteren/gamen, vertalen, ons verhaal, streaks 🔥, AI-filter, "we zijn samen" |
| ✨ Extra-menu | Dagelijks rad, complimenten, openingszin-battle, groepen, events, dubbel-date, zwerver, reismodus, nachtmodus, match-quiz, thema's, Spotlight |
| 🗺️ Kaart-extra | Vanavond, gekruiste paden, Galaxy-wandeling |
| 🎤 Live-extra | Audio rooms, badges, video- en voice-intro, video-check, Galaxy-ranking |
| 🪐 Universum | Sterrenstelsel, planeten per interesse, komeet-bericht, eclips-avond, radar |
| 🤝 Echt leven | Galaxy-spots, date-deals, activiteit-dates, speed-date-woensdag, BFF-modus, cadeaukaart |
| ✅ Eerlijk daten | Galaxy-belofte, gratis zien wie jou leuk vindt, 25 per dag, skip de small talk, anti-ghosting, respect-score, intentie-label, vervaagde ongevraagde foto's, nepprofiel-scan |
| 🧠 AI & extra | AI-matchmaker, AI-profielcheck, vrienden laten stemmen, avatar-modus, 2 waarheden 1 leugen, tijdcapsule, creator-dashboard, podcast-room |
| 💡 Van Hinge & Breeze | Prompts liken met reactie, "Laat Galaxy het regelen" (instant date bij partnerzaak, eerste drankje gratis), nieuwe selectie elke avond 19u, betalen per date |
| 🌐 Talen | Nederlands, Frans, Engels, Duits, Spaans, Italiaans, Portugees, Turks, Pools (menu's en knoppen) |
| 💳 Betalen | Galaxy+ €9,99 · Gold €19,99 · Cosmic €34,99 per maand, kortingen bij 6/12 mnd, munten kopen |

## ⚙️ Instellingen (bovenaan zoeken in index.html)

| Regel | Wat het doet |
|---|---|
| `const PARTNERS_LIVE=false;` | Zet op `true` zodra je echte partnerzaken hebt (date-deals, gratis drankje) |
| `const GOOGLE_MAPS_KEY="";` | Plak hier je Google Maps API-sleutel. Leeg = gratis kaart (OpenStreetMap/CARTO) |

**Google Maps-sleutel maken:** ga naar console.cloud.google.com → nieuw project → "Maps JavaScript API" inschakelen → Credentials → API key. Beperk de sleutel tot jouw website (bv. `vbxr24.github.io/*`), anders kan iemand anders hem misbruiken. Google vraagt een betaalkaart; check daar de actuele gratis limieten.

## Op GitHub zetten (gratis online)

1. Maak een nieuwe repository `galaxy` op github.com.
2. Upload `index.html` en `README.md` (Add file → Upload files).
3. Ga naar Settings → Pages → Branch: `main` → Save.
4. Na 1 minuut staat je app op `https://JOUWNAAM.github.io/galaxy`.

## Van prototype naar echte app (bouwplan)

1. **Backend + login**: Supabase of Firebase (gratis start): accounts, profielen, foto-opslag.
2. **Echte matching**: likes opslaan in database, match = beiden geliket.
3. **Realtime chat**: Supabase Realtime of Firebase Firestore.
4. **Kaart**: Leaflet + OpenStreetMap (gratis) met afgeronde locatie (±500 m).
5. **Live streaming**: LiveKit, Agora of Mux (betaald per minuut).
6. **Betalingen**: Stripe (web) of RevenueCat (App Store / Google Play).
7. **App in de stores**: React Native / Expo, of eerst als PWA.
8. **Veiligheid** (verplicht voor dating): fotoverificatie, melden/blokkeren, moderatie, 18+ check, privacybeleid (GDPR).

## Ideeën voor later

- 🎙️ Spraakberichten en voice-intro op je profiel
- 🎲 Dagelijkse "Galaxy-vraag" waar matches op antwoorden
- 👯 Dubbel-date-modus (met een vriend(in) samen swipen)
- 🎵 Spotify-koppeling: toon je top-artiesten op je profiel
- 🎮 Mini-games in de chat als ijsbreker
- 📅 Date plannen in de app + "deel met vriend" voor veiligheid
- 🏆 Events/hotspots: Galaxy-avonden in cafés

## Verder werken in een nieuwe chat (kopieer deze prompt)

```
Ik bouw een dating app "Galaxy" (Tinder + Bumble + Instagram + interactieve kaart
+ live streams + Pure-modus + betaalabonnementen). Hier is mijn huidige index.html
(één bestand, HTML/CSS/JS, donker galaxy-thema, Nederlands). Bouw verder op deze
code zonder bestaande functies te breken. Volgende stap: [SCHRIJF HIER WAT JE WIL].
```
Voeg daarna je `index.html` toe als bijlage.
