# ADR-001: De changelog per versie klaarzetten voor de MCP-server

## Status
Aanvaard

## Datum
2026-09-25

## Context

Ticket: FLUX-812.

De MCP-server van deze repo moet de changelog van Flux Web Components per versie aanbieden aan LLM-agents en
tooling. `changelog-copy` en `changelog-cleanup` zetten per versie `catalog/flux/<versie>/changelog/changelog.md`
klaar: de sectie van die release, platte markdown van conventional-changelog.

Met die markdown alleen kan een agent weinig:

- een entry is één regel; wat er echt veranderde, staat in de commit, en een afnemer gaat dat niet uitzoeken;
- er is geen type per entry dat een machine kan lezen, dus een breaking change is niet te onderscheiden van een
  docs-wijziging zonder de tekst te interpreteren;
- niets zegt wat een wijziging voor het project van een afnemer betekent: moet hij iets doen, kan hij iets
  nieuws gebruiken, of raakt het hem niet (testen, CI, de build en de documentatie van Flux zelf);
- er is geen koppeling naar de componenten en hun documentatie in die versie;
- niets zegt welke wijzigingen over toegankelijkheid gaan, terwijl afnemers aan WCAG moeten voldoen;
- de vraag "wat verandert er als ik van X naar Y ga" is niet te beantwoorden zonder elke versie apart te lezen;
- wijzigingen aan de API van een component die de changelog niet vermeldt, blijven onzichtbaar.

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
  changelog-entry noemt die bij naam.

## Beslissing

### 1. Per versie een gegenereerde `changelog.json`, gecommit in de catalogus

`changelog-build` voegt per versie alles samen in `catalog/flux/<versie>/changelog/changelog.json`:

- de changelog;
- de feiten uit de commits (3);
- de analyse (5);
- de API-diff (6).

Het script is deterministisch: vaste sortering en geen tijdstempel, dus opnieuw bouwen geeft hetzelfde bestand.
Het bestand komt in git, zoals de rest van de catalogus. Wie een PR reviewt, ziet zo exact wat de server zal
tonen.

```bash
pnpm run flux:web-components:changelog-build 2.20.0          # één versie
pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
pnpm run flux:web-components:changelog-build --check         # exit 1 als een changelog.json niet meer klopt
pnpm run flux:web-components:changelog-build --check 2.20.0  # enkel die versie controleren
```

`--all` is nodig als de analyse wijzigt of als de web-types van een vorige versie later binnenkomen. `--check`
is bedoeld voor CI.

Na een release is de volgorde:

1. `web-types-copy`
2. `changelog-copy`
3. `changelog-cleanup`
4. `changelog-commits`
5. de analyse, door een AI-agent met `prompts/changelog-analyse.md`
6. `changelog-build`

### 2. Wat een entry bevat

| Veld                              | Herkomst                                                                            |
|-----------------------------------|-------------------------------------------------------------------------------------|
| `id`                              | korte sha van de commit; zonder commit `<type>-<n>`, stabiel omdat een gereleasede changelog niet meer wijzigt |
| `type`, `section`                 | sectie: `breaking`, `feature`, `fix`, `docs`, `perf`, `revert`, anders `other`; de ruwe titel blijft bewaard |
| `issues`                          | de key vooraan (`FLUX-…`, `UIG-…`)                                                  |
| `scope`                           | eerste deel na de key, als er daarna nog een samenvatting volgt                     |
| `components` / `topics`           | de scope gesplitst op `,` en `/`: `vl-*` wordt een component, de rest een thema     |
| `mentions`                        | `vl-*`-namen in de samenvatting die niet in de scope staan                          |
| `summary`, `text`                 | de samenvatting, en de volledige tekst zonder links                                  |
| `commits`, `closes`               | de links aan het einde van de regel                                                 |
| `impact`, `impactSource`          | uit de analyse, anders afgeleid; zie 4                                               |
| `explanation`, `action`, `example`| uit de analyse; zie 5                                                               |
| `labels`, `wcag`                  | `a11y` en de WCAG-criteria; zie 4                                                   |
| `source`                          | de feiten uit de commits; zie 3                                                     |

Per versie komen er bovenop:

- `version`, `date`, `previous` (uit de compare-url), `compareUrl` en de `summary` uit de analyse;
- tellingen per type en per impact, en het aantal `a11y`-entries;
- de betrokken componenten, zonder de entries met impact `none`. Een component die in de web-types staat,
  krijgt zijn soort en Storybook-link van die versie. Een naam die er niet in staat, zoals `vl-header-next`,
  blijft vermeld, maar zonder link.
- de API-diff, zie 6.

### 3. De feiten uit de commits

`changelog-commits` haalt de commits van een release op uit de bronrepo. Het clonet zonder blobs en enkel de
geschiedenis sinds de vorige tag. Voor elke entry schrijft het naar `catalog/flux/<versie>/changelog/commits.json`:

- `body`: de uitleg uit de commit message, zonder onderwerp en trailers;
- `areas`: per soort het aantal gewijzigde bestanden. `code` en `styles` zijn bestanden uit de gepubliceerde
  packages (`libs/{common,components,map,styles}/src`, zonder testen en stories). De andere soorten zijn `docs`,
  `storybook`, `examples` (waaronder `libs/integrations`, referentiecode), `tests` en `tooling`.
- `published`: of er `code` of `styles` wijzigde, dus of de wijziging de packages van een afnemer raakt;
- `publishedFiles`: welke;
- `storybook`: de pagina's die wijzigden. De link komt uit `index.json` van de Storybook van die release, en
  `added` bevat de documentatie die erbij kwam. Langer dan 100 regels geeft enkel de titels.

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
  contrast. `axe` zit er bewust niet bij, want `cypress-axe` is testtooling. De analyse kan het label
  overschrijven.
- **`wcag`** bevat de succescriteria uit een tekst die WCAG noemt, bv. `(WCAG 2.4.1)` → `["2.4.1"]`.

Zo zijn we hier gekomen:

1. We begonnen met een label `internal`, afgeleid uit signaalwoorden en standaard verborgen.
2. Dat werd `no-impact`: een afnemer mag weten dat Flux van npm naar pnpm migreerde, het raakt zijn project
   enkel niet.
3. Signaalwoorden bleken het verkeerde fundament: "migratie van npm naar pnpm" bevat er geen, en "flaky testen
   en ready-event" bevat er één terwijl de entry actie vraagt. De feiten uit de commits beslissen nu, en de
   analyse verfijnt dat.

### 5. De analyse, per release geschreven door een AI-agent

Per versie beschrijft `catalog/flux/<versie>/analysis/changelog.json` wat elke entry voor een afnemer betekent:
`impact`, `explanation`, `action` (bij `action`) en eventueel een `example`. Per versie staat er ook een `summary`.
Een AI-agent schrijft de analyse één keer per release, met de prompt `prompts/changelog-analyse.md`:

- Hij vertrekt van de feiten uit de commits en de Storybook-documentatie.
- Hij leest de diff zelf waar die uitleg tekortschiet: zonder body, bij een vermoedelijke gedragswijziging, of
  voor elke naam die hij noemt.
- Hij controleert elke naam van een attribuut, event, methode of class in de web-types of de code van die
  versie. Staat een attribuut wel in de code maar niet in de web-types, dan zegt hij dat.
- Alles wat hij schrijft, moet uit de commit, de diff, de documentatie of de web-types komen.

`changelog-build` controleert de analyse en weigert:

- een onbekende entry;
- een onbekende sleutel;
- een ongeldige impact;
- een `action` die ontbreekt of niet bij de impact past.

De uitvoer toont welke entries nog niet geanalyseerd zijn. De analyse staat buiten `changelog/`, want
`changelog-copy` vervangt die map, en komt via een PR in git.

Handmatige kennis die nergens in de commits staat, zoals migratie-notities of kanttekeningen van het team, hoort
niet in deze repo. Daarvoor komen er `.llm.md` bestanden in flux-web-components; dat is apart werk dat nog
volgt.

De analyse van 2.19.0 en 2.20.0 vond vijf wijzigingen die actie vragen:

