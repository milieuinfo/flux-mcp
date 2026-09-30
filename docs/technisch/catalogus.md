# De catalogus

`catalog/flux/` bevat per Flux-release wat de MCP-server aanbiedt: wat er voor een afnemer verandert tegenover de vorige
versie ([changelog](changelog.md)), en de documentatie uit Storybook van die versie ([Storybook](storybook.md)). De
catalogus bevat de releases op de hoofdlijn van `develop-v2`, vanaf 2.0.0
([ADR-002](../beslissingen/ADR-002-historische-catalogus-v2.md)).

```
catalog/flux/
├── 2.20.0/
│   ├── web-types/            bron: de API van de componenten
│   ├── packages/             bron: de dependencies van de gepubliceerde packages
│   ├── changelog/            deterministisch: de changelog, de commits en wat changelog:build maakt
│   ├── changelog-analysis/   LLM: per entry de impact, een uitleg, de actie en een voorbeeld
│   └── storybook/            deterministisch: de pagina's uit Storybook
└── storybook-analysis/       LLM: één analyse per inhoud van een pagina, over de versies heen
```

De versies staan naast elkaar, elk in een eigen map; de versie is dus verplicht. Elk script vult zijn eigen map: een
nieuwe kopie van dezelfde versie vervangt enkel die map, de rest van de versiemap blijft staan.

## Na een release: `catalog:update`

```bash
pnpm run flux:catalog:update 2.20.0
pnpm run flux:catalog:update --skip-analysis 2.20.0   # zonder Claude Code
```

Het doet alles in één keer, zonder tussenkomst:

1. de bronnen van die versie (`web-types:copy`, `packages:copy`, `changelog:copy`, `changelog:cleanup`,
   `changelog:commits`) en `storybook:copy`;
2. `changelog:build --all`, want ook de volgende versie in de catalogus krijgt haar diffs tegen deze versie;
3. `changelog:analyse` voor die versie, en voor de volgende versie als die er is: haar analyse wordt aangevuld met wat
   de nieuwe diffs tonen;
4. `storybook:analyse` voor die versie: enkel de pagina's waarvan de inhoud nog geen analyse heeft;
5. `changelog:build --all` en `--check`, en `storybook:check`.

Faalt een stap, dan stopt het en zegt het met welk script je verder gaat. Stap voor stap:

```bash
pnpm run flux:web-types:copy 2.20.0      # tag v2.20.0 naar catalog/flux/2.20.0/web-types/
pnpm run flux:packages:copy 2.20.0       # registry naar catalog/flux/2.20.0/packages/
pnpm run flux:changelog:copy 2.20.0      # tag v2.20.0 naar catalog/flux/2.20.0/changelog/
pnpm run flux:changelog:cleanup 2.20.0   # enkel de wijzigingen van 2.20.0 in changelog.md
pnpm run flux:changelog:commits 2.20.0   # de feiten uit de commits in commits.json
pnpm run flux:changelog:build --all      # overzicht, tickets en de diffs tegen de vorige versie
pnpm run flux:changelog:analyse 2.20.0   # de analyse en de review, door Claude Code
pnpm run flux:storybook:copy 2.20.0      # de pagina's uit Storybook
pnpm run flux:storybook:analyse 2.20.0   # de analyse van pagina's met nieuwe inhoud, door Claude Code
```

## Een reeks versies: `catalog:backfill`

```bash
pnpm run flux:catalog:backfill --skip-analysis 2.0.0 2.18.0   # enkel fase 1
pnpm run flux:catalog:backfill 2.0.0 2.18.0                   # fase 1 en 2, hervatbaar
pnpm run flux:catalog:backfill --max 7 2.0.0 2.18.0           # fase 2 voor hoogstens 7 versies
```

De releases zijn de commits `chore(release): X.Y.Z` op de hoofdlijn van `develop-v<major>` in de bronrepo; patches op
een zijtak, zoals 2.17.1, horen er niet bij. Het werkt van oud naar nieuw, zodat de vorige versie er telkens al staat,
in twee fasen:

1. **De bronnen** van elke release die ze nog niet heeft, en daarna `changelog:build --all`. Zonder LLM, snel en
   deterministisch.
2. **De analyse** van elke release zonder volledige analyse, door Claude Code. Daarna vult het de versie aan die in de
   catalogus op `<tot>` volgt, want die kreeg nieuwe diffs. Tot slot `changelog:build --all` en `--check`.

Wat klaar is, slaat het over. Stopt een run, bv. op een limiet van het abonnement, dan herneem je ze met hetzelfde
commando.

De documentatie uit Storybook zit nog niet in `catalog:backfill`. Voor een reeks versies draai je `storybook:copy --all`
en daarna `storybook:analyse` per versie, van oud naar nieuw.

## Controleren

- **`changelog:build --check`**, offline: de gebouwde bestanden van de changelog, en de analyse.
- **`storybook:check`**, offline: de pagina's en de analyses van Storybook, in alle versies.
- **`storybook:copy --check [versie]`** bouwt de pagina's opnieuw uit de bronrepo en `index.json` van Storybook, en
  vergelijkt; het schrijft niets.
- **`catalog:check <versie>`** controleert de hele versie tegen de echte bron.

`catalog:check` haalt de bronnen van die versie opnieuw op en bouwt ze, in een kopie van de repo, en vergelijkt
`web-types/`, `packages/`, `changelog/` en `storybook/` met wat in git staat. De analyses vergelijkt het niet: die
schrijft een LLM. Omdat het de bronrepo, de registry en Storybook nodig heeft, hoort het niet bij `pnpm test`. Met een
lokale clone duurt het een tiental seconden:

```bash
FLUX_REPO=~/repos/flux-web-components pnpm run flux:catalog:check 2.20.0
```
