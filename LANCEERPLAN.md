# 🚀 Galaxy – lanceerplan

## 1. Eerst eerlijk: de grootste uitdaging

Een dating-app werkt pas als er **genoeg mensen in de buurt** zijn. 100 gebruikers verspreid over België = een lege app. 100 gebruikers in Halle–Tubize = een levende app.
👉 Daarom: **begin heel lokaal**, word daar groot, en breid dan stad per stad uit. Zo zijn Tinder (universiteiten) en Bumble ook begonnen.

---

## 1b. Hoe Galaxy Tinder en Bumble verslaat (online onderzoek, nov 2026)

| Wat mensen haten aan de grote apps | Wat Galaxy doet |
|---|---|
| Eindeloos swipen voelt als een sleur ("swipe fatigue"); Tinder verliest al jaren betalende gebruikers | Max. 25 profielen per dag, pauze-herinnering, vallende ster en AI-matchmaker voor kwaliteit |
| Betaalmuren, bv. betalen om te zien wie je leuk vindt | **Gratis zien wie jou leuk vindt.** Betalen alleen voor extra's |
| Lang chatten zonder ooit af te spreken (Hinge: 79% wil de small talk overslaan) | Knop "Skip de small talk" direct na een match + date-planner + date-deals |
| Ongewenste seksuele berichten en foto's | Ongevraagde foto's automatisch vervaagd, AI-filter, meldknop, na-date-check |
| Twijfel of berichten door AI geschreven zijn; jongeren wantrouwen AI | "Echte gesprekken"-belofte: AI geeft tips, maar schrijft niet in jouw naam |
| Jongeren willen elkaar liever in het echt ontmoeten | Hotspots, Galaxy-spots, events, activiteit-dates, speed-date-avonden |
| Wat wél werkt bij Hinge: duidelijke bedoelingen | Intentie-label op elk profiel |

**Jouw slogan-idee:** *"Galaxy: de dating-app die je terug naar buiten stuurt."*

