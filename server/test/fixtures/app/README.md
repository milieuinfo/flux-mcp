# Containeraanvraag: de toepassing voor de evaluatie van de recepten

Een kleine toepassing op niveau 7.A van de planning, voor `pnpm run flux:server:eval-recipe <recept>` (ADR-004,
sectie 9). Ze gebruikt de echte Flux web-componenten `@domg-wc/*` 2.12.1 uit de registry van Flux. Ze heeft zowel
wat een migratie vraagt als afwijkingen van de norm, zoals een echt project: `migreren` en `valideren` werken op
dezelfde code, en mogen elkaars terrein niet raken.

- **Gepinde versie:** `@domg-wc/common` en `@domg-wc/components` exact op 2.12.1. Niet 2.12.0: dat package importeert
  `.raw.css`-bestanden die er niet in zitten; 2.12.1 voegde ze toe (FLUX-604).
- **Standalone, zonder backend:** `pnpm start` (Vite); een aanvraag gaat nergens heen, de toepassing toont meteen de
  bevestiging, en zoeken vindt nooit een aanvraag.
- **e2e:** Playwright, `pnpm run test:e2e`, groen op 2.12.1. De testen kijken naar gedrag, niet naar de implementatie,
  zodat een recept dat een afwijking wegwerkt, ze groen kan houden. Enkel de test van annuleren hangt aan
  `window.confirm`: wordt dat een `vl-modal`, dan wijzigt het gedrag bewust.

## Wat een migratie naar 2.20.0 vraagt

Uit de catalogus:

| Ticket | Versie | Wat de toepassing doet | Wat de migratie vraagt |
|---|---|---|---|
| FLUX-620 | 2.15.0 | `title` op `vl-functional-header`, en een e2e-test die de header op dat attribuut zoekt | `title-label`, en de e2e-test aanpassen; zonder migratie faalt die test op 2.20.0 |
| FLUX-589 | 2.14.0 | `min-date="today"` op `vl-datepicker` | een `vl-form-message` voor `rangeUnderflow` |
| FLUX-638 | 2.14.0 | `disable-mobile-native-input` op `vl-datepicker` | het attribuut verdwijnt: de native datumkiezer op mobiel is weg |
| FLUX-270 | 2.16.0 | `vl-search` in de functionele header | `vl-search` is deprecated: een zoekformulier met `vl-input-field` en `vl-button` (input-group) |
| FLUX-219 | 2.19.0 | een `<div>` rond de items van `vl-description-data` | de items als directe kinderen |

`migreren` laat de afwijkingen hieronder staan, behalve `vl-search`, dat ook een migratie is: het wijzigt niets buiten
wat de migratie vraagt.

## De afwijkingen van de norm

Voor `valideren`: de API tegen de gepinde versie 2.12.1, de richtlijnen en patronen tegen de nieuwste versie in de
catalogus, 2.20.0 (ADR-004, open beslissing 2). `norm` is wat `docs` van `flux_get_upgrade` van 2.12.1 naar 2.20.0
over de pagina zegt.

| # | Wat de toepassing doet | Soort (planning 5.3) | Regel | `norm` | `vereist` |
|---|---|---|---|---|---|
| E1 | geen `vl-template`, geen `vl-title` als h1, geen `skip-to-content-id` | paginastructuur | `patronen-pagina-opbouw` | gewijzigd sinds 2.12.1 | — |
| E2 | `required` zonder `vl-form-message` met `state="valueMissing"` | eigen formulierpatroon | `patronen-formulier-validatie` | gewijzigd sinds 2.12.1 | — |
| E3 | geen `autocomplete` op de naam | toegankelijkheid | `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` | — | — |
| N1 | `vl-search` in de functionele header, zoals het patroon van 2.12.1 | verouderd componentgebruik | `patronen-navigatie-functionele-header-met-search` | gewijzigd sinds 2.12.1 | — |
| N2 | een eigen `<button class="knop">` voor Annuleren, naast `vl-button` | lokale variant | `patronen-formulier-demo` | gewijzigd sinds 2.12.1 | — |
| N3 | Annuleren vraagt bevestiging met `window.confirm()` | eigen interactiepatroon | `patronen-overlays-modal-vs-side-sheet` | nieuw sinds 2.12.1 | — |
| N4 | het e-mailveld heeft enkel `placeholder="E-mailadres"`, geen label | toegankelijkheid | `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` | — | — |
| N5 | de ophaaldatum valt na de leverdatum: eigen JavaScript bij het indienen, met een `<p class="foutmelding">` | eigen foutafhandeling | `patronen-formulier-cross-validatie` | nieuw sinds 2.12.1 | migratie naar 2.19.0: `CrossValidationMixin` (FLUX-610) |
| N6 | die foutmelding zegt enkel "Fout." | toegankelijkheid | `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` | — | — |
| N7 | `closable="false"` op `vl-alert`, wat de sluitknop net aanzet | API | `boolean-attribute-false` van `flux_check_markup` | — | — |

