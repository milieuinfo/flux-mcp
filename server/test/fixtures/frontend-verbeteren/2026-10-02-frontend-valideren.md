---
workflow: frontend-valideren
flux-mcp: 0.4.0
fluxversie: 2.12.1
normversie: 2.20.0
scope: index.html, src/**/*.js
datum: 2026-10-02
resultaat: geslaagd
e2e: groen
---

# Validatie van Containeraanvraag (flux-demo-aanvraag)

## Analyse

**Voorwaarden.** `@domg-wc/components` en `@domg-wc/common` staan exact gepind op `2.12.1` in package.json (de lockfile
bevestigt `@domg-wc/components@2.12.1`). De e2e-suite (Playwright, `pnpm run test:e2e`) is groen: 7 van de 7 testen
geslaagd. Het recept `frontend-verbeteren` kan er dus op steunen. Let op: de test
`annuleren maakt het formulier leeg na bevestiging` hangt aan `window.confirm` (zie A-019), en de test
`de header is te vinden op zijn titel` aan het attribuut `title` van `vl-functional-header`.

**Scope.** De bestanden met markup of met code die Flux-elementen aanstuurt:

| Bestand | Inhoud | `vl-*`-elementen |
|---|---|---|
| `index.html` | de hele pagina: header, zoeken, formulier, bevestiging, samenvatting, eigen CSS | `vl-functional-header`, `vl-search`, `vl-input-field`, `vl-datepicker`, `vl-button`, `vl-alert`, `vl-description-data`, `vl-description-data-item` |
| `src/main.js` | registratie van de componenten, submit met eigen cross-validatie, annuleren met `window.confirm`, zoeken | (stuurt `#aanvraag`, `#annuleer`, `#zoek-aanvraag` aan) |
| `src/aanvraag.js` | bevestiging tonen, de regel ophaaldatum > leverdatum, zoeken | (stuurt `vl-description-data-item`, `vl-alert` aan) |

De e2e-testen (`e2e/`) en de configuratie vallen buiten de scope.

Wat Flux zou kunnen leveren, met eigen elementen of eigen CSS ervoor:

- **opbouw van de pagina**: geen `vl-template`, `vl-section`, `vl-content-block` of `vl-title`; een eigen
  `<main class="vl-layout">`; geen `skip-to-content-id` op de functionele header;
- **formulier en foutmeldingen**: geen enkele `vl-form-message`; een eigen `<p class="foutmelding">` met eigen CSS
  (kleur `#db3434`) en eigen JavaScript voor de regel ophaaldatum > leverdatum; geen `class="vl-form"`;
- **knoppen**: een eigen `<button class="knop">` met eigen CSS naast `vl-button`;
- **bevestigingen en dialogen**: `window.confirm()` in plaats van `vl-modal`;
- **meldingen**: `vl-alert` met `closable="false"`; het zoekresultaat in een `<p>` zonder live-regio;
- **navigatie en zoeken**: `vl-search` in het slot `sub-title` van `vl-functional-header`.

**Richtlijnen en patronen (normversie 2.20.0).** `flux_get_upgrade` van 2.12.1 naar 2.20.0 geeft in `docs` voor de
pagina's die hier gelden:

| Pagina (id) | Soort | `docs` sinds 2.12.1 | Geldt voor |
|---|---|---|---|
| `patronen-pagina-opbouw` | pattern | changed | de opbouw van `index.html` |
| `patronen-navigatie-functionele-header-met-search` | pattern | changed | `vl-search` in de header |
| `patronen-zoeken-loading-state` | pattern | added | het zoekformulier en de aankondiging van het resultaat |
| `patronen-formulier-demo` | pattern | changed | het formulier, de knoppen |
| `patronen-formulier-validatie` | pattern | changed | `required` zonder `vl-form-message` |
| `patronen-formulier-aangepaste-validatie` | pattern | changed | (achtergrond voor cross-validatie) |
| `patronen-formulier-cross-validatie` | pattern | added | de regel ophaaldatum > leverdatum |
| `patronen-formulier-blur-validatie` | pattern | added | niet gebruikt; geen afwijking (opt-in) |
| `patronen-overlays-modal-vs-side-sheet` | pattern | added | de bevestiging bij Annuleren |
| `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` | guideline | — | labels, placeholder, foutboodschappen, autocomplete |
| `richtlijnen-toegankelijkheid-aanpak-2-bedienbaar-2-4-navigeerbaar` | guideline | — | blokken omzeilen (skip-link), koppen |
| `richtlijnen-toegankelijkheid-aanpak-3-begrijpelijk-3-3-assistentie-bij-invoer` | guideline | — | instructies bij het datumformaat |
| `richtlijnen-toegankelijkheid-aanpak-1-waarneembaar-1-3-aanpasbaar` | guideline | — | landmarks, `autocomplete` (1.3.5) |
| `richtlijnen-toegankelijkheid-aanpak-1-waarneembaar-1-4-onderscheidbaar` | guideline | — | kleur van de eigen foutmelding |
| `richtlijnen-toegankelijkheid-aanpak-4-robuust-4-1-compatibel` | guideline | — | statusberichten (4.1.3) |

