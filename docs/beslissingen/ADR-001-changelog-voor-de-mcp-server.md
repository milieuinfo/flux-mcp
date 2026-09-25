# ADR-001: De changelog per versie klaarzetten voor de MCP-server

## Status
Aanvaard

## Datum
2026-09-25

## Context

Ticket: FLUX-812.

De MCP-server van deze repo moet de changelog van Flux Web Components per versie aanbieden aan LLM-agents
en tooling. `changelog-copy` en `changelog-cleanup` zetten per versie
`catalog/flux/<versie>/changelog/changelog.md` klaar: de sectie van die release, platte markdown van
conventional-changelog.

Met die markdown alleen kan een agent weinig:

- er is geen type per entry dat een machine kan lezen, dus een breaking change is niet te onderscheiden
  van een docs-wijziging zonder de tekst te interpreteren;
- er is geen koppeling naar de componenten en hun documentatie in die versie;
- niets zegt welke wijzigingen over toegankelijkheid gaan, terwijl afnemers aan WCAG moeten voldoen;
- wijzigingen zonder impact op het project van een afnemer, zoals flaky testen, CI, de build van Flux zelf of
  de documentatie, staan tussen wat zijn project wel raakt;
- de vraag "wat verandert er als ik van X naar Y ga" is niet te beantwoorden zonder elke versie apart te
  lezen;
- wijzigingen aan de API van een component die de changelog niet vermeldt, blijven onzichtbaar.

### Wat de bron ons geeft

We onderzochten de changelogs van 2.19.0 en 2.20.0 en de volledige historiek (`resources/changelog/CHANGELOG.md`
van tag v2.20.0, 955 entries):

- **Versiekop.** Er zijn drie formaten: `# [2.20.0](…/compare/v2.19.0...v2.20.0) (2026-09-18)`,
  `## [2.12.1](…)` voor een patch, en `# 1.0.0 (datum)` voor de oudste. De compare-url noemt de vorige
  versie expliciet.
- **Secties.** We vonden `Bug Fixes`, `Features`, `Documentation` en `BREAKING CHANGES`. Onder
  `BREAKING CHANGES` staan entries zonder commit-link, bv. `* start van v2`.
- **Entries.** Het patroon is `* <KEY> - <scope> - <samenvatting> ([sha7](commit-url))`, soms met
  `, closes [ref](url)` erachter. 92% volgt het patroon met key en scope. De rest heeft geen key, geen scope,
  een oude key (`UIG-…`) of meerdere ` - ` in de samenvatting.
- **Scopes.** Een scope noemt één of meer componenten (`vl-header, vl-header-next`,
  `vl-header-next / vl-footer-next`) of is een thema (`form-control`, `cross-validatie`, `storybook`,
  `skip-link`).
- **Web-types.** De web-types van dezelfde versie staan naast de changelog. Ze beschrijven per element de
  attributen, slots, properties, events en `deprecated`, met een Storybook-link naar die versie. Tussen 2.19.0
  en 2.20.0 krijgt `vl-alert` het attribuut `banner` (FLUX-809). Daarnaast wijzigt de beschrijving van
  `blur-validation` in 11 formuliercomponenten, en wijzigt de `label`-slot van `vl-cascader-item`. Geen
  changelog-entry noemt die bij naam.

## Beslissing

### 1. Per versie een gegenereerde `changelog.json`, gecommit in de catalogus

Het script `flux:web-components:changelog-build` zet `changelog.md` om naar
`catalog/flux/<versie>/changelog/changelog.json`. Dat script is deterministisch: vaste sortering en geen
tijdstempel, dus opnieuw bouwen geeft hetzelfde bestand.

Het bestand komt in git, zoals de rest van de catalogus. Wie een PR reviewt, ziet zo exact wat de server
zal tonen, ook de afgeleide labels, en kan ze corrigeren.

```bash
pnpm run flux:web-components:changelog-build 2.20.0          # één versie
pnpm run flux:web-components:changelog-build --all           # alle versies in de catalogus
pnpm run flux:web-components:changelog-build --check         # exit 1 als een changelog.json niet meer klopt
pnpm run flux:web-components:changelog-build --check 2.20.0  # enkel die versie controleren
```

`--all` is nodig als een annotatie wijzigt of als de web-types van een vorige versie later binnenkomen. `--check`
is bedoeld voor CI.

Na een release is de volgorde: `web-types-copy` → `changelog-copy` → `changelog-cleanup` → `changelog-build`.

### 2. Wat een entry bevat

De parser leest per entry:

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
| `labels`, `wcag`                  | afgeleid, zie 3                                                                     |
| `note`, `migration`               | handmatig, zie 4                                                                    |

Per versie komen er bovenop:

- `version`, `date`, `previous` (uit de compare-url) en `compareUrl`;
- tellingen per type en per label;
- de betrokken componenten. Een component die in de web-types staat, krijgt zijn soort en Storybook-link
  van die versie. Een naam die er niet in staat, zoals `vl-header-next`, blijft vermeld, maar zonder link.
