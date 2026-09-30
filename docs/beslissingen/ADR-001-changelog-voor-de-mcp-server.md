# ADR-001: De changelog per versie klaarzetten voor de MCP-server

## Status
Aanvaard

## Datum
2026-09-25

## Context

Ticket: FLUX-812.

De MCP-server van deze repo moet per Flux-release één vraag van een afnemer beantwoorden: wat verandert er voor
mij als ik van de vorige versie naar deze upgrade? Moet ik iets aanpassen, wat kan ik nieuw gebruiken, wat krijg ik
vanzelf mee, en wat raakt mijn project niet? Een versie wordt één keer opgebouwd, na de release, en wijzigt daarna
niet meer; de volgende release krijgt een eigen map. Een upgrade over meerdere versies telt de server op.

`changelog:copy` en `changelog:cleanup` zetten per versie `catalog/flux/<versie>/changelog/changelog.md` klaar: de
sectie van die release, platte markdown van conventional-changelog.

Met die markdown alleen kan een agent weinig:

- een entry is één regel; wat er echt veranderde, staat in de commit, en een afnemer gaat dat niet uitzoeken;
- er is geen type per entry dat een machine kan lezen, dus een breaking change is niet te onderscheiden van een
  docs-wijziging zonder de tekst te interpreteren;
- niets zegt wat een wijziging voor het project van een afnemer betekent: moet hij iets doen, kan hij iets
  nieuws gebruiken, of raakt het hem niet (testen, CI, de build en de documentatie van Flux zelf);
- er is geen koppeling naar de componenten en hun documentatie in die versie;
- niets zegt welke wijzigingen over toegankelijkheid gaan, terwijl afnemers aan WCAG moeten voldoen;
- de vraag "wat verandert er als ik van X naar Y ga" is niet te beantwoorden zonder elke versie apart te lezen;
- wijzigingen aan de API van een component die de changelog niet vermeldt, blijven onzichtbaar;
- commits die de packages raken maar niet in de changelog staan, blijven onzichtbaar: conventional-changelog laat
  onder meer `chore`, `refactor` en `build` weg;
- niets zegt of de dependencies van de packages wijzigden, terwijl een afnemer die mee installeert.

### Wat de bron ons geeft

We onderzochten de changelogs van 2.19.0 en 2.20.0, de volledige historiek (`resources/changelog/CHANGELOG.md` van
tag v2.20.0, 955 entries) en de 35 commits achter de entries van 2.19.0 en 2.20.0.

- **Versiekop.** Er zijn drie formaten: `# [2.20.0](…/compare/v2.19.0...v2.20.0) (2026-09-18)`, `## [2.12.1](…)`
  voor een patch, en `# 1.0.0 (datum)` voor de oudste. De compare-url noemt de vorige versie expliciet.
- **Secties.** We vonden `Bug Fixes`, `Features`, `Documentation` en `BREAKING CHANGES`. Onder `BREAKING CHANGES`
  staan entries zonder commit-link, bv. `* start van v2`.
- **Entries.** Het patroon is `* <KEY> - <scope> - <samenvatting> ([sha7](commit-url))`, soms met
  `, closes [ref](url)` erachter. 92% volgt het patroon met key en scope. De rest heeft geen key, geen scope, een
  oude key (`UIG-…`) of meerdere ` - ` in de samenvatting.
- **Scopes.** Een scope noemt één of meer componenten (`vl-header, vl-header-next`,
  `vl-header-next / vl-footer-next`) of is een thema (`form-control`, `cross-validatie`, `storybook`, `skip-link`).
- **Commits.**
  - De meeste commits hebben een body waarin het Flux-team uitlegt wat er verandert en waarom, vaak met wat
    een afnemer moet doen.
  - Het pad van de gewijzigde bestanden zegt of een wijziging de gepubliceerde packages raakt
    (`@domg-wc/common`, `components`, `map`, `styles`), en welke Storybook-pagina's er wijzigden.
  - De tekst die in die pagina's bijkwam, is de documentatie van de wijziging, vaak met een voorbeeld.

  Een voorbeeld: "FLUX-788 - vl-header-next / vl-footer-next - flaky testen en ready-event" klinkt als
  testwerk. De commit wijzigt echter de code van beide componenten, en de body zegt: "Afnemers die vandaag op
  window luisteren moeten overschakelen naar het element."
- **Web-types.** De web-types van dezelfde versie staan naast de changelog. Ze beschrijven per element de
  attributen, slots, properties, events en `deprecated`, met een Storybook-link naar die versie. Tussen 2.19.0
  en 2.20.0 krijgt `vl-alert` het attribuut `banner` (FLUX-809). Daarnaast wijzigt de beschrijving van
  `blur-validation` in 11 formuliercomponenten en wijzigt de `label`-slot van `vl-cascader-item`. Geen
  changelog-entry noemt die bij naam. Het gaat telkens enkel om de tekst van de beschrijving: van de 13 gewijzigde
  elementen is `banner` de enige wijziging aan het contract.