Wat `valideren` niet als afwijking mag melden:

- `label` als attribuut op `vl-input-field`: de richtlijn over toegankelijkheid laat het uitdrukkelijk toe, naast
  `vl-form-label`;
- `title` op `vl-functional-header`: geldig in 2.12.1; de hernoeming naar `title-label` (FLUX-620) is een migratie.

`flux_check_markup` op 2.12.1 geeft drie warnings: `closable="false"` (N7), en `label` en `inline` op `vl-search`, die
niet in de web-types staan maar wel in de analyse van Storybook.

De evaluatie zoekt elke afwijking op haar regel en haar locatie, `pad:regel` (`../valideren.json`). Wijzig je deze
toepassing, pas dan de locaties daar mee aan. `test/recipe-check.test.mjs` vangt een deel: een locatie buiten het
bestand, een code van `flux_check_markup` die niet meer op haar plek staat, en een `norm` die niet meer is wat de
catalogus zegt. Of een locatie nog naar het juiste element wijst, ga je zelf na.

## Wat verbeteren krijgt

`verbeteren` krijgt het afwijkingenrapport `../verbeteren/2026-10-02-valideren.md`: het rapport van een run van
`valideren` op deze toepassing, met 19 afwijkingen, en met de uitkomsten die het team in de review zette. De
evaluatie (`../verbeteren.json`) zet het in `.flux/rapporten/` voor de eerste commit.

| Uitkomst | Afwijkingen | Wat verbeteren doet |
|---|---|---|
| `volgt-norm` | A-001, A-002, A-004 tot en met A-010, A-015, A-016, A-017, A-019 | wegwerken; bij A-019 de e2e-test van annuleren bewust aanpassen |
| `volgt-norm`, `vereist` 2.19.0 | A-018 | laten liggen: eerst `migreren` |
| `te-beslissen` | A-003, A-011, A-013, A-014 | laten liggen |
| `normkandidaat` | A-012 | laten liggen, en een ticket voorstellen |

Wijzig je deze toepassing, kijk dan ook de locaties in dat rapport na.

## De pull request voor review

`review` krijgt een pull request op deze toepassing: `../review/type-container.patch`, een type container en een
opmerking bij een aanvraag. De evaluatie (`../review.json`) past ze toe als commit op een branch boven op `main`; de
e2e-testen blijven groen, met een test erbij voor het type in de samenvatting. De regels zijn die in de versie met de
patch.

| # | Wat de pull request doet | Verwacht van review | Regel |
|---|---|---|---|
| R1 | een native `<select>` voor het type container, met een eigen `<label>` (41) | een lokale variant van `vl-select` | `patronen-formulier-demo` |
| R2 | `vl-textarea` met enkel `placeholder="Opmerking"` (57) | geen label | `richtlijnen-toegankelijkheid-praktijk-richtlijnen-wip` |
| R3 | `maxlength="500"` op die `vl-textarea` (57): het attribuut is `max-length` | een error van `flux_check_markup` | `unknown-attribute` |
| R4 | `icon="check"` op de regel van `vl-alert`, waar `closable="false"` al stond (64) | een bestaande afwijking op een gewijzigde regel | `boolean-attribute-false` |
| C1 | een `vl-checkbox` voor een herinnering, met de tekst in het default slot (58) | geen melding: volgt de norm | — |
| C2 | een item voor het type in `vl-description-data`, in de bestaande `<div class="items">` (71) | geen melding: de `<div>` is een migratie (FLUX-219) | — |

Een afwijking buiten de diff, zoals het e-mailveld zonder label, mag review niet melden. Let op bij C1: `label` op
`vl-checkbox` vult in 2.12.1 enkel het `aria-label`; de zichtbare tekst hoort in het default slot. Een eerste versie
van de pull request gebruikte `label`, en review meldde dat terecht.

## Het ticket voor uitbreiden

`uitbreiden` krijgt het ticket CONT-12 uit een nagemaakte Jira (`../uitbreiden/tickets.json`): een verplicht
telefoonnummer, met een formaat, een foutmelding en het nummer in de samenvatting. De evaluatie (`../uitbreiden.json`)
verwacht een `vl-input-field` met `type="tel"`, `required`, een label en `autocomplete="tel"`, een `vl-form-message`
voor `valueMissing` en voor `patternMismatch` (`patronen-formulier-validatie`), het nummer in de samenvatting, en een
e2e-test. Het nieuwe verplichte veld wijzigt het gedrag bewust: de bestaande e2e-testen vullen het in. De afwijkingen
hierboven, buiten het ticket, blijven staan. Dat het ticket met 2.12.1 te maken is, is nagegaan met een uitwerking die
de controles van de evaluatie doorstaat.

Een registry-token voor de Flux-registry is niet nodig: de packages zijn publiek. De evaluatie draait pnpm met een
lege gebruikersconfiguratie, zodat een verlopen token in `~/.npmrc` de installatie niet laat falen.
