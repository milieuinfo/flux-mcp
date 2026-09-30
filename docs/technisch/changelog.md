# De changelog: wat verandert er bij een upgrade

Per Flux-release beantwoordt de catalogus één vraag: wat verandert er voor een afnemer die van de vorige versie naar
deze upgradet? Moet hij iets aanpassen, wat kan hij nieuw gebruiken, wat krijgt hij vanzelf mee, en wat raakt zijn
project niet? Een versie wordt één keer opgebouwd, na de release: `catalog/flux/2.20.0/` vergelijkt 2.20.0 met 2.19.0.
Een upgrade over meerdere versies telt de server op (zie [De server](server.md)). De keuzes en het waarom staan in
[ADR-001](../beslissingen/ADR-001-changelog-voor-de-mcp-server.md).

Hoe je een versie opbouwt, staat bij [De catalogus](catalogus.md).

## De bronnen

Vier bronnen, alle vier van die release:

| Bron                 | Script                                  | Map en inhoud                                                   |
|----------------------|-----------------------------------------|-----------------------------------------------------------------|
| de web-types         | `web-types:copy`                        | `web-types/`: de API van elke component                         |
| de packages          | `packages:copy`                         | `packages/`: de dependencies die een afnemer mee installeert    |
| de changelog         | `changelog:copy`, `changelog:cleanup`   | `changelog/changelog.md`: wat het Flux-team opschreef           |
| de commits erachter  | `changelog:commits`                     | `changelog/commits.json`: de feiten achter elke entry           |

- **`web-types/`** is plat: de `*.web-types.json` bestanden van de tag, zonder de mappen van de bronrepo. Waar de
  bronrepo `DOMG-WC-VERSION` heeft, onder meer in de doc-urls naar Storybook, vult het script de versie in.
- **`packages/`** bevat per gepubliceerd package (`@domg-wc/common`, `components`, `map` en `styles`) de naam, de versie
  en de dependencies, zoals ze op de registry staan. De bronrepo volstaat niet: de build van Flux zet de dependencies
  pas bij het publiceren in de package.json.
- **`changelog:copy`** zet `CHANGELOG.md` uit `resources/changelog/` van de tag in `changelog/`, met de historiek tot en
  met die release. **`changelog:cleanup`** houdt enkel de sectie van de versie zelf over, met de kop, in
  `changelog.md`: een sectie loopt van de versiekop tot de volgende. Opnieuw opkuisen geeft hetzelfde resultaat.

### De feiten uit de commits

Een changelog-entry is één regel. Een afnemer gaat niet uitzoeken wat er in een commit wijzigde; de server moet het hem
vertellen. `changelog:commits` haalt daarom per entry uit de bronrepo:

- de uitleg die het Flux-team in de commit message schreef;
- in welk soort bestanden de wijziging zit: `code` en `styles` van de gepubliceerde packages, of `docs`, `storybook`,
  `examples`, `tests` en `tooling`. Daaruit volgt of de wijziging de packages van een afnemer raakt (`published`);
- de Storybook-pagina's die wijzigden, met hun link in de Storybook van die release, en de documentatie die erbij
  kwam. Langer dan 100 regels geeft enkel de titels.

Daarnaast zoekt het de commits tussen de vorige en deze tag die niet in de changelog staan. conventional-changelog laat
onder meer `chore`, `refactor` en `build` weg, ook als ze de packages raken. Zo'n commit komt in `unlisted`, met zijn
onderwerp, de uitleg en de gewijzigde bestanden van de packages. De release-commit, die enkel de web-types genereert,
telt niet mee.

Het script leest de commits uit `changelog.md` en haalt ze op zoals de andere scripts, ook met `FLUX_REPO`. De
Storybook-pagina's komen uit `index.json` van de Storybook van die release. Opnieuw draaien geeft hetzelfde bestand.

## Wat er per versie staat

Twee mappen, met dezelfde bestandsnaam per ticket: `changelog/` bevat wat scripts maken, deterministisch, en
`changelog-analysis/` wat een LLM schreef. Leg de twee bestanden van een ticket naast elkaar, en je ziet wat waarvandaan
komt.

```
catalog/flux/2.20.0/
├── changelog/                  deterministisch (scripts)
│   ├── changelog.md            bron: de sectie van de release
│   ├── commits.json            bron: de feiten uit de commits
│   ├── release.json            overzicht: versie, tellingen, componenten, alle entries, de tickets met hun bestand
│   ├── web-types-diff.json     wat er aan de API veranderde tegenover de vorige versie
│   ├── dependencies-diff.json  wat er aan de dependencies veranderde tegenover de vorige versie
│   └── tickets/
│       ├── FLUX-809-vl-alert.json
│       └── a6116b6.json        een entry zonder ticket
└── changelog-analysis/         LLM (prompts/changelog-analyse.md)
    ├── release.json            de samenvatting van de versie
    └── tickets/
        └── FLUX-809-vl-alert.json
```

Een ticketbestand heet naar de issue-key, gevolgd door de componenten en thema's uit de scope van zijn entries. Een
entry zonder ticket krijgt haar id in de plaats, bv. `a6116b6.json` of `0debeef-vl-footer-vl-footer-next.json`.