Raakt een plek zowel een concrete Flux-regel (bv. `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip`) als het
algemene WCAG-criterium erachter (bv. 1.3.5 of 3.3.1), dan staat de afwijking onder de concrete Flux-regel en noemt de
beschrijving het WCAG-criterium. Waar enkel een WCAG-pagina de plek dekt, staat ze onder die pagina (A-001, A-011,
A-013).

De rest van het antwoord van `flux_get_upgrade` (FLUX-620 `title-label`, FLUX-589 `min-date="today"`, FLUX-638
`disable-mobile-native-input`, FLUX-270 `vl-search` deprecated, FLUX-219 de `<div>` rond de items van
`vl-description-data`, FLUX-742 de positionering van de datepicker) is migratie, voor het recept `frontend-upgraden`,
en geen afwijking. In het bijzonder: de `<div class="items">` in `vl-description-data` (`index.html:58`) wijkt af van de
voorbeelden, maar 2.12.1 heeft er geen regel over; het is FLUX-219 in 2.19.0.

**API (fluxversie 2.12.1).** `flux_get_component` op 2.12.1 voor `vl-functional-header`, `vl-search`,
`vl-input-field`, `vl-datepicker`, `vl-button`, `vl-alert`, `vl-description-data`, en voor de voorstellen
`vl-form-message`, `vl-modal`, `vl-template`, `vl-header` en `vl-text`. `flux_check_markup` op 2.12.1:

| Bestand | error | warning | Bevindingen |
|---|---|---|---|
| `index.html` (html) | 0 | 3 | `unknown-attribute` `label` op `vl-search` (33:47), `unknown-attribute` `inline` op `vl-search` (33:70), `boolean-attribute-false` `closable` op `vl-alert` (54:82) |
| `src/main.js` (lit) | 0 | 0 | geen templates |
| `src/aanvraag.js` (lit) | 0 | 0 | geen templates |

`label` en `inline` op `vl-search` staan niet in de web-types, maar wel in de documentatie van 2.12.1 (de pagina en
de story zetten `inline`, de analyse beschrijft `label`): geen afwijking. `label` op `vl-input-field` en
`vl-datepicker` laat `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` uitdrukkelijk toe, en `title` op
`vl-functional-header` is geldig in 2.12.1: geen afwijking.

## Afwijkingen

### A-001: De functionele header heeft geen skip-link naar de hoofdinhoud

- regel: richtlijnen-toegankelijkheid-aanpak-2-bedienbaar-2-4-navigeerbaar
- locatie: index.html:23
- ernst: warning
- uitkomst: volgt-norm
- norm: —
- vereist: —

`vl-functional-header` staat er zonder `skip-to-content-id`. Zonder dat attribuut rendert de component geen skip-link
en geeft hij een waarschuwing in de console (documentatie van `vl-functional-header` op 2.12.1, die vraagt om het
steeds in te vullen). WCAG 2.4.1 Blokken omzeilen (brons[basis]) vraagt dat gebruikers meteen naar het begin van de
hoofdinhoud kunnen gaan. Voorstel: geef de hoofdinhoud een id en verwijs ernaar.

```html
<vl-functional-header title="Containeraanvraag" hide-back-link skip-to-content-id="#inhoud" custom-css="…">
    …
</vl-functional-header>
…
<vl-title type="h1" id="inhoud">Container aanvragen</vl-title>
```

### A-002: Het zoekveld in de header is een `vl-search` in plaats van een zoekformulier met input group

