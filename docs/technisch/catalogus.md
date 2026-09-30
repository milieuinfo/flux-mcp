# De catalogus

`catalog/flux/` bevat per Flux-release wat de MCP-server aanbiedt: wat er voor een afnemer verandert tegenover de vorige
versie ([changelog](changelog.md)).

```
catalog/flux/
└── 2.20.0/
    ├── web-types/            bron: de API van de componenten
    ├── packages/             bron: de dependencies van de gepubliceerde packages
    ├── changelog/            deterministisch: de changelog, de commits en wat changelog:build maakt
    └── changelog-analysis/   LLM: per entry de impact, een uitleg, de actie en een voorbeeld
```

De versies staan naast elkaar, elk in een eigen map; de versie is dus verplicht. Elk script vult zijn eigen map: een
nieuwe kopie van dezelfde versie vervangt enkel die map, de rest van de versiemap blijft staan.

## Na een release: `catalog:update`

```bash
pnpm run flux:catalog:update 2.20.0
pnpm run flux:catalog:update --skip-analysis 2.20.0   # zonder Claude Code
```

Het doet alles in één keer, zonder tussenkomst:

1. de bronnen van die versie: `web-types:copy`, `packages:copy`, `changelog:copy`, `changelog:cleanup` en
   `changelog:commits`;
2. `changelog:build --all`, want ook de volgende versie in de catalogus krijgt haar diffs tegen deze versie;
3. `changelog:analyse` voor die versie, en voor de volgende versie als die er is: haar analyse wordt aangevuld met wat
   de nieuwe diffs tonen;
4. `changelog:build --all` en `--check`.

Faalt een stap, dan stopt het en zegt het met welk script je verder gaat. Stap voor stap:

```bash
pnpm run flux:web-types:copy 2.20.0      # tag v2.20.0 naar catalog/flux/2.20.0/web-types/
pnpm run flux:packages:copy 2.20.0       # registry naar catalog/flux/2.20.0/packages/
pnpm run flux:changelog:copy 2.20.0      # tag v2.20.0 naar catalog/flux/2.20.0/changelog/
pnpm run flux:changelog:cleanup 2.20.0   # enkel de wijzigingen van 2.20.0 in changelog.md
pnpm run flux:changelog:commits 2.20.0   # de feiten uit de commits in commits.json
pnpm run flux:changelog:build --all      # overzicht, tickets en de diffs tegen de vorige versie
pnpm run flux:changelog:analyse 2.20.0   # de analyse en de review, door Claude Code
```

## Controleren

- **`changelog:build --check`**, offline: de gebouwde bestanden van de changelog, en de analyse.