## De build

`changelog:build` maakt `release.json`, `web-types-diff.json`, `dependencies-diff.json` en `tickets/` uit de bronnen.
De bestanden komen in git.

```bash
pnpm run flux:changelog:build 2.20.0     # één versie
pnpm run flux:changelog:build --all      # alle versies in de catalogus
pnpm run flux:changelog:build --check    # faalt als een gebouwd bestand niet meer klopt
```

Gebruik `--all` ook wanneer de web-types of de packages van een vorige versie later binnenkomen: de diffs van de
volgende versie hangen ervan af.

**Per entry** in een ticketbestand staan:

- wat de changelog zegt: het type (`breaking`, `feature`, `fix`, `docs`, …), de issues (`FLUX-809`), de componenten
  uit de scope, de thema's (`form-control`) en de componenten die de tekst noemt;
- de feiten uit de commits, in `source`;
- de afgeleide impact, in `derivedImpact`. Met `commits.json` beslist `published`: raakt de wijziging de packages niet,
  dan `none`, anders `opt-in` voor een feature en `automatic` voor een fix. Zonder `commits.json` vallen we terug op
  het type en op signaalwoorden in de tekst. Een breaking change is altijd `action`;
- het label `a11y` voor een wijziging aan toegankelijkheid, met de WCAG-criteria in `wcag`.

**`web-types-diff.json`** is de diff tegen de web-types van de vorige versie, in twee delen:

- **het contract** (`added`, `removed`, `changed`): elementen, attributen, slots, properties en events die erbij kwamen
  of verdwenen, en een ander type, een andere default of `deprecated`. Dat kan een afnemer raken;
- **de beschrijvingen** (`descriptions`): elementen en onderdelen waarvan enkel de tekst wijzigde. Dat raakt geen
  project. In 2.20.0 zijn dat er
  12, tegenover één wijziging aan het contract: `banner` op `vl-alert`.

Elk element krijgt `inChangelog`, zodat een wijziging zonder changelog-entry opvalt.

**`dependencies-diff.json`** vergelijkt de packages: welke erbij kwamen of verdwenen, en per package de
`dependencies`, `peerDependencies` en `optionalDependencies` die erbij kwamen, verdwenen of een andere versie kregen.
Een dependency op een package van dezelfde release (`@domg-wc/common` 2.20.0 in `@domg-wc/components` 2.20.0) telt
niet. Een lege diff betekent dat er niets veranderde.

Ontbreken de web-types of de packages van de vorige versie, dan is er geen diff, en zegt `webTypesDiffUnavailable` of
`dependenciesDiffUnavailable` in `release.json` waarom.

**`unlistedCommits`** in `release.json` zijn de commits die de packages raken zonder in de changelog te staan. `[]`
betekent dat er geen zijn, `null` dat `commits.json` ontbreekt.

Na het bouwen toont het script de tellingen, de acties, de entries over toegankelijkheid en de entries die nog niet
geanalyseerd zijn. Het meldt ook wijzigingen aan het contract die de changelog niet vermeldt, hoeveel beschrijvingen
wijzigden, of de dependencies wijzigden, en de commits buiten de changelog.

## De analyse

Per ticket beschrijft `changelog-analysis/tickets/<naam>.json` voor elke entry wat de wijziging voor een afnemer
betekent. `changelog-analysis/release.json` bevat de samenvatting van de versie.

- **`impact`:** wat hij ermee moet.
  - `action`: iets aanpassen of nakijken;
  - `opt-in`: een nieuwe mogelijkheid die hij zelf moet gebruiken;
  - `automatic`: hij krijgt ze mee door te upgraden;
  - `none`: het raakt zijn project niet.
- **`explanation`:** een uitleg voor hem.
- **`action`:** wat hij moet doen, bij `action`.
- **`example`:** een voorbeeld, als dat helpt.

```bash
pnpm run flux:changelog:analyse 2.20.0
```

`changelog:analyse` laat Claude Code de analyse schrijven en daarna reviewen (zie [Claude Code](claude-code.md)):

1. **De analyse**, met `prompts/changelog-analyse.md`. Claude vertrekt van de feiten uit de commits, leest de diff waar
   die uitleg tekortschiet, en controleert elke naam in de web-types of de code. Staat er al een analyse, dan vult het
   die aan in plaats van opnieuw te beginnen.
2. **De review**, met `prompts/changelog-review.md`. Blijft er iets onopgelost, of heeft een entry geen analyse, dan
   faalt het script.

De analyse staat bewust buiten `changelog/`, want `changelog:copy` vervangt die map. `changelog:build` controleert ze en
weigert een bestand dat bij geen ticket hoort, een entry die niet bij haar ticket hoort, een onbekende sleutel en een
ongeldige impact.

De server voegt beide mappen samen bij het laden. De analyse bepaalt de impact (`impactSource: "analysis"`), de uitleg,
de actie, het voorbeeld en eventueel het label `a11y`. Zonder analyse geldt de afgeleide impact
(`impactSource: "derived"`).

Handmatige kennis, zoals migratie-notities die nergens in de commits staan, hoort niet hier: daarvoor komen er
`.llm.md` bestanden in flux-web-components.
