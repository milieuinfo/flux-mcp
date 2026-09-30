# De catalogus

`catalog/flux/` bevat per Flux-release wat de MCP-server aanbiedt. Per release beantwoordt de catalogus één vraag: wat
verandert er voor een afnemer die van de vorige versie naar deze upgradet? Een versie wordt één keer opgebouwd, na de
release: `catalog/flux/2.20.0/` vergelijkt 2.20.0 met 2.19.0.

```
catalog/flux/
└── 2.20.0/
    └── web-types/            bron: de API van de componenten
```

De versies staan naast elkaar, elk in een eigen map; de versie is dus verplicht. Elk script vult zijn eigen map: een
nieuwe kopie van dezelfde versie vervangt enkel die map, de rest van de versiemap blijft staan.

## De web-types

De eerste bron zijn de web-types van die release: de API van elke component, om te zien wat er aan het contract
veranderde.

```bash
pnpm run flux:web-types:copy 2.20.0    # tag v2.20.0 naar catalog/flux/2.20.0/web-types/
```

`web-types/` is plat: de `*.web-types.json` bestanden van de tag, zonder de mappen van de bronrepo. Waar de bronrepo
`DOMG-WC-VERSION` heeft, onder meer in de doc-urls naar Storybook, vult het script de versie in.

`server/src/web-types.mjs` leest de web-types van een versie en vergelijkt ze met die van een andere, in twee delen:

- **het contract** (`added`, `removed`, `changed`): elementen, attributen, slots, properties en events die erbij kwamen
  of verdwenen, en een ander type, een andere default of `deprecated`. Dat kan een afnemer raken;
- **de beschrijvingen** (`descriptions`): elementen en onderdelen waarvan enkel de tekst wijzigde. Dat raakt geen
  project. In 2.20.0 zijn dat er 12, tegenover één wijziging aan het contract: `banner` op `vl-alert`.