- de API-diff, zie 5.

### 3. Afgeleide labels, met vaste regels

De regels staan als lijsten met commentaar bovenaan `server/src/changelog.mjs` en matchen op woordgrenzen.

- **`no-impact`**: een afnemer mag het weten, maar het raakt zijn project niet. Het label komt er in drie
  gevallen:
  - elke docs-entry, want documentatie wijzigt geen project, ook niet als ze nuttig is om te lezen;
  - een scope met een thema zoals storybook, cypress, een build, agents, onderhoud of een release-script;
  - een tekst over testen, flaky, cypress, pipeline of lint.

  Hoe de server die entries toont, hangt af van de vraag (zie 6).
- **`a11y`**: wijzigingen aan toegankelijkheid. Het label komt er bij aria, WCAG, screenreader/schermlezer,
  toegankelijk…, focus…, toetsenbord…, keyboard, skip-link/skip-to-content of contrast. `axe` zit er bewust
  niet bij: `cypress-axe` is testtooling.
- **`wcag`**: de succescriteria die in de tekst staan, bv. `(WCAG 2.4.1)` → `["2.4.1"]`.

We noemden `no-impact` eerst `internal`, met als gedrag "standaard verborgen". Maar een afnemer mag weten dat
Flux van npm naar pnpm migreerde; het raakt zijn project enkel niet. Daarom beschrijft het label nu het
criterium, impact op het project, en niet langer of iets verborgen blijft.

De regels zullen soms mislopen, vooral bij wijzigingen aan de eigen build of tooling zonder signaalwoord, zoals
"migratie van npm naar pnpm". Een extra woord zoals `pnpm` helpt niet: het recept "Van npm naar pnpm" voor
afnemers zou het dan ook krijgen.

Daarom toont het script na het bouwen, naast de gelabelde entries, een lijst **te beoordelen**: de entries die
volgens de regels impact hebben maar geen component noemen. Wie reviewt, legt het oordeel vast met een
annotatie; daarna verdwijnt de entry uit de lijst.

### 4. Handmatige annotaties, buiten de gekopieerde map

Het bestand `catalog/flux/<versie>/annotations/changelog.json` is optioneel en wordt met de hand gevuld:

```json
{
  "summary": "Korte samenvatting voor afnemers.",
  "migration": "Wat een afnemer bij deze upgrade moet doen.",
  "entries": {
    "6899016": { "labels": { "no-impact": true } },
    "f2a3414": { "note": "…", "migration": "…", "labels": { "a11y": true } }
  }
}
```

- Het staat buiten `changelog/`, want `changelog-copy` vervangt die map volledig.
- `labels` overschrijft de afgeleide labels: `true` zet een label aan, `false` zet het af.
- Een onbekende entry-id of een onbekende sleutel doet de build falen, zodat annotaties niet stil verrotten.

### 5. API-diff uit de web-types

Elke versie krijgt een diff van haar web-types met die van `previous`:

- welke elementen erbij kwamen en welke verdwenen;
- per gewijzigd element de attributen, slots, properties en events die erbij kwamen, verdwenen of wijzigden;
- wijzigingen in `deprecated` en in de beschrijving.

Hoe de diff werkt:

- Een onderdeel wordt op naam gematcht. Een onderdeel zonder naam (bestaat, bv. bij `vl-wizard`) matcht op
  zijn beschrijving.
- `doc-url` wordt genegeerd, want die verschilt altijd door het versienummer.
- Elk gewijzigd element krijgt `inChangelog: true|false`. Zo wijst de server wijzigingen aan die de changelog
  niet vermeldt.

Staan de web-types van de vorige versie niet in de catalogus, dan is `api` `null` en staat de reden in
`apiUnavailable`. Dat geldt nu voor 2.19.0.

### 6. Een query-module los van MCP

`server/src/catalog.mjs` bevat de vragen die de server zal beantwoorden, als gewone functies. De
MCP-koppeling roept ze later enkel op en kan zo getest worden zonder MCP.

| Functie                                    | Beantwoordt                                                                    |
|--------------------------------------------|--------------------------------------------------------------------------------|
| `listVersions()`                           | welke versies er zijn, met datum, tellingen en of de keten naar de vorige versie compleet is |
| `getChangelog(versie, filters)`            | wat er in één versie veranderde, te filteren op type, component en label       |
| `getChangesBetween(van, tot, filters)`     | wat er verandert bij een upgrade: eerst breaking, dan features, fixes en docs, gegroepeerd per component, met migratie-notities en de netto API-diff |
| `getComponentHistory(component, bereik)`   | wat er per versie aan één component veranderde, met de Storybook-link van die versie |
| `findChanges(zoekterm)`                    | in welke versie een issue (`FLUX-800`) of een wijziging zit                     |

Wat een entry met `no-impact` doet, hangt af van de vraag:

