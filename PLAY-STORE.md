# Galaxy in Google Play – stappenplan

Bijgewerkt op 11 november 2026.

## Wat al klaar is

- App online en geschikt als Android-app (PWA): https://vbxr24.github.io/galaxy/?play=1
- Privacybeleid: https://vbxr24.github.io/galaxy/privacy.html
- Pagina om je account te verwijderen: https://vbxr24.github.io/galaxy/verwijderen.html
- Veiligheidsregels (ook tegen kindermisbruik): https://vbxr24.github.io/galaxy/veiligheid.html
- Contactadres: galaxy.app.xv@gmail.com
- Teksten, 5 schermafbeeldingen (1080x1920) en banner (1024x500): zie het marketingplan

## Wat alleen jij kunt doen

1. Ga naar https://play.google.com/console en meld je aan met galaxy.app.xv@gmail.com.
2. Kies **Persoonlijk account**. Betaal de eenmalige 25 dollar.
3. Doorloop de identiteitscontrole van Google met je eigen identiteitskaart. Dat kan een paar dagen duren.
4. Verifieer een Android-toestel met de Play Console-app als Google daarom vraagt.

## Daarna, samen

5. **App maken** in de Play Console: naam "Galaxy: live kaart & ontmoeten", taal Nederlands, App, Gratis.
6. **Android-pakket (.aab)** maken met PWABuilder (https://www.pwabuilder.com) voor het adres hierboven,
   pakketnaam `io.github.vbxr24.galaxy`. Bewaar het sleutelbestand en de wachtwoorden die je erbij krijgt heel goed:
   zonder die sleutel kun je de app later niet meer bijwerken.
7. **assetlinks.json**: PWABuilder geeft een bestandje dat op de website moet staan (in de map `.well-known`),
   zodat de app zonder adresbalk opent.
8. **Winkelpagina** invullen met de teksten en afbeeldingen uit het marketingplan. Categorie: Dating.
9. **App-inhoud** invullen:
   - Privacybeleid: link hierboven
   - Doelgroep: alleen 18+
   - Inhoudsbeoordeling: vragenlijst eerlijk invullen (dating, gebruikers praten met elkaar, locatie delen)
   - Gegevensveiligheid: locatie bij benadering, naam, geboortedatum, profielgegevens, berichten;
     versleuteld verstuurd; verwijderen kan via de link hierboven
   - Standaarden voor kinderveiligheid: link naar veiligheid.html en het contactadres
10. **Gesloten test**: 12 testers uitnodigen met hun Gmail-adres. Ze moeten 14 dagen ingeschreven blijven.
11. **Productie aanvragen** na die 14 dagen. Google bekijkt de app; dat kan enkele dagen duren.

## Voor de aanvraag nog nodig in de app

- Leeftijdscontrole met ID (aanbevolen voor een 18+-app met locatie).
- Betalen via Google Play Billing, of de abonnementen verbergen tot dat klaar is.
- Iemand die meldingen binnen een dag behandelt.

## Niet doen

- Niets schrijven over "one night stand" of "friends with benefits" op de winkelpagina.
  Die keuzes zijn in de Play-versie (`?play=1`) verborgen.
- Geen valse cijfers of recensies.
