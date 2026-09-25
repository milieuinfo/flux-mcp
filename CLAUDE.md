# CLAUDE.md

Richtlijnen voor AI-agents die in deze repo werken. De details staan in `README.md` en in de ADR's onder
`docs/beslissingen/`; lees die eerst wanneer je aan een onderdeel begint.

## Taal

Alle communicatie is in het Nederlands. Dat geldt voor:

- je antwoorden en vragen aan de gebruiker;
- commit messages en PR-beschrijvingen;
- documentatie: README, ADR's en prompts;
- commentaar in de code, en foutmeldingen en uitvoer van scripts;
- teksten die in de catalogus terechtkomen, zoals de analyse van de changelog.

Namen in de code (functies, variabelen, JSON-sleutels) blijven Engels, zoals nu.

## Wat deze repo is

`flux-mcp` bouwt een MCP-server die informatie over **Flux Web Components** (de bronrepo
`https://github.com/milieuinfo/flux-web-components`) aanbiedt aan LLM-agents. Daarnaast verrijkt de repo de
FLUX Figma-library met Code Connect snippets, component descriptions en documentation links. De twee sporen
staan los van elkaar; de server kent Figma niet.

De MCP-koppeling zelf bestaat nog niet. Wat er is:

- de catalogus;
- de scripts die hem vullen;
- `server/src/catalog.mjs`, met de queries die de server later aan tools en resources hangt.

## Structuur

| Map                                 | Inhoud                                                                    |
|-------------------------------------|---------------------------------------------------------------------------|
| `server/src/`                       | queries en de logica om de catalogus op te bouwen (`changelog.mjs`, `commits.mjs`, `web-types.mjs`, `catalog.mjs`) |
| `server/test/`                      | tests met `node --test`                                                   |
| `catalog/flux/<versie>/web-types/`  | de web-types van een release (script)                                     |
| `catalog/flux/<versie>/changelog/`  | deterministisch, door scripts gemaakt: `changelog.md`, `commits.json`, `changelog.json`, `api.json`, `tickets/` |
| `catalog/flux/<versie>/analysis/`   | wat een LLM schreef: `changelog.json` (samenvatting) en `tickets/` (per entry impact, uitleg, actie, voorbeeld) |
| `catalog/figma/`                    | Code Connect templates (`code-connect/v2/`) en de kennis per component (`descriptions/v2/`) |
| `docs/beslissingen/`                | ADR's; `ADR-000-template.md` is het sjabloon                              |
| `prompts/`                          | prompts voor agents: `changelog-analyse.md`, `figma-descriptions.md`      |
| `resources/`                        | scripts: bash voor het kopiëren uit de bronrepo, Node voor de rest        |

## Commando's

Alles loopt via `pnpm run` (pnpm 11, Node 22; `devEngines` weigert npm). Installeer met `pnpm install`.

```bash
pnpm test                                               # alle tests (node --test)

# Na een Flux-release, voor versie X.Y.Z:
pnpm run flux:web-components:web-types-copy X.Y.Z
pnpm run flux:web-components:changelog-copy X.Y.Z
pnpm run flux:web-components:changelog-cleanup X.Y.Z
pnpm run flux:web-components:changelog-commits X.Y.Z   # netwerk: bronrepo en Storybook
#   → dan de analyse met prompts/changelog-analyse.md
pnpm run flux:web-components:changelog-build X.Y.Z
pnpm run flux:web-components:changelog-build --check   # controleert alle gebouwde bestanden

# Figma: zie "TL;DR: Figma na een release" in de README.
```

Een lokale clone van de bronrepo gebruik je met `FLUX_REPO=~/pad/naar/flux-web-components` vóór het commando.

## Conventies

- **Geen dependencies** in de scripts en de server: Node 22, ESM `.mjs`, en enkel `node:`-modules. Bash-scripts
  delen hun instellingen via een `common.sh` in dezelfde map.
- **Deterministisch.** Een gebouwd bestand heeft geen tijdstempel en een vaste volgorde, en opnieuw bouwen geeft
  hetzelfde bestand. Gebouwde bestanden komen in git; `--check` bewaakt dat ze kloppen.
- **Gegenereerd niet met de hand wijzigen.** De bestanden in `catalog/flux/<versie>/changelog/` maakt een script;
  een wijziging daar verdwijnt bij de volgende build. De analyse wijzig je in `analysis/`, de descriptions voor
  Figma in `catalog/figma/descriptions/v2/`, nooit in Figma zelf.
- **Scheiding tussen deterministisch en LLM.** Feiten uit de changelog, de commits en de web-types staan in
  `changelog/`. Interpretatie door een LLM staat in `analysis/`, met dezelfde bestandsnaam per ticket. Elke tekst
  staat maar één keer in git.
- **Wat een LLM schrijft, moet kloppen.** Het komt uit de commit, de diff, de Storybook-documentatie of de
  web-types, nooit uit een vermoeden. Elke naam van een attribuut, event of methode controleer je in de web-types
  of de code van die versie.
- **Code-stijl:**
  - 4 spaties, enkele quotes en regels van maximaal 120 tekens;
  - commentaar in het Nederlands, dat uitlegt waarom, bovenaan elk bestand met het gebruik;
  - foutmeldingen die zeggen wat je moet doen, bv. welk script eerst moet draaien.
- **Tests** gebruiken inline fragmenten voor randgevallen en een kopie van de echte catalogus voor de rest.
  Wijzig je gedrag, pas dan de tests mee aan.
- **Documentatie mee bijwerken.** Wijzigt een script of een formaat, werk dan de README bij. Wijzigt een
  beslissing, werk dan de ADR bij of schrijf een nieuwe volgens `ADR-000-template.md`.

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
  aan pagina's.
- **Web-types kunnen onvolledig zijn.** Het `ellipsis` attribuut van `vl-breadcrumb` (2.20.0) staat bv. in de
  code maar niet in de web-types.
- **macOS is hoofdletterongevoelig.** `CHANGELOG.md` en `changelog.md` wijzen daar naar hetzelfde bestand; de
  scripts houden daar rekening mee.
- **De catalogus begint bij 2.19.0.** Oudere versies halen we niet op; de queries melden een onderbroken keten van
  versies.
- **De keuzes rond de changelog** (impact, analyse, opsplitsing per ticket) staan in
  `docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md`.
