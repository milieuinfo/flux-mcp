# flux-mcp

MCP-server (Model Context Protocol) voor **Flux**: stelt de Flux-catalogus en bijhorende resources beschikbaar
aan LLM-agents en tooling via MCP. De server zelf kent Figma niet.

Daarnaast verrijkt deze repo de FLUX Figma-library met wat we over de componenten weten: de Code Connect
snippets, de component descriptions en de documentation links. Een agent vindt die niet hier, maar via de
Figma MCP-server, terwijl hij in Figma werkt. Die twee sporen staan los van elkaar; wat ze delen is de kennis
per component, die hier in git leeft.

## Structuur

| Folder                | Inhoud                                                              |
|-----------------------|---------------------------------------------------------------------|
| `server/`             | de MCP-server zelf; voorlopig de queries op de catalogus (`src/`) en hun tests (`test/`) |
| `catalog/flux/`       | wat de MCP-server aanbiedt: `<versie>/web-types/`, `<versie>/changelog/` en `<versie>/analysis/` van die Flux-release |
| `catalog/figma/`      | wat we naar Figma schrijven: `code-connect/v2/` (de templates) en `descriptions/v2/` (de kennis per component) |
| `docs/beslissingen/`  | ADR's: de beslissingen en waarom (`ADR-000-template.md` is het sjabloon) |
| `prompts/`            | MCP-prompts die de server aanbiedt (concept), en prompts voor het onderhoud van de catalogus, zoals `changelog-analyse.md` |
| `resources/`          | scripts enzo                                                        |

Alle scripts lopen via `pnpm run` (zie `package.json`); installeer eerst met `pnpm install`. De tests draaien
met `pnpm test`.

## TL;DR: Figma na een release

Voor versie `X.Y.Z`; `FIGMA_TOKEN` staat in je omgeving. Details in de secties hieronder.

1. `pnpm run figma:web-components:copy-figma`: templates van de laatste release naar de catalogus (of geef
   `X.Y.Z` mee).
2. `pnpm run figma:code-connect:publish --dry-run`: valideert tegen Figma, publiceert niets.
3. `pnpm run figma:code-connect:publish`: publiceert de snippets (of via Jenkins, `ACTION` publish).
4. `pnpm run figma:descriptions:write X.Y.Z`: payload met descriptions en documentation links.
5. Commit de catalogus.
6. Maak in Figma een branch van de library.
7. Laat een AI-agent met de Figma MCP `prompts/figma-descriptions.md` uitvoeren op die branch. Hij toont wat
   verschilt en schrijft pas na je akkoord.
8. Review de branch, merge hem en publiceer de library.

Een description aanpassen doe je in `catalog/figma/descriptions/v2/<soort>/<naam>.figma.md` (via een PR), nooit
rechtstreeks in Figma. Bij de volgende release neemt stap 7 ze mee; wil je ze eerder in Figma, herhaal dan
stap 4 en 6 tot 8.

## Bronrepo

Alle scripts hier halen hun gegevens uit de repo van Flux Web Components. Dat gebeurt vanzelf: ze klonen
`https://github.com/milieuinfo/flux-web-components.git` over https naar een tijdelijke map. Die repo is open
source, dus er zijn geen credentials voor nodig en in CI hoef je niets in te stellen.

Lokaal kan je een bestaande clone gebruiken door `FLUX_REPO` vóór het commando te zetten:

```bash
FLUX_REPO=~/repos/flux-web-components pnpm run figma:web-components:copy-figma 2.20.0
```

Dat scheelt een clone per run en werkt zonder netwerk. De variabele geldt enkel voor dat ene commando, er
wordt niets bewaard. Zorg wel dat je clone de gevraagde tag kent, anders eerst `git fetch --tags`.

Je eigen clone wordt nooit gewijzigd: `figma:web-components:copy-figma` kloont ook een lokale bron eerst naar
een tijdelijke map.

## Web-types en changelog per versie

De MCP-server biedt de web-types en de changelog van Flux Web Components per versie aan. Je haalt ze op uit de
tag van een release:

