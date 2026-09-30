# 3.3 Assistentie bij invoer

Geef gebruikers genoeg informatie zodat ze geen fouten maken, of begrijpen wat er misgaat en dat kunnen
rechtzetten.

**Referenties:**

- [3.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#input-assistance)
- [3.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#input-assistance)

## Brons[basis]

### 3.3.1 Foutidentificatie

Wanneer er een fout optreedt, **toon** dan duidelijk waar de fout zit.
En **beschrijf** goed wat er fout is.

Zo begrijpen ook mensen die bepaalde kleuren niet goed kunnen zien of die pictogrammen of andere symbolen
niet goed begrijpen dat er iets fout is gegaan.

**Referenties:**

- [3.3.1 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#error-identification)
- [3.3.1 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#error-identification)

### 3.3.2 Labels of instructies

Bijvoorbeeld een contactformulier of de aanmelding voor een nieuwsbrief.

Zorg ervoor dat gebruikers **begrijpen wat ze moeten invullen** in een veld van een formulier.
Moeten ze gegevens in een bepaald formaat ingeven, bijvoorbeeld een datum? Leg dan uit hoe dat moet.

Zo begrijpen alle gebruikers meteen welke gegevens ze moeten invullen.

**Referenties:**

- [3.3.2 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#labels-or-instructions)
- [3.3.2 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#labels-or-instructions)

## Brons[plus]

### 3.3.7 Overbodige invoer

Informatie die je al **eerder invulde**, moet tijdens hetzelfde proces **automatisch ingevuld** worden of gemakkelijk terug te kiezen zijn.

Dat mag alleen anders als:

- het echt nodig is om alles opnieuw in te vullen,
- het belangrijk is voor de veiligheid, of
- de oude informatie niet meer klopt.

**Referenties:**

- [3.3.7 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#redundant-entry)
- [3.3.7 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#redundant-entry)

## Zilver[basis]

### 3.3.3 Foutsuggestie

Wanneer gebruikers niet de juiste gegevens invoeren, kan je voorstellen laten zien van hoe ze die
kunnen **verbeteren**. Tenzij dat niet veilig of nuttig zou zijn.

Zo lossen gebruikers problemen gemakkelijker op.

**Referenties:**

- [3.3.3 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#error-suggestion)
- [3.3.3 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#error-suggestion)

**Voorbeelden:**

vb. 1: [Toon een melding met role='alertdialog' bij ongeldige invoer.](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA18)

    ```html
    <div role="alertdialog" aria-labelledby="alertHeading">
        <h1 id="alertHeading">Error</h1>
        <p>Employee's Birth Date is after their hire date.
            Please verify the birth date and hire date.</p>
        <button>Save and Continue</button>
        <button>Return to page and correct error</button>
    </div>
    ```

## Zilver[plus]

### 3.3.4 Foutpreventie (wettelijk, financieel, gegevens)

Moeten gebruikers vertrouwelijke gegevens invoeren, zoals wettelijke, financiële of persoonlijke gegevens?
Zorg ervoor dat ze hun ingevoerde informatie kunnen **nakijken, verbeteren en bevestigen**.

**Referenties:**

- [3.3.4 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#error-prevention-legal-financial-data)
- [3.3.4 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#error-prevention-legal-financial-data)

### 3.3.8 Toegankelijke authenticatie (minimum)

Een **cognitieve test** (zoals een wachtwoord onthouden of een puzzel oplossen)
mag **geen verplichte stap** zijn **tijdens het inloggen**, tenzij minstens één
van de volgende wordt aangeboden:

- een andere manier van inloggen zonder cognitieve test
- hulp om de test op te lossen
- een test gebaseerd op het herkennen van objecten
- een test gebaseerd op persoonlijke inhoud die je zelf eerder aan de website gaf

**Referenties:**

- [3.3.8 - WCAG - Nederlandse Beschrijving](https://www.w3.org/Translations/WCAG22-nl/#accessible-authentication-minimum)
- [3.3.8 - WCAG - Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/?showtechniques=111%2C121#accessible-authentication-minimum)

**Voorbeelden:**

vb. 1: [Voorzie een email om in te loggen via een link.](https://www.w3.org/WAI/WCAG22/Techniques/general/G218)