| Entry | Actie |
|---|---|
| `toaster.showAlert()` (FLUX-207) | verwacht `alert-role` in plaats van `alertRole` |
| externe `vl-link` (FLUX-213) | meldt zelf dat ze in een nieuw venster opent, dus een eigen melding wordt dubbel voorgelezen |
| `vl-header-next`, `vl-footer-next` (FLUX-788) | het ready-event komt op het element in plaats van op window |
| `vl-header`, `vl-header-next` (FLUX-471) | zonder `skip-to-content-id` volgt een waarschuwing in de console |
| `vl-side-sheet` (FLUX-810) | houdt op mobiel de focus vast, dus een side-sheet op volle breedte heeft een eigen sluitknop nodig |

Geen van die vijf staat als actie in de changelog.

### 6. API-diff uit de web-types

Elke versie krijgt een diff van haar web-types met die van `previous`:

- welke elementen erbij kwamen en welke verdwenen;
- per gewijzigd element de attributen, slots, properties en events die erbij kwamen, verdwenen of wijzigden;
- wijzigingen in `deprecated` en in de beschrijving.

Hoe de diff werkt:

- Een onderdeel wordt op naam gematcht. Een onderdeel zonder naam (bestaat, bv. bij `vl-wizard`) matcht op zijn
  beschrijving.
- `doc-url` wordt genegeerd, want die verschilt altijd door het versienummer.
- Elk gewijzigd element krijgt `inChangelog: true|false`. Zo wijst de server wijzigingen aan die de changelog
  niet vermeldt.

Staan de web-types van de vorige versie niet in de catalogus, dan is `api` `null` en staat de reden in
`apiUnavailable`. Dat geldt nu voor 2.19.0.

### 7. Een query-module los van MCP

`server/src/catalog.mjs` bevat de vragen die de server zal beantwoorden, als gewone functies. De MCP-koppeling
roept ze later enkel op en kan zo getest worden zonder MCP.

| Functie                                    | Beantwoordt                                                                    |
|--------------------------------------------|--------------------------------------------------------------------------------|
| `listVersions()`                           | welke versies er zijn, met datum, samenvatting, tellingen en of de keten naar de vorige versie compleet is |
| `getChangelog(versie, filters)`            | wat er in één versie veranderde, te filteren op type, impact, component en label |
| `getChangesBetween(van, tot, filters)`     | wat er verandert bij een upgrade: per impact, eerst wat actie vraagt, gegroepeerd per component, met de netto API-diff |
| `getComponentHistory(component, bereik)`   | wat er per versie aan één component veranderde, met de Storybook-link van die versie |
| `findChanges(zoekterm)`                    | in welke versie een issue (`FLUX-800`) of een wijziging zit; zoekt ook in de uitleg uit de commit en de analyse |

Wat een entry met impact `none` doet, hangt af van de vraag:

- **Wat is er nieuw** (`getChangelog`) en **zoeken** (`findChanges`): de entry verschijnt, want een afnemer mag
  het weten.
- **Een upgrade** (`getChangesBetween`) en **de historiek van een component** (`getComponentHistory`): de entry
  valt standaard weg, want daar telt enkel wat het project raakt.

Elk resultaat zegt in `hiddenNoImpact` hoeveel entries er wegvielen, en met `includeNoImpact` toon je ze toch.

Een component mag zonder `vl-` gevraagd worden, en een thema als `form-control` werkt ook.

Een fout in de vraag, zoals een onbekende versie of een onbekend type, geeft een `CatalogError`. De tekst ervan kan
een agent zo tonen: bij een onbekende versie noemt ze de beschikbare versies.

Voorlopige mapping naar MCP, uit te werken bij de bouw van de server:

- resources `flux://changelog/{versie}` (markdown en JSON);
- tools `flux_changelog`, `flux_upgrade`, `flux_component_history` en `flux_find_change`;
- een prompt `flux-upgrade` in `prompts/`.

### 8. Ontbrekende versies melden, niet aanvullen

Voorlopig staan enkel 2.19.0 en 2.20.0 in de catalogus. We vullen geen oudere versies aan (geen backfill).
`getChangesBetween` volgt de `previous`-keten van `tot` terug tot `van`.

Breekt die keten, dan zegt het resultaat `complete: false`, welke versie ontbreekt
(`missing: { version: "2.18.0", previousOf: "2.19.0" }`) en een `warning` in gewone taal. Een onvolledig antwoord
mag nooit als volledig overkomen.