```bash
pnpm run flux:web-components:web-types-copy 2.20.0    # tag v2.20.0 naar catalog/flux/2.20.0/web-types/
pnpm run flux:web-components:changelog-copy 2.20.0    # tag v2.20.0 naar catalog/flux/2.20.0/changelog/
pnpm run flux:web-components:changelog-cleanup 2.20.0 # enkel de wijzigingen van 2.20.0 in changelog.md
pnpm run flux:web-components:changelog-commits 2.20.0 # de feiten uit de commits in commits.json
pnpm run flux:web-components:changelog-build 2.20.0   # overzicht, tickets en API-diff van 2.20.0
```

Tussen `changelog-commits` en `changelog-build` schrijft een AI-agent de analyse, met de prompt
`prompts/changelog-analyse.md` (zie hieronder).

De versie is verplicht; `2.20.0` en `v2.20.0` mogen allebei. Anders dan bij de Code Connect templates staan de
versies naast elkaar, elk in een eigen map. Elk script vult daaronder zijn eigen map: een nieuwe kopie van
dezelfde versie vervangt enkel die map, de rest van de versiemap blijft staan.

`web-types/` is plat: de `*.web-types.json` bestanden van de tag, zonder de mappen van de bronrepo. In de
bronrepo staat `DOMG-WC-VERSION` waar de versie hoort, onder meer in de doc-urls naar Storybook; het script vult
de versie in.

`changelog-copy` zet `CHANGELOG.md` uit `resources/changelog/` van de tag in `changelog/`, met de historiek tot
en met die release. `changelog-cleanup` houdt daarvan enkel de sectie van de versie zelf over, met de kop erbij,
en schrijft ze naar `changelog.md`. Dat gebeurt deterministisch op de tekst: een sectie loopt van de versiekop
tot de volgende. Opnieuw opkuisen geeft hetzelfde resultaat.

De keuzes en het waarom van alles hieronder staan in
[ADR-001](docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md).

### De feiten uit de commits

Een changelog-entry is één regel. Een afnemer gaat niet uitzoeken wat er in een commit wijzigde; de server moet
het hem vertellen. `changelog-commits` haalt daarom per entry uit de bronrepo:

- de uitleg die het Flux-team in de commit message schreef;
- in welk soort bestanden de wijziging zit: `code` en `styles` van de gepubliceerde packages (`@domg-wc/common`,
  `components`, `map`, `styles`), of `docs`, `storybook`, `examples`, `tests` en `tooling`. Daaruit volgt of de
  wijziging de packages van een afnemer raakt (`published`);
- de Storybook-pagina's die wijzigden, met hun link in de Storybook van die release en de documentatie die
  erbij kwam. Langer dan 100 regels geeft enkel de titels.

Het resultaat staat in `changelog/commits.json`. Het script leest de commits uit `changelog.md`, haalt ze op zoals
de andere scripts (`FLUX_REPO` werkt ook hier) en neemt de Storybook-pagina's uit `index.json` van de Storybook van
die release. Opnieuw draaien geeft hetzelfde bestand.

### Wat er per versie staat

Per versie staan de gegevens in twee mappen naast elkaar, met dezelfde bestandsnaam per ticket:

- **`changelog/`** bevat wat scripts maken, deterministisch;
- **`analysis/`** bevat wat een LLM schreef.

Zo zie je bij een review meteen wat waarvandaan komt: leg de twee bestanden van een ticket naast elkaar.

```
catalog/flux/2.20.0/
├── changelog/                  deterministisch (scripts)
│   ├── changelog.md            bron: de sectie van de release
│   ├── commits.json            bron: de feiten uit de commits
│   ├── changelog.json          overzicht: versie, tellingen, componenten, alle entries, de tickets met hun bestand
│   ├── api.json                de API-diff uit de web-types
│   └── tickets/
│       ├── FLUX-809-vl-alert.json
│       ├── FLUX-810-vl-side-sheet-vl-cascader.json
│       └── a6116b6.json        een entry zonder ticket
└── analysis/                   LLM (prompts/changelog-analyse.md)
    ├── changelog.json          de samenvatting van de versie
    └── tickets/
        ├── FLUX-809-vl-alert.json
        └── …
```

