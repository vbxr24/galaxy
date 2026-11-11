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
