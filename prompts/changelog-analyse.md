---
name: changelog-analyse
description: Schrijft voor een Flux-release per changelog-entry wat ze voor een afnemer betekent, per ticket in catalog/flux/<versie>/changelog-analysis/.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0.
    required: true
  - name: repo
    description: De map van een clone van flux-web-components met de tag v{{version}}.
    required: true
---

# Analyse van de changelog van Flux {{version}}

De vraag is: wat verandert er voor een afnemer die naar Flux {{version}} upgradet, vanaf de vorige versie?

Een changelog-entry is één regel. Een afnemer gaat niet uitzoeken wat er achter die regel zit; de MCP-server moet
het hem vertellen. Je schrijft daarom per entry van Flux {{version}}:

- wat de wijziging voor zijn project betekent (de impact);
- een uitleg voor hem;
- wat hij moet doen, als dat nodig is;
- een voorbeeld, als dat helpt.

Alles wat je schrijft, moet kloppen. Het komt uit de commit, de diff, de Storybook-documentatie of de
web-types van {{version}}, nooit uit een vermoeden.

## Voorwaarden

- `catalog:update` haalde de bronnen van {{version}} op: `catalog/flux/{{version}}/changelog/changelog.md` en
  `commits.json`, `web-types/` en `packages/`.
- Lees en zoek met Read, Grep en Glob. Bash mag enkel voor de git-commando's hieronder (`show`, `log` en
  `ls-tree`) en voor `pnpm run flux:changelog:build {{version}}`, zonder pipes, `cd` of andere
  commando's: al de rest wordt geweigerd, ook `git grep`.
- De bronrepo staat in `{{repo}}`, uitgecheckt op v{{version}}:
  - de code van deze versie lees en doorzoek je met Read, Grep en Glob, in `{{repo}}`;
  - een commit en haar diff: `git -C {{repo}} show <sha>`;
  - een bestand van een andere versie: `git -C {{repo}} show v<versie>:<pad>`;
  - de geschiedenis en de bestanden van een andere versie: `git -C {{repo}} log …` en
    `git -C {{repo}} ls-tree -r --name-only v<versie>`.
- Je schrijft enkel in `catalog/flux/{{version}}/changelog-analysis/`.

## Werkwijze

### 1. Lezen

Bouw eerst wat de scripts over de versie weten:

```bash
pnpm run flux:changelog:build {{version}}
```

Dat schrijft in `catalog/flux/{{version}}/changelog/`:

- `release.json`: het overzicht, met alle entries, per ticket het bestand, en in `unlistedCommits` de commits die
  de packages raken zonder in de changelog te staan;
- `tickets/<ticket>-<componenten>.json`: per ticket de volledige entries;
- `web-types-diff.json`: wat er in de web-types veranderde tegenover de vorige versie. `added`, `removed` en
  `changed` zijn het contract; `descriptions` zijn elementen waarvan enkel de tekst wijzigde;
- `dependencies-diff.json`: welke dependencies van de packages erbij kwamen, verdwenen of een andere versie
  kregen.

Werk ticket per ticket. Per entry in een ticketbestand staan:

- `text`, `type` en `components`: wat de changelog zegt;
- `source.body`: de uitleg die het Flux-team in de commit schreef;
- `source.published`: of de wijziging de packages van een afnemer raakt;
- `source.areas` en `source.publishedFiles`: welk soort bestanden wijzigde;
- `source.storybook`: de Storybook-pagina's die wijzigden, met in `added` de documentatie die erbij kwam;
- `derivedImpact`: de afgeleide impact, een startpunt.

Een element in het contract van `web-types-diff.json` met `inChangelog: false` wijzigde zonder dat een entry het
noemt. Vermeld het bij de entry waar het bij hoort, als je die vindt. Een nieuwe beschrijving in `descriptions`
raakt geen project, tenzij de tekst op ander gedrag wijst; lees dan de diff.

Niet alles hoort bij een entry:

- **Commits buiten de changelog** (`unlistedCommits`): lees de diff van elke commit. Wat een
  afnemer ervan moet weten, komt in de `summary`.
- **Dependencies** (`dependencies-diff.json`): een nieuwe major van bv. `lit` of `ol`, of een nieuwe
  peerDependency, kan actie vragen. Vermeld het in de `summary`. Een lege diff hoef je niet te vermelden.

### Een bestaande analyse

Staat er al een analyse in `catalog/flux/{{version}}/changelog-analysis/`, begin dan niet opnieuw. Dat gebeurt
wanneer een versie haar bronnen opnieuw kreeg, of wanneer de vorige versie in de catalogus bijkwam en deze versie
daardoor voor het eerst een diff van de web-types of de dependencies heeft.

- Vul aan wat ontbreekt: entries zonder analyse, contractwijzigingen met `inChangelog: false` die geen entry en
  de `summary` niet vermelden, en gewijzigde dependencies en commits buiten de changelog die de `summary` niet
  noemt.
- Verbeter wat niet meer klopt met de feiten.
- Laat de rest staan zoals het is: herschrijf niets dat klopt.

### 2. De diff lezen waar nodig

Lees de diff zelf (`git -C {{repo}} show <sha>`) wanneer:

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

Per versie schrijf je `summary`: twee tot vier zinnen over het belangrijkste van de upgrade, met uitdrukkelijk
wat actie vraagt. Neem er ook in op wat niet bij een entry hoort: gewijzigde dependencies en commits buiten de
changelog die een afnemer raken.

De analyse staat in `catalog/flux/{{version}}/changelog-analysis/` en volgt de bestanden van `changelog/`.

- **Per ticket:** `changelog-analysis/tickets/<naam>.json`, met exact dezelfde naam als het ticketbestand in
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

- **Per versie:** `changelog-analysis/release.json`, met enkel de samenvatting.

  ```json
  { "summary": "…" }
  ```

Schrijf enkel in `changelog-analysis/`. De bestanden in `changelog/` zijn gegenereerd; een wijziging daar verdwijnt
bij de volgende build.

### 5. Controleren

```bash
pnpm run flux:changelog:build {{version}}
```

Het script weigert een analyse met:

- een bestand dat bij geen ticket hoort;
- een entry die niet bij dat ticket hoort;
- een onbekende sleutel;
- een ongeldige impact;
- een `action` die ontbreekt of niet past.

De lijst "nog niet geanalyseerd" in de uitvoer moet leeg zijn.

Eindig met een kort verslag in het Nederlands:

- de `summary`;
- de entries met impact `action`, met hun `action`;
- per entry waar de gekozen impact afwijkt van de afgeleide, waarom;
- bij een bestaande analyse: wat je aanvulde of verbeterde.

Daarna controleert een tweede agent je analyse met `prompts/changelog-review.md`, en verbetert wat niet klopt.
