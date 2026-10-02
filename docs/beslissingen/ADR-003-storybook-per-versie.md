# ADR-003: De documentatie uit Storybook per versie aanbieden

## Status
Aanvaard

## Datum
2026-09-28

## Context

Ticket: FLUX-812.

De catalogus beantwoordt nu per versie de upgrade-vraag (ADR-001) en bevat de API van de componenten in de
web-types. Wie met de web-componenten werkt, heeft meer nodig: een nieuwe toepassing opzetten, een bestaande
verbeteren, van een ontwerp in Figma naar code gaan. Die kennis staat in Storybook: waarvoor een component dient, de
varianten met hun code, wat er voor toegankelijkheid moet gebeuren, patronen zoals een formulier met validatie,
recepten voor imports, events en styling, en de richtlijnen rond WCAG en CSP. Afnemers lezen die documentatie per
versie op `https://flux.omgeving.vlaanderen.be/release-v2/<versie>/storybook/`.

De MCP-server moet die informatie ook per versie aanbieden, zodat een agent de documentatie krijgt van de versie die
het project gebruikt. Storybook wordt opgebouwd uit de stories en de MDX-bestanden in flux-web-components. De vragen:

- halen we de documentatie uit die broncode of van de publieke site?
- in welk formaat en met welke structuur bewaren we ze, en hoe biedt de server ze aan?
- hoe vermijden we dat elke release alles opnieuw geanalyseerd wordt? Wat ongewijzigd is, nemen we 1-op-1 over;
  enkel wat wijzigde of bijkwam, wordt (opnieuw) geanalyseerd.

### Wat Storybook bevat

We onderzochten de broncode van de tags v2.0.0 en v2.20.0, `index.json` van beide Storybooks, en de gepubliceerde
site van 2.20.0, ook in Chrome.

- **Pagina's.** `index.json` van 2.20.0 telt 773 entries: 234 documentatiepagina's en 539 stories. 93 pagina's zijn
  losse MDX-bestanden onder `apps/storybook/docs/`: Afnemen, Richtlijnen, Patronen en Recepten, maar ook Bijdragen,
  Beheren en Planning, die over het werk van het Flux-team gaan. De andere 141 horen bij een stories-bestand: de
  componenten, de styles en de kaart.
- **Componentpagina's.** Van de 142 stories-bestanden in `libs/` hebben er 130 een eigen pagina
  (`*.stories-doc.mdx`, via `parameters.docs.page`). Van de andere 12 krijgen er 11 een pagina volgens het sjabloon
  `flux-document.template.mdx`: het eerste voorbeeld, de API en alle stories, zonder tekst. `vl-radio.stories.ts`
  heeft geen docs-pagina in `index.json`.
- **MDX is Markdown met JSX-blokken.** In 2.20.0 komen een 25-tal soorten blokken voor. De meeste zijn `Canvas`
  (443 keer: een story met haar code), `FluxComponentMetaData` (130: de status van een component, uit
  `.storybook/flux-meta-data/json/`), `ArgTypes` (101: de API-tabel), `Source` (85: vaste code), de
  `FluxWcag*`-blokken van de toegankelijkheidsrichtlijnen (samen 158), `FluxAlert` (30) en `ColorItem` (18).
- **De API-tabel en de web-types.** `ArgTypes` toont de argTypes uit `*.stories-arg.ts`, en de web-types worden
  daaruit gegenereerd. Ze kunnen achterlopen: `ellipsis` van `vl-breadcrumb` staat in 2.20.0 in de argTypes en in
  de documentatie, maar niet in de web-types.
- **De code van een voorbeeld.** Een story is een lit-template met args. `story()` uit `resources/utils-storybook`
  zet elk arg dat gelijk is aan de default op `nothing`, zodat "Show code" enkel toont wat afwijkt. Die code maakt
  Storybook pas in de browser, uit de gerenderde template. Voor `vl-button - icon only - ghost` is dat
  `<vl-button ghost="" label="Verwijder" icon="trash">`; bij `vl-button - error` staat de demotekst `Error: ` van
  de template mee in de code. Die code staat nergens in de bronrepo en nergens als bestand op de site.
- **Twee generaties Storybook.** 2.0.0 tot en met 2.4.x gebruiken Storybook 7.6: de algemene pagina's zijn
  `.stories.mdx` met `<Meta title>`, en de status heet `FluxMetaData`. Vanaf 2.5.0 is het Storybook 9 (FLUX-41).
  `index.json` bestaat voor beide, in formaat v4 en v5.

### De broncode of de publieke site

- **De site** is een statische build. `index.json` geeft per pagina en per story de id, de titel en het bronbestand
  (`importPath`); `changelog:commits` gebruikt dat al. De tekst van de MDX staat in gecompileerde, geminificeerde
  JavaScript, bv. `n.jsx(e.p,{children:"Gebruik een secondary button …"})`, en een verwijzing naar een story is een
  variabele: `n.jsx(a,{of:d})`. Leesbaar wordt het pas na het renderen in een browser. Headless Chrome met
  `--dump-dom` raakte in onze test na twee minuten niet klaar met één pagina. De code van een voorbeeld verschijnt
  pas na een klik op "Show code"; op de pagina van `vl-button` zijn dat er 17.
