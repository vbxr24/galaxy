// Galaxy hulp zonder AI: vaste antwoorden in 5 talen. Andere talen krijgen Engels.
// [trefwoorden, link of '', { nl, en, fr, de, es }]
export const FAQ: [RegExp, string, Record<string, string>][] = [
  [/zelfmoord|suicid|suizid|self.?harm|zelfbeschadig|kill myself|mezelf.*(dood|pijn)|me tuer|mich umbringen|matarme/i, 'helplines', {
    nl: '💜 Wat fijn dat je het zegt. Je staat er niet alleen voor. Bel of chat nu met een hulplijn (in België: 1813, in Nederland: 113). In direct gevaar: bel 112.',
    en: "💜 I'm glad you said something. You're not alone. Please reach out to a helpline now; this page lists one for your country. If you're in immediate danger, call your emergency number (112 / 911).",
    fr: "💜 Merci de l'avoir dit. Tu n'es pas seul(e). Contacte une ligne d'écoute maintenant (en Belgique : 0800 32 123, en France : 3114). En danger immédiat : appelle le 112.",
    de: '💜 Gut, dass du es sagst. Du bist nicht allein. Wende dich jetzt an eine Hilfe-Hotline (Deutschland: 0800 111 0 111). In akuter Gefahr: 112.',
    es: '💜 Gracias por decirlo. No estás solo/a. Contacta ahora con una línea de ayuda (España: 024). En peligro inmediato: llama al 112.' }],
  [/gevaar|danger|bedreig|threat|achtervolg|stalk|aangerand|assault|agress|gefahr|peligro|dringend|urgent|nood|emergency/i, 'safety', {
    nl: '🚨 Ben je nu in gevaar? Bel meteen 112. Blokkeer en meld de persoon in de app (tik op het profiel → melden). Ik stuur je melding ook door naar het Galaxy-team.',
    en: '🚨 Are you in danger right now? Call your emergency number (112 / 911) immediately. Block and report the person in the app (tap their profile → report).',
    fr: "🚨 Es-tu en danger maintenant ? Appelle tout de suite le 112. Bloque et signale la personne dans l'app (touche son profil → signaler).",
    de: '🚨 Bist du gerade in Gefahr? Ruf sofort 112 an. Blockiere und melde die Person in der App (Profil antippen → melden).',
    es: '🚨 ¿Estás en peligro ahora? Llama al 112 de inmediato. Bloquea y denuncia a la persona en la app (toca su perfil → denunciar).' }],
  [/minderjarig|underage|minor|mineur|minderjährig|menor|jonger dan 18|under 18|moins de 18|unter 18/i, '', {
    nl: 'Galaxy is alleen voor 18+. Vermoed je dat iemand minderjarig is? Meld het profiel in de app, dan wordt het snel nagekeken en verwijderd.',
    en: 'Galaxy is 18+ only. Think someone is underage? Report the profile in the app and it will be reviewed and removed quickly.',
    fr: 'Galaxy est réservé aux 18+. Tu penses que quelqu\'un est mineur ? Signale le profil dans l\'app, il sera vérifié et supprimé rapidement.',
    de: 'Galaxy ist nur ab 18. Vermutest du, dass jemand minderjährig ist? Melde das Profil in der App, es wird schnell geprüft und entfernt.',
    es: 'Galaxy es solo para mayores de 18. ¿Crees que alguien es menor? Denuncia el perfil en la app y se revisará y eliminará rápido.' }],
  [/melden|report|signal|denunc|blok|block|bloqu|lastig|harass|belästig|acoso|spam|fake|nep/i, 'safety', {
    nl: 'Tik op iemands profiel → "Melden" of "Blokkeren". Na blokkeren kan die persoon je niet meer zien of berichten. Meldingen worden snel bekeken.',
    en: 'Tap someone\'s profile → "Report" or "Block". After blocking they can no longer see or message you. Reports are reviewed quickly.',
    fr: 'Touche le profil → « Signaler » ou « Bloquer ». Une fois bloquée, la personne ne peut plus te voir ni t\'écrire.',
    de: 'Tippe auf das Profil → „Melden" oder „Blockieren". Danach kann die Person dich nicht mehr sehen oder anschreiben.',
    es: 'Toca el perfil → «Denunciar» o «Bloquear». Tras bloquear, esa persona ya no puede verte ni escribirte.' }],
  [/verwijder|delete|supprim|lösch|borrar|eliminar|account weg|uitschrijven|unsubscribe/i, 'delete_account', {
    nl: 'Je account verwijderen kan in de app via je profiel → "Account verwijderen", of via deze pagina. Alles wordt binnen 30 dagen gewist.',
    en: 'Delete your account in the app via your profile → "Delete account", or on this page. Everything is erased within 30 days.',
    fr: 'Supprime ton compte dans l\'app via ton profil → « Supprimer le compte », ou sur cette page. Tout est effacé sous 30 jours.',
    de: 'Lösche dein Konto in der App über dein Profil → „Konto löschen" oder auf dieser Seite. Alles wird innerhalb von 30 Tagen gelöscht.',
    es: 'Elimina tu cuenta en la app desde tu perfil → «Eliminar cuenta», o en esta página. Todo se borra en 30 días.' }],
  [/exact|precies|waar ik ben|where i am|où je suis|wo ich bin|dónde estoy|locatie|location|localisation|standort|ubicación|gps|zone/i, 'privacy', {
    nl: 'Niemand ziet je exacte plek. Anderen zien hooguit een zone van ongeveer 300 meter. Met de onzichtbaar-knop zien ze niets.',
    en: 'Nobody sees your exact location. Others see at most an area of about 300 m. With the invisible button they see nothing.',
    fr: 'Personne ne voit ta position exacte. Les autres voient au plus une zone d\'environ 300 m. Avec le bouton invisible, rien du tout.',
    de: 'Niemand sieht deinen genauen Standort. Andere sehen höchstens einen Bereich von etwa 300 m. Mit dem Unsichtbar-Knopf gar nichts.',
    es: 'Nadie ve tu ubicación exacta. Los demás ven como mucho una zona de unos 300 m. Con el botón invisible, nada.' }],
  [/onzichtbaar|invisible|unsichtbar|verberg|hide|cacher|ocult|ghost/i, '', {
    nl: 'Tik op de kaart op het mannetje-icoon en kies "Onzichtbaar". Dan zie je de kaart nog, maar niemand ziet jou. Gratis.',
    en: 'On the map, tap the person icon and choose "Invisible". You still see the map, but nobody sees you. Free.',
    fr: 'Sur la carte, touche l\'icône du personnage et choisis « Invisible ». Tu vois la carte, personne ne te voit. Gratuit.',
    de: 'Tippe auf der Karte auf das Figuren-Symbol und wähle „Unsichtbar". Du siehst die Karte, aber niemand dich. Kostenlos.',
    es: 'En el mapa, toca el icono del muñeco y elige «Invisible». Ves el mapa, pero nadie te ve. Gratis.' }],
  [/privacy|gegevens|data|données|daten|datos|gdpr|avg|rgpd|dsgvo/i, 'privacy', {
    nl: 'We bewaren alleen wat nodig is, verkopen niets en tonen nooit je exacte plek. Alles staat in ons privacybeleid.',
    en: 'We only keep what is needed, sell nothing and never show your exact location. Everything is in our privacy policy.',
    fr: 'Nous ne gardons que le nécessaire, ne vendons rien et ne montrons jamais ta position exacte. Tout est dans notre politique de confidentialité.',
    de: 'Wir speichern nur das Nötigste, verkaufen nichts und zeigen nie deinen genauen Standort. Alles steht in unserer Datenschutzerklärung.',
    es: 'Solo guardamos lo necesario, no vendemos nada y nunca mostramos tu ubicación exacta. Todo está en nuestra política de privacidad.' }],
  [/café|cafe|bar\b|club|zaak|venue|restaurant|horeca|kroeg|établissement|lokal|local/i, 'cafe_signup', {
    nl: 'Heb je een café, bar of club? Meld je zaak gratis aan voor Galaxy-avonden: je staat op de kaart en gasten checken in met een QR-code.',
    en: 'Do you run a bar, café or club? Sign up for free for Galaxy nights: you appear on the map and guests check in with a QR code.',
    fr: 'Tu as un bar, café ou club ? Inscris-le gratuitement aux soirées Galaxy : il apparaît sur la carte et les clients font leur check-in avec un QR code.',
    de: 'Du hast eine Bar, ein Café oder einen Club? Melde dich kostenlos für Galaxy-Abende an: du erscheinst auf der Karte, Gäste checken per QR-Code ein.',
    es: '¿Tienes un bar, café o club? Inscríbelo gratis a las noches Galaxy: aparece en el mapa y los clientes hacen check-in con un código QR.' }],
  [/prijs|kost|betal|price|cost|pay|how much|combien|co[uû]te|wie viel|cu[aá]nto|prix|payer|preis|zahlen|precio|pagar|abonnement|subscription|forever|gold|cosmic|galaxy\+/i, '', {
    nl: 'Tijdens de testversie is alles gratis, er wordt niets afgerekend. Later: Galaxy+ €9,99/maand, Gold €19,99, Cosmic €34,99 of Galaxy Forever €149,99 eenmalig. De basis blijft gratis.',
    en: 'Everything is free during the beta; nothing is charged. Later: Galaxy+ €9.99/month, Gold €19.99, Cosmic €34.99 or Galaxy Forever €149.99 one-time. The basics stay free.',
    fr: 'Tout est gratuit pendant la version test. Plus tard : Galaxy+ 9,99 €/mois, Gold 19,99 €, Cosmic 34,99 € ou Galaxy Forever 149,99 € une fois. La base reste gratuite.',
    de: 'In der Testversion ist alles kostenlos. Später: Galaxy+ 9,99 €/Monat, Gold 19,99 €, Cosmic 34,99 € oder Galaxy Forever 149,99 € einmalig. Die Basis bleibt gratis.',
    es: 'Todo es gratis durante la beta. Más adelante: Galaxy+ 9,99 €/mes, Gold 19,99 €, Cosmic 34,99 € o Galaxy Forever 149,99 € pago único. Lo básico sigue gratis.' }],
  [/terugbetal|refund|rembours|erstatt|reembols|geld terug|money back/i, '', {
    nl: 'Tijdens de testversie wordt er niets aangerekend. Werd er toch iets aangerekend? Beschrijf het kort, dan stuur ik het door naar het team.',
    en: 'Nothing is charged during the beta. Were you charged anyway? Describe it briefly and I\'ll pass it on to the team.',
    fr: 'Rien n\'est facturé pendant la version test. Tu as quand même été débité ? Décris-le brièvement, je transmets à l\'équipe.',
    de: 'In der Testversion wird nichts berechnet. Wurde dir trotzdem etwas berechnet? Beschreib es kurz, ich leite es weiter.',
    es: 'Durante la beta no se cobra nada. ¿Te cobraron igualmente? Descríbelo brevemente y lo paso al equipo.' }],
  [/install|download|app store|play store|startscherm|home screen|écran d.accueil|startbildschirm|pantalla de inicio|iphone|android/i, 'app', {
    nl: 'Galaxy werkt in je browser, je hoeft niets te downloaden. Open de app en kies in je browsermenu "Toevoegen aan startscherm".',
    en: 'Galaxy works in your browser, nothing to download. Open the app and choose "Add to Home Screen" in your browser menu.',
    fr: 'Galaxy fonctionne dans ton navigateur. Ouvre l\'app et choisis « Ajouter à l\'écran d\'accueil » dans le menu du navigateur.',
    de: 'Galaxy läuft im Browser, nichts herunterladen. Öffne die App und wähle im Browser-Menü „Zum Startbildschirm hinzufügen".',
    es: 'Galaxy funciona en tu navegador. Abre la app y elige «Añadir a pantalla de inicio» en el menú del navegador.' }],
  [/mannetje|avatar|figuur|personnage|figur|muñeco|kapsel|haar|hair|cheveux|kleren|clothes|schoen|shoe|merch/i, 'app', {
    nl: 'Je mannetje pas je aan via "Stijl" in je profiel: kapsel, gezicht, make-up, kleren, schoenen, accessoires en Galaxy merch. Vergeet niet op Opslaan te tikken.',
    en: 'Customise your avatar via "Style" in your profile: hair, face, make-up, clothes, shoes, accessories and Galaxy merch. Don\'t forget to tap Save.',
    fr: 'Personnalise ton avatar via « Style » dans ton profil : cheveux, visage, maquillage, vêtements, chaussures, accessoires et merch Galaxy. N\'oublie pas d\'enregistrer.',
    de: 'Passe deinen Avatar über „Stil" im Profil an: Haare, Gesicht, Make-up, Kleidung, Schuhe, Accessoires und Galaxy-Merch. Speichern nicht vergessen.',
    es: 'Personaliza tu avatar en «Estilo» de tu perfil: pelo, cara, maquillaje, ropa, zapatos, accesorios y merch Galaxy. No olvides guardar.' }],
  [/match|zwaai|wave|coucou|winken|saludar|chat|bericht|message|nachricht|mensaje/i, '', {
    nl: 'Zwaai naar iemand in een zone. Zwaait die terug, dan is het een match en kunnen jullie chatten. Zo krijg je alleen berichten van mensen die jij ook wilt.',
    en: 'Wave at someone in an area. If they wave back, it\'s a match and you can chat. That way you only get messages from people you want.',
    fr: 'Fais coucou à quelqu\'un dans une zone. S\'il répond, c\'est un match et vous pouvez discuter.',
    de: 'Wink jemandem in einem Bereich zu. Winkt die Person zurück, ist es ein Match und ihr könnt chatten.',
    es: 'Saluda a alguien en una zona. Si te devuelve el saludo, es un match y podéis chatear.' }],
  [/inchecken|check.?in|enregistr|einchecken|registrar/i, '', {
    nl: 'Ben je bij een plek op de kaart (binnen 150 m), tik erop en kies "Inchecken". Anderen zien dan hoeveel mensen er zijn, niet wie.',
    en: 'When you\'re at a place on the map (within 150 m), tap it and choose "Check in". Others see how many people are there, not who.',
    fr: 'Quand tu es à un endroit de la carte (à moins de 150 m), touche-le et choisis « Check-in ». Les autres voient combien de personnes, pas qui.',
    de: 'Bist du an einem Ort der Karte (innerhalb 150 m), tippe ihn an und wähle „Einchecken". Andere sehen wie viele, nicht wer.',
    es: 'Cuando estés en un lugar del mapa (a menos de 150 m), tócalo y elige «Check-in». Los demás ven cuántos hay, no quiénes.' }],
  [/groep|group|groupe|gruppe|grupo/i, '', {
    nl: 'Met een groepsdate plan je iets bij een café of park en nodig je anderen uit. Samen afspreken is veiliger en leuker. Gratis: 1 tegelijk.',
    en: 'With a group date you plan something at a bar or park and invite others. Meeting as a group is safer and more fun. Free: 1 at a time.',
    fr: 'Avec un date de groupe, tu organises quelque chose dans un bar ou un parc et invites d\'autres personnes.',
    de: 'Mit einem Gruppendate planst du etwas in einer Bar oder einem Park und lädst andere ein.',
    es: 'Con una cita en grupo planeas algo en un bar o parque e invitas a otros.' }],
  [/druk|busy|crowd|monde|affluence|voll|lleno|gente/i, '', {
    nl: 'De kaart toont waar het druk is. Nu is dat een schatting op basis van het soort plek en het uur; met meer leden telt Galaxy live per zone, zonder te tonen wie waar is.',
    en: 'The map shows where it\'s busy. For now it\'s an estimate based on the kind of place and time; with more members Galaxy counts live per area, without showing who is where.',
    fr: 'La carte montre où il y a du monde. Pour l\'instant c\'est une estimation selon le lieu et l\'heure.',
    de: 'Die Karte zeigt, wo viel los ist. Derzeit ist es eine Schätzung nach Ort und Uhrzeit.',
    es: 'El mapa muestra dónde hay gente. Por ahora es una estimación según el lugar y la hora.' }],
  [/leeftijd|age|âge|alter|edad|id|identiteit|verif|vinkje|tick|echt/i, '', {
    nl: 'Galaxy is alleen voor 18+. Het echtheidsvinkje krijg je met een selfie met een gebaar (in je profiel → "Echt"). Een leeftijdscontrole met ID komt voor de officiële lancering.',
    en: 'Galaxy is 18+ only. Get the verified tick with a selfie doing a gesture (profile → "Real"). An ID age check comes before the official launch.',
    fr: 'Galaxy est réservé aux 18+. Le badge vérifié s\'obtient avec un selfie (profil → « Vrai »).',
    de: 'Galaxy ist ab 18. Das Echtheits-Häkchen bekommst du mit einem Selfie (Profil → „Echt").',
    es: 'Galaxy es solo para mayores de 18. La marca verificada se obtiene con un selfie (perfil → «Real»).' }],
  [/inlog|login|log in|wachtwoord|password|mot de passe|passwort|contraseña|e-?mail|code|connect/i, '', {
    nl: 'Je kunt Galaxy gebruiken zonder wachtwoord. Wil je je account bewaren, koppel dan je e-mail in je profiel; je krijgt een inloglink per mail. Lukt inloggen niet? Beschrijf het kort.',
    en: 'You can use Galaxy without a password. To keep your account, link your email in your profile; you\'ll get a login link by email. Can\'t log in? Describe it briefly.',
    fr: 'Tu peux utiliser Galaxy sans mot de passe. Pour garder ton compte, lie ton e-mail dans ton profil ; tu recevras un lien de connexion.',
    de: 'Du kannst Galaxy ohne Passwort nutzen. Um dein Konto zu behalten, verknüpfe deine E-Mail im Profil; du bekommst einen Login-Link.',
    es: 'Puedes usar Galaxy sin contraseña. Para conservar tu cuenta, vincula tu correo en el perfil; recibirás un enlace de acceso.' }],
  [/melding|notification|push|benachrichtig|notificaci/i, '', {
    nl: 'Meldingen staan standaard uit. Zet ze aan in je profiel → Meldingen. Een melding bevat nooit berichtinhoud of locatie.',
    en: 'Notifications are off by default. Turn them on in your profile → Notifications. They never contain message content or location.',
    fr: 'Les notifications sont désactivées par défaut. Active-les dans ton profil → Notifications.',
    de: 'Benachrichtigungen sind standardmäßig aus. Schalte sie im Profil → Benachrichtigungen ein.',
    es: 'Las notificaciones están desactivadas por defecto. Actívalas en tu perfil → Notificaciones.' }],
  [/taal|language|langue|sprache|idioma/i, '', {
    nl: 'Galaxy is er in 15 talen. Tik bovenaan in de app op de vlag om je taal te kiezen.',
    en: 'Galaxy is available in 15 languages. Tap the flag at the top of the app to choose your language.',
    fr: 'Galaxy existe en 15 langues. Touche le drapeau en haut de l\'app pour choisir ta langue.',
    de: 'Galaxy gibt es in 15 Sprachen. Tippe oben in der App auf die Flagge, um deine Sprache zu wählen.',
    es: 'Galaxy está en 15 idiomas. Toca la bandera arriba en la app para elegir tu idioma.' }],
  [/werkt niet|doesn.t work|kapot|bug|error|fout|crash|laadt niet|not loading|ne marche pas|funktioniert nicht|no funciona|traag|slow/i, '', {
    nl: 'Vervelend! Probeer eerst de pagina te herladen of de app helemaal te sluiten en opnieuw te openen. Blijft het? Beschrijf kort wat er gebeurt en op welk toestel, dan stuur ik het door.',
    en: 'Sorry about that! First try reloading or fully closing and reopening the app. Still happening? Describe briefly what happens and on which device, and I\'ll pass it on.',
    fr: 'Désolé ! Recharge la page ou ferme complètement l\'app puis rouvre-la. Toujours le problème ? Décris-le brièvement.',
    de: 'Ärgerlich! Lade die Seite neu oder schließe die App ganz und öffne sie wieder. Weiterhin? Beschreib kurz, was passiert.',
    es: '¡Vaya! Recarga la página o cierra la app por completo y vuelve a abrirla. ¿Sigue igual? Descríbelo brevemente.' }],
  [/hoe werkt|how does|how do|comment ça|wie funktioniert|cómo funciona|wat is galaxy|what is galaxy/i, 'home', {
    nl: 'Galaxy is een live wereldkaart: je ziet waar het druk is, loopt rond met je eigen 3D-mannetje, zwaait naar mensen in de buurt en spreekt af op een openbare plek. Alleen 18+, gratis tijdens de testversie.',
    en: 'Galaxy is a live world map: see where it\'s busy, walk around with your own 3D avatar, wave at people nearby and meet in a public place. 18+ only, free during the beta.',
    fr: 'Galaxy est une carte du monde en direct : vois où il y a du monde, promène-toi avec ton avatar 3D, fais coucou aux gens proches et retrouvez-vous dans un lieu public.',
    de: 'Galaxy ist eine Live-Weltkarte: sieh, wo viel los ist, lauf mit deinem 3D-Avatar herum, wink Leuten in der Nähe zu und trefft euch an einem öffentlichen Ort.',
    es: 'Galaxy es un mapa mundial en vivo: ves dónde hay gente, paseas con tu avatar 3D, saludas a gente cerca y quedáis en un lugar público.' }],
  [/hallo|hoi|hey|hi\b|hello|bonjour|salut|guten tag|hola|dag\b/i, '', {
    nl: 'Hoi! 👋 Stel gerust je vraag over Galaxy, je account, veiligheid of je café.',
    en: 'Hi! 👋 Ask me anything about Galaxy, your account, safety or your venue.',
    fr: 'Salut ! 👋 Pose ta question sur Galaxy, ton compte, la sécurité ou ton établissement.',
    de: 'Hallo! 👋 Frag mich alles zu Galaxy, deinem Konto, Sicherheit oder deinem Lokal.',
    es: '¡Hola! 👋 Pregúntame lo que quieras sobre Galaxy, tu cuenta, seguridad o tu local.' }],
  [/dank|thank|merci|danke|gracias/i, '', { nl: 'Graag gedaan! 💜', en: "You're welcome! 💜", fr: 'Avec plaisir ! 💜', de: 'Gern geschehen! 💜', es: '¡De nada! 💜' }],
];
export const NONE: Record<string, string> = {
  nl: 'Dat kan ik niet zelf oplossen. Beschrijf je vraag kort, dan stuur ik ze door naar het Galaxy-team.',
  en: "I can't solve that myself. Describe your question briefly and I'll pass it on to the Galaxy team.",
  fr: 'Je ne peux pas résoudre ça moi-même. Décris ta question brièvement, je la transmets à l\'équipe Galaxy.',
  de: 'Das kann ich nicht selbst lösen. Beschreib deine Frage kurz, ich leite sie an das Galaxy-Team weiter.',
  es: 'No puedo resolverlo yo mismo. Describe tu pregunta brevemente y la paso al equipo de Galaxy.',
};
// welke onderwerpen moeten ook meteen naar een mens
export const URGENT = /zelfmoord|suicid|suizid|self.?harm|gevaar|danger|bedreig|threat|stalk|aangerand|assault|minderjarig|underage|minor/i;
