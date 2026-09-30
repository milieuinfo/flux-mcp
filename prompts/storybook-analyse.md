---
name: storybook-analyse
description: Schrijft per Storybook-pagina van een Flux-release wat niet deterministisch uit de bron te halen is (voorbeelden, samenvatting, zoektermen, opmerkingen), in catalog/flux/storybook-analysis/<pagina>/<inputHash>.json.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0.
    required: true
  - name: repo
    description: De map van een checkout van flux-web-components op de tag v{{version}}.
    required: true
  - name: pages
    description: De pagina's om te analyseren, als JSON.
    required: true
---

# Analyse van de Storybook-documentatie van Flux {{version}}

De MCP-server van deze repo geeft agents de documentatie uit Storybook, per versie. Een ontwikkelaar gebruikt die
om een toepassing te bouwen of te verbeteren, of om van een ontwerp in Figma naar code te gaan. De tekst van elke
pagina staat al als Markdown in de catalogus, deterministisch omgezet uit de MDX. Wat daar ontbreekt, schrijf jij:

- **de code van elk voorbeeld**: Storybook toont die code pas in de browser, onder "Show code", en ze staat
  nergens als bestand;
- **een samenvatting** en **zoektermen**, voor de lijsten en het zoeken van de server;
- **opmerkingen** over wat niet strookt tussen de documentatie, de stories en de web-types.

Alles wat je schrijft, moet kloppen. Het komt uit de MDX, de stories, de code of de web-types van {{version}}, nooit
uit een vermoeden. Een mens leest het niet na: een tweede run controleert het, en een script toetst elk voorbeeld
aan de web-types.

## De pagina's

```json
{{pages}}
```

Per pagina:

- `markdown`: de tekst van de pagina. Een regel `> Story: [<naam>](/?path=/story/<id>)` staat waar Storybook een
  voorbeeld toont; `> API: <element>` waar Storybook de API-tabel toont, die de server uit de web-types haalt;
- `sources`: de bronbestanden in `{{repo}}`: de MDX, het stories-bestand en de bestanden die het importeert, zoals
  `*.stories-arg.ts` met de args en hun defaults;
- `elements`: de elementen van de pagina in de web-types;
- `stories`: de id en de naam van elke story op de pagina;
- `write`: het bestand dat je schrijft;
- `previous`: als de pagina in een andere versie al een analyse had, die analyse (`analysis`) en de Markdown van die
  versie (`markdown`). Anders `null`.

## Voorwaarden

- Lees en zoek met Read, Grep en Glob: de catalogus in deze repo, en de bron van {{version}} in `{{repo}}`.
- De web-types van {{version}} staan in `catalog/flux/{{version}}/web-types/`.
- Je schrijft enkel de bestanden in `write`. Bash mag enkel voor
  `pnpm run flux:storybook:check {{version}}`; al de rest wordt geweigerd.

## Werkwijze

### 1. Lezen

Lees per pagina de Markdown, en in `{{repo}}` het stories-bestand met zijn template, de args van elke story en de
defaults. Een story is een lit-template met args. De helper `story()` uit `resources/utils-storybook` zet elk arg
dat gelijk is aan zijn default op `nothing`, zodat het attribuut niet in de code verschijnt. "Show code" toont dus
enkel wat de story instelt.

Heeft de pagina een vorige analyse (`previous`), begin dan niet opnieuw. Vergelijk de Markdown van de vorige versie
met de huidige, en de stories. Neem letterlijk over wat nog klopt, en pas aan wat wijzigde of bijkwam.

### 2. De voorbeelden

Schrijf voor **elke** story van de pagina de code zoals een ontwikkelaar ze overneemt:

- gewone HTML, geen lit-syntax: `ghost`, niet `?ghost=${…}`; geen `.prop=${…}` en geen `@event=${…}`;
- de attributen die de story instelt en die van de default afwijken, met de waarde van de story;
- de inhoud van de slots zoals de story ze vult. Tekst die enkel de demo-template toevoegt, zoals `Error: ` of
  ` (disabled)` bij `vl-button`, laat je weg;
- `js` erbij als de story properties zet, events gebruikt of data meegeeft die niet in HTML past. Gebruik dan
  `document.querySelector`, `addEventListener` en gewone property-toewijzingen;
- toont de pagina de code al zelf, in een codeblok onder de story, neem die dan over;
- een patroon of een groot voorbeeld mag lang zijn; laat niets weg wat nodig is om het te laten werken.

Elk `vl-*`-element en elk attribuut erop controleer je in de web-types van {{version}}. Staat een attribuut wel in
de code of de argTypes, maar niet in de web-types (bv. `ellipsis` van `vl-breadcrumb` in 2.20.0), gebruik het dan
enkel als de story het gebruikt, en voeg een note toe van het type `not-in-web-types`. Anders keurt het script het
voorbeeld af.

### 3. Samenvatting, zoektermen en opmerkingen

- `summary`: Nederlands, één tot drie zinnen: waarvoor de pagina dient, en voor een component wanneer je het
  gebruikt. Schrijf voor een ontwikkelaar die een lijst van pagina's overloopt.
- `keywords`: vijf tot vijftien termen, in kleine letters, waarmee een ontwikkelaar de pagina zoekt. Ook in het
  Engels, want een agent zoekt vaak in het Engels: bv. `knop`, `button`, `icon button`, `call to action`.
- `notes`: wat niet strookt, met de bron:
  - `not-in-web-types`: een element of attribuut in de code of de documentatie dat niet in de web-types staat. Met
    `element`, `name` (het attribuut; weg als het hele element ontbreekt), `text` en `source` (het bestand);
  - `mismatch`: de documentatie, de stories en de web-types spreken elkaar tegen, bv. een voorbeeld met een
    attribuut dat de component niet kent. Met `text` en `source`, en `element` en `name` waar het past.

  Geen notes? Schrijf dan `[]`.

### 4. Schrijven

Schrijf per pagina het bestand in `write`, met exact deze sleutels:

```json
{
  "schema": 1,
  "page": "components-atom-button",
  "inputHash": "5267f457e16f",
  "analysedFor": "{{version}}",
  "summary": "Knop voor een actie op de pagina, met varianten voor gewicht, grootte, icoon, toggle en cta-link.",
  "keywords": ["knop", "button", "icon button", "toggle", "call to action", "download"],
  "examples": {
    "components-atom-button--button-icon-only-ghost": {
      "html": "<vl-button icon=\"trash\" label=\"Verwijder\" ghost></vl-button>"
    }
  },
  "notes": []
}
```

- `page` en `inputHash` zijn die van de pagina; `analysedFor` is {{version}}.
- `examples` heeft een sleutel per story-id van de pagina, en geen andere. Elk voorbeeld heeft `html`, `js` of
  beide.
- Twee spaties inspringing, zoals hierboven.

### 5. Controleren

Draai tot slot:

```bash
pnpm run flux:storybook:check {{version}}
```

Voor de pagina's die je schreef, mag het geen problemen melden. Andere pagina's zonder analyse zijn geen probleem.
Meldt het iets over jouw bestanden, verbeter het dan en draai opnieuw.

Geef tot slot kort terug welke pagina's je schreef, en wat je in `notes` zette.