- **De broncode** geeft voor elke release, onder een tag, de MDX als Markdown-tekst, de stories met hun naam, args
  en template, en de metadata als JSON. Git zegt welke bestanden wijzigden, en er is geen browser nodig.

### Hoeveel er per release wijzigt

Van de bestanden achter Storybook (de MDX, de mappen `stories/` en `apps/storybook/docs/`, en de metadata)
wijzigden er 33 van 2.18.0 naar 2.19.0, en 34 van 2.19.0 naar 2.20.0. Die 34 raken rechtstreeks 22 van de 234
pagina's. Daarnaast:

- wijzigde `form-control.stories-arg.ts`, dat 8 stories-bestanden van formuliercomponenten importeren;
- wijzigden alle 7 metadata-bestanden, omdat `wcagLevel: "TODO"` bij bijna elke component `wcag` werd.

Van 2.1.0 naar 2.5.0 wijzigden 465 van de 490 bestanden, vooral door de overgang naar Storybook 9. In de MDX van
`vl-button` wijzigde enkel de import (`@storybook/addon-docs` werd `@storybook/addon-docs/blocks`), in de stories
vooral de imports en de inspringing.

Wie wijzigingen afleest uit de bronbestanden, analyseert dus te veel: bij een upgrade van Storybook bijna alles, en
in 2.20.0 elke component, door een veld in de metadata dat voor de analyse niet telt.

## Beslissing

Samengevat:

- de inhoud komt uit de broncode op de tag, de id's en de koppeling met de bestanden uit `index.json` van de site;
- per versie staat elke pagina als Markdown in `catalog/flux/<versie>/storybook/`, met een `index.json` erbij,
  deterministisch opgebouwd;
- wat een LLM toevoegt (de code van de voorbeelden, een samenvatting, zoektermen en opmerkingen), staat één keer
  per inhoud van een pagina in `catalog/flux/storybook-analysis/`, onder de hash van wat de analyse leest;
- een pagina met dezelfde hash neemt de bestaande analyse over; enkel een nieuwe hash wordt geanalyseerd;
- de server voegt bij het lezen de pagina, de analyse, de web-types en de metadata van die versie samen.

### 1. De broncode als bron, `index.json` van de site als sleutel

De inhoud komt uit de bronrepo, op tag `v<versie>`, zoals bij de andere scripts (ook met `FLUX_REPO`). Van de site
van die versie gebruiken we enkel `index.json`:

- de id's en de titels zijn die van de gepubliceerde Storybook, dus ook die in de links van de web-types en in de
  Figma-descriptions (`storybook: components-atom-button`);
- `importPath` koppelt elke pagina en elke story aan haar bronbestand;
- de build controleert dat elke pagina uit `index.json` in de catalogus staat of met een reden overgeslagen is, en
  omgekeerd.

De site blijft de referentie voor wat een afnemer ziet: elke pagina en elk voorbeeld krijgt de link naar die versie.

### 2. Twee lagen: de pagina's per versie, de analyse per inhoud

```
catalog/flux/
├── <versie>/
│   ├── web-types/, packages/, changelog/, changelog-analysis/     zie ADR-001
│   └── storybook/                   deterministisch (storybook:copy)
│       ├── index.json               de pagina's: id, titel, soort, bronnen, elementen, status, stories, hash
│       └── pages/
│           ├── components-atom-button.md
│           ├── afnemen-aan-de-slag.md
│           └── …
└── storybook-analysis/              LLM (prompts/storybook-analyse.md)
    ├── components-atom-button/
    │   ├── 3f2a9c1b07e4.json        de analyse van één inhoud van de pagina
    │   └── 9c1e4b7a02d3.json
    └── …
```

- **`storybook/` per versie, zoals de web-types.** Een script maakt de map, deterministisch: dezelfde tag geeft
  dezelfde bestanden. Een pagina bevat geen versienummer (zie 3), dus een ongewijzigde pagina is in elke versie
  hetzelfde bestand, en git bewaart ze één keer.
- **Een pagina heet naar haar Storybook-id**, zonder `--documentatie`: `components-atom-button.md`. De map is plat.
- **De analyse hoort bij de inhoud van een pagina, niet bij een release.** Ze staat één keer in git, onder de id
  van de pagina en de hash van haar invoer (zie 6). Elke versie waarin een pagina dezelfde invoer heeft, gebruikt
  dezelfde analyse. Zo neemt een nieuwe release ongewijzigde pagina's over zonder iets te kopiëren, geldt een
  verbetering voor alle versies met die inhoud, en toont de commit van een release enkel wat er echt geanalyseerd
  werd. De map van een pagina toont hoeveel verschillende inhouden ze in v2 had.
- **`storybook-analysis/` staat naast de versies.** `createCatalog` slaat nu al elke map over die geen versie is.

### 3. Van MDX naar Markdown

`storybook:copy` zet elke pagina om naar Markdown, met een regel per soort blok. Wat de MDX in Markdown schrijft,
blijft zoals het is.

