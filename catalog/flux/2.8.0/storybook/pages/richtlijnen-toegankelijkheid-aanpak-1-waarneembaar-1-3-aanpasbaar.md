# 1.3 Aanpasbaar

Maak inhoud die gebruikers op verschillende manieren kunnen weergeven zonder dat ze informatie of het
overzicht verliezen.

**Referenties:**

- [1.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#adaptable)
- [1.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#adaptable)

## Brons[basis]

### 1.3.1 Info en onderlinge verhoudingen

Bijvoorbeeld tabellen, lijsten, koppen, paragrafen, opsommingen, invoervelden van formulieren.

Leg in de code van je website vast wat de **relatie tussen de verschillende onderdelen** van
je webpagina is.

Wat je zichtbaar weergeeft, moet ook waar te nemen zijn met ondersteunende technologieën, zoals schermlezers,
schermvergrotingssoftware en spraakherkenningssoftware.

**Referenties:**

- [1.3.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#info-and-relationships)
- [1.3.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#info-and-relationships)

**Voorbeelden:**

vb. 1: [Gebruik het 'role' attribuut met ARIA-landmarks (region, banner, navigation, ... ) om paginaonderdelen te identificeren.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA11)

    ```html
    <div role="banner">site logo and name, etc. here</div>
    <div role="search">search functionality here</div>
    <div role="navigation">a list of navigation links here</div>
    <div role="form">a sign-up form here</div>
    <div role="main">the page's main content here</div>
    <div role="region">a sponsor's promotion here</div>
    <div role="complementary">sidebar content here</div>
    <div role="contentinfo"> site contact details, copyright information, etc. here </div>
    ```

vb. 2: [Gebruik semantische HTML om regions te identificeren.](https://www.w3.org/WAI/WCAG22/Techniques/html/H101)

    ```html
    <header> site logo and name, etc. here </header>
    <form aria-label="site search"> search functionality here </form>
    <nav> a list of navigation links here </nav>
    <main> the page's main content here </main>
    <section> a sponsor's promotion here </section>
    <aside> sidebar content here </aside>
    <footer> site contact details, copyright information, etc. here </footer>
    ```

vb. 3: [Gebruik 'role=heading' om headings te identificeren.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA12)

    ```html
    <div role="heading" aria-level="2">Global News Items</div>
    ... a list of global news with editorial comment....

    <div role="heading" aria-level="3">Politics</div>
    ... a list of global political news stories ...
    ```

vb. 4: [Gebruik 'aria-labelledby' om regions te benoemen.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)

    ```html
    <div role="application" aria-labelledby="p123" aria-describedby="info">
        <h1 id="p123">Calendar<h1>
            <p id="info">This calendar shows the game schedule for the Boston Red Sox.</p>
            <div role="grid">
                ...
            </div>
    </div>
    ```

vb. 5: [Gebruik de 'group' role voor gerelateerde zaken.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA17)

    ```html
    <div role="group" aria-labelledby="ssn1">
        <span id="ssn1">Social Security Number</span>
        <span style="color: #D90D0D;"> (required)</span>
        <input size="3" type="text" aria-required="true" title="First 3 digits">-
        <input size="2" type="text" aria-required="true" title="Next 2 digits">-
        <input size="4" type="text" aria-required="true" title="Last 4 digits">
    </div>
    ```

vb. 6: [Gebruik de 'region' role om een regio te identificeren.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA20)

    ```html
    <div role="region" aria-label="weather portlet">
        ...
    </div>
    ```

vb. 7: [Gebruik semantische elementen voor structuur.](https://www.w3.org/WAI/WCAG22/Techniques/general/G115)

    ```html
    <p>What the user <em>really</em> meant to say was,
        <q>This is not ok, it is <strong>excellent</strong>!</q>
    </p>
    ```

### 1.3.2 Betekenisvolle volgorde

Zorg dat gebruikers de **inhoud in een logische volgorde** kunnen waarnemen, of dat nu met hun
ogen is of met ondersteunende technologie zoals een schermlezer. Daarvoor moet je alles de juiste code
geven.

**Referenties:**

- [1.3.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#meaningful-sequence)
- [1.3.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#meaningful-sequence)

**Voorbeelden:**

vb. 1: [Orden de inhoud in een betekenisvolle volgorde.](https://www.w3.org/WAI/WCAG22/Techniques/general/G57)

### 1.3.3 Zintuiglijke eigenschappen

Zorg ervoor dat je inhoud **nooit** bestaat uit dingen die gebruikers **alleen maar kunnen zien of horen**, zoals vormen, kleuren, grootte of geluiden.

Zo krijgen gebruikers die moeilijk of niet zien of horen de informatie ook mee.

**Referenties:**

- [1.3.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#sensory-characteristics)
- [1.3.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#sensory-characteristics)

**Voorbeelden:**

vb. 1: [Gebruik tekstuele identificatie voor zaken die anders enkel visueel zijn.](https://www.w3.org/WAI/WCAG22/Techniques/general/G96)

## Zilver[basis]

### 1.3.4 Weergavestand

Zorg dat de inhoud is **afgestemd op schermen met verschillende verhoudingen**. En dat de
inhoud in verschillende weergaves goed leesbaar is: **staand en liggend**.

Gebruikers met een handicap moeten de inhoud kunnen bekijken in een stand die voor hen het beste werkt. Een
weergave in grotere letters is bijvoorbeeld makkelijker om te lezen in liggende stand. Sommige gebruikers
hebben een toestel dat vastgezet is in een staande of liggende stand en dat je dus niet zomaar van stand
verwisselt.

**Referenties:**

- [1.3.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#orientation)
- [1.3.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#orientation)

**Voorbeelden:**

vb. 1: [Voorzie een manier om de richting expliciet te beïnvloeden.](https://www.w3.org/WAI/WCAG22/Techniques/general/G214)

### 1.3.5 Identificeer het doel van de input

Maak het **doel van invoervelden van formulieren duidelijk**.

Zorg voor een goede opbouw en uitleg bij de invoervelden. Verschillende webbrowsers en ondersteunende
technologieën moeten die kunnen weergeven, bijvoorbeeld een schermlezer.

**Referenties:**

- [1.3.5 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#identify-input-purpose)
- [1.3.5 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121%2C131#identify-input-purpose)

**Voorbeelden:**

vb. 1: [Gebruik het HTML 5.2 autocomplete attribuut.](https://www.w3.org/WAI/WCAG22/Techniques/html/H98)

    ```html
    <form method="post" action="step2">
        <div>
            <label for="fname">First Name</label>
            <input autocomplete="given-name" id="fname" type="text">
        </div>
        <div>
            <label for="lname">Last Name</label>
            <input autocomplete="family-name" id="lname" type="text">
        </div>
        <div>
            <label for="cc-num">Credit card number:</label>
            <input autocomplete="cc-number" id="cc-num" type="text">
        </div>
        <div>
            <label for="exp-date">Expiry Date:</label>
            <input autocomplete="cc-exp" id="exp-date" type="month">
        </div>
        <div>
            <input type="submit" value="Continue">
        </div>
    </form>
    ```