- regel: patronen-navigatie-functionele-header-met-search
- locatie: index.html:33
- ernst: warning
- uitkomst: volgt-norm
- norm: gewijzigd sinds 2.12.1
- vereist: —

De toepassing zet `<vl-search label="Aanvraagnummer" inline>` in het slot `sub-title`, en `src/main.js:28` luistert
naar zijn `change`-event. Het patroon bouwt het zoekveld als `<form role="search">` met een input group van
`vl-input-field` (`type="search"`) en een `vl-button` met zoekicoon; `vl-input-field` en `vl-button` hebben
`input-group`, `icon` en `label` al in 2.12.1. (Dat `vl-search` in 2.16.0 deprecated is, FLUX-270, is daarnaast een
migratie.) Voorstel:

```html
<div class="vl-group vl-group--space-between" slot="sub-title">
    <span>Gemeente Voorbeeld</span>
    <form id="zoek-aanvraag" role="search" aria-label="Aanvraag zoeken">
        <div class="vl-group vl-group--input-group">
            <vl-input-field input-group block type="search" name="aanvraagnummer" label="Aanvraagnummer" autocomplete="off"></vl-input-field>
            <vl-button input-group icon="search" type="submit" label="Zoeken" tertiary></vl-button>
        </div>
    </form>
</div>
```

```js
document.querySelector('#zoek-aanvraag').addEventListener('submit', (event) => {
    event.preventDefault();
    const nummer = new FormData(event.target).get('aanvraagnummer');
    document.querySelector('#zoekresultaat').textContent = zoek(nummer);
});
```

### A-003: De opbouw van de pagina volgt het patroon niet

- regel: patronen-pagina-opbouw
- locatie: index.html:36
- ernst: warning
- uitkomst: te-beslissen
- norm: gewijzigd sinds 2.12.1
- vereist: —

De inhoud staat in een eigen `<main id="inhoud" class="vl-layout">`, zonder `vl-template`, zonder `vl-section` en
`vl-content-block`, en zonder `vl-title type="h1"` als eerste kop van de inhoud. Het patroon vraagt `vl-template` met
`vl-header` in het slot `header`, de functionele header en de inhoud in `<section class="vl-section"><div
class="vl-content-block">` in het slot `main`, en `vl-footer` in het slot `footer`. Te beslissen, omdat `vl-header` en
`vl-footer` een identifier van Digitaal Vlaanderen vragen (aan te vragen bij Team Infra), en `vl-header` in 2.12.1
legacy is met `vl-header-next` als opvolger: een keuze in de configuratie. Het deel zonder header en footer kan los
daarvan in de code:

```html
<main>
    <vl-template>
        <vl-header slot="header" identifier="<identifier van de toepassing>"></vl-header>
        <div slot="main">
            <vl-functional-header title="Containeraanvraag" hide-back-link skip-to-content-id="#inhoud" …>…</vl-functional-header>
            <section class="vl-section">
                <div class="vl-content-block">
                    <vl-title type="h1" id="inhoud">Container aanvragen</vl-title>
                    <!-- zoekresultaat, formulier, bevestiging, samenvatting -->
                </div>
            </section>
        </div>
        <vl-footer slot="footer" identifier="<identifier van de toepassing>"></vl-footer>
    </vl-template>
</main>
```

### A-004: Het zoekresultaat wordt niet aangekondigd

- regel: patronen-zoeken-loading-state
- locatie: index.html:37
- ernst: warning
- uitkomst: volgt-norm
- norm: nieuw sinds 2.12.1
- vereist: —

`src/main.js` schrijft het resultaat van een zoekopdracht in `<p id="zoekresultaat">`, een gewone paragraaf. Het
patroon vraagt een live-regio met `role="status"` en `aria-live="polite"`, zodat een schermlezer het resultaat
voorleest (WCAG 4.1.3 Statusberichten, ook in `richtlijnen-toegankelijkheid-aanpak-4-robuust-4-1-compatibel`). Zet de
regio bij voorkeur in het zoekformulier, zoals het patroon. Voorstel:

```html
<p id="zoekresultaat" role="status" aria-live="polite"></p>
```

`loading` op de zoekknop is pas nodig zodra er een trage backend achter het zoeken zit.

### A-005: Het formulier heeft geen class `vl-form`

