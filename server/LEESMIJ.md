# Galaxy – server opzetten (Supabase)

De database is ontworpen en getest (42 controles: 18+, zones in plaats van exacte locatie,
15 minuten vertraging, onzichtbaar, chatten alleen na een match, blokkeren, account wissen).

## Wat jij moet doen (ongeveer 10 minuten)

1. Ga naar https://supabase.com en maak een gratis account. Kies bij voorkeur inloggen met e-mail.
2. Klik **New project**. Naam: `galaxy`. Regio: **Frankfurt (eu-central-1)** of een andere EU-regio.
   Kies een sterk database-wachtwoord en bewaar het. Deel dat wachtwoord met niemand, ook niet met Claude.
3. Open links **SQL Editor** > **New query**. Plak de volledige inhoud van `schema.sql` en klik **Run**.
   Er moet "Success" verschijnen.
4. Open **Project Settings** > **API**. Kopieer:
   - de **Project URL** (begint met https:// en eindigt op .supabase.co)
   - de **anon public** sleutel (of "publishable key")
   Deze twee zijn bedoeld om in een app te staan. Stuur ze naar Claude.
   Stuur NOOIT de **service_role** sleutel of het database-wachtwoord.
5. Open **Authentication** > **Providers** en laat **Email** aan staan.

Daarna koppelt Claude de app aan de server: registreren en inloggen, profiel opslaan,
zones met echte mensen, zwaaien, matches, chat, melden en blokkeren.

## Wat de server afdwingt

- Onder 18 kan geen profiel bestaan.
- De exacte locatie wordt nooit bewaard: de server rondt af naar een zone van ongeveer 300 m.
- Een nieuwe zone is pas na 15 minuten zichtbaar voor anderen.
- Onzichtbaar betekent: in geen enkele lijst.
- Geaardheid en socials zijn alleen zichtbaar als de eigenaar dat koos.
- Berichten kunnen alleen na een wederzijdse zwaai, en niet na blokkeren.
- Abonnement, respect-score en leeftijdscontrole kan een gebruiker niet zelf aanpassen.
- Meldingen zijn alleen leesbaar voor de beheerder.

## Nog nodig voor een echte lancering

- Leeftijdscontrole met ID (zie businessplan, hoofdstuk 6).
- Iemand die meldingen behandelt.
- Een contactadres op de juridische pagina's.
- Ondernemingsnummer zodra er betaald wordt.
