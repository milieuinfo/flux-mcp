---
name: storybook-review
description: Controleert de analyse van Storybook-pagina's van een Flux-release tegen de bron en verbetert wat niet klopt, in catalog/flux/storybook-analysis/.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0.
    required: true
  - name: repo
    description: De map van een checkout van flux-web-components op de tag v{{version}}.
    required: true
  - name: pages
    description: De pagina's om te controleren, als JSON.
    required: true
  - name: problems
    description: Wat storybook:check na de analyse meldde.
    required: true
---

# Review van de Storybook-analyse van Flux {{version}}

Een andere agent schreef voor de pagina's hieronder een analyse, met `prompts/storybook-analyse.md`. Niemand leest
ze daarna nog na: jij bent de review. Een agent die een toepassing bouwt, neemt de voorbeelden letterlijk over. Wees
kritisch en onafhankelijk: vertrek van de bron, niet van wat de analyse beweert.

## De pagina's

```json
{{pages}}
```

De velden zijn dezelfde als in de analyse: `markdown`, `sources` in `{{repo}}`, `elements`, `stories`, `write`
(het bestand van de analyse) en `previous`.

## Wat storybook:check na de analyse meldde

{{problems}}

## Wat je hebt

- **De regels** voor de analyse: `prompts/storybook-analyse.md`. Lees die eerst.
- **De bron** van {{version}} in `{{repo}}`, en de web-types in `catalog/flux/{{version}}/web-types/`.

Lees en zoek met Read, Grep en Glob. Je schrijft enkel de bestanden in `write`. Bash mag enkel voor
`pnpm run flux:storybook:check {{version}}`; al de rest wordt geweigerd.

## Wat je controleert

Per pagina:

1. **Vorm.** Het bestand bestaat en heeft exact de sleutels uit de regels, met `page`, `inputHash` en `analysedFor`
   van de pagina.
2. **Voorbeelden.** Er is een voorbeeld voor elke story van de pagina, en geen ander. Lees de template en de args
   van de story in `{{repo}}`, en controleer per voorbeeld:
   - het is gewone HTML, zonder lit-syntax;
   - het heeft de attributen die de story instelt en die van de default afwijken, niet meer en niet minder;
   - de inhoud van de slots is die van de story, zonder de demotekst van de template;
   - de `js` klopt met wat de story doet.
3. **Namen.** Elk element, attribuut, property, event en slot bestaat in de web-types of de code van {{version}},
   met exact die schrijfwijze. Wat enkel in de code staat, heeft een note `not-in-web-types`.
4. **Samenvatting.** Ze klopt met de pagina en is geschreven voor een ontwikkelaar.
5. **Zoektermen.** Ze passen bij de pagina, ook in het Engels.
6. **Notes.** Elke note klopt en noemt haar bron; wat niet strookt en ontbreekt, voeg je toe.

## Wat je doet

- Klopt iets niet, verbeter het dan zelf in het bestand. Schrijf nergens anders.
- Verander niets dat klopt. Herschrijf geen zin enkel omdat je hem anders zou schrijven.
- Draai daarna `pnpm run flux:storybook:check {{version}}`. Voor deze pagina's mag het niets melden.
- Kan je iets niet oplossen, omdat de bron ontbreekt of zichzelf tegenspreekt, zet het dan in `unresolved`.

## Wat je teruggeeft

Het resultaat in het gevraagde JSON-formaat, met de teksten in het Nederlands:

- `status`: `ok` als er niets te verbeteren viel, `fixed` als je iets verbeterde en nu alles klopt, `unresolved`
  als er iets overblijft;
- `corrections`: per verbetering de pagina, wat je veranderde en waarom, met de bron;
- `unresolved`: wat je niet kon oplossen, en waarom.