Een ticketbestand heet naar de issue-key, gevolgd door de componenten en thema's uit de scope van zijn entries.
Een entry zonder ticket krijgt haar id als naam.

#### changelog/

`changelog-build` maakt `changelog.json`, `api.json` en `tickets/` uit `changelog.md`, `commits.json` en de
web-types. De bestanden komen mee in git.

```bash
pnpm run flux:web-components:changelog-build 2.20.0          # één versie
pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
pnpm run flux:web-components:changelog-build --check         # faalt als een gebouwd bestand niet meer klopt
```

Per entry in een ticketbestand staan:

- wat de changelog zegt: het type (`breaking`, `feature`, `fix`, `docs`, …), de issues (`FLUX-809`), de
  componenten uit de scope, de thema's (`form-control`) en de componenten die de tekst noemt;
- de feiten uit de commits in `source`;
- de afgeleide impact in `derivedImpact`. Met `commits.json` beslist `published`: raakt de wijziging de packages
  niet, dan `none`, anders `opt-in` voor een feature en `automatic` voor een fix. Zonder `commits.json` vallen we
  terug op het type en op signaalwoorden in de tekst. Een breaking change is altijd `action`.
- het label `a11y` voor een wijziging aan toegankelijkheid, met de WCAG-criteria in `wcag`.

`api.json` is de diff tegen de web-types van de vorige versie. Hij toont de attributen, slots, properties en
events die erbij kwamen, verdwenen of wijzigden. Elk element krijgt `inChangelog`, zodat een wijziging zonder
changelog-entry opvalt. Staan de web-types van de vorige versie niet in de catalogus, dan is er geen `api.json` en
zegt `apiUnavailable` in `changelog.json` waarom.

Gebruik `--all` ook wanneer de web-types van een vorige versie later binnenkomen: de API-diff van de volgende
versie hangt ervan af.

#### analysis/

Per ticket beschrijft `analysis/tickets/<naam>.json` voor elke entry van dat ticket wat de wijziging voor een
afnemer betekent:

- **`impact`:** wat hij ermee moet.
  - `action`: iets aanpassen of nakijken;
  - `opt-in`: een nieuwe mogelijkheid die hij zelf moet gebruiken;
  - `automatic`: hij krijgt ze mee door te upgraden;
  - `none`: het raakt zijn project niet.
- **`explanation`:** een uitleg voor hem.
- **`action`:** wat hij moet doen, bij `action`.
- **`example`:** een voorbeeld, als dat helpt.

`analysis/changelog.json` bevat de samenvatting van de versie.

Een AI-agent schrijft de analyse met de prompt `prompts/changelog-analyse.md`. Hij vertrekt van de feiten uit de
commits, leest de diff waar die uitleg tekortschiet, en controleert elke naam in de web-types of de code. De
analyse komt via een PR in git. Ze staat bewust buiten `changelog/`, want `changelog-copy` vervangt die map.

`changelog-build` controleert de analyse en weigert:

- een bestand dat bij geen ticket hoort;
- een entry die niet bij haar ticket hoort;
- een onbekende sleutel;
- een ongeldige impact.

Na het bouwen toont het script de tellingen, de acties, de entries over toegankelijkheid en de entries die nog
niet geanalyseerd zijn.

Handmatige kennis, zoals migratie-notities die nergens in de commits staan, hoort niet hier: daarvoor komen er
`.llm.md` bestanden in flux-web-components.

#### Wat de server toont

De server voegt beide samen bij het laden. De analyse bepaalt de impact (`impactSource: "analysis"`), de uitleg,
de actie, het voorbeeld en eventueel het label `a11y`. Zonder analyse geldt de afgeleide impact
(`impactSource: "derived"`).

### Queries voor de server

