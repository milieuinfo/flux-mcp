# CLAUDE.md

Richtlijnen voor AI-agents die in deze repo werken. De details staan in de technische documentatie onder
`docs/technisch/` en in de ADR's onder `docs/beslissingen/`; lees die eerst wanneer je aan een onderdeel begint.

## Taal

Alle communicatie is in het Nederlands. Dat geldt voor:

- je antwoorden en vragen aan de gebruiker;
- commit messages en PR-beschrijvingen;
- documentatie: de README, de technische documentatie, de ADR's en de prompts;
- commentaar in de code, en foutmeldingen en uitvoer van scripts;
- teksten die in de catalogus terechtkomen, zoals de analyse van de changelog.

Namen in de code (functies, variabelen, JSON-sleutels) blijven Engels, zoals nu.

## Wat deze repo is

`flux-mcp` bouwt een MCP-server die informatie over **Flux Web Components** (de bronrepo
`https://github.com/milieuinfo/flux-web-components`) aanbiedt aan LLM-agents. Daarnaast verrijkt de repo de
FLUX Figma-library met Code Connect snippets, component descriptions en documentation links. De twee sporen
staan los van elkaar; de server kent Figma niet.

De MCP-koppeling zelf bestaat nog niet; wat de server moet aanbieden, staat als voorstel in ADR-004. Wat er is:

- de catalogus: per Flux-release wat er voor een afnemer verandert als hij van de vorige versie upgradet, en de
  documentatie uit Storybook van die release;
- de scripts die hem vullen;
- `server/src/catalog.mjs` (de changelog) en `server/src/docs.mjs` (de documentatie), met de queries die de
  server later aan tools en resources hangt.

## Structuur

| Map                                         | Inhoud                                                                    |
|---------------------------------------------|---------------------------------------------------------------------------|
| `server/src/`                               | queries en de logica om de catalogus op te bouwen (`changelog.mjs`, `commits.mjs`, `web-types.mjs`, `packages.mjs`, `catalog.mjs`; voor Storybook `mdx.mjs`, `storybook.mjs`, `docs.mjs`; de url van Storybook in `storybook-url.mjs`) |
| `server/test/`                              | de tests van de server, met `node --test`                                 |
| `test/`                                     | de tests van de scripts en hun modules; `runs/` draait elk script tegen een nagemaakte flux-web-components (`helpers/`) |
| `catalog/flux/<versie>/web-types/`          | de web-types van een release (script)                                     |
| `catalog/flux/<versie>/packages/`           | de dependencies van de gepubliceerde packages, uit de registry (script)   |
| `catalog/flux/<versie>/changelog/`          | deterministisch, door scripts gemaakt: `changelog.md`, `commits.json`, `release.json`, `web-types-diff.json`, `dependencies-diff.json`, `tickets/` |
| `catalog/flux/<versie>/changelog-analysis/` | wat een LLM schreef: `release.json` (samenvatting) en `tickets/` (per entry impact, uitleg, actie, voorbeeld) |
| `catalog/flux/<versie>/storybook/`          | deterministisch, door een script gemaakt: `index.json` en per Storybook-pagina `pages/<id>.md` |
| `catalog/flux/storybook-analysis/`          | wat een LLM schreef, één keer per inhoud van een pagina: `<pagina>/<inputHash>.json` (voorbeelden, samenvatting, zoektermen, opmerkingen) |
| `catalog/figma/`                            | Code Connect templates (`code-connect/v2/`) en de kennis per component (`descriptions/v2/`) |
| `docs/technisch/`                           | de technische documentatie, per thema; de README verwijst ernaar      |
| `docs/beslissingen/`                        | ADR's; `ADR-000-template.md` is het sjabloon                              |
| `prompts/`                                  | prompts voor agents: `changelog-analyse.md`, `changelog-review.md`, `storybook-analyse.md`, `storybook-review.md`, `figma-descriptions.md` |
| `resources/`                                | scripts: `pnpm run <spoor>:<onderwerp>:<actie>` staat in `resources/<spoor>/<onderwerp>/<actie>.sh` of `.mjs`, wat de scripts van een spoor delen in `resources/<spoor>/`, wat beide sporen delen in `resources/common.sh` en `common.mjs`; bash voor het kopiëren uit de bronrepo, Node voor de rest |

