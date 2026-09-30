# 4.1 Compatibel

Compatibel betekent dat een website werkt met alle webbrowsers en ondersteunende technologieën. Ook een app
moet je met alle ondersteunende technologieën kunnen gebruiken.

**Referenties:**

- [4.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#compatible)
- [4.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#compatible)

## Brons[basis]

### 4.1.2 Naam, rol, waarde

Zijn er onderdelen van de gebruikersomgeving waarmee gebruikers iets moeten **kunnen doen**?
Dan moeten ze die **ook met ondersteunende technologieën** kunnen gebruiken.

Zo kunnen ook gebruikers van schermlezers met deze onderdelen werken.

**Referenties:**

- [4.1.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#name-role-value)
- [4.1.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#name-role-value)

**Voorbeelden:**

vb. 1: [Voorzie een sluit knop met aria-label in een pop-up.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14)

    ```html
    <div id="box">
        This is a pop-up box.
        <button aria-label="Close">X</button>
    </div>
    ```

vb. 2: [Splits een telefoonnummer op in meerdere velden met een aria-label.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA14)

    ```html
    <div role="group" aria-labelledby="groupLabel">
        <span id="groupLabel">Work Phone</span>
        +<input autocomplete="tel-country-code" type="number" aria-label="country code">
        <input autocomplete="tel-area-code" type="number" aria-label="area code">
        <input autocomplete="tel-local" type="number" aria-label="subscriber number">
    </div>
    ```

vb. 3: [Gebruik het attribuut 'aria-labelledby'.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA16)

    ```html
    <p>Please select the <span id="mysldr-lbl">number of days for your trip</span></p>
    <div id="mysldr" role="slider" aria-labelledby="mysldr-lbl"></div>
    ```

## Zilver[plus]

### 4.1.3 Statusberichten

Bijvoorbeeld de voortgang van een proces, een foutmelding, een bevestiging.

**Verandert er iets** aan de inhoud van de pagina, bijvoorbeeld een bevestiging nadat iemand
een formulier verzendt, of een lijst met zoekresultaten nadat iemand op ‘zoeken’ drukt? Laat dat dan weten
aan je gebruikers met een statusbericht, ook aan mensen die ondersteunende technologieën gebruiken.

Gebruikers van een schermlezer kunnen de wijzigingen niet zien en moeten een melding krijgen met info over
wat er veranderd is.

**Referenties:**

- [4.1.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#status-messages)
- [4.1.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#status-messages)

**Voorbeelden:**

vb. 1: [Voorzie een boodschap na zoeken.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)

    ```html
    <div role="status" aria-atomic="true">5 results returned.</div>
    ```

vb. 2: [Pas de status van de winkelwagen aan.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)

    ```html
    <p role="status" aria-atomic="true">
        <img src="shopping-cart.png" alt="Shopping Cart">
        <span id="cart">0</span> items
    </p>
    ```