| MDX | Markdown |
|---|---|
| `import`, `export`, `<Meta>` | weg |
| `<Canvas of={…}>`, `<DocsStory>`, `<Primary>`, `<Stories>` | per story een regel `> Story: [<naam>](/?path=/story/<id>)` |
| `<ArgTypes>`, `<Controls>`, `<ArgsTable>` | `> API: <element>`; de server zet er de API uit de web-types bij. Hoort er in de web-types geen element bij de pagina, dan `> API: geen element in de web-types`, met een link naar de argTypes in Storybook |
| `<FluxComponentMetaData>`, `<FluxMetaData>`, `<FluxComponentEvolution>` | weg; de status staat in `index.json` (zie 4) |
| `<FluxCanvasIframe>` | de regel `> Story:` van de eerste story |
| `<Source code={…}>` | een codeblok, zie hieronder |
| `<Markdown>` | de tekst, zonder de inspringing van de template literal |
| `<FluxAlert type="warning">` | een blockquote met het type, als GitHub-alert: `> [!WARNING]` |
| `<FluxWcag*>` | titels en tekst: richtlijn, niveau en succescriterium, met hun links naar W3C |
| `<ColorPalette>`, `<ColorItem>` | een tabel met de naam en de kleurwaarden |
| `<FluxComponentOverview>` | een tabel met de metadata van alle componenten |
| een geïmporteerde MDX, zoals `<FormControlPublicMethods />` | de omgezette inhoud van dat bestand |
| een HTML-tabel, `<strong>`, `<em>`, `<code>`, `<a>`, lijsten, titels, `<img>` | hun equivalent in Markdown |
| een element dat Storybook live toont, zoals `<vl-alert>` | HTML, zonder `style` en `class`, met de inhoud als Markdown |
| een afbeelding uit een import | haar pad in de bronrepo, bv. `/apps/storybook/resources/afnemen/autocomplete.png`; de server maakt er een link naar het bestand op de tag van |
| een link naar een andere pagina, in Markdown of als `href` in HTML | `/?path=/docs/<id>--documentatie`, zonder host en versie |

De code in `<Source code={…}>` komt uit een letterlijke tekst of template literal, een `export const` in de MDX, een
raw-import (`?raw` in Storybook 9, `!!raw-loader!` in Storybook 7), of een benoemde import van een constante uit
TypeScript, bv. de HTML van een patroon in `functionele-header.helpers.ts`. Komt die HTML uit een pijlfunctie, zoals
`createFunctionalHeaderHtmlWithExtraComponent('<vl-button>…</vl-button>', true)`, dan rekent de omzetting de
template literal uit met de argumenten: ternaries, `&&`, `||`, vergelijkingen en `.trim()`. Ze voert niets uit.
Wat niet letterlijk uit te rekenen is, zoals `VlSectionStories.SectionOverlap.toString()`, wordt de declaratie uit de
bron, met de aanroep erboven.

- **Geen versie in de pagina.** Links naar Storybook en afbeeldingen blijven relatief; de server maakt ze absoluut
  voor de versie die gevraagd wordt (zie 8).
- **Een onbekend blok laat het script falen**, met het bestand en de naam van het blok. Er verdwijnt dus niets
  ongemerkt; wie een regel toevoegt, schrijft er een test bij. Hetzelfde geldt voor een `Source` of een `Markdown`
  waarvan de inhoud niet te bepalen is.
- **Een pagina zonder eigen MDX** (het sjabloon) krijgt de titel, de API en alle stories.
- **De changelog-pagina** slaan we over: haar inhoud staat al in `changelog/`.
- **Beide generaties.** De regels dekken de blokken van Storybook 7 en 9; `FluxMetaData` en `FluxComponentMetaData`
  zijn hetzelfde blok.
- **Inspringing.** MDX kent geen ingesprongen code, Markdown wel: tekst uit JSX die meespringt met de code eromheen,
  zou een codeblok worden. Buiten lijsten en codeblokken verdwijnt de inspringing daarom.

De omzetting is een eigen parser voor MDX, zonder dependencies (`server/src/mdx.mjs`): ESM-regels, JSX-elementen
met hun attributen, expressies tussen accolades, en Markdown waarin codeblokken en code tussen backticks letterlijk
blijven. De blokken van Storybook en Flux zet `server/src/storybook.mjs` om. Alle 26 versies, van 2.0.0 tot 2.20.0,
zetten om zonder fout.

Zo begint `components-atom-button.md`:

````markdown
# Button

## Doel

Gebruik de `button` component om een button af te beelden op een pagina.

## Voorbeeld

```js
import { VlButtonComponent } from '@domg-wc/components/atom';
```

```html
<vl-button></vl-button>
```

> Story: [vl-button - primary](/?path=/story/components-atom-button--button-primary)

## Configuratie

> API: vl-button

## Varianten

…

### Enkel icoon