- **Commits buiten de changelog.** Tussen v2.19.0 en v2.20.0 staan 20 commits, waarvan 18 in de changelog. De
  andere twee zijn de release-commit, die enkel de web-types genereert, en `chore: FLUX-717 - figma mcp`, zonder
  bestanden uit de packages. Voor 2.20.0 ontbreekt er dus niets, maar dat is geen garantie.
- **Dependencies.** De build van Flux zet de dependencies van de packages pas bij het publiceren in de
  package.json; de bronrepo heeft voor `libs/components` geen package.json. De registry
  (`https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm`) geeft ze per versie, zonder aanmelden.
  Tussen 2.19.0 en 2.20.0 zijn ze ongewijzigd.

## Beslissing

### 1. Per versie gegenereerde bestanden per ticket, en de analyse ernaast

Naast de bronnen `web-types/` en `packages/` staan de gegevens per versie in twee mappen, met dezelfde
bestandsnaam per ticket:

```
catalog/flux/<versie>/
├── web-types/                  bron: de API van de componenten
├── packages/                   bron: de dependencies van de gepubliceerde packages (7)
├── changelog/                  deterministisch (scripts)
│   ├── changelog.md            bron: de sectie van de release
│   ├── commits.json            bron: de feiten uit de commits (3)
│   ├── release.json            overzicht: versie, tellingen, componenten, alle entries, de tickets met hun bestand
│   ├── web-types-diff.json     de diff van de web-types (6)
│   ├── dependencies-diff.json  de diff van de dependencies (7)
│   └── tickets/<ticket>-<componenten>.json
└── changelog-analysis/          LLM (5)
    ├── release.json            de samenvatting van de versie
    └── tickets/<ticket>-<componenten>.json
```

- **Een bestand per ticket.** Het heet naar de issue-key, gevolgd door de componenten en thema's uit de scope van
  zijn entries, bv. `FLUX-810-vl-side-sheet-vl-cascader.json`. Meer dan vier namen worden afgekapt met `-enz`.
  Een entry zonder ticket krijgt haar id in de plaats van de issue-key, bv. `a6116b6.json` of
  `0debeef-vl-footer-vl-footer-next.json`. Een ticket met meerdere entries, zoals FLUX-800, heeft één bestand.
- **`release.json` voor de hele versie.** Tegenover `tickets/`, dat per ticket gaat, en in beide mappen met
  dezelfde naam. Het heette eerst `changelog.json`, maar naast `changelog.md` leek dat de changelog in JSON.
- **Deterministisch en LLM gescheiden, in twee mappen.** De inhoud van een versie wijzigt na de release niet meer,
  maar het formaat wel, zolang de tooling en de MCP-server in ontwikkeling zijn. Alles in `changelog/` bouwt
  `changelog:build` opnieuw uit bronnen die in git staan (`changelog.md`, `commits.json`, de web-types en de
  packages), voor alle versies met één commando. De analyse is het enige deel dat niet opnieuw te maken is: ze is
  niet reproduceerbaar, en elke run vraagt tijd en een review. In een eigen map blijft ze buiten elke rebuild. Zo
  heeft elk bestand één herkomst en staat elke tekst maar één keer in git. Wie wil nagaan wat waarvandaan komt, legt
  de twee bestanden van een ticket naast elkaar.
- **`changelog-analysis/` naast `changelog/`.** De naam zegt waarvan het de analyse is, en de twee mappen staan
  naast elkaar. Een latere analyse van iets anders, bv. van de web-types, krijgt een eigen map. De map heette
  eerst `analysis/`.
- **Samenvoegen gebeurt in de server.** `readRelease` doet dat bij het laden: de analyse bepaalt de impact, de
  uitleg, de actie, het voorbeeld en eventueel het label `a11y`.

`changelog:build` schrijft de bestanden in `changelog/` en ruimt gegenereerde bestanden op die niet meer gebouwd
worden: ticketbestanden, `release.json` en de diffs.
Het script is deterministisch: vaste sortering en geen tijdstempel, dus opnieuw bouwen geeft dezelfde bestanden.
De bestanden komen in git, zoals de rest van de catalogus. Het script controleert ook of de analyse bij de
tickets past.

```bash
pnpm run flux:changelog:build 2.20.0          # één versie
pnpm run flux:changelog:build --all           # alle versies in de catalogus
pnpm run flux:changelog:build --check         # exit 1 als een gebouwd bestand niet meer klopt
pnpm run flux:changelog:build --check 2.20.0  # enkel die versie controleren
```

`--all` is nodig als de web-types of de packages van een vorige versie later binnenkomen. `--check` is bedoeld
voor CI: het meldt ook ontbrekende en overbodige bestanden.

Na een release is de volgorde:

1. `web-types:copy`
2. `packages:copy`
3. `changelog:copy`
4. `changelog:cleanup`
5. `changelog:commits`
6. `changelog:build --all`: alle versies, zodat ook de volgende versie haar diffs tegen deze versie krijgt;
   `changelog:analyse` weigert te starten zonder gebouwde `release.json`
7. `changelog:analyse`: de analyse en de review, door Claude Code (zie 5)
8. `changelog:build --all` en `--check`

`catalog:update` doet dat in één keer. Na de analyse van deze versie analyseert het ook de volgende, als die er is:
haar bestaande analyse wordt aangevuld met de nieuwe diffs. Met `--skip-analysis` slaat het de analyse over.

### 2. Wat een entry bevat

In een ticketbestand in `changelog/tickets/` staan per entry de velden hieronder, zonder die uit de analyse.
Wat de server toont, heeft alle velden.

| Veld                              | Herkomst                                                                            |
|-----------------------------------|-------------------------------------------------------------------------------------|
| `id`                              | korte sha van de commit; zonder commit `<type>-<n>`, stabiel omdat een gereleasede changelog niet meer wijzigt |
| `type`, `section`                 | sectie: `breaking`, `feature`, `fix`, `docs`, `perf`, `revert`, anders `other`; de ruwe titel blijft bewaard |
| `issues`                          | de key vooraan (`FLUX-…`, `UIG-…`); een projectsleutel zonder nummer (`FLUX - …`) valt weg |
| `scope`                           | eerste deel na de key, als er daarna nog een samenvatting volgt                     |
| `components` / `topics`           | de scope gesplitst op `,` en `/`: `vl-*` wordt een component, de rest een thema     |
| `mentions`                        | `vl-*`-namen in de samenvatting die niet in de scope staan                          |
| `summary`, `text`                 | de samenvatting, en de volledige tekst zonder links                                  |
| `commits`, `closes`               | de links aan het einde van de regel                                                 |
| `derivedImpact`                   | afgeleid; zie 4                                                                     |
| `labels`, `wcag`                  | `a11y` en de WCAG-criteria; zie 4                                                   |
| `source`                          | de feiten uit de commits; zie 3                                                     |
| `impact`, `impactSource`          | enkel in wat de server toont: uit de analyse, anders de afgeleide; zie 4            |
| `explanation`, `action`, `example`| enkel in wat de server toont: uit de analyse; zie 5                                 |
| `ticket`, `file`                  | enkel in wat de server toont: het ticket en zijn bestand                            |

Het overzicht `changelog/release.json` bevat per versie:

- `version`, `date`, `previous` (uit de compare-url) en `compareUrl`;
- tellingen per type en per afgeleide impact, en het aantal `a11y`-entries;
- de componenten die de changelog noemt. Een component die in de web-types staat, krijgt zijn soort en
  Storybook-link van die versie. Een naam die er niet in staat, zoals `vl-header-next`, blijft vermeld, maar
  zonder link.
- alle entries in de volgorde van de changelog: id, ticket, type, afgeleide impact, tekst en bestand;
- de tickets met hun bestand, componenten en entries;
- `webTypesDiff` (`web-types-diff.json`) of `webTypesDiffUnavailable`, zie 6;
- `dependenciesDiff` (`dependencies-diff.json`) of `dependenciesDiffUnavailable`, zie 7;
- `unlistedCommits`: de commits die de packages raken zonder in de changelog te staan, zie 3. `null` als
  `commits.json` ontbreekt.

Wat de server toont, telt per impact na de analyse, bevat de `summary` uit de analyse, en toont enkel de
componenten van entries met impact.

### 3. De feiten uit de commits

`changelog:commits` haalt de commits van een release op uit de bronrepo. Van GitHub clonet het zonder blobs en enkel
de geschiedenis sinds de vorige tag. Voor elke commit achter een entry schrijft het naar
`catalog/flux/<versie>/changelog/commits.json`:

- `body`: de uitleg uit de commit message, zonder onderwerp en trailers;
- `areas`: per soort het aantal gewijzigde bestanden. `code` en `styles` zijn bestanden uit de gepubliceerde
  packages (`libs/{common,components,map,styles}/src`, zonder testen en stories). De andere soorten zijn `docs`,
  `storybook`, `examples` (waaronder `libs/integrations`, referentiecode), `tests` en `tooling`.
- `published`: of er `code` of `styles` wijzigde, dus of de wijziging de packages van een afnemer raakt;
- `publishedFiles`: welke;
- `storybook`: de pagina's die wijzigden. De link komt uit `index.json` van de Storybook van die release, en
  `added` bevat de documentatie die erbij kwam. Langer dan 100 regels geeft enkel de titels.