- regel: patronen-formulier-demo
- locatie: index.html:38
- ernst: info
- uitkomst: volgt-norm
- norm: gewijzigd sinds 2.12.1
- vereist: —

`<form id="aanvraag">` is een kaal formulier. Het patroon gebruikt een native `<form class="vl-form">`, met de
`vl-grid`-classes voor de opbouw. Voorstel:

```html
<form id="aanvraag" class="vl-form">
```

### A-006: Het verplichte veld Naam heeft geen foutmelding voor `valueMissing`

- regel: patronen-formulier-validatie
- locatie: index.html:39
- ernst: warning
- uitkomst: volgt-norm
- norm: gewijzigd sinds 2.12.1
- vereist: —

`vl-input-field id="naam"` heeft `required`, maar er is geen `vl-form-message`: de gebruiker ziet bij een lege naam
geen boodschap die zegt wat er mis is. Het patroon vraagt per constraint een `vl-form-message` met `for` = het id van
het veld en `state` = de sleutel van de ValidityState. De voorbeelden markeren een verplicht veld ook in het label
(`Naam *`). Voorstel:

```html
<vl-input-field id="naam" name="naam" label="Naam *" autocomplete="name" required></vl-input-field>
<vl-form-message for="naam" state="valueMissing">Vul je naam in.</vl-form-message>
```

### A-007: Het veld Naam heeft geen `autocomplete`

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:39
- ernst: warning
- uitkomst: volgt-norm
- norm: —
- vereist: —

De richtlijn vraagt `autocomplete` correct in te stellen (zie ook WCAG 1.3.5 in
`richtlijnen-toegankelijkheid-aanpak-1-waarneembaar-1-3-aanpasbaar`). Voor een naam is dat `name`; `vl-input-field`
heeft `autocomplete` in 2.12.1. Voorstel:

```html
<vl-input-field id="naam" name="naam" label="Naam *" autocomplete="name" required></vl-input-field>
```

### A-008: Het e-mailveld heeft geen label; de placeholder dient als label

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:40
- ernst: error
- uitkomst: volgt-norm
- norm: —
- vereist: —

`<vl-input-field id="email" type="email" placeholder="E-mailadres">` heeft geen `label` en geen `vl-form-label`. De
richtlijn vraagt een label voor elke form control, met `vl-form-label` of met het attribuut `label`, en de
placeholder enkel voor een voorbeeldwaarde, niet als label. Zonder label heeft het veld geen betrouwbare toegankelijke
naam, en verdwijnt de enige aanwijzing zodra de gebruiker typt. Voorstel:

```html
<vl-input-field id="email" name="email" type="email" label="E-mailadres" autocomplete="email" placeholder="bv. naam@voorbeeld.be"></vl-input-field>
```

### A-009: Het e-mailveld heeft geen `autocomplete`

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:40
- ernst: warning
- uitkomst: volgt-norm
- norm: —
- vereist: —

Het e-mailveld heeft geen `autocomplete`; de richtlijn vraagt het correct in te stellen (WCAG 1.3.5). Voorstel:
`autocomplete="email"`, zie het fragment bij A-008.

### A-010: De verplichte Leverdatum heeft geen foutmelding voor `valueMissing`

- regel: patronen-formulier-validatie
- locatie: index.html:41
- ernst: warning
- uitkomst: volgt-norm
- norm: gewijzigd sinds 2.12.1
- vereist: —

`vl-datepicker id="datum"` heeft `required`, maar er is geen `vl-form-message`. Voorstel, in dezelfde vorm als A-006:

```html
<vl-datepicker id="datum" name="datum" label="Leverdatum *" min-date="today" disable-mobile-native-input required></vl-datepicker>
<vl-form-message for="datum" state="valueMissing">Kies een leverdatum.</vl-form-message>
```

Een boodschap voor `rangeUnderflow` (bij `min-date="today"`) hoort er na een upgrade naar 2.14.0 of hoger bij
(FLUX-589); dat is migratie.

### A-011: Leverdatum zegt niet in welk formaat de datum moet

- regel: richtlijnen-toegankelijkheid-aanpak-3-begrijpelijk-3-3-assistentie-bij-invoer
- locatie: index.html:41
- ernst: warning
- uitkomst: te-beslissen
- norm: —
- vereist: —