## Commando's

Alles loopt via `pnpm run` (pnpm 11, Node 22; `devEngines` weigert npm). Installeer met `pnpm install`.

```bash
pnpm test                                   # alle tests (node --test), ook de runs van de scripts

# Na een Flux-release, voor versie X.Y.Z; catalog:update doet alles, ook de analyse en de review door Claude Code:
pnpm run flux:catalog:update X.Y.Z
pnpm run flux:catalog:backfill <van> <tot>  # een reeks releases, hervatbaar (ADR-002)
pnpm run flux:catalog:check X.Y.Z           # netwerk: klopt de catalogus van X.Y.Z nog met de bron?
#   of stap voor stap:
pnpm run flux:web-types:copy X.Y.Z
pnpm run flux:packages:copy X.Y.Z           # netwerk: de registry van Flux
pnpm run flux:changelog:copy X.Y.Z
pnpm run flux:changelog:cleanup X.Y.Z
pnpm run flux:changelog:commits X.Y.Z       # netwerk: bronrepo en Storybook
pnpm run flux:changelog:build --all         # vóór de analyse: die vraagt een gebouwde release.json
pnpm run flux:changelog:analyse X.Y.Z       # Claude Code: analyse en review
pnpm run flux:changelog:build --check       # controleert alle gebouwde bestanden en de analyse
pnpm run flux:storybook:copy X.Y.Z          # netwerk: bronrepo en index.json van Storybook (ADR-003)
pnpm run flux:storybook:analyse X.Y.Z       # Claude Code, Opus 5.5 op xhigh: enkel nieuwe inhoud
pnpm run flux:storybook:check               # controleert de pagina's en de analyses, offline

# Figma: zie "Na een release" in docs/technisch/figma.md.
```

Een lokale clone van de bronrepo gebruik je met `FLUX_REPO=~/pad/naar/flux-web-components` vóór het commando.

## Conventies

- **Geen dependencies** in de scripts en de server: Node 22, ESM `.mjs`, en enkel `node:`-modules. Eén
  uitzondering: de Code Connect CLI (`@figma/code-connect`), een devDependency die de figma-scripts aanroepen om
  te publiceren; de versie staat gepind. Bash-scripts delen hun instellingen via de `common.sh` van hun spoor
  (`resources/figma/common.sh`, `resources/flux/common.sh`). Wat beide sporen delen, de bronrepo (`FLUX_REPO`) en
  de controle van de versie, staat één keer: in `resources/common.sh` voor bash, in `resources/common.mjs` voor
  Node.
- **Deterministisch.** Een gebouwd bestand heeft geen tijdstempel en een vaste volgorde, en opnieuw bouwen geeft
  hetzelfde bestand. Gebouwde bestanden komen in git; `--check` bewaakt dat ze kloppen. Eén bewuste uitzondering:
  `syncedAt` in `catalog/figma/code-connect/<library>/manifest.json`, het tijdstip waarop de templates gekopieerd
  werden.
- **Gegenereerd niet met de hand wijzigen.** De bestanden in `catalog/flux/<versie>/changelog/` en `storybook/`
  maakt een script; een wijziging daar verdwijnt bij de volgende build. De analyse wijzig je in
  `changelog-analysis/` en `catalog/flux/storybook-analysis/`, de descriptions voor Figma in
  `catalog/figma/descriptions/v2/`, nooit in Figma zelf.
- **Scheiding tussen deterministisch en LLM.** Feiten uit de changelog, de commits en de web-types staan in
  `changelog/`. Interpretatie door een LLM staat in `changelog-analysis/`, met dezelfde bestandsnaam per ticket.
  Voor Storybook staat de tekst per versie in `storybook/`, en de analyse één keer per inhoud in
  `storybook-analysis/`: een pagina die niet wijzigde, gebruikt dezelfde analyse. Elke tekst staat maar één keer
  in git.
- **Wat een LLM schrijft, moet kloppen.** Het komt uit de commit, de diff, de Storybook-documentatie of de
  web-types, nooit uit een vermoeden. Elke naam van een attribuut, event of methode controleer je in de web-types
  of de code van die versie. Een mens leest de analyse niet na: een tweede run van Claude Code
  (`prompts/changelog-review.md`, `prompts/storybook-review.md`) controleert en verbetert ze. De steekproef na een
  reeks versies (ADR-002, ADR-003) toetst enkel de werkwijze. Het LLM-werk rond Storybook gebruikt altijd Opus 5.5
  (`claude-opus-5-5`) met effort `xhigh`.
