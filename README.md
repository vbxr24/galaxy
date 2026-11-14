# Galaxy – live kaart om nieuwe mensen te ontmoeten

Galaxy is een live wereldkaart (18+). Je ziet waar het druk is, je loopt rond met je eigen 3D-mannetje,
je checkt in bij een plek, zwaait naar iemand in dezelfde zone en chat na een match.

- App: https://vbxr24.github.io/galaxy/
- Website: https://vbxr24.github.io/galaxy/welkom.html
- Dev-venster (status): https://vbxr24.github.io/galaxy/dev.html
- Contact: galaxy.app.xv@gmail.com

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | de app (schermen, profiel, abonnementen) |
| `galaxy-map.js` | 3D-wereldkaart, plekken, drukte, inchecken, groepsdates, slot tijdens rijden |
| `avatar.js` + `models/` | 3D-mannetjes (Quaternius, CC0) |
| `profile.js` | profiel, wat zoek ik, badges, thema's, muziek, socials, events |
| `backend.js` | koppeling met de server (Supabase, EU) |
| `theme.js` | themalied (eigen compositie) |
| `server/schema.sql` | database met alle veiligheidsregels |
| `welkom.html` | website |
| `privacy.html`, `voorwaarden.html`, `veiligheid.html`, `verwijderen.html` | juridische pagina's |
| `PLAY-STORE.md` | stappenplan voor Google Play |

## Veiligheid en privacy

- Alleen 18+. De server weigert profielen onder 18.
- De exacte locatie verlaat het toestel niet: alleen een zone van ongeveer 300 m, zichtbaar na 15 minuten.
- Onzichtbaar-knop, melden en blokkeren.
- Chatten kan alleen na een wederzijdse zwaai.

## Nog te doen

Leeftijdscontrole met ID, betalen via Google Play, inloggen met e-mail, vertalingen, moderatie van meldingen.

Kaartgegevens: OpenStreetMap-bijdragers, kaart via OpenFreeMap. 3D-figuren: Quaternius (CC0).

## Kleuren

In de app kies je via ✨ → Kleuren een donker Galaxy-thema of een licht pastelthema (lila, perzik, mint, hemel, roos). De keuze blijft bewaard op het toestel.

## Dates plannen
In een chat met een match: **📅 Date**. Kies waar je zin in hebt (zin-meter), wat, waar (openbare plekken uit de kaart of zelf getypt), wanneer en wat je een fijn gevoel geeft. De ander bevestigt, vraagt een ander moment of zegt af, en geeft zelf aan waar hij of zij zin in heeft. Bevestigd: aftelklok, weer ter plaatse, route, agenda (.ics/Google) en een veilig-knop. Na de date: "nog eens?" (privé; je ziet alleen of jullie allebei ja zeiden). Overzicht via ✨ → Mijn dates. Server: `server/dateplans.sql`. Code: `dateplan.js`.

## Feedback na een date
Na een bevestigde date: complimenten geven (anoniem; op een profiel pas zichtbaar vanaf 2 verschillende gevers), "voelde je je veilig?" en "leek de persoon op het profiel?" (privé; een nee wordt een vertrouwelijke melding) en een bedankje sturen. Server: `server/feedback.sql`.

## Dagbonus
✨ → Dagbonus: elke dag dat je Galaxy opent een stempel (+5 munten); 7 stempels (niet per se na elkaar) = Sterrendoos (+30 munten). Vraag van de dag (+3) die je een dag op je profiel kunt zetten. Geen reeks die je verliest, geen willekeurige prijzen, geen meldingen, uit te zetten. Munten staan op het toestel. Code: `dagbonus.js`.

## Mijn QR-code
Profiel → Veiligheid of ✨ → Mijn QR-code: een persoonlijke QR-code met een link naar je profielkaart. Iemand scant hem (met Galaxy of de gewone camera) en ziet meteen je profiel om naar je te zwaaien. Ook: zelf een code scannen en je link delen. Code: `myqr.js`.

## Welzijn
✨ → **Welzijn** (of Profiel → Veiligheid): pauzemodus (24 u, 3 dagen, 1 week of tot je terugkomt, je chats blijven), welzijn-badges en een zelfzorg-zin (alleen op je profiel als je dat aanzet), een dagelijkse schermtijd-grens, een ademoefening van 1 minuut, tips en hulplijnen per land met findahelpline.com als reserve voor de rest van de wereld. Code: `welzijn.js`.