Daarnaast zoekt het de commits tussen de vorige en deze tag, zonder merges, die niet in de changelog staan. Raakt
zo'n commit bestanden uit de packages, dan komt ze in `unlisted`, met `sha`, `url`, `subject`, `body` en
`publishedFiles`. De
web-types tellen daarbij niet mee: de release-commit genereert ze, en de diff van de web-types toont wat erin
veranderde. `changelog:build` neemt `unlisted` over in `release.json` als `unlistedCommits`, en de analyse
vermeldt wat een afnemer ervan moet weten in de samenvatting.

`commits.json` heeft een eigen `schema`; `changelog:build` weigert een oud bestand en zegt dat
`changelog:commits` opnieuw moet draaien.

Dit zijn feiten, geen interpretatie. Het script is deterministisch voor een gereleasede versie.

### 4. Impact en labels

Elke entry krijgt één `impact`, van meest naar minst dringend:

| Impact      | Betekenis voor een afnemer                                       |
|-------------|------------------------------------------------------------------|
| `action`    | hij moet iets aanpassen of nakijken                              |
| `opt-in`    | een nieuwe mogelijkheid die hij zelf moet gebruiken              |
| `automatic` | hij krijgt ze mee door te upgraden, zonder iets te doen          |
| `none`      | hij mag het weten, maar het raakt zijn project niet              |

De analyse bepaalt de impact (`impactSource: "analysis"`). Zonder analyse wordt ze afgeleid
(`impactSource: "derived"`):

- een breaking change is `action`;
- met de feiten uit de commits: raakt de wijziging de packages niet, dan `none`, anders `opt-in` voor een feature
  en `automatic` voor een fix;
- zonder die feiten: `none` voor documentatie en voor signaalwoorden in de tekst (testen, flaky, cypress,
  pipeline, lint, of een thema zoals storybook of een build), anders zoals hierboven.

Daarnaast:

- **`a11y`** komt uit signaalwoorden in de changelog-tekst en de uitleg in de commit: aria, WCAG,
  screenreader/schermlezer, toegankelijk…, focus…, toetsenbord…, keyboard, skip-link/skip-to-content en
  contrast en a11y. `axe` zit er bewust niet bij, want `cypress-axe` is testtooling. De analyse kan het label
  overschrijven.
- **`wcag`** bevat de succescriteria uit een tekst die WCAG noemt, bv. `(WCAG 2.4.1)` → `["2.4.1"]`.

Zo zijn we hier gekomen:

1. We begonnen met een label `internal`, afgeleid uit signaalwoorden en standaard verborgen.
2. Dat werd `no-impact`: een afnemer mag weten dat Flux van npm naar pnpm migreerde, het raakt zijn project
   enkel niet.
3. Signaalwoorden bleken het verkeerde fundament: "migratie van npm naar pnpm" bevat er geen, en "flaky testen
   en ready-event" bevat er één terwijl de entry actie vraagt. De feiten uit de commits beslissen nu, en de
   analyse verfijnt dat.

### 5. De analyse, per release geschreven en gecontroleerd door Claude Code

Per ticket beschrijft `catalog/flux/<versie>/changelog-analysis/tickets/<naam>.json` wat elke entry van dat ticket voor
een afnemer betekent: `impact`, `explanation`, `action` (bij `action`) en eventueel een `example`. De naam is die
van het ticketbestand in `changelog/tickets/`. `changelog-analysis/release.json` bevat de `summary` van de versie.

`changelog:analyse` laat Claude Code de analyse schrijven en controleren, in twee headless runs (`claude -p`),
zonder tussenkomst van een mens. De eerste run schrijft de analyse met `prompts/changelog-analyse.md`:

- Hij vertrekt van de feiten uit de commits en de Storybook-documentatie.
- Hij leest de diff zelf waar die uitleg tekortschiet: zonder body, bij een vermoedelijke gedragswijziging, of
  voor elke naam die hij noemt.
- Hij controleert elke naam van een attribuut, event, methode of class in de web-types of de code van die
  versie. Staat een attribuut wel in de code maar niet in de web-types, dan zegt hij dat.
- Alles wat hij schrijft, moet uit de commit, de diff, de documentatie of de web-types komen.
- Staat er al een analyse, dan vult hij die aan in plaats van opnieuw te beginnen. Dat gebeurt wanneer de vorige
  versie in de catalogus bijkomt en deze versie daardoor voor het eerst een diff heeft.

De tweede run is de review, met `prompts/changelog-review.md`. Ze vertrekt van de feiten en niet van de analyse,
controleert per entry de impact, de feiten, elke naam, de actie en het voorbeeld, en voor de versie of de
`summary` de contractwijzigingen zonder entry, de dependencies en de commits buiten de changelog vermeldt. Wat niet
klopt, verbetert ze zelf. Ze meldt haar resultaat in een vast JSON-formaat (`--json-schema`): `ok`, `fixed` of
`unresolved`, met per verbetering wat en waarom. Bij `unresolved` faalt het script.