Bronnen: [Fast Company: Why Gen Z is abandoning dating apps](https://fastcompany.co.za/tech/2025-11-30-why-gen-z-is-abandoning-dating-apps-and-how-ai-might-bring-them-back/) · [Fortune: 4 reasons Gen Z & millennials rebel against dating apps](https://fortune.com/2024/05/16/gen-z-millennialls-shun-dating-apps-tinder-bumble-hinge) · [Hinge Date Ideas (79% wil small talk overslaan)](https://ccstartup.com/blog/2026/04/23/hinges-new-date-ideas-feature-takes-care-of-scheduling/) · [TechCrunch: Tinder verliest betalende abonnees](https://techcrunch.com/2025/12/09/hinge-ceo-steps-down-to-launch-overtone-an-ai-dating-app) · [91mobiles: Tinder Sparks 2026](https://www.91mobiles.com/updates/tinder-unveils-ai-powered-matching-live-events-and-new-social-modes-sparks-2026/)

---

## 2. Stappenplan

### Fase 0 · Voorbereiden (nu – maand 1)
- [ ] Prototype (dit project) op GitHub Pages zetten
- [ ] Aan 20 mensen tonen (vrienden, collega's) en vragen: wat is leuk, wat is verwarrend?
- [ ] **Wachtlijst-pagina** maken: "Galaxy komt naar Halle–Tubize. Schrijf je in." (bv. met Tally of Google Forms)
- [ ] Domeinnaam checken: `galaxydating.be` / `getgalaxy.app` (± €10–20/jaar)
- [ ] Naam checken: "Galaxy" is een veelgebruikte naam (bv. Samsung Galaxy). Zoek op [euipo.europa.eu](https://euipo.europa.eu) of je hem als merk kunt gebruiken. Desnoods "Galaxy Dating" of "Galaxi".

### Fase 1 · Echte app bouwen (maand 1–4)
| Onderdeel | Gratis/goedkope keuze |
|---|---|
| App | React Native + Expo (één code voor iPhone én Android) |
| Login, database, chat | Supabase of Firebase (gratis tot je groeit) |
| Kaart | Mapbox of OpenStreetMap |
| Live & audio rooms | LiveKit of Agora (betaal per minuut, pas later inbouwen) |
| Betalingen | RevenueCat (abonnementen via App Store en Google Play) |
| Moderatie | AI-filter voor foto's en tekst + meldknop |

💡 Kun je zelf niet programmeren? Opties: met AI-hulp leren (zoals deze chat), een student informatica inschakelen, of een freelancer (Malt, Upwork). Reken bij een freelancer op €5.000–€30.000 voor een eerste versie.

👉 **Bouw NIET alles tegelijk.** Versie 1 = swipen, chat, kaart, Pure-modus en Galaxy+. Live, audio rooms en events komen in update 2 en 3.

### Fase 2 · Lokale lancering (maand 4–6)
- [ ] Gesloten **bèta** met 50–100 mensen uit de wachtlijst
- [ ] **Galaxy-lanceerfeest** in een café in Halle: wie de app installeert, mag gratis binnen of krijgt een drankje
- [ ] **Ambassadeurs**: 5–10 sociale mensen (studenten, jeugdbeweging, sportclubs) krijgen gratis Cosmic in ruil voor het verspreiden
- [ ] Eerste 3 maanden: Galaxy+ **gratis** voor iedereen die vroeg instapt (= "Founding member"-badge)

### Fase 3 · Groeien in België en Nederland (maand 6–24)
Doel: **heel België + Nederland** (± 30 miljoen inwoners). Nog altijd stad per stad, want een lege app in 20 steden verliest van een volle app in 3 steden.

| Golf | Steden | Waarom |
|---|---|---|
| 1 | Halle, Tubize, Brussel | Thuisbasis, tweetalig |
| 2 | Leuven, Gent, Antwerpen | Grote studentensteden = veel singles |
| 3 | Utrecht, Amsterdam, Rotterdam | Grootste Nederlandse markt, zelfde taal |
| 4 | Luik, Namen, Eindhoven, Groningen | Wallonië + rest van NL |

**Nodig voor BE + NL:**
- **Nederlands én Frans** in de app (Tubize, Brussel en Wallonië spreken Frans); later Engels voor expats
- Nederlandse en Belgische woorden en humor op TikTok (een Belgische video werkt anders in NL)
- Eén Belgisch bedrijf volstaat: GDPR geldt in de hele EU, je hebt geen apart Nederlands bedrijf nodig
- Let op Nederlandse concurrenten (zoals Breeze, dat dates voor je plant) en Hinge, dat in NL sterk is
- Per stad 1 lanceerevent en 5–10 lokale ambassadeurs

**Wat dat kan opbrengen** (dezelfde aannames: 5% betaalt, gemiddeld €12):

| Gebruikers BE+NL | Bruto/maand |
|---|---|
| 50.000 | ± €45.000 |
| 200.000 | ± €180.000 |

Op dat niveau heb je een team nodig (programmeurs, moderatie, support) en waarschijnlijk een investeerder.

---

## 3. Marketing (vooral gratis)

**TikTok/Instagram is jouw wapen.** Je hebt al ervaring met TikTok en streamen, en dat is goud waard.
- 📹 "Ik bouw een dating-app als productiemedewerker": je eigen verhaal werkt (build in public)
- 😂 Sketches: "Tinder vs Galaxy", "eerste date fails", "de vallende ster heeft me gered"
- 🔭 Blind date-challenges op straat in Halle/Brussel (met toestemming filmen)
- 🎧 Live-streams waarin je de app test met kijkers
- 📊 Elke week één nieuwe functie tonen = vaste content

**Andere gratis kanalen:** Reddit r/belgium, lokale Facebookgroepen, posters in cafés en hogescholen, samenwerken met lokale DJ's en cafés (events).

---

## 4. Wetgeving & veiligheid (verplicht!)

⚠️ Dating-apps verwerken **gevoelige gegevens** (seksuele oriëntatie, locatie, foto's). Neem dit serieus; boetes zijn hoog.

- **GDPR/AVG**: privacybeleid, toestemming vragen, gegevens laten verwijderen, data in de EU bewaren
- **Leeftijd 18+**: verplichte leeftijdscheck bij registratie
- **Digital Services Act (EU)**: meldknop voor illegale inhoud, regels duidelijk uitleggen, snel reageren op meldingen
- **App Store & Google Play**: dating- en chat-apps moeten kunnen melden/blokkeren en inhoud modereren, anders word je geweigerd
- **Betalingen**: abonnementen moeten makkelijk opzegbaar zijn, prijzen duidelijk vermeld
- **Algemene voorwaarden** + **privacybeleid**: laat die nakijken door een jurist (start-ups kunnen vaak goedkoop terecht bij een ondernemersloket of een UNIZO-adviseur)

## 5. Bedrijf opstarten (België)

Je werkt nu als werknemer, dus je kunt starten als **zelfstandige in bijberoep**:
1. Ondernemingsnummer aanvragen via een ondernemingsloket
2. Aansluiten bij een sociaal verzekeringsfonds
3. Btw-nummer (nodig zodra je verkoopt)
4. Een boekhouder voor de eerste jaren is aan te raden

💡 Subsidies en hulp: **VLAIO** (Vlaanderen), **hub.brussels** (Brussel), **Wallonie Entreprendre** (Wallonië, want Tubize ligt in Wallonië). Check welke regio voor jou geldt.

## 6. Kosten (ruwe schatting, check actuele prijzen)

| Wat | Kost |
|---|---|
| Apple Developer-account | ± $99 per jaar |
| Google Play-account | ± $25 eenmalig |
| Domein | €10–20 per jaar |
| Supabase/Firebase | €0 bij start, €25+/maand bij groei |
| Live streaming | per minuut, kan duur worden: pas inbouwen als er inkomsten zijn |
| Jurist (voorwaarden/privacy) | €500–€2.000 |
| Lanceerfeest/marketing | €200–€1.000 |

**Inkomsten:** abonnementen (Galaxy+ / Gold / Cosmic), munten (super likes, boosts, cadeautjes), Spotlight, event-tickets, later samenwerkingen met cafés. Let op: Apple en Google houden 15–30% van in-app betalingen in.

---

## 7. 🧠 Nieuwe ideeën (brainstorm ronde 2)

**Uniek Galaxy-concept: het universum**
- 🌌 **Jouw sterrenstelsel**: elke match wordt een ster, chats maken sterren feller, oude matches doven langzaam uit
- ☄️ **Komeet-bericht**: één bericht per week dat bij iemand bovenaan "inslaat", zelfs zonder match
- 🪐 **Planeten = interesses**: "Planeet Techno", "Planeet Gaming"; reis naar een planeet en ontmoet mensen met dezelfde passie
- 🌑 **Eclips-avond**: elke maand een avond waarop iedereen gratis Cosmic krijgt (piekmoment = veel activiteit)

**Echt leven > scherm**
- 📍 **Galaxy-spots**: cafés krijgen een Galaxy-sticker; wie daar incheckt, ziet wie er ook is
- 🎟️ **Date-deals**: 2-voor-1 korting bij partnercafés als je een Galaxy-date plant (cafés betalen jou hiervoor)
- 🚲 **Activiteit-dates**: kies een activiteit (bowling, escape room) en Galaxy zoekt iemand die mee wil

**Eerlijk daten**
- ✅ **Respect-score**: wie altijd antwoordt en niemand ghost, komt hoger in de lijst
- 👻 **Anti-ghosting**: na 3 dagen stilte vraagt de app vriendelijk "afsluiten of verder praten?"
- 🎯 **Intentie-label**: "iets serieus", "zien wat er komt", "vrienden"; je ziet het meteen

**Creators**
- 🎙️ **Galaxy-podcast live** in audio rooms met lokale gasten
- 💸 **Creator-programma**: populaire streamers verdienen geld met cadeautjes (Galaxy houdt ±30%)

**Slimme AI**
- 🧠 **AI-matchmaker**: "Ik heb 3 mensen gevonden die écht bij je passen, en hier is waarom"
- 📝 **Profiel-check**: AI zegt wat er beter kan aan je bio
- 🕵️ **Nepprofiel-detectie**: automatisch scammers en bots eruit halen

---

## 8. Doelen om bij te houden

| Moment | Doel |
|---|---|
| Wachtlijst | 500 inschrijvingen in Halle–Tubize vóór lancering |
| Maand 1 na lancering | 1.000 gebruikers, 30% komt elke week terug |
| Maand 6 | 5% betaalt een abonnement |
| Jaar 1 | 3 steden actief |

**Volgende stap voor jou:** zet het prototype op GitHub Pages, maak een wachtlijst en post je eerste TikTok: "Ik bouw een dating-app 🚀".
