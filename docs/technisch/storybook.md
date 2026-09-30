# De documentatie uit Storybook

Een ontwikkelaar die met Flux een toepassing bouwt of verbetert, of van een ontwerp naar code gaat, vindt het meeste in
Storybook: waarvoor een component dient, de varianten met hun code, wat er voor toegankelijkheid moet gebeuren, de
patronen, de recepten en de richtlijnen. De catalogus bevat die documentatie per versie, zoals afnemers ze lezen op
`https://flux.omgeving.vlaanderen.be/release-v2/<versie>/storybook/`. De keuzes en het waarom staan in
[ADR-003](../beslissingen/ADR-003-storybook-per-versie.md).

```bash
pnpm run flux:storybook:copy 2.20.0              # bronrepo en index.json naar 2.20.0/storybook/
pnpm run flux:storybook:copy --all               # alle versies, na een wijziging aan de omzetting
pnpm run flux:storybook:copy --check             # bouwt opnieuw en vergelijkt; vraagt de bronrepo
pnpm run flux:storybook:analyse 2.20.0           # Claude Code: enkel pagina's met nieuwe inhoud
pnpm run flux:storybook:analyse --dry-run 2.20.0 # toont wat geanalyseerd zou worden
pnpm run flux:storybook:analyse --max 10 2.20.0  # hoogstens 10 pagina's in deze run
pnpm run flux:storybook:check                    # offline: pagina's en analyses van alle versies
```

`catalog:update` draait ze mee. `FLUX_REPO` werkt ook hier; de web-types van de versie moeten in de catalogus staan.

## Wat er staat

```
catalog/flux/
├── 2.20.0/storybook/            deterministisch (storybook:copy)
│   ├── index.json               de pagina's: id, titel, soort, bronnen, elementen, status, stories, inputHash
│   └── pages/
│       └── components-atom-button.md
└── storybook-analysis/          LLM (prompts/storybook-analyse.md), één keer per inhoud van een pagina
    └── components-atom-button/
        └── 5267f457e16f.json
```

## De pagina's

`storybook:copy` leest de MDX, de stories en de metadata uit de bronrepo op de tag. Van de site gebruikt het enkel
`index.json`: de id's, de titels en welk bestand bij welke pagina hoort. Elke pagina wordt Markdown, met een regel per
soort blok:

- `<Canvas>`, `<Primary>` en `<Stories>` worden per story een regel `> Story: [<naam>](/?path=/story/<id>)`;
- `<ArgTypes>` en `<Controls>` worden `> API: <element>`; de server zet er de API uit de web-types bij. Hoort er geen
  element bij de pagina, dan `> API: geen element in de web-types`, met een link naar Storybook;
- `<Source>` wordt een codeblok, ook als de code uit een raw-import, een constante of een helperfunctie komt;
- HTML-tabellen, nadruk, links en lijsten worden Markdown. De blokken van Flux zelf (`FluxAlert`, `FluxWcag*`,
  `ColorPalette`, …) hebben elk een eigen omzetting. De status van een component gaat naar `index.json`;
- een afbeelding wordt haar pad in de bronrepo; de server maakt er een link naar het bestand op de tag van.

Verder:

- Een blok of expressie die het script niet kent, laat het falen: er verdwijnt niets ongemerkt.
- Een pagina bevat geen versienummer: links naar Storybook, ook als `href` in HTML, en afbeeldingen blijven relatief.
  Zo is een ongewijzigde pagina in elke versie hetzelfde bestand.
- Het script meldt links naar pagina's die niet bestaan, en elementen waarvan de doc-url in de web-types naar een
  onbestaande pagina wijst (12 in 2.20.0). Die koppelt het aan de pagina van hun stories-bestand.

## De analyse

Wat niet deterministisch uit de bron te halen is, schrijft Claude Code per pagina:

- `examples`: per story de code zoals een ontwikkelaar ze overneemt. Storybook maakt die pas in de browser, onder
  "Show code";
- `summary` en `keywords`: voor de lijsten en het zoeken, met Engelse zoektermen erbij;
- `notes`: wat niet strookt tussen de documentatie, de stories en de web-types, bv. een attribuut dat wel in de code
  staat maar niet in de web-types.

**Eén keer per inhoud.** De analyse hoort bij de inhoud van een pagina, niet bij een versie:
`storybook-analysis/<pagina>/<inputHash>.json`. `inputHash` dekt precies wat de analyse leest:

- de MDX, de stories en de bestanden die ze importeren;
- de voorbeeldcomponenten uit `libs/integrations` die een story rendert, via een alias uit `tsconfig.base.json`
  (bv. `@domg-wc/integrations/form`);
- het contract van de elementen van de pagina in de web-types;
- van de andere `vl-*`-elementen in de stories de namen van hun attributen, want een voorbeeld zet ook attributen op
  zulke elementen.

De imports bovenaan een bestand en witruimte tellen niet mee, en ook de metadata en de beschrijvingen in de web-types
niet. Heeft een pagina dezelfde inhoud als in een andere versie, dan heeft ze dus al een analyse. `storybook:analyse`
doet enkel wat nieuw is of wijzigde; een gewijzigde pagina krijgt de analyse van de dichtstbijzijnde versie mee om bij
te werken. Van 2.19.0 naar 2.20.0 zijn dat 35 van de 233 pagina's; over heel v2 zijn het 1209 analyses voor 5500
pagina's.

**De run.** `storybook:analyse` werkt in reeksen van vijf pagina's (`FLUX_STORYBOOK_BATCH`), met per reeks een analyse
en een review (`prompts/storybook-review.md`); zie [Claude Code](claude-code.md). Daarna toetst het elk voorbeeld aan de
web-types: elk `vl-*`-element en elk attribuut moet erin staan, of in een note `not-in-web-types`.

Faalt een reeks, of onderbreek je het script (Ctrl+C), dan stopt het de lopende run van Claude en verwijdert het de
analyses van die reeks: ze zijn niet (volledig) gereviewd. Hetzelfde commando maakt ze daarna opnieuw.

**De controle.** `storybook:check` toetst de voorbeelden in elke versie die de analyse gebruikt. Het meldt ook analyses
die geen versie nog gebruikt; `--prune` ruimt ze op.