- **Code-stijl:**
  - 4 spaties, enkele quotes en regels van maximaal 120 tekens;
  - commentaar in het Nederlands, dat uitlegt waarom, bovenaan elk bestand met het gebruik;
  - foutmeldingen die zeggen wat je moet doen, bv. welk script eerst moet draaien.
- **Tests** gebruiken inline fragmenten voor randgevallen en een kopie van de echte catalogus voor de rest.
  Wijzig je gedrag, pas dan de tests mee aan. De runs van de scripts staan in `test/runs/`: elk script draait daar
  tegen een nagemaakte flux-web-components, in een kopie van de repo. Een nieuw script krijgt er een test bij.
- **Documentatie mee bijwerken.** Wijzigt een script of een formaat, werk dan de pagina over dat thema in
  `docs/technisch/` bij; de README in de root blijft beknopt. Wijzigt een beslissing, werk dan de ADR bij of schrijf
  een nieuwe volgens `ADR-000-template.md`.

## Git

- Commit en push enkel wanneer de gebruiker erom vraagt.
- Commit message: `<type>: FLUX-<nr> - <onderwerp> - <wat>`, bv.
  `feat: FLUX-812 - changelog - per ticket, deterministisch en LLM in aparte mappen`. Types zijn `feat`, `fix` en
  `chore`. Daaronder een body in het Nederlands die uitlegt wat er verandert en waarom.
- Werk op een featurebranch (`feature/FLUX-<nr>-…`); `main` is de hoofdbranch.

## Goed om te weten

- **Gepubliceerde packages.** Dat zijn `@domg-wc/common`, `components`, `map` en `styles`
  (`libs/{common,components,map,styles}/src` in de bronrepo). `libs/integrations` is referentiecode, geen
  package.
- **Storybook.** Een release staat op
  `https://flux.omgeving.vlaanderen.be/release-v<major>/<versie>/storybook/`. `index.json` daar koppelt bestanden
  aan pagina's. De tekst halen we uit de MDX in de bronrepo, niet van de site: daar staat ze enkel als
  gecompileerde JavaScript. 2.0.0 tot en met 2.4.0 gebruiken Storybook 7, vanaf 2.5.0 is het Storybook 9.
- **De omzetting van MDX** kent elk blok bij naam (`server/src/storybook.mjs`). Een onbekend blok laat
  `storybook:copy` falen; voeg dan een regel toe, met een test.
- **Doc-urls in de web-types kunnen verkeerd zijn.** In 2.20.0 wijzen er 12 naar een pagina die niet bestaat, bv.
  `vl-text` naar `components-atom-text-text`. `storybook:copy` meldt ze en koppelt het element aan de pagina van
  zijn stories-bestand.
- **Dependencies van de packages** staan niet in de bronrepo: de build van Flux zet ze pas bij het publiceren
  in de package.json. `packages:copy` haalt ze uit de registry.
- **Web-types kunnen onvolledig zijn.** Het `ellipsis` attribuut van `vl-breadcrumb` (2.20.0) staat bv. in de
  code maar niet in de web-types.
- **macOS is hoofdletterongevoelig.** `CHANGELOG.md` en `changelog.md` wijzen daar naar hetzelfde bestand; de
  scripts houden daar rekening mee.
- **De catalogus bevat de releases op de hoofdlijn van `develop-v2`**, de commits `chore(release): 2.x.y`, vanaf
  2.0.0. Patches op een zijtak (2.4.1, 2.15.1, 2.17.1–2.17.3) en v1 staan er niet in; zie ADR-002. De queries
  melden een onderbroken keten van versies.
- **De keuzes rond de changelog** (impact, analyse, opsplitsing per ticket) staan in
  `docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md`, die rond de documentatie uit Storybook in
  `docs/beslissingen/ADR-003-storybook-per-versie.md`. Wat de MCP-server ermee aanbiedt, staat als voorstel in
  `docs/beslissingen/ADR-004-functionaliteit-mcp-server.md`.