- **Wat is er nieuw** (`getChangelog`) en **zoeken** (`findChanges`): de entry verschijnt, met het label erbij,
  want een afnemer mag het weten.
- **Een upgrade** (`getChangesBetween`) en **de historiek van een component** (`getComponentHistory`): de entry
  valt standaard weg, want daar telt enkel wat het project raakt.

Elk resultaat zegt in `hiddenNoImpact` hoeveel entries er wegvielen, en met `includeNoImpact` toon je ze toch.

Een component mag zonder `vl-` gevraagd worden, en een thema als `form-control` werkt ook.

Een fout in de vraag, zoals een onbekende versie of een onbekend type, geeft een `CatalogError`. De tekst
ervan kan een agent zo tonen: bij een onbekende versie noemt ze de beschikbare versies.

Voorlopige mapping naar MCP, uit te werken bij de bouw van de server:

- resources `flux://changelog/{versie}` (markdown en JSON);
- tools `flux_changelog`, `flux_upgrade`, `flux_component_history` en `flux_find_change`;
- een prompt `flux-upgrade` in `prompts/`.

### 7. Ontbrekende versies melden, niet aanvullen

Voorlopig staan enkel 2.19.0 en 2.20.0 in de catalogus. We vullen geen oudere versies aan (geen backfill).
`getChangesBetween` volgt de `previous`-keten van `tot` terug tot `van`.

Breekt die keten, dan zegt het resultaat `complete: false`, welke versie ontbreekt
(`missing: { version: "2.18.0", previousOf: "2.19.0" }`) en een `warning` in gewone taal. Een onvolledig
antwoord mag nooit als volledig overkomen.

`getComponentHistory` en `findChanges` geven een `coverage` mee: de oudste en de nieuwste versie in de
catalogus en de gaten in de keten. De netto API-diff van `getChangesBetween` klopt ook bij een onderbroken
keten, zolang de web-types van beide kanten er zijn.

### 8. Techniek

- Node 22 en ESM `.mjs`, zoals `resources/figma/descriptions/write.mjs`, zonder dependencies.
- Tests draaien met `node --test` (`pnpm test`). Ze gebruiken inline fragmenten voor de randgevallen van de
  parser en de echte catalogus voor de diff en de queries.
- Bestanden:
  - `server/src/changelog.mjs`: parsen, labelen, annoteren, opbouwen;
  - `server/src/web-types.mjs`: laden en diffen;
  - `server/src/catalog.mjs`: de queries;
  - `resources/flux/web-components/changelog-build.mjs`: de CLI;
  - `server/test/`: de tests.

## Alternatieven overwogen

- **De server parst `changelog.md` bij het opstarten, zonder gegenereerde JSON.** Er is dan één bron en er
  kan niets verouderen. Maar wie reviewt, ziet de labels en koppelingen pas als de server draait, en een
  parse- of annotatiefout duikt pas op in productie. `--check` vangt het verouderen van de JSON op.
- **Labels en samenvattingen laten schrijven door een LLM.** Dat is niet deterministisch, niet te reviewen
  als code, en wijzigt bij elke run. Vaste regels plus annotaties blijven voorspelbaar.
- **Oudere versies aanvullen uit de volledige `CHANGELOG.md`.** Dat maakt upgrade-vragen over een groter
  bereik mogelijk, maar zonder de web-types van die versies, dus zonder Storybook-links en API-diff. We
  houden het uit de scope tot er vraag naar is. Het script en de module werken al voor elke versie die later
  in de catalogus komt.
- **Enkel de changelog, zonder web-types.** Dat is eenvoudiger, maar dan vervallen de Storybook-links en de
  API-diff. Juist die diff toont wat de changelog niet vermeldt (zie Context).
- **Annotaties naast `changelog.md` in `changelog/`.** Dat is verworpen: `changelog-copy` zou ze bij een
  nieuwe kopie wissen.

## Gevolgen

- Na elke release komt er één stap bij (`changelog-build`). Na een wijziging aan annotaties of aan de
  web-types van een vorige versie moet `--all` opnieuw draaien. `--check` in CI voorkomt dat dat vergeten
  wordt.
- De MCP-server hoeft voor de changelog enkel nog de functies uit `catalog.mjs` aan tools en resources te
  hangen.
- Hoe goed de labels zijn, hangt af van de regels. Die zullen soms mislopen, en een annotatie verhelpt dat.
  Na elke release beoordeelt iemand de lijst "te beoordelen" uit het script. Die is kort: in 2.20.0 twee
  entries, in 2.19.0 drie. De regels bijsturen kan; `--all` past het resultaat dan overal toe.
- Wijzigt het formaat van de changelog of de web-types upstream, dan faalt de build of vallen entries onder
  `other`. De tests met randgevallen uit de historiek maken dat zichtbaar.
- `schema: 1` in elk bestand laat toe het formaat later te wijzigen zonder dat de server oude bestanden
  verkeerd leest.

## Gerelateerde ADR's

Geen.