Het veld aanvaardt een getypte datum enkel als `dd.mm.jjjj` (het masker van `vl-datepicker`), maar zegt dat nergens.
WCAG 3.3.2 Labels of instructies (brons[basis]) vraagt bij een datum uit te leggen hoe je ze ingeeft, en
`patronen-formulier-validatie` vraagt een hint vóór de ingave. In 2.12.1 doen de voorbeelden van `vl-datepicker` dat
met een placeholder en een `vl-text annotation` (`variant="annotation"` op `vl-form-message` komt pas in 2.15.0).
Voorstel:

```html
<vl-datepicker id="datum" … placeholder="dd.mm.jjjj"></vl-datepicker>
<vl-text annotation>Typ een datum als dd.mm.jjjj, bv. 31.12.2030, of kies ze in de kalender.</vl-text>
```

**Beslissing van het team:** de ontwerper beslist hoe de hint over het formaat van een datum eruitziet, voor alle
datumvelden samen.

### A-012: Leverdatum heeft geen `autocomplete="off"`

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:41
- ernst: info
- uitkomst: normkandidaat
- norm: —
- vereist: —

Voor een leverdatum zijn er geen relevante suggesties van de browser; de richtlijn vraagt dan `autocomplete="off"`.
`vl-datepicker` heeft `autocomplete` in 2.12.1. Voorstel: `<vl-datepicker id="datum" … autocomplete="off">`.

**Beslissing van het team:** de browser geeft bij een datumveld geen suggesties, en `vl-datepicker` heeft een eigen
masker: `autocomplete="off"` voegt er niets toe. De richtlijn kan datumvelden uitzonderen, in plaats van het attribuut
in elke toepassing te vragen.

### A-013: Ophaaldatum zegt niet in welk formaat de datum moet, en niet dat ze na de leverdatum moet vallen

- regel: richtlijnen-toegankelijkheid-aanpak-3-begrijpelijk-3-3-assistentie-bij-invoer
- locatie: index.html:49
- ernst: warning
- uitkomst: te-beslissen
- norm: —
- vereist: —

Zoals A-011, en bovendien heeft het veld een regel die de gebruiker pas na het indienen ontdekt: de ophaaldatum valt
na de leverdatum. WCAG 3.3.2 en de hint uit `patronen-formulier-validatie` vragen die vooraf te tonen. Voorstel:

```html
<vl-datepicker id="ophaaldatum" name="ophaaldatum" label="Ophaaldatum" placeholder="dd.mm.jjjj" autocomplete="off"></vl-datepicker>
<vl-text annotation>Niet verplicht. Valt na de leverdatum; typ als dd.mm.jjjj of kies in de kalender.</vl-text>
```

**Beslissing van het team:** zoals A-011: de ontwerper beslist over de hint.

### A-014: Ophaaldatum heeft geen `autocomplete="off"`

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:49
- ernst: info
- uitkomst: te-beslissen
- norm: —
- vereist: —

Zoals A-012. Voorstel: `<vl-datepicker id="ophaaldatum" … autocomplete="off">`.

**Beslissing van het team:** volgt de beslissing over de normkandidaat A-012.

### A-015: De foutmelding van de ophaaldatum zegt enkel "Fout."

- regel: richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip
- locatie: index.html:50
- ernst: error
- uitkomst: volgt-norm
- norm: —
- vereist: —

`<p id="ophaaldatum-fout" class="foutmelding">Fout.</p>` zegt niet wat er fout is en niet hoe je het oplost. De
richtlijn vraagt duidelijke, specifieke instructies in de foutboodschap; WCAG 3.3.1 Foutidentificatie (brons[basis])
vraagt te tonen waar de fout zit en te beschrijven wat er fout is. De melding is ook niet aan het veld gekoppeld en
valt enkel op door haar rode kleur. Voorstel voor de tekst (de vorm volgt uit A-018):

```html
<vl-form-message for="ophaaldatum" state="customError">
    Kies een ophaaldatum na de leverdatum, of laat de ophaaldatum leeg.
</vl-form-message>
```

### A-016: Annuleren is een eigen `<button>` met eigen CSS in plaats van een `vl-button`

- regel: patronen-formulier-demo
- locatie: index.html:52
- ernst: warning
- uitkomst: volgt-norm
- norm: gewijzigd sinds 2.12.1
- vereist: —