`server/src/catalog.mjs` beantwoordt de vragen over de changelog als gewone functies. De MCP-server hangt ze
later aan tools en resources.

| Functie                                   | Vraag                                                                      |
|-------------------------------------------|----------------------------------------------------------------------------|
| `listVersions()`                          | welke versies zijn er?                                                     |
| `getChangelog(versie, filters)`           | wat veranderde er in één versie? Filters: type, impact, component, label   |
| `getChangesBetween(van, tot, filters)`    | wat verandert er bij een upgrade? Per impact, eerst wat actie vraagt, per component, met de netto API-diff |
| `getComponentHistory(component, bereik)`  | wat veranderde er per versie aan één component?                           |
| `findChanges(zoekterm)`                   | in welke versie zit `FLUX-800`, of een wijziging over "window ready"? Zoekt ook in de uitleg |

Wat een entry met impact `none` doet, hangt af van de vraag:

- `getChangelog` en `findChanges` tonen ze, want een afnemer mag weten wat er nieuw is.
- `getChangesBetween` en `getComponentHistory` laten ze standaard weg, want bij een upgrade telt enkel wat het
  project raakt.

`hiddenNoImpact` zegt hoeveel entries er wegvielen, en met `includeNoImpact` toon je ze toch.

Ontbreekt er een versie in de keten, dan zegt `getChangesBetween` dat met `complete: false`, `missing` en een
`warning`. Oudere versies halen we niet op: de catalogus begint bij 2.19.0.

## Code Connect

De Figma Code Connect templates horen bij Flux Web Components, maar worden van hieruit gepubliceerd. Na een
npm release halen we de templates van die release op in `catalog/figma/code-connect/v2/`, zodat we altijd
weten wat er in Figma staat. De catalogus houdt geen Flux-versies naast elkaar: een nieuwe kopie vervangt de
vorige, git bewaart de historiek en `manifest.json` zegt welke release erin zit.

```bash
pnpm run figma:web-components:copy-figma           # kopieert de laatste release naar de catalogus
pnpm run figma:web-components:copy-figma 2.20.0    # of een bepaalde versie: tag v2.20.0
pnpm run figma:code-connect:publish --dry-run      # valideert de templates, publiceert niets
pnpm run figma:code-connect:publish                # publiceert naar Figma
pnpm run figma:code-connect:unpublish              # haalt die snippets weer weg
```

De map is de Figma-library, en die volgt de major van de Flux-release: 2.21.0 hoort bij `v2`, 3.0.0 bij `v3`.
Een nieuwe library komt er dus vanzelf naast te staan. De commando's zonder versie kiezen de library die in de
catalogus staat; staan er meerdere, dan kies je met `FIGMA_MAJOR_VERSION`:

```bash
FIGMA_MAJOR_VERSION=3 pnpm run figma:code-connect:publish --dry-run
```

De Code Connect CLI is een devDependency in `package.json`. In Jenkins installeert `install-pnpm.sh` eerst
dezelfde pnpm-versie als flux-web-components; dat is het enige script dat niet via `pnpm run` kan, omdat pnpm
er dan nog niet is.

Publiceren en unpublishen vragen `FIGMA_TOKEN`, een Figma token met `File content: read` en
`Code Connect: write`. Voor een dry run volstaat `File content: read`. Lokaal zet je het vóór het commando:

```bash
FIGMA_TOKEN=<token> pnpm run figma:code-connect:publish --dry-run
```

In Jenkins draaien dezelfde scripts. Start de pipeline via "Build with Parameters" met `ACTION` (dry run,
publish of unpublish); het token komt daar uit de credential `flux-mcp/figma_cli`.

Goed om te weten:

- Figma bewaart per node en per label één snippet. Publiceren vervangt dus wat er voor die nodes stond. Terug
  naar een vorige stand doe je door die opnieuw te publiceren, niet met `figma:code-connect:unpublish`.