`getComponentHistory` en `findChanges` geven een `coverage` mee: de oudste en de nieuwste versie in de catalogus en
de gaten in de keten. De netto API-diff van `getChangesBetween` klopt ook bij een onderbroken keten, zolang de
web-types van beide kanten er zijn.

### 9. Techniek

- Node 22 en ESM `.mjs`, zoals `resources/figma/descriptions/write.mjs`, zonder dependencies.
- Tests draaien met `node --test` (`pnpm test`). Ze gebruiken inline fragmenten voor de randgevallen van de parser
  en de commits, en de echte catalogus voor de diff en de queries.
- Bestanden:
  - `server/src/changelog.mjs`: parsen, impact en labels afleiden, de analyse controleren, opbouwen;
  - `server/src/commits.mjs`: de feiten uit een commit, zonder git of netwerk;
  - `server/src/web-types.mjs`: laden en diffen;
  - `server/src/catalog.mjs`: de queries;
  - `resources/flux/web-components/changelog-commits.mjs` en `changelog-build.mjs`: de CLI's;
  - `prompts/changelog-analyse.md`: de prompt voor de analyse;
  - `server/test/`: de tests.

## Alternatieven overwogen

- **De server parst `changelog.md` bij het opstarten, zonder gegenereerde JSON.** Er is dan één bron en er kan
  niets verouderen. Maar wie reviewt, ziet de impact en de koppelingen pas als de server draait, en een fout duikt
  pas op in productie. `--check` vangt het verouderen van de JSON op.
- **Enkel vaste regels, zonder analyse.** Dat is voorspelbaar, maar de regels zien niet wat er in een commit
  staat. Een actie die in de body van een "flaky testen"-commit verstopt zit, missen ze. De feiten uit de commits
  zijn wel deterministisch, en die gebruiken we ook zonder analyse.
- **Een LLM die bij elke vraag de commits leest, in de server.** Dat is niet reproduceerbaar, niet te reviewen,
  traag en duur. De analyse gebeurt nu één keer per release, op basis van de feiten, en komt via een PR in git.
- **Handmatige annotaties in deze repo.** Dat hebben we eerst zo gebouwd, maar kennis die niet uit de commits
  af te leiden is, hoort bij de bron: de `.llm.md` bestanden in flux-web-components.
- **Oudere versies aanvullen uit de volledige `CHANGELOG.md`.** Dat maakt upgrade-vragen over een groter bereik
  mogelijk, maar zonder de web-types van die versies, dus zonder Storybook-links en API-diff. We houden het uit
  de scope tot er vraag naar is. De scripts en de module werken al voor elke versie die later in de catalogus
  komt.
- **Enkel de changelog, zonder web-types.** Dat is eenvoudiger, maar dan vervallen de Storybook-links en de
  API-diff. Juist die diff toont wat de changelog niet vermeldt (zie Context).

## Gevolgen

- Na elke release komen er twee scripts en een analyse bij. `changelog-commits` heeft de bronrepo en de
  Storybook van de release nodig.
- De analyse schrijft een AI-agent, en een mens reviewt ze. Dat die klopt, steunt op drie dingen: de feiten staan
  ernaast in `source`, de prompt eist dat elke naam gecontroleerd is, en de build weigert een analyse die niet bij
  de changelog past.
- Na een wijziging aan de analyse of aan de web-types van een vorige versie moet `--all` opnieuw draaien.
  `--check` in CI voorkomt dat dat vergeten wordt.
- De MCP-server hoeft voor de changelog enkel nog de functies uit `catalog.mjs` aan tools en resources te hangen.
- Zodra de `.llm.md` bestanden in flux-web-components er zijn, horen ze in de analyse mee te wegen. De prompt
  moet dan aangevuld worden.
- Wijzigt het formaat van de changelog of de web-types upstream, dan faalt de build of vallen entries onder
  `other`. De tests met randgevallen uit de historiek maken dat zichtbaar.
- `schema: 1` in elk bestand laat toe het formaat later te wijzigen zonder dat de server oude bestanden verkeerd
  leest.

## Gerelateerde ADR's

Geen.