`<button id="annuleer" class="knop">` krijgt zijn opmaak van eigen CSS (`.knop` in `index.html:12`, met eigen kleuren
en marges). Het patroon zegt voor knoppen: `vl-button`, en zet de tweede knop van een formulier als `secondary` naast
de submit. Voorstel, met de eigen `.knop`-CSS weg:

```html
<div class="vl-action-group">
    <vl-button type="submit">Vraag aan</vl-button>
    <vl-button id="annuleer" type="button" secondary>Annuleren</vl-button>
</div>
```

Luister in `src/main.js` dan op `vl-click` van `vl-button`, of op `click` zoals nu.

### A-017: `closable="false"` op `vl-alert` zet de sluitknop net aan

- regel: boolean-attribute-false
- locatie: index.html:54
- ernst: warning
- uitkomst: volgt-norm
- norm: —
- vereist: —

`closable` is een boolean attribuut: het geldt zodra het er staat, ook met de waarde `"false"`. De bevestiging krijgt
dus een sluitknop. Die verwijdert `vl-alert` uit de DOM (documentatie van `vl-alert` op 2.12.1), zodat
`document.querySelector('#bevestiging')` in `src/aanvraag.js:5` daarna `null` geeft en een tweede aanvraag faalt met
een TypeError. Voorstel: laat het attribuut weg.

```html
<vl-alert id="bevestiging" type="success" icon="check" title="Aanvraag ontvangen" hidden>
```

### A-018: De regel ophaaldatum > leverdatum is eigen JavaScript bij het indienen in plaats van cross-validatie

- regel: patronen-formulier-cross-validatie
- locatie: src/main.js:14
- ernst: warning
- uitkomst: volgt-norm
- norm: nieuw sinds 2.12.1
- vereist: migratie naar 2.19.0 of hoger

De submit-handler roept `ophaaldatumKlopt` (`src/aanvraag.js:10`) op en toont of verbergt zelf
`<p id="ophaaldatum-fout" class="foutmelding">`, met eigen CSS (`.foutmelding` in `index.html:8`). Het veld zelf
blijft geldig voor de Constraint Validation API: geen `aria-invalid`, geen gekoppelde melding, en de fout verdwijnt
niet als de leverdatum wijzigt. Het patroon vraagt een validator met `dependencySelectors` op een eigen component met
`CrossValidationMixin`, en de fout in een `vl-form-message` met `state="customError"`. `CrossValidationMixin` kwam in
2.19.0 (FLUX-610). Voorstel:

```js
import { CrossValidationMixin, VlDatepickerComponent } from '@domg-wc/components/form';

class VlOphaaldatumComponent extends CrossValidationMixin(VlDatepickerComponent) {
    static formControlValidators = [
        ...VlDatepickerComponent.formControlValidators,
        {
            key: 'customError',
            message: 'Kies een ophaaldatum na de leverdatum, of laat de ophaaldatum leeg.',
            dependencySelectors: ['#datum'],
            isValid(instance, value) {
                if (!value) return true;
                const leverdatum = instance.form?.querySelector('#datum')?.value;
                return !leverdatum || value > leverdatum;
            },
        },
    ];
}
customElements.define('vl-ophaaldatum', VlOphaaldatumComponent);
```

```html
<vl-ophaaldatum id="ophaaldatum" name="ophaaldatum" label="Ophaaldatum" placeholder="dd.mm.jjjj" autocomplete="off"></vl-ophaaldatum>
<vl-form-message for="ophaaldatum" state="customError">Kies een ophaaldatum na de leverdatum, of laat de ophaaldatum leeg.</vl-form-message>
```

De submit-handler toont dan enkel nog de bevestiging; het formulier dient niet in zolang het veld ongeldig is. Tot de
migratie kan het al op 2.12.1 met `patronen-formulier-aangepaste-validatie` (een subklasse van
`VlDatepickerComponent` met dezelfde validator, zonder mixin), maar dan hervalideert het veld niet vanzelf als de
leverdatum wijzigt.

### A-019: Annuleren vraagt bevestiging met `window.confirm()` in plaats van een modal

- regel: patronen-overlays-modal-vs-side-sheet
- locatie: src/main.js:24
- ernst: warning
- uitkomst: volgt-norm
- norm: nieuw sinds 2.12.1
- vereist: —