- De catalogus is plat: één map per soort (`atom`, `block`, `compliance`, `form`, `map`, `styles`), zonder de
  mappen van de bronrepo. De helpers die de templates importeren, zoals `escape-html.ts`, komen in `helpers/`;
  `figma:web-components:copy-figma` herschrijft de imports en de include-patronen in `figma.config.json` daarop.
- `figma:web-components:copy-figma` haalt de tag `v<versie>`. Zonder versie zoekt hij de hoogste release tag
  in de bronrepo op (prereleases tellen niet mee); staat `FIGMA_MAJOR_VERSION` gezet, dan de hoogste binnen
  die major. Met `--ref` kies je een andere git ref; welke repo hij aanspreekt staat hierboven onder Bronrepo.
- `FIGMA_MAJOR_VERSION` werkt op alle scripts; `3` en `v3` mogen allebei. Handig wanneer een prerelease van de volgende major nog naar de
  huidige library moet, of omgekeerd.
- De versie van de Code Connect CLI staat gepind in `package.json`: we publiceren met dezelfde versie als
  waarmee de templates gevalideerd zijn.

## Kennis per component en Figma-descriptions

`catalog/figma/descriptions/v2/<soort>/<naam>.figma.md` bundelt wat een ontwerper, een developer of een AI over één
component in Figma moet weten; sommige van die componenten bestaan enkel in Figma. Het bestand staat in
dezelfde soort en heet zoals het Code Connect template waar het bij hoort:
`descriptions/v2/atom/vl-button.figma.md` hoort bij `code-connect/v2/atom/vl-button.figma.ts`. De kennis loopt
door over Flux-releases heen; ze hoort bij de Figma-library, niet bij een versie van de web componenten. Welke
library, leidt het script af uit de major van de versie die je meegeeft; `FIGMA_MAJOR_VERSION` overrulet dat.

Zo ziet zo'n bestand eruit:

```markdown
---
storybook: components-atom-button
---

# vl-button

## Figma

Knop voor een actie op de pagina.

• …
```

- `storybook` is de id van de documentatiepagina, zonder `--documentatie`.
- Onder `## Figma` staat de tekst die als component description in Figma komt. De Figma MCP geeft die aan een
  AI mee als "usage descriptions … best practices", samen met de documentation link. Schrijf ze voor wie
  ontwerpt of van design naar code gaat: wat het component is, waar het vaak misloopt en wat er voor
  toegankelijkheid in de code moet gebeuren. Details horen in Storybook.

Na een release en een `figma:web-components:copy-figma` bouw je de descriptions en documentation links voor
die versie:

```bash
pnpm run figma:descriptions:write 2.20.0    # dist/descriptions/2.20.0.json
```

De payload is wegwerp en staat in `.gitignore`: de versie bepaalt enkel naar welke Storybook-release de
documentation links wijzen. Genereer ze opnieuw wanneer je naar Figma schrijft.

Het script koppelt elk bestand via het template aan zijn Figma node, controleert of de Storybook-pagina in die
release bestaat en weigert teksten boven 1200 tekens. Onder elke description zet het een regel dat de tekst
gegenereerd is uit dat `.figma.md` bestand, op welk tijdstip, en dat ze niet in Figma aangepast mag worden.

Het resultaat in Figma zetten kan niet vanuit een script of vanuit Jenkins: descriptions en documentation links
zijn enkel via de Plugin API te wijzigen, niet via de REST API. Het werk verdeelt zich daarom zo:

1. De developer maakt in de Figma-file van de library een branch.
2. Een AI-agent met de Figma MCP schrijft de descriptions uit `catalog/figma/descriptions/v2/` en de
   documentation links in die branch weg. Hij gebruikt daarvoor `dist/descriptions/<versie>.json`,
   dat die teksten al koppelt aan de juiste Figma node en Storybook-versie. De werkwijze staat in de prompt
   `prompts/figma-descriptions.md`: hij toont eerst wat verschilt en schrijft pas na akkoord.
3. De developer reviewt de wijzigingen in de branch, merget ze en publiceert de library.

## Status

Project in opstart. Setup, gebruik en architectuur volgen.
