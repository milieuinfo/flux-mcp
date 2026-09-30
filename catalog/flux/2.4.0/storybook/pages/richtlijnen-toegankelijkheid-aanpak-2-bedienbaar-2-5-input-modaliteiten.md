# 2.5 Input modaliteiten

Gebruikers moeten websites en apps kunnen gebruiken met verschillende apparaten waarmee je dingen kan
aanwijzen en gegevens kan invoeren. Dus niet alleen met een toetsenbord.

Twee voorbeelden van een apparaat waarmee gebruikers een computer, tablet of smartphone gebruiken en
gegevens invoeren: een touchscreen of aanraakscherm en een aanwijzer met een laser die je met je hoofd
bedient.

**Referenties:**

- [2.5 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#input-modalities)
- [2.5 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#input-modalities)

## Brons[basis]

### 2.5.1 Aanwijzergebaren

Bijvoorbeeld inhoud vergroten of verkleinen door met een knijpbeweging met je vingers, van links naar rechts
met je vinger te vegen.

Op een **aanraakscherm** zijn er soms vingerbewegingen nodig om de onderdelen te kunnen
gebruiken. Zorg dat gebruikers op **meer dan één manier de inhoud** kunnen bedienen.

Sommige gebruikers met een handicap moeten taken kunnen uitvoeren en selecties maken met eenvoudige invoer of
eenvoudige bewegingen. Ingewikkelde of nauwkeurige bewegingen kunnen moeilijk zijn voor hen.

**Referenties:**

- [2.5.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#pointer-gestures)
- [2.5.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#pointer-gestures)

### 2.5.2 Aanwijzerannulering

Als gebruikers iets doen wat niet de bedoeling is op een **aanraakscherm**, dan moeten ze
dat **kunnen stoppen of annuleren**.

Zo voorkom je dat gebruikers per ongeluk dingen in gang zetten op een pagina.

**Referenties:**

- [2.5.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#pointer-cancellation)
- [2.5.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#pointer-cancellation)

**Voorbeelden:**

vb. 1: [Drag-en-drop acties moeten annuleerbaar zijn.](https://www.w3.org/WAI/WCAG22/Techniques/general/G210)

### 2.5.3 Label in naam

Geef onderdelen een label met een duidelijke naam die beschrijft wat de **bedoeling** ervan is.
Gebruikers van spraakinvoer, kunnen zo onderdelen activeren.

Gebruikers van voorleessoftware weten dan welke actie er aan een onderdeel verbonden is.

**Referenties:**

- [2.5.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#label-in-name)
- [2.5.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#label-in-name)

**Voorbeelden:**

vb. 1: [Gebruik verborgen tekst om zaken te verduidelijken.](https://www.w3.org/WAI/WCAG22/Techniques/general/G208)

    ```html
    <p>Go to
        <a href="code-of-conduct.html">Code of conduct <span class="hidden_accessibly"> of ACME Corporation</span></a>
    <p>
    ```

## Brons[plus]

### 2.5.4 Bewegingsactivering

Kunnen gebruikers dingen doen op je website of in je app met **gebaren** of door hun apparaat
te **bewegen**? Zorg dan ook voor een andere manier om dezelfde dingen te doen.

Sommige mensen hebben namelijk moeilijkheden om hun toestel te kantelen, schudden of gebaren te maken. Hun
toestel kan ook ergens op vastgezet zijn, zodat ze het kunnen gebruiken zonder het vast te houden.

**Referenties:**

- [2.5.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#motion-actuation)
- [2.5.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#motion-actuation)

## Zilver[basis]

### 2.5.8 Grootte van het aanwijsgebied (minimum)

Interactieve elementen moeten **minimaal 24 × 24 CSS-pixels** groot zijn voor bediening
met een aanwijzer, tenzij dit door context, ontwerpkeuzes of technische beperkingen niet mogelijk of niet
nodig is - bijvoorbeeld wanneer de functie ook op een andere manier beschikbaar is, elementen voldoende
afstand houden zonder overlap, of wanneer de grootte bepaald wordt door de browser of inline tekst.

**Referenties:**

- [2.5.8 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#target-size-minimum)
- [2.5.8 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#target-size-minimum)

## Zilver[plus]

### 2.5.7 Sleepbewegingen

Functionaliteit die normaal via slepen wordt bediend, moet **ook** toegankelijk zijn **via één enkele handeling** (zoals klikken of tikken), tenzij slepen essentieel is of de werking buiten de controle van de auteur valt.

**Referenties:**

- [2.5.7 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#dragging-movements)
- [2.5.7 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#dragging-movements)