Annuleren maakt het formulier leeg na `window.confirm('Wil je de aanvraag annuleren?')`: een native dialoog, buiten
de huisstijl, met de knoppen van de browser. Wat de gebruiker invulde, is daarna weg: een onomkeerbare bevestiging,
waarvoor het patroon altijd een modal vraagt. `vl-modal` bestaat in 2.12.1. Voorstel:

```html
<vl-button id="annuleer" type="button" secondary modal-open="annuleer-modal" aria-controls="annuleer-modal" aria-haspopup="dialog">Annuleren</vl-button>
<vl-modal id="annuleer-modal" title="Aanvraag annuleren?" closable>
    <span slot="content">Wat je invulde, gaat verloren.</span>
    <vl-button slot="button" id="bevestig-annuleren" error>Ja, annuleer de aanvraag</vl-button>
</vl-modal>
```

```js
document.querySelector('#bevestig-annuleren').addEventListener('click', () => {
    formulier.reset();
    document.querySelector('#annuleer-modal').close();
});
```

De e2e-test `annuleren maakt het formulier leeg na bevestiging` accepteert nu een native `dialog`; die moet dan de
knop in de modal klikken.

## Normkandidaten

- A-012: de richtlijn over `autocomplete` kan datumvelden uitzonderen.

## Verificatie

**`flux_check_markup` op 2.12.1, per bestand:**

| Bestand | Bevinding | Ernst | Afwijking |
|---|---|---|---|
| `index.html` | `boolean-attribute-false`, `closable` op `vl-alert` (54:82) | warning | A-017 |
| `index.html` | `unknown-attribute`, `label` op `vl-search` (33:47) | warning | geen: staat in de documentatie van `vl-search` op 2.12.1 (analyse van Storybook) |
| `index.html` | `unknown-attribute`, `inline` op `vl-search` (33:70) | warning | geen: de story en de pagina van `vl-search` op 2.12.1 zetten het |
| `src/main.js` | geen | — | — |
| `src/aanvraag.js` | geen | — | — |

Er zijn geen errors.

**Voorstellen getoetst.** De voorstellen, samen in één fragment, gaven op 2.12.1 enkel warnings voor attributen en
slots die niet in de web-types staan maar wel in de documentatie: de slots `header`, `main` en `footer` van
`vl-template`, en `modal-open` op `vl-button` (uit de voorbeelden van `vl-modal`). `variant="annotation"` op
`vl-form-message` gaf een error: het kwam in 2.15.0 (FLUX-223), en de voorstellen gebruiken daarom `vl-text
annotation`, dat in 2.12.1 bestaat.

**`vereist`.** A-018: `CrossValidationMixin` en `ValidatorWithDeps` uit `@domg-wc/components/form` kwamen in 2.19.0,
volgens `flux_find_changes` (FLUX-610, "dependencySelectors via CrossValidationMixin met voorbeelden en docs").

**`norm`.** Volgens `docs` van `flux_get_upgrade` van 2.12.1 naar 2.20.0: `changed` voor `patronen-pagina-opbouw`,
`patronen-navigatie-functionele-header-met-search`, `patronen-formulier-demo` en `patronen-formulier-validatie`;
`added` voor `patronen-zoeken-loading-state`, `patronen-formulier-cross-validatie` en
`patronen-overlays-modal-vs-side-sheet`. De richtlijnen over toegankelijkheid die hier gelden, staan niet in `docs`:
`—`.

**Velden en locaties.** Elke afwijking heeft alle velden en één regel; elke regel is een id uit `flux_get_guidance`
op 2.20.0 of de code `boolean-attribute-false` uit `flux_check_markup`. De locaties wijzen naar de regel waar het
element of de code begint: `index.html:23` `<vl-functional-header`, `:33` `<vl-search`, `:36` `<main`, `:37`
`<p id="zoekresultaat">`, `:38` `<form id="aanvraag">`, `:39` naam, `:40` e-mail, `:41` `<vl-datepicker id="datum"`,
`:49` ophaaldatum, `:50` `<p id="ophaaldatum-fout"`, `:52` `<button id="annuleer"`, `:54` `<vl-alert`;
`src/main.js:14` de submit-handler, `src/main.js:24` `window.confirm`.

**Toepassing ongewijzigd.** `git status` toont enkel `.flux/` als nieuw bestand. Het draaien van de e2e-suite
maakte `dist/` en `test-results/` opnieuw aan; die staan in `.gitignore`.
