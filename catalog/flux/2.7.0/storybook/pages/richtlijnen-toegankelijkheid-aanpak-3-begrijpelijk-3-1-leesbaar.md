# 3.1 Leesbaar

Zorg ervoor dat iedereen de inhoud kan lezen en begrijpen. Of het nu gaat om inhoud die gebruikers zien,
horen of voelen.

**Referenties:**

- [3.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#readable)
- [3.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#readable)

## Brons[plus]

### 3.1.1 Taal van de pagina

Geef in de code van elke pagina aan wat de **hoofdtaal** van de tekst is. Zo spreekt een
schermlezer alles uit met het juiste accent en de juiste uitspraak.

**Referenties:**

- [3.1.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#language-of-page)
- [3.1.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#language-of-page)

**Voorbeelden:**

vb. 1: [Specifieer Frans als hoofdtaal.](https://www.w3.org/WAI/WCAG22/Techniques/html/H57)

    ```html
    <!doctype html>
    <html lang="fr">
    <head>
        <meta charset="utf-8">
        <title>document écrit en français</title>
    </head>
    <body>
    ... document écrit en français ...
    </body>
    </html>
    ```

## Zilver[plus]

### 3.1.2 Taal van onderdelen

Geef aan wanneer de taal op een pagina **verandert** of wanneer een **deel in een andere** taal is. Zo schakelen schermlezers daar over naar het juiste accent en de juiste uitspraak
voor die taal.

**Referenties:**

- [3.1.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#language-of-parts)
- [3.1.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#language-of-parts)

**Voorbeelden:**

vb. 1: [Specifieer Duits als de taal van een quote.](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)

    ```html
    <blockquote lang="de">
        <p>
            Da dachte der Herr daran, ihn aus dem Futter zu schaffen,
            aber der Esel merkte, daß kein guter Wind wehte, lief fort
            und machte sich auf den Weg nach Bremen: dort, meinte er,
            könnte er ja Stadtmusikant werden.
        </p>
    </blockquote>
    ```