Om een icon-only button weer te geven kan je onderstaande code gebruiken.
Het invullen van het `label` attribuut is hierbij verplicht ([WCAG richtlijn](https://www.w3.org/TR/WCAG22/#name-role-value)).

> Story: [vl-button - icon only](/?path=/story/components-atom-button--button-icon-only)
````

De pagina is zo op zichzelf leesbaar, en de server herkent de regels `> Story:` en `> API:` om er de code en de API
bij te zetten (zie 8).

### 4. `index.json`

```json
{
    "schema": 1,
    "version": "2.20.0",
    "storybook": "9.1.5",
    "url": "https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/",
    "pages": [
        {
            "id": "components-atom-button",
            "title": "Components - Atom/button",
            "kind": "component",
            "file": "pages/components-atom-button.md",
            "sources": [
                "libs/components/src/atom/button/stories/vl-button.stories-arg.ts",
                "libs/components/src/atom/button/stories/vl-button.stories-doc.mdx",
                "libs/components/src/atom/button/stories/vl-button.stories.ts"
            ],
            "elements": ["vl-button"],
            "status": {
                "condition": {
                    "base": "LitElement", "generation": "v2", "documentation": "uitgebreid", "wcag": "reviewed"
                }
            },
            "stories": [
                { "id": "components-atom-button--button-primary", "name": "vl-button - primary" },
                { "id": "components-atom-button--button-icon-only-ghost", "name": "vl-button - icon only - ghost" }
            ],
            "links": ["components-form-input-group"],
            "inputHash": "5267f457e16f"
        }
    ],
    "skipped": [
        { "id": "changelog", "title": "Changelog", "reason": "de changelog staat in changelog/" }
    ]
}
```

- `kind` volgt uit het eerste deel van de titel: `component` (Components, map), `styles`, `guide` (Introductie,
  Design System, Afnemen, Opmaak), `guideline` (Richtlijnen), `pattern` (Patronen, en Ontwerp in Storybook 7),
  `recipe` (Recepten), `planning` en `flux-team` (Bijdragen, Beheren). Een onbekend deel wordt `other`, met een
  waarschuwing.
- `elements` komt uit de web-types: elk element linkt met zijn `doc-url` naar zijn pagina. Die link klopt niet altijd:
  in 2.20.0 wijzen 12 van de 154 elementen naar een pagina die niet bestaat, bv. `vl-text` naar
  `components-atom-text-text`. Dan koppelt `storybook:copy` het element aan de pagina van het stories-bestand met
  zijn naam (`vl-text.stories.ts`), en anders aan de pagina waarvan de id het meest op die uit de doc-url lijkt. Het
  meldt elke link die niet klopt.
- `status` is de metadata van de component uit `.storybook/flux-meta-data/`, zonder `name` en `docs`: de conditie
  (`condition`) en, als die er is, de evolutie (`evolution`).
- `links` zijn de pagina's waarnaar de tekst verwijst.
- De pagina's staan in de volgorde van Storybook. `inputHash`: zie 6.

### 5. Wat de LLM schrijft

Per pagina en per inhoud schrijft Claude Code enkel wat niet deterministisch uit de bron te halen is:

```json
{
    "schema": 1,
    "page": "components-atom-button",
    "inputHash": "5267f457e16f",
    "analysedFor": "2.20.0",
    "summary": "Knop voor een actie op de pagina, met varianten voor gewicht, grootte, icoon, toggle en cta-link.",
    "keywords": ["knop", "button", "icon button", "toggle", "call to action", "download"],
    "examples": {
        "components-atom-button--button-icon-only-ghost": {
            "html": "<vl-button icon=\"trash\" label=\"Verwijder\" ghost></vl-button>"
        }
    },
    "notes": []
}
```

- **`examples`:** per story de code zoals een ontwikkelaar ze overneemt: de attributen en de inhoud die de story
  instelt, zonder wat enkel de demo-template toevoegt (zoals `Error: `), met `js` erbij als de story properties of
  events gebruikt. Dat is wat "Show code" toont, zonder de ruis. Claude leidt het af uit de template, de args en de
  defaults van de story in de bronrepo.
- **`summary`:** waarvoor de pagina dient, in een tot drie zinnen, voor de lijsten en de zoekresultaten.
- **`keywords`:** termen waarmee een ontwikkelaar de pagina zoekt, ook in het Engels ("modal", "dropdown"), omdat
  een agent vaak in het Engels zoekt.
- **`notes`:** wat niet strookt tussen de documentatie, de stories en de web-types, met de bron. Het type is
  `not-in-web-types`, bv. `{ "type": "not-in-web-types", "element": "vl-breadcrumb", "name": "ellipsis", … }`, of
  `mismatch` voor documentatie, stories en web-types die elkaar tegenspreken.
- **`analysedFor`:** de versie waarvoor de analyse geschreven werd; ter informatie.

De regels van ADR-001 gelden ook hier: alles komt uit de bron van die versie, elke naam is gecontroleerd, en een
tweede run (`prompts/storybook-review.md`) controleert en verbetert de analyse, zonder mens. Daarnaast controleert
`storybook:check` elke analyse deterministisch, in elke versie die ze gebruikt:

- elke story van de pagina heeft een voorbeeld, en elk voorbeeld hoort bij een story van de pagina;
- elk `vl-*`-element in een voorbeeld staat in de web-types van die versie;
- elk attribuut op zo'n element staat in de web-types, is een globaal HTML-attribuut (`id`, `class`, `slot`,
  `aria-*`, `data-*`, …) of staat in `notes` als `not-in-web-types`;
- een voorbeeld is gewone HTML: lit-syntax als `?ghost=${…}` of `@vl-click=${…}` wordt geweigerd.

### 6. Enkel analyseren wat wijzigde

`storybook:copy` berekent per pagina `inputHash`: de eerste 12 tekens van de SHA-256 van precies wat de analyse
leest, genormaliseerd.

- De MDX van de pagina.
- Het stories-bestand en de bestanden voor de stories die het importeert (`*.stories-arg.ts`, helpers, mocks), en de
  bestanden die de pagina toont (`<Source>`, `<Markdown>`). Niet de code van de componenten zelf.
- De voorbeeldcomponenten uit `libs/integrations` die een story rendert, met hun eigen imports. Een story importeert
  ze met een alias uit `tsconfig.base.json`, bv. `@domg-wc/integrations/page-layout`. Tien stories-bestanden van
  patronen doen dat (formulieren, de kaart, de popovers en de pagina-opbouw), en de analyse leest die code om de
  voorbeelden te schrijven. Zonder hen heeft `patronen-pagina-opbouw` dezelfde hash in 2.11.0 tot en met 2.20.0,
  terwijl `vl-page-layout-example` in 2.19.0 `skip-to-content-id` op `vl-header` kreeg. Een analyse van 2.20.0 zou
  zo ook gelden voor versies waar dat attribuut niet in de web-types staat, en `storybook:check` zou falen.
- Het contract van de elementen van de pagina in de web-types: de namen, types, defaults en `deprecated` van de
  attributen, properties, slots en events. Zonder de beschrijvingen en zonder `doc-url`.
- Van de andere `vl-*`-elementen in de stories en de voorbeeldcomponenten: enkel of ze in de web-types staan, en de
  namen van hun attributen. Een voorbeeld zet ook attributen op zulke elementen, en `validateAnalysis` toetst die
  namen aan de web-types van elke versie met dezelfde hash. Zonder dit deelden de stories van `vl-share-buttons` in
  2.8.0 tot en met 2.15.0 één hash, terwijl `medium` en `href` van `vl-share-button` pas vanaf 2.12.0 in de
  web-types staan; hetzelfde gold voor `open` en `left` van `vl-side-sheet` in de stories van de cascader in 2.11.0.
  De MDX en getoonde code tellen hier niet mee: de voorbeelden komen uit de stories. Het volledige contract van die
  elementen, ook die uit de MDX, vroeg in een meting 89 analyses meer, zonder dat de controle er iets aan heeft.

Normaliseren betekent zonder de eigen imports van het bestand, en met elke reeks witruimte als één spatie. De eigen
imports zijn de import-regels in de ESM van een MDX-bestand en de imports bovenaan JavaScript of TypeScript; een
`export const` in de MDX is inhoud. Een import in een
codeblok of in een template literal is inhoud: in `recepten-imports` wijzigde van 2.0.1 naar 2.0.2 net zo'n regel.
Ook een bestand dat de pagina toont, houdt zijn imports.

Wat de analyse niet leest, telt niet mee: de metadata, de vorm van de Markdown en de beschrijvingen in de web-types.
Zo tellen de nieuwe import in bijna elke MDX bij de overgang naar Storybook 9 en het nieuwe veld in de metadata van
2.20.0 niet mee. Een betere omzetting naar Markdown maakt ook geen analyse ongeldig. Enkel de pagina die de metadata
zelf toont (`FluxComponentOverview`), neemt ze op in haar hash.

Eén uitzondering nemen we bewust: een pagina volgens het sjabloon toont de beschrijving van haar element uit de
web-types, maar die telt, zoals elke beschrijving, niet mee in de hash. Een nieuwe beschrijving zonder ander contract
geeft voor die 11 pagina's dus geen nieuwe analyse.

`storybook:analyse <versie>` werkt zo:

1. Per pagina zoekt het `storybook-analysis/<id>/<inputHash>.json`. Bestaat dat, dan is de pagina klaar.
2. De andere pagina's zijn nieuw of gewijzigd. Bij een gewijzigde pagina krijgt Claude de analyse van die pagina in
   de dichtstbijzijnde andere versie en de Markdown van die versie erbij, en werkt die analyse bij in plaats van
   opnieuw te beginnen. Wat nog klopt, blijft zo letterlijk hetzelfde.
3. De review controleert enkel de analyses die deze run schreef.
4. Het script toetst elke analyse van de reeks met `validateAnalysis` aan de web-types van die versie (zie 5).
   Omdat het contract van de web-types in de hash zit, geldt dat resultaat voor elke versie met dezelfde hash.

`storybook:check` zonder versie controleert alle versies en al hun analyses; `catalog:update` draait het voor de
nieuwe versie.

De volgorde van de versies maakt niet uit: een pagina van 2.19.0 met dezelfde invoer als in 2.20.0 vindt de analyse
die voor 2.20.0 geschreven werd, en omgekeerd.

Gemeten over de 26 versies van v2:

| | Pagina's met een nieuwe hash |
|---|---|
| 2.0.0, de eerste versie | 177 van 177 |
| 2.19.0 → 2.20.0 | 35 van 233 |
| een patch (2.0.1, 2.8.1, 2.12.1) | 0 |
| 2.4.0 → 2.5.0, de overgang naar Storybook 9 | 153 van 208 |
| 2.7.0 → 2.8.0 | 144 van 218 |
| alle versies samen | 1209 analyses voor 5500 pagina's |

Bij 2.5.0 is de Markdown van 113 van de 150 gewijzigde pagina's dezelfde: het verschil zit in de stories of in het
contract van de web-types. Bij 2.14.0 tot 2.16.0 (telkens 70 à 90 pagina's) is de Markdown van de meeste echt anders.
Een pagina met dezelfde hash is in 4290 van de 4291 gevallen ook byte voor byte dezelfde Markdown; het verschil is
witruimte op het einde van een regel in een codeblok.

De definitie van de hash is een contract: wijzigt ze, dan hoort er een migratie bij die de analyses hernoemt, anders
valt elke analyse weg. De migratie hernoemt elke analyse naar de hash van haar pagina in de versie waarvoor ze
geschreven werd (`analysedFor`), na een controle tegen die versie; een andere versie die dezelfde hash had, krijgt
zo een eigen analyse als haar invoer verschilt.

### 7. Scripts

```bash
pnpm run flux:storybook:copy 2.20.0              # netwerk: bronrepo en index.json, naar storybook/
pnpm run flux:storybook:copy --all               # alle versies, na een wijziging aan de omzetting
pnpm run flux:storybook:copy --check             # bouwt opnieuw en vergelijkt, met de bronrepo
pnpm run flux:storybook:analyse 2.20.0           # Claude Code: de pagina's zonder analyse, en de review
pnpm run flux:storybook:analyse --dry-run 2.20.0 # toont wat geanalyseerd zou worden
pnpm run flux:storybook:check                    # offline: pagina's en analyses van alle versies
```

- **`storybook:copy`** checkt de tag uit in een tijdelijke map (`storybook/source.mjs`) en haalt `index.json` op. Het
  vervangt de map pas als alles gelukt is. Met `--check` bouwt het opnieuw en vergelijkt het; dat vraagt de
  bronrepo. Alle 26 versies duren samen een halve minuut met een lokale clone.
- **`storybook:analyse`** werkt zoals `changelog:analyse`: headless runs (`claude -p`) op het abonnement, met een
  analyse en een review per reeks van vijf pagina's (`FLUX_STORYBOOK_BATCH`) en ongeveer 40 stories. Al het
  LLM-werk rond Storybook, de analyse en de review, draait op Opus 5.5 (`claude-opus-5-5`) met effort `xhigh`: een
  agent neemt de voorbeelden letterlijk over. Het script legt het vaste model-id vast, en de omgeving kan het niet
  wijzigen, zodat een nieuwere Opus de keuze niet stilletjes verandert. Claude mag lezen, enkel de analyses van de
  pagina's in de reeks schrijven en `storybook:check` voor die versie draaien. Het script geeft daarvoor
  `--permission-mode manual` mee, anders geldt de `defaultMode` uit de instellingen, en in `auto` keurt een
  classifier ook andere commando's goed. De regels voor Write en Edit hebben een absoluut pad (`//…`): een relatief
  pad leest Claude Code tegenover de huidige map van de shell, en na een `cd` in Bash werd een toegelaten Edit zo
  geweigerd. Na de review toetst het script elke analyse van de reeks. Een pagina met een analyse slaat het over, dus
  het is hervatbaar; `--max` begrenst een run. Faalt een reeks, of wordt het script onderbroken (Ctrl+C, SIGTERM),
  dan stopt het de lopende run van Claude en verwijdert het de analyses van die reeks: ze zijn niet (volledig)
  gereviewd, en zouden anders bij het hervatten als klaar gelden. De run met Claude Code staat in `claude-run.mjs`,
  dat `changelog:analyse` later ook kan gebruiken.
- **`storybook:check`** meldt ook de pagina's zonder analyse, en de analyses die geen enkele versie nog gebruikt.
  Die laatste verwijdert het enkel met `--prune`: wat een LLM schreef, is niet opnieuw te maken.
- **`catalog:update`** roept `storybook:copy` op bij de bronnen, en na de changelog `storybook:analyse` en
  `storybook:check`; `--skip-analysis` slaat ook deze analyse over.
- **`catalog:backfill`** (ADR-002) neemt de documentatie nog niet op. Voor een reeks versies doe je
  `storybook:copy --all` en `storybook:analyse` per versie.

### 8. Wat de server aanbiedt

De server voegt bij het lezen samen: de pagina, de analyse voor haar hash, en de web-types en de metadata van die
versie.

- Een regel `> Story:` wordt de naam van de story, het voorbeeld uit de analyse en de link naar de story in die
  versie. Zonder analyse blijven de naam en de link.
- Een regel `> API:` wordt een tabel met de attributen, properties, slots en events uit de web-types, met type,
  default en `deprecated`, en daaronder de `notes` over wat er niet in staat.
- Relatieve links worden absoluut: een link naar Storybook, in Markdown of als `href`, gaat naar de Storybook van
  die versie; een afbeelding gaat naar het bestand op de tag in de bronrepo
  (`https://github.com/milieuinfo/flux-web-components/raw/v<versie>/<pad>`).
- Een regel `> API: geen element in de web-types` blijft zoals hij is.
- Bovenaan staan de titel, de versie, de link, de elementen en, voor een component, de conditie uit de status:
  generatie, basis, css, documentatie en wcag. De volledige status, met de evolutie, geven `getPage` en
  `getComponent` in `status`.

De queries staan in een eigen module, `server/src/docs.mjs`, zoals `catalog.mjs` die over de changelog, en los van
MCP:

| Functie | Vraag |
|---|---|
| `listDocVersions()` | welke versies hebben documentatie, met hoeveel pagina's en analyses? |
| `listPages(versie, filters)` | welke pagina's zijn er? Filters: soort en element; `flux-team` enkel op vraag |
| `getPage(versie, pagina)` | één pagina, samengevoegd; `pagina` is een id, een element (`vl-button`, `button`) of een Storybook-link |
| `getComponent(versie, element)` | alles over één component: de pagina, de API, de voorbeelden, de status, en wat er de vorige versies aan veranderde (`getComponentHistory`) |
| `searchDocs(zoekterm, filters)` | welke pagina's gaan over een onderwerp? Zoekt in de titels, de tekst, de samenvattingen en de `keywords`, en geeft per pagina de samenvatting en de passage |
| `getDocsChanges(van, tot)` | welke pagina's kwamen erbij, wijzigden of verdwenen, uit de `inputHash` per pagina |

`listPages`, `searchDocs` en `getDocsChanges` laten de pagina's van het Flux-team standaard weg; `hiddenFluxTeam`
zegt hoeveel, en met `includeFluxTeam` toon je ze toch.

`getDocsChanges` staat naast `getChangesBetween` (ADR-001) in plaats van erin: zo blijft `catalog.mjs` enkel over de
changelog gaan, en voegt de MCP-koppeling beide samen voor de upgrade-vraag. Zo ziet een afnemer ook documentatie die
wijzigde zonder changelog-entry.

Voorlopige mapping naar MCP:

- resources `flux://storybook/{versie}` (het overzicht) en `flux://storybook/{versie}/{pagina}` (Markdown);
- tools `flux_component`, `flux_docs_search`, `flux_docs_page` en `flux_docs_list`;
- zonder versie geldt de nieuwste in de catalogus, en het antwoord zegt welke. De instructies van de server vragen
  een agent de versie van `@domg-wc/components` uit de `package.json` van het project te nemen.

ADR-004 (voorstel) werkt dit uit; eens aanvaard, vervangt ze deze mapping.

Van design naar code: de Figma-description en de documentation link van een component noemen de Storybook-id
(`components-atom-button`), de Code Connect-snippet noemt het element. Met elk van beide vindt een agent die met de
Figma MCP werkt, via `flux_component` de pagina van de juiste versie.

### 9. Stappenplan

1. **De omzetting en `storybook:copy`**, met tests per soort blok (inline fragmenten) en de pagina's van alle 26
   versies in de catalogus. Klaar.
2. **De queries**, met hun tests. Zonder analyse is de catalogus al bruikbaar: tekst, API, status en links. Klaar.
3. **De analyse:** `prompts/storybook-analyse.md`, `prompts/storybook-review.md`, `storybook:analyse` en
   `storybook:check`. Klaar voor alle versies, van 2.0.0 tot en met 2.20.0: eerst 2.20.0 volledig, daarna per
   versie, van nieuw naar oud, de pagina's met een nieuwe hash. Controleer na elke reeks een steekproef van de
   voorbeelden in Storybook; die toetst de werkwijze, niet elke analyse, want die leest een mens niet na.
4. **`catalog:update`**, de documentatie en `CLAUDE.md`. Klaar. `catalog:backfill` volgt.
5. **De MCP-koppeling**, samen met die van ADR-001, zoals ADR-004 (voorstel) ze uitwerkt.

## Alternatieven overwogen

- **De gerenderde pagina's van de publieke site.** Dat is precies wat een afnemer ziet, ook de code van "Show
  code". Maar de tekst bestaat pas na het renderen, dus de pipeline heeft een browser nodig, ook in CI. Headless
  Chrome raakte in onze test niet klaar met één pagina, de code verschijnt pas na een klik per voorbeeld, Storybook
  7 en 9 zien er anders uit, en welke pagina's wijzigden, weet je pas als alles gerenderd is. Van HTML naar
  Markdown moet dan nog altijd.
- **De gecompileerde bundels van de site lezen.** De tekst staat erin, maar als JSX-aanroepen met geminificeerde
  namen, en een story is een variabele zonder naam. Elke build geeft andere bestandsnamen.
- **De code van "Show code" uit de browser halen, en de rest uit de broncode.** Dat geeft de code van Storybook zelf,
  deterministisch, maar ook de ruis van de demo-templates, en opnieuw een browser in de pipeline. Blijken de
  voorbeelden uit de analyse niet betrouwbaar, dan kan dit er later als controle bij.
- **Geen voorbeelden, enkel de template en de args van de story.** Dat is deterministisch, maar dan moet een agent
  zelf een lit-template renderen. De template van `vl-button` heeft meer dan twintig bindings en demologica; dat
  kost tokens en vraagt bij elke vraag interpretatie, in plaats van één keer per inhoud.
- **Geen LLM-laag.** Wat deterministisch is, is ook zonder analyse bruikbaar (stap 2). Maar dan ontbreken de
  voorbeelden, die enkel in de browser bestaan, en de samenvattingen voor de lijsten en het zoeken.
- **Een MDX-parser (`@mdx-js/mdx`) of de TypeScript-compiler.** Dat is robuuster, maar een dependency, tegen de
  conventie van de repo. Flux gebruikt een beperkte set blokken, en een onbekend blok laat het script falen.
- **De analyse per versie kopiëren, zoals `changelog-analysis/`.** Dan is elke versie op zichzelf compleet. Maar
  dezelfde tekst staat tot 26 keer in de catalogus, een verbetering moet in elke kopie, en de commit van een release
  toont 234 analyses, waarvan het merendeel kopieën.
- **Per versie enkel de nieuwe analyses bewaren, en voor de rest verwijzen naar een oudere versie.** Elke tekst staat
  dan één keer in git, maar de server moet de keten aflopen, en de volgorde van analyseren telt. Met de hash is de
  verwijzing rechtstreeks.
- **Wijzigingen afleiden uit de bronbestanden (git diff tussen de tags).** Dan telt elke import en elke witruimte:
  bij de overgang naar Storybook 9 bijna elk bestand, en in 2.20.0 elke component, door de metadata.
- **De hash op de gebouwde Markdown.** Dan maakt elke verbetering aan de omzetting de analyses van alle geraakte
  pagina's ongeldig.
- **De bronbestanden per versie in de catalogus bewaren.** Dan kan alles offline opnieuw gebouwd worden. Maar enkel
  de MDX, de stories en de metadata zijn al 1,5 MB per versie, en ze staan onder een tag in de bronrepo. We doen het
  zoals met de commits: het script haalt er de feiten uit en bewaart die.
- **De pagina's van het Flux-team (Bijdragen, Beheren) weglaten.** Ze raken het project van een afnemer niet, maar
  ze kosten weinig en helpen wie aan Flux zelf werkt. Ze staan erin als `flux-team`, en de server toont ze enkel op
  vraag.

## Gevolgen

- **Een omzetting om te onderhouden.** Voegt Flux een nieuw blok toe, dan faalt `storybook:copy` tot er een regel
  voor is. Dat stopt `catalog:update`, bewust: anders verdwijnt er inhoud.
- **Geen browser in de pipeline.** Die heeft zoals nu de bronrepo, `index.json` van de site en Claude Code nodig.
- **De voorbeelden schrijft een LLM, niet Storybook.** Ze komen uit de template en de args. `storybook:check` en de
  review controleren ze tegen de web-types, maar een fout in bv. de inhoud van een slot vangt enkel de review.
- **De eerste analyse is groot.** 2.0.0 telt 177 pagina's; heel v2 vraagt 1209 analyses (zie 6). Daarna gaat het
  per release om een klein deel van de pagina's, in 2.20.0 om 35 van de 233. Dat past in de werkwijze van ADR-002:
  in reeksen en hervatbaar.
- **De omvang blijft beperkt.** `storybook/` van 2.20.0 is 1,3 MB, alle 26 versies samen 25 MB in de werkmap. Een
  ongewijzigde pagina bewaart git één keer.
- **Fouten in de bron worden zichtbaar.** `storybook:copy` meldt links naar pagina's die niet bestaan (bv.
  `components-atoms-button` in de migratiegids) en elementen waarvan de doc-url in de web-types niet klopt. Die zijn
  voor het Flux-team om recht te zetten.
- **De web-types blijven de enige bron voor de API.** Waar ze achterlopen, zegt de analyse dat in `notes`. Wordt dat
  in de web-types rechtgezet, dan wijzigt het contract en dus de hash, en verdwijnt de note bij de nieuwe analyse.
- **Een map naast de versies:** `catalog/flux/storybook-analysis/`. De rest van de catalogus blijft per versie.
- **De hash is een contract.** Een andere definitie vraagt een migratie van de bestandsnamen.
- **`getDocsChanges`** toont welke documentatie tussen twee versies wijzigde, ook zonder changelog-entry.
- **v3** werkt op dezelfde manier, met de Storybook onder `release-v3`.

## Gerelateerde ADR's

- ADR-001: De changelog per versie klaarzetten voor de MCP-server.
- ADR-002: De historische catalogus van v2 opbouwen.
- ADR-004: De functionaliteit van de MCP-server (voorstel).