Claude leest de code van die versie met Read, Grep en Glob in een clone die op de tag uitgecheckt is (`--add-dir`).
`git grep` laat Claude Code via Bash in geen enkele vorm van de regel toe. Verder mag Claude enkel schrijven in
`changelog-analysis/` van die versie, `changelog:build` draaien en de clone lezen met `git show`, `ls-tree` en `log`
(`--allowedTools` met `--permission-mode manual` en `--permission-prompts none`, en een absoluut pad in de regels
voor Edit en Write: een relatief pad leest Claude Code tegenover de huidige map van de shell, die een `cd` in Bash
verandert). Al de rest wordt geweigerd, behalve de vaste leescommando's van Claude Code, zoals `ls`.
`--permission-mode manual` staat er expliciet: zonder neemt `claude -p` de `defaultMode` uit de instellingen over,
en in `auto` keurt een classifier ook commando's goed die niet in `--allowedTools` staan, zoals `node -e`. De
analyses van 2.0.0 tot en met 2.20.0 in de catalogus liepen nog zonder die vlag: ze lazen zo ook met `node -e`,
`python3`, `grep` en `sed`, maar schreven niets buiten hun map. Het model en de effort zijn instelbaar; standaard
`opus` en `xhigh`. Waarom `xhigh` en niet `high`, staat in ADR-002 (sectie 5).

De runs lopen op het abonnement waarmee Claude Code aangemeld is (bv. Max), niet op een API-sleutel: het script
haalt `ANTHROPIC_API_KEY` en `ANTHROPIC_AUTH_TOKEN` uit de omgeving van `claude`, en stopt als een run toch een
sleutel gebruikt (`apiKeySource` in de eerste gebeurtenis van de run). Het verbruik telt mee in de limieten van
het abonnement, zonder kosten per token. Een budget per run in dollar aan API-tarief is optioneel.

`changelog:build` controleert de analyse en weigert:

- een bestand dat bij geen ticket hoort;
- een entry die niet bij haar ticket hoort;
- een onbekende sleutel;
- een ongeldige impact;
- een `action` die ontbreekt of niet bij de impact past;
- een lege `explanation` of `summary`, een `example` dat geen tekst is, of een `a11y` die geen true of false is.

Na de review bouwt `changelog:analyse` de versie opnieuw en controleert het dat elke entry een analyse heeft en de
versie een `summary`. De analyse staat buiten `changelog/`, want `changelog:copy` vervangt die map.

Handmatige kennis die nergens in de commits staat, zoals migratie-notities of kanttekeningen van het team, hoort
niet in deze repo. Daarvoor komen er `.llm.md` bestanden in flux-web-components; dat is apart werk dat nog
volgt.

De analyse van 2.19.0 en 2.20.0 vond zes wijzigingen die actie vragen:

| Entry | Actie |
|---|---|
| externe `vl-link` (FLUX-213) | meldt zelf dat ze in een nieuw venster opent, dus een eigen melding wordt dubbel voorgelezen |
| `vl-description-data` (FLUX-219) | rendert enkel nog `vl-description-data-item`s en kloont de inhoud van hun slots: andere kinderen en listeners op die inhoud vallen weg |
| `vl-http-error-message` (FLUX-236) | de debug-info staat in een `<dl>` in plaats van een tabel, en de fouttekst verandert: testen op de oude opbouw falen |
| `vl-header-next`, `vl-footer-next` (FLUX-788) | het ready-event komt op het element in plaats van op window |
| `vl-header`, `vl-header-next` (FLUX-471) | zonder `skip-to-content-id` volgt een waarschuwing in de console |
| `vl-side-sheet` (FLUX-810) | houdt op mobiel de focus vast, dus een side-sheet op volle breedte heeft een eigen sluitknop nodig |

Geen van die zes staat als actie in de changelog. Een eerdere proef, zonder review en op een lagere effort, gaf
ook `toaster.showAlert()` (FLUX-207) als actie: `alertRole` zou nu een typefout geven. Dat klopt niet, want
`alertRole` kwam pas in 2.19.0 in het model, samen met `alert-role`. Ze miste wel FLUX-219 en FLUX-236.

### 6. Diff van de web-types

Elke versie krijgt een diff van haar web-types met die van `previous`, in twee delen. Enkel het eerste kan een
afnemer bij een upgrade raken:

- **het contract** (`added`, `removed`, `changed`): welke elementen erbij kwamen en welke verdwenen, en per
  gewijzigd element de attributen, slots, properties en events die erbij kwamen of verdwenen, of een ander type,
  een andere default of `deprecated` kregen. Wijzigde ook de beschrijving, dan staat de nieuwe tekst erbij.
- **de beschrijvingen** (`descriptions`): elementen en onderdelen waarvan enkel de tekst wijzigde.

Hoe de diff werkt:

- Een onderdeel wordt op naam gematcht. Een onderdeel zonder naam (bestaat, bv. bij `vl-wizard`) matcht op zijn
  beschrijving.
- `doc-url` wordt genegeerd, want die verschilt altijd door het versienummer.
- Elk gewijzigd element krijgt `inChangelog: true|false`. Zo wijst de server wijzigingen aan die de changelog
  niet vermeldt.

De diff staat in `changelog/web-types-diff.json`; `webTypesDiff` in `release.json` verwijst ernaar. Staan de
web-types van de vorige versie niet in de catalogus, dan is `webTypesDiff` `null` en staat de reden in
`webTypesDiffUnavailable`. Dat geldt voor 2.0.0, want 1.48.2 staat niet in de catalogus.

### 7. Diff van de dependencies

`packages:copy` haalt per versie de metadata van `@domg-wc/common`, `components`, `map` en `styles` uit de registry,
en bewaart in `catalog/flux/<versie>/packages/<naam>.json` enkel de naam, de versie en de `dependencies`,
`peerDependencies` en `optionalDependencies`. Tijdstempels en checksums laat het weg, zodat het bestand
deterministisch is. De registry kies je met `FLUX_REGISTRY`.

`changelog:build` vergelijkt ze met die van `previous` in `changelog/dependencies-diff.json`: welke packages erbij
kwamen of verdwenen, en per package de dependencies die erbij kwamen, verdwenen of een andere versie kregen. Een
dependency op een package van dezelfde release (`@domg-wc/common` 2.20.0 in `@domg-wc/components` 2.20.0) wijzigt
bij elke versie en telt niet. Een lege diff zegt dat er niets veranderde; zonder de packages van de vorige versie
is `dependenciesDiff` `null` en staat de reden in `dependenciesDiffUnavailable`.

### 8. Een query-module los van MCP

`server/src/catalog.mjs` bevat de vragen die de server zal beantwoorden, als gewone functies. De MCP-koppeling
roept ze later enkel op en kan zo getest worden zonder MCP.

| Functie                                    | Beantwoordt                                                                    |
|--------------------------------------------|--------------------------------------------------------------------------------|
| `listVersions()`                           | welke versies er zijn, met datum, samenvatting, tellingen, of de keten naar de vorige versie compleet is, en of er web-types en packages zijn |
| `getChangelog(versie, filters)`            | wat er in één versie veranderde, te filteren op type, impact, component en label |
| `getChangesBetween(van, tot, filters)`     | wat er verandert bij een upgrade: per impact, eerst wat actie vraagt, gegroepeerd per component, met de netto diff van de web-types en de dependencies, en de commits buiten de changelog |
| `getComponentHistory(component, bereik)`   | wat er per versie aan één component veranderde, met de Storybook-link van die versie |
| `findChanges(zoekterm)`                    | in welke versie een issue (`FLUX-800`) of een wijziging zit; zoekt ook in de uitleg uit de commit en de analyse |

Wat een entry met impact `none` doet, hangt af van de vraag:

- **Wat is er nieuw** (`getChangelog`) en **zoeken** (`findChanges`): de entry verschijnt, want een afnemer mag
  het weten.
- **Een upgrade** (`getChangesBetween`) en **de historiek van een component** (`getComponentHistory`): de entry
  valt standaard weg, want daar telt enkel wat het project raakt.

Elk resultaat zegt in `hiddenNoImpact` hoeveel entries er wegvielen, en met `includeNoImpact` toon je ze toch.

Voor de beschrijvingen in de diff van de web-types geldt hetzelfde: `getChangesBetween` en `getComponentHistory`
laten ze standaard weg (`hiddenDescriptions`, `includeDescriptions`), `getChangelog` toont ze.

Een component mag zonder `vl-` gevraagd worden, en een thema als `form-control` werkt ook.

Een fout in de vraag, zoals een onbekende versie of een onbekend type, geeft een `CatalogError`. De tekst ervan kan
een agent zo tonen: bij een onbekende versie noemt ze de beschikbare versies.

Voorlopige mapping naar MCP, uit te werken bij de bouw van de server:

- resources `flux://changelog/{versie}` (markdown en JSON);
- tools `flux_changelog`, `flux_upgrade`, `flux_component_history` en `flux_find_change`;
- een prompt `flux-upgrade` in `prompts/`.

### 9. Ontbrekende versies melden

Welke versies de catalogus bevat, beslist ADR-002: alle releases op de hoofdlijn van `develop-v2`, vanaf 2.0.0.
Wat er niet in staat, v1 en de patches op een zijtak, vullen we niet aan.
`getChangesBetween` volgt de `previous`-keten van `tot` terug tot `van`.

Breekt die keten, dan zegt het resultaat `complete: false`, welke versie ontbreekt
(`missing: { version: "1.48.2", previousOf: "2.0.0" }`) en een `warning` in gewone taal. Een onvolledig antwoord
mag nooit als volledig overkomen.

