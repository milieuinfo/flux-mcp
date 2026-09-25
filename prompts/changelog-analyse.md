---
name: changelog-analyse
description: Schrijft voor een Flux-release per changelog-entry wat ze voor een afnemer betekent, per ticket in catalog/flux/<versie>/analysis/.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0.
    required: true
---

# Analyse van de changelog van Flux {{version}}

Een changelog-entry is één regel. Een afnemer gaat niet uitzoeken wat er achter die regel zit; de MCP-server moet
het hem vertellen. Je schrijft daarom per entry van Flux {{version}}:

- wat de wijziging voor zijn project betekent (de impact);
- een uitleg voor hem;
- wat hij moet doen, als dat nodig is;
- een voorbeeld, als dat helpt.

Alles wat je schrijft, moet kloppen. Het komt uit de commit, de diff, de Storybook-documentatie of de
web-types van {{version}}, nooit uit een vermoeden.

## Voorwaarden

- `catalog/flux/{{version}}/changelog/changelog.md` en `commits.json` staan er. Ontbreken ze, draai dan:

  ```bash
  pnpm run flux:web-components:changelog-copy {{version}}
  pnpm run flux:web-components:changelog-cleanup {{version}}
  pnpm run flux:web-components:changelog-commits {{version}}
  ```

- Je kan de repo van flux-web-components lezen: `https://github.com/milieuinfo/flux-web-components.git`, of een
  lokale clone. Je hebt ze nodig om een diff te lezen.

## Werkwijze

### 1. Lezen

Bouw eerst wat de scripts over de versie weten:

```bash
pnpm run flux:web-components:changelog-build {{version}}
```

Dat schrijft in `catalog/flux/{{version}}/changelog/`:

- `changelog.json`: het overzicht, met alle entries en per ticket het bestand;
- `tickets/<ticket>-<componenten>.json`: per ticket de volledige entries;
- `api.json`: wat er in de web-types veranderde.

Werk ticket per ticket. Per entry in een ticketbestand staan:

- `text`, `type` en `components`: wat de changelog zegt;
- `source.body`: de uitleg die het Flux-team in de commit schreef;
- `source.published`: of de wijziging de packages van een afnemer raakt;
- `source.areas` en `source.publishedFiles`: welk soort bestanden wijzigde;
- `source.storybook`: de Storybook-pagina's die wijzigden, met in `added` de documentatie die erbij kwam;
- `derivedImpact`: de afgeleide impact, een startpunt.

Een element in `api.json` met `inChangelog: false` wijzigde zonder dat een entry het noemt. Vermeld het bij de
entry waar het bij hoort, als je die vindt.

### 2. De diff lezen waar nodig

Lees de diff zelf (`git show <sha>`) wanneer:

- `source.body` ontbreekt en de wijziging de packages raakt;
- de uitleg een gedragswijziging laat vermoeden: een event op een ander element, andere keys, een nieuwe
  waarschuwing, escaping, focus die anders loopt;
- je een attribuut, property, event, methode of class wil noemen.

Een naam die je noemt, controleer je in de web-types of de code van {{version}}. Staat een attribuut wel in de
code maar niet in de web-types, zeg dat dan: een IDE stelt het dan niet voor.

### 3. De impact kiezen

| Impact      | Wanneer                                                                                           |
|-------------|---------------------------------------------------------------------------------------------------|
| `action`    | De afnemer moet iets aanpassen of nakijken. Bijvoorbeeld: bestaande code werkt anders (een event op een ander element, andere keys), er verschijnt een nieuwe waarschuwing, iets wordt dubbel voorgelezen, of een nieuw gedrag vraagt iets extra (een focus trap die een eigen sluitknop nodig maakt). Een breaking change is altijd `action`. |
| `opt-in`    | Een nieuwe mogelijkheid die de afnemer zelf moet gebruiken. Bestaande code verandert niet.        |
| `automatic` | Een fix of verbetering die hij meekrijgt door te upgraden, zonder iets te doen. Ook een visuele wijziging. |
| `none`      | Raakt de packages niet (`source.published` is `false`): testen, tooling, de documentatie van Flux zelf. |

Heeft een entry meerdere kanten, kies dan de dringendste die voor een gewone afnemer geldt. Vermeld de rest in
de uitleg: een fix die bij een nieuwe feature meekomt, of een randgeval dat enkel wie iets ongewoons doet
raakt.

### 4. Schrijven

Per entry:

- `explanation` (verplicht): Nederlands, voor een afnemer, één tot vier zinnen over wat er voor zijn project
  verandert.
  - Laat interne details weg: guards, closures, testen, CI.
  - Noem componenten, attributen, events en pagina's zoals de afnemer ze kent.
  - Verwijs naar een Storybook-pagina met haar titel, bv. Patronen/Formulier/cross-validatie.
- `action` (verplicht bij `action`, anders weg): wie het raakt en wat hij moet doen. Bijvoorbeeld: "Luister je
  op window naar …, registreer de listener dan op het element zelf."
- `example` (optioneel): enkel bij `opt-in` of `action`, en enkel als het helpt. Neem het waar kan over uit de
  Storybook-documentatie (`source.storybook[].added`). Schrijf het als een markdown-codeblok.
- `a11y` (optioneel): enkel wanneer het afgeleide label niet klopt. Een voorbeeld is een entry die een
  schermlezer vermeldt maar geen wijziging aan toegankelijkheid is.

Per versie schrijf je `summary`: twee tot vier zinnen over het belangrijkste van de release, met uitdrukkelijk
wat actie vraagt.

De analyse staat in `catalog/flux/{{version}}/analysis/` en volgt de bestanden van `changelog/`.

- **Per ticket:** `analysis/tickets/<naam>.json`, met exact dezelfde naam als het ticketbestand in
  `changelog/tickets/`. Als sleutel gebruik je de `id` van elke entry van dat ticket.

  ```json
  {
    "entries": {
      "778158e": {
        "impact": "action",
        "explanation": "…",
        "action": "…",
        "example": "```js\n…\n```"
      }
    }
  }
  ```

- **Per versie:** `analysis/changelog.json`, met enkel de samenvatting.

  ```json
  { "summary": "…" }
  ```

Schrijf enkel in `analysis/`. De bestanden in `changelog/` zijn gegenereerd; een wijziging daar verdwijnt bij de
volgende build.

### 5. Controleren

```bash
pnpm run flux:web-components:changelog-build {{version}}
```

Het script weigert een analyse met:

- een bestand dat bij geen ticket hoort;
- een entry die niet bij dat ticket hoort;
- een onbekende sleutel;
- een ongeldige impact;
- een `action` die ontbreekt of niet past.

De lijst "nog niet geanalyseerd" in de uitvoer moet leeg zijn.

Toon de gebruiker daarna:

- de `summary`;
- de entries met impact `action`, met hun `action`;
- per entry de gekozen impact, en waar die afwijkt van de afgeleide, waarom.

De analyse komt via een PR in git, net als de rest van de catalogus.
