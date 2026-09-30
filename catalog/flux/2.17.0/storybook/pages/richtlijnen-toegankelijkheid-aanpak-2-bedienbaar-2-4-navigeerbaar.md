# 2.4 Navigeerbaar

Help gebruikers de weg naar je inhoud te vinden door een goede, duidelijke opbouw.

**Referenties:**

- [2.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#navigable)
- [2.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#navigable)

## Brons[basis]

### 2.4.1 Blokken omzeilen

Zorg ervoor dat gebruikers **onmiddellijk naar het begin van de hoofdinhoud** kunnen gaan en
onderdelen die herhaald worden, overslaan.

Bijvoorbeeld een hoofding of een menu met links. Zo kunnen gebruikers zonder muis ook snel en gemakkelijk de
hoofdinhoud van de pagina bereiken, in plaats van eerst alle links van het menu daarboven te moeten
doorlopen.

**Referenties:**

- [2.4.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#bypass-blocks)
- [2.4.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#bypass-blocks)

### 2.4.2 Paginatitel

Geef je webpagina’s een **unieke titel** die de inhoud of het doel van de pagina beschrijft.
Ook zonder de inhoud te kennen, moeten gebruikers meteen begrijpen waar de pagina over gaat.

Zo vinden gebruikers snel hun weg en weten ze waarvoor een pagina dient zonder alles te moeten lezen.

**Referenties:**

- [2.4.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#page-titled)
- [2.4.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#page-titled)

**Voorbeelden:**

vb. 1: [Voorzie altijd een titel.](https://www.w3.org/WAI/WCAG22/Techniques/html/H25)

    ```html
    <!doctype html>
    <html lang="en">
        <head>
            <title>The World Wide Web Consortium</title>
        </head>
        <body>
        ...
        </body>
    </html>
    ```

### 2.4.3 Focus volgorde

Zorg dat mensen via een **logische volgorde door de inhoud** kunnen gaan. De volgorde die je
met je ogen ziet, moet ook in de broncode gevolgd worden.

**Referenties:**

- [2.4.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#focus-order)
- [2.4.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#focus-order)

### 2.4.4 Linkdoel (in context)

Gebruikers moeten links makkelijk begrijpen. De tekst van de link moet de **bestemming of het doel ervan duidelijk maken**.

Zo weten gebruikers van een schermlezer waar een link naartoe leidt zonder dat ze alle omliggende inhoud
moeten lezen. En gebruikers die werken met spraakherkenning kunnen zo links kiezen via spraakopdrachten.

**Referenties:**

- [2.4.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#link-purpose-in-context)
- [2.4.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#link-purpose-in-context)

**Voorbeelden:**

vb. 1: [Gebruik de inhoud van een link om het doel duidelijk te formuleren.](https://www.w3.org/WAI/WCAG22/Techniques/general/G91)

    ```html
    <a href="routes.html">Current routes at Boulders Climbing Gym</a>
    ```

vb. 2: [Gebruik het 'alt' attribuut van een image in een link om het doel duidelijk te formuleren.](https://www.w3.org/WAI/WCAG22/Techniques/html/H30)

    ```html
    <a href="routes.html">
        <img src="topo.gif" alt="Current routes at Boulders Climbing Gym">
    </a>
    ```

vb. 3: [Gebruik het 'alt' attribuut van een area element om het deel duidelijk te beschrijven.](https://www.w3.org/WAI/WCAG22/Techniques/html/H24)

    ```html
    <img src="welcome.gif" usemap="#map1"
        alt="Areas in the library. Select an area for more information on that area.">
        <map id="map1" name="map1">
            <area shape="rect" coords="0,0,30,30" href="reference.html" alt="Reference">
            <area shape="rect" coords="34,34,100,100" href="media.html" alt="Audio visual lab">
        </map>
    ```

## Zilver[basis]

### 2.4.5 Meerdere manieren

Zorg dat er meerdere manieren zijn om **inhoud weer te geven en de weg te vinden**.

Verschillende mensen hebben verschillende voorkeuren. Iemand met minder concentratie of tijd bladert
misschien door een overzicht van alle links. Terwijl iemand die vergroting gebruikt misschien liever een
zoekopdracht doet in plaats van door een lang overzicht te scrollen.

**Referenties:**

- [2.4.5 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#multiple-ways)
- [2.4.5 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#multiple-ways)

### 2.4.6 Koppen en labels

Gebruik duidelijke, beschrijvende koppen en tussenkoppen in je teksten. Zo geef je de inhoud
een **overzichtelijke opbouw**. Geef onderdelen zoals een formulier, zoekbalk of tabel een
label.

Zo begrijpen gebruikers waarvoor ze dienen en vinden gebruikers van schermlezers gemakkelijk de weg.

**Referenties:**

- [2.4.6 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#headings-and-labels)
- [2.4.6 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#headings-and-labels)

**Voorbeelden:**

vb. 1: [Sla geen headings over en gebruik het onderscheidend woord als eerste.](https://www.w3.org/WAI/WCAG22/Techniques/general/G130)

    ```html
    <h1>Disaster preparation</h1>
    <h2>Flood preparation</h2>
    <h2>Fire preparation</h2>
    ```

### 2.4.7 Focus zichtbaar

Maak zichtbaar welk onderdeel van een pagina de **toetsenbordfocus** heeft. Gebruikers van een
toetsenbord moeten zien waar ze zich bevinden op de pagina.

**Referenties:**

- [2.4.7 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#focus-visible)
- [2.4.7 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#focus-visible)

## Zilver[plus]

### 2.4.11 Focus niet bedekt (minimum)

Als je met het toetsenbord naar een element navigeert, **moet** het element op dat
moment **zichtbaar worden** en mag het niet verstopt blijven achter andere inhoud.

**Referenties:**

- [2.4.11 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#focus-not-obscured-minimum)
- [2.4.11 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#focus-not-obscured-minimum)