`getComponentHistory` en `findChanges` geven een `coverage` mee: de oudste en de nieuwste versie in de catalogus en
de gaten in de keten. De netto diffs van de web-types en de dependencies in `getChangesBetween` kloppen ook bij
een onderbroken keten, zolang de web-types en de packages van beide kanten er zijn.

### 10. Techniek

- Node 22 en ESM `.mjs`, zoals `resources/figma/descriptions/write.mjs`, zonder dependencies.
- Tests draaien met `node --test` (`pnpm test`). Ze gebruiken inline fragmenten voor de randgevallen van de parser
  en de commits, en de echte catalogus voor de diff en de queries.
- Bestanden:
  - `server/src/changelog.mjs`: parsen, impact en labels afleiden, de analyse controleren, opbouwen;
  - `server/src/commits.mjs`: de feiten uit een commit, zonder git of netwerk;
  - `server/src/web-types.mjs` en `packages.mjs`: laden en diffen;
  - `server/src/storybook-url.mjs`: de url van de Storybook van een release, voor de links in de feiten;
  - `server/src/catalog.mjs`: de queries;
  - `resources/flux/`: de scripts, per onderwerp een map. `web-types/copy.sh`, `changelog/copy.sh` en
    `changelog/cleanup.sh` halen bronnen op en kuisen ze op, met `common.sh`; `packages/copy.mjs`,
    `changelog/commits.mjs`, `changelog/build.mjs` en `changelog/analyse.mjs` zijn de CLI's per stap;
    `catalog/update.sh` en `catalog/backfill.mjs` (ADR-002) draaien ze na elkaar; `source-repo.mjs` kloont de
    bronrepo en bepaalt de releases;
  - `resources/common.sh` en `resources/common.mjs`: wat de scripts delen, de bronrepo (`FLUX_REPO`) en de controle
    van de versie;
  - `prompts/changelog-analyse.md` en `prompts/changelog-review.md`: de prompts voor de analyse en de review;
  - `server/test/` en `test/`: de tests van de server en die van de scripts.

## Alternatieven overwogen

- **De server parst `changelog.md` bij het opstarten, zonder gegenereerde JSON.** Er is dan één bron en er kan
  niets verouderen. Maar wie reviewt, ziet de impact en de koppelingen pas als de server draait, en een fout duikt
  pas op in productie. `--check` vangt het verouderen van de JSON op.
- **Enkel vaste regels, zonder analyse.** Dat is voorspelbaar, maar de regels zien niet wat er in een commit
  staat. Een actie die in de body van een "flaky testen"-commit verstopt zit, missen ze. De feiten uit de commits
  zijn wel deterministisch, en die gebruiken we ook zonder analyse.
- **Een LLM die bij elke vraag de commits leest, in de server.** Dat is niet reproduceerbaar, niet te controleren,
  traag en duur. De analyse gebeurt nu één keer per release, op basis van de feiten, en komt in git.
- **Een mens reviewt de analyse, via een PR.** Zo was het eerst beslist. Maar dan is een release niet volledig met
  scripts op te bouwen, en wacht de catalogus op iemand. Een tweede, onafhankelijke run met de feiten en de regels
  erbij, plus de controles van `changelog:build`, vangt de fouten op; wat ze verbetert, staat in de uitvoer en in
  git.
- **De analyse interactief laten schrijven door een agent.** Dat werkt, maar is geen script: wie het doet, moet
  weten welke prompt, welke versies en in welke volgorde.
- **Een LLM-API rechtstreeks aanroepen vanuit een Node-script.** Dan moeten we zelf het lezen van bestanden, de
  git-commando's en de rechten bouwen, of een SDK als dependency toevoegen. Claude Code brengt die tools en een
  rechtenmodel mee, en de scripts blijven zonder dependencies.
- **De Claude Agent SDK (TypeScript) in plaats van de CLI.** De SDK start zelf de CLI van Claude Code, met dezelfde
  aanmelding, tools en rechten; ook het abonnement werkt zo. Ze zou wel een npm-dependency toevoegen, terwijl
  `claude -p` met `--allowedTools`, `--json-schema` en `stream-json` hetzelfde geeft.
- **Handmatige annotaties in deze repo.** Dat hebben we eerst zo gebouwd, maar kennis die niet uit de commits
  af te leiden is, hoort bij de bron: de `.llm.md` bestanden in flux-web-components.
- **Eén `changelog.json` per versie met alles samengevoegd.** Zo was het eerst gebouwd, maar het bestand werd
  groot en moeilijk te evalueren, en de LLM-tekst stond er naast de analyse een tweede keer in. Nu is er een
  bestand per ticket, en scheiden twee mappen wat deterministisch is van wat een LLM schreef.
- **Eén bestand per ticket met een blok voor de feiten en een blok voor de analyse.** Dat toont alles in één
  oogopslag, en als de build het analyseblok laat staan, staat elke tekst maar één keer in git. Maar de build moet
  dan samenvoegen in een bestand dat deels door een LLM geschreven is, `--check` kan geen hele bestanden meer
  vergelijken, en elke wijziging aan het formaat vraagt een migratie die de LLM-tekst bewaart, of een nieuwe
  analyse met een nieuwe review. De LLM schrijft dan ook in een bestand vol feiten.
- **Feiten en analyse in dezelfde map, met een achtervoegsel** (`FLUX-809-vl-alert.analysis.json`). De twee
  bestanden van een ticket staan dan naast elkaar, maar de map is niet meer volledig gegenereerd. Het opruimen,
  `--check`, de prompt en de regel "niets met de hand wijzigen" krijgen elk een uitzondering op de bestandsnaam.
- **Oudere versies aanvullen uit de volledige `CHANGELOG.md`.** Dat maakt upgrade-vragen over een groter bereik
  mogelijk, maar zonder de web-types van die versies, dus zonder Storybook-links en zonder diff van de web-types.
  ADR-002 vult de oudere versies van v2 wel aan, maar met de bronnen per tag.
- **Enkel de changelog, zonder web-types.** Dat is eenvoudiger, maar dan vervallen de Storybook-links en de diff
  van de web-types. Juist die diff toont wat de changelog niet vermeldt (zie Context).
- **De beschrijvingen uit de diff van de web-types weglaten.** Dan blijft enkel het contract over. Maar een nieuwe
  beschrijving kan op gewijzigd gedrag wijzen, en wie wil weten wat er in een versie nieuw is, mag ze zien. Ze
  staan dus apart, en de upgrade-queries verbergen ze standaard.
- **Commits buiten de changelog als volwaardige entries opnemen.** Dan krijgen ze een impact en een analyse zoals
  de rest. Maar de changelog blijft de eenheid waarop tickets, bestandsnamen en de analyse steunen, en zulke
  commits zijn zeldzaam: in 2.19.0 en 2.20.0 raakt er geen enkele de packages. Ze staan als feiten in
  `release.json`, en de analyse vermeldt ze in de samenvatting.
- **De dependencies uit de package.json van de bronrepo.** Die bestaat niet voor de packages: de build zet de
  dependencies pas bij het publiceren. De root package.json vermeldt alle dependencies van de monorepo, niet
  wat elk package meebrengt. De registry toont wat een afnemer echt installeert.

## Gevolgen

- Na elke release draait `catalog:update`. `changelog:commits` heeft de bronrepo en de Storybook van de release
  nodig, `packages:copy` de registry, en `changelog:analyse` Claude Code.
- De analyse schrijft en controleert Claude Code, zonder mens. Dat ze klopt, steunt op vier dingen: de feiten
  staan ernaast in `source`, de prompt eist dat elke naam gecontroleerd is, een tweede run controleert en
  verbetert, en de build weigert een analyse die niet bij de changelog past.
- De repo hangt voor de analyse af van Claude Code: de CLI moet geïnstalleerd en aangemeld zijn met een
  abonnement. Elke run telt mee in de limieten van dat abonnement en is niet deterministisch. De scripts zelf
  blijven zonder dependencies.
- Na een wijziging aan de web-types of de packages van een vorige versie moet `--all` opnieuw draaien. `--check`
  in CI voorkomt dat dat vergeten wordt, en controleert ook de analyse; die verandert de gebouwde bestanden niet.
- De MCP-server hoeft voor de changelog enkel nog de functies uit `catalog.mjs` aan tools en resources te hangen.
- Zodra de `.llm.md` bestanden in flux-web-components er zijn, horen ze in de analyse mee te wegen. De prompt
  moet dan aangevuld worden.
- Wijzigt het formaat van de changelog of de web-types upstream, dan faalt de build of vallen entries onder
  `other`. De tests met randgevallen uit de historiek maken dat zichtbaar.
- `schema` in de gebouwde bestanden laat toe het formaat later te wijzigen zonder dat de server oude bestanden
  verkeerd leest. Het ging naar 2 bij de opsplitsing per ticket, naar 3 toen `api.json` hernoemd werd tot
  `web-types-diff.json`, en naar 4 met de beschrijvingen apart, de diff van de dependencies en de commits buiten
  de changelog. `commits.json` heeft een eigen schema, sinds `unlisted` op 2.
- Wat de server toont, staat niet meer als één bestand in git. De server voegt de twee mappen samen, en de tests
  controleren dat samenvoegen.
- Zolang het formaat evolueert, is een rebuild van alle versies één commando, en de analyse blijft onaangeroerd.
  Wordt het formaat stabiel, dan kan één bestand per ticket met feiten en analyse samen opnieuw overwogen worden.

## Gerelateerde ADR's

- ADR-002: De historische catalogus van v2 opbouwen.
