# ADR-004: De functionaliteit van de MCP-server

## Status
Aanvaard

## Datum
2026-09-29

## Context

Ticket: FLUX-812.

De catalogus staat er: per Flux-release wat er voor een afnemer verandert (ADR-001), voor alle releases op de
hoofdlijn van v2 (ADR-002), en de documentatie uit Storybook per versie (ADR-003). `server/src/catalog.mjs` en
`server/src/docs.mjs` beantwoorden de vragen als gewone functies, met tests. De MCP-koppeling zelf bestaat nog niet.

ADR-001 (sectie 8) en ADR-003 (sectie 8) gaven elk een voorlopige mapping naar MCP, uit te werken bij de bouw van de
server. Samen zijn dat acht tools, drie resources en een prompt, per module bedacht: `flux_changelog`,
`flux_upgrade`, `flux_component_history` en `flux_find_change` voor de changelog, `flux_component`,
`flux_docs_search`, `flux_docs_page` en `flux_docs_list` voor de documentatie. Een vraag als "hoe gebruik ik
`vl-alert` in 2.20.0, en wat veranderde eraan" zit zo verdeeld over twee tools.

Daarnaast was er een ontwerpvoorstel voor de Flux-MCP (v2). Het beschreef hoe de server de AI-workflows uit de
Storybook-pagina *Flux-AI - Frontend Uniformisering* (Planning, sectie 5;
`catalog/flux/2.20.0/storybook/pages/planning-flux-ai-frontend-uniformisering.md`) aanbiedt aan afnemende projecten:
kennis in tools en resources, workflows als recepten in MCP-prompts, en de uitvoering bij de AI-client van het
project. Dat wijkt af van de planning, waar de Flux-Agent de enige ingang voor afnemers is (sectie 4 en 11.1). Het
voorstel was geschreven zonder deze repo te kennen, en vroeg zelf om eerst na te gaan waar de repo afwijkt. Deze ADR
neemt het op: wat ervan overeind blijft, staat hieronder, en het afzonderlijke document vervalt.

### Waar het ontwerpvoorstel en de repo verschillen

| Onderwerp | Ontwerpvoorstel | In deze repo |
|---|---|---|
| Het *hoe* | `.llm.md` per versie; Storybook bewust niet (planning 11.2) | de `.llm.md` is een concept, geen bestand: alle kennis die niet uit de web-types of de release notes komt. De documentatie uit Storybook per versie, met haar analyse, is er het eerste deel van (ADR-003) |
| Migratie | een `migration.json` per versie, met `kind` en `codemod` | per ticket de feiten en de analyse: impact, uitleg, actie en voorbeeld (ADR-001); de diffs van de web-types en de dependencies; geen codemods |
| Opslag | `knowledge/<versie>/` | `catalog/flux/<versie>/` en `catalog/flux/storybook-analysis/` |
| Model | `ComponentKnowledge`, met CSS custom properties, CSS parts en een status | de web-types: attributen, slots, properties, events en `deprecated`; geen CSS custom properties of parts; de status staat in de metadata van Storybook |
| Stack | TypeScript, `@modelcontextprotocol/sdk` en Zod | Node 22, ESM `.mjs`, enkel `node:`-modules (`CLAUDE.md`) |
| Kwaliteitspoort | `knowledge:check` | `changelog:build --check`, `storybook:check` en `pnpm test` |
| Queries | te bouwen | `catalog.mjs` en `docs.mjs` bestaan, met tests |

### Wat de catalogus vandaag geeft

- **Versies.** De 26 releases van 2.0.0 tot en met 2.20.0 op de hoofdlijn van `develop-v2`. v1 en de patches op een
  zijtak (2.4.1, 2.15.1, 2.17.1–2.17.3) staan er niet in (ADR-002).
- **De changelog.** Elke entry van elke versie heeft een analyse (`impactSource: "analysis"`) en elke versie een
  `summary`. Over alle versies samen: 71 entries met impact `action`, 93 `opt-in`, 136 `automatic` en 106 `none`.
- **De documentatie.** 5500 pagina's over 26 versies, van 177 tot 233 per versie, met ongeveer 1200 verschillende
  inhouden (4,7 MB). Elke pagina van elke versie heeft een analyse (ADR-003, stap 3). Zonder analyse zijn er geen
  voorbeelden per story, geen samenvatting en geen zoektermen.
- **De web-types van 2.20.0.** 154 elementen met 918 attributen. 866 attributen hebben geen type; 52 hebben een lijst
  van waarden, zoals `'info' | 'success' | 'warning' | 'error'`. Er staan geen CSS custom properties of parts in. Drie
  elementen zijn `deprecated` (`vl-search`, `vl-share-button`, `vl-share-buttons`), en zeven eindigen op `-next`: hun
  generatie in de metadata van Storybook is `v3-next`. Wat Storybook "(intern)" noemt, zoals `button-style`, zijn
  styles (`CSSResult`), geen elementen.
- **De omvang van een antwoord.** Als JSON, zoals de queries het nu teruggeven:

  | Vraag | Omvang |
  |---|---|
  | `getChangesBetween('2.0.0', '2.20.0')`: 54 `action`, 92 `opt-in`, 134 `automatic` | 1,2 MB |
  | `getChangesBetween('2.19.0', '2.20.0')` | 32 KB |
  | `getChangesBetween('2.12.0', '2.20.0', { component: 'vl-alert' })` | 23 KB |
  | `getComponent('2.20.0', 'vl-button')`, met de historiek | 30 KB |
  | `getPage('2.20.0', 'vl-button')`, de Markdown | 17 KB |
  | `listPages('2.20.0')`: 222 pagina's | 145 KB |

  Claude Code waarschuwt vanaf 10.000 tokens per antwoord van een MCP-tool en kapt standaard af op 25.000
  (`MAX_MCP_OUTPUT_TOKENS`). Met ruwweg 3 à 4 tekens per token zit 32 KB al aan die waarschuwing.
- **De omvang van de catalogus.** 46 MB aan bestanden, 7,4 MB gecomprimeerd. De pagina's van Storybook zijn daarvan
  24 MB, maar met 4,7 MB verschillende inhoud; de web-types zijn 9,3 MB.

## Beslissing

Samengevat:

- de server levert kennis per versie via zeven tools en een handvol resources, en workflowrecepten via prompts; de
  AI-client van het project voert de workflows uit;
- de kennis is de catalogus zoals ADR-001 tot ADR-003 hem opbouwen. De `.llm.md` is een concept: alle kennis die niet
  uit de web-types of de release notes komt; de documentatie uit Storybook en haar analyse zijn er het eerste deel
  van. De changelog per ticket vervult de rol van het migratiebestand;
- elke tool vraagt een expliciete versie, geeft de effectieve versie en de bronnen terug, en blijft standaard onder
  de 10.000 tokens;
- de server is eigen code zonder dependencies, over stdio, en wordt verdeeld als npm-pakket met de catalogus erin;
- we bouwen in vijf incrementen: eerst ontsluiten wat er al is, dan `flux_check_markup`, dan de recepten.

### 1. Rol en grenzen

- **Kennis in tools, recepten in prompts, uitvoering bij de client.** Tools en resources leveren kennis. Een prompt
  beschrijft een workflow: de stappen, de tools, de verificatie en het rapport. De client voert die uit in het project:
  code lezen, tests draaien en bestanden aanpassen.
- **Buiten scope van de server:**
  - LLM-calls: de server roept geen model aan;
  - projectcode lezen of wijzigen, en koppelen met Jira of Git: dat doet de client;
  - Figma: dat is de Figma MCP met Code Connect. Een recept mag de client vragen die te gebruiken; de server zelf kent
    Figma niet, en de Code Connect-bestanden in deze repo zijn voor Figma, niet voor de server;
  - de `.llm.md` en de analyse schrijven: dat gebeurt bij een release, de server leest ze enkel;
  - een plugin voor Claude Code (de server plus skills, met een model per stap). Die kan later, als blijkt dat de
    meeste teams Claude Code gebruiken, en hergebruikt dan de recepten van de server.
- **Voor afnemende projecten en voor Team Flux.** Een project koppelt de server aan zijn eigen client, bv. Claude Code
  of VS Code met Copilot, en start een workflow met een prompt. flux-agents, het interne gereedschap van Team Flux,
  haalt dezelfde recepten op met `prompts/get` (sectie 6.7). Er is één definitie per workflow. Dit wijkt af van
  sectie 4 en 11.1 van de planning, waar de Flux-Agent de enige ingang is; die pagina moet mee aangepast worden (zie
  Gevolgen).
- **Deterministisch per versie van flux-mcp.** Dezelfde versie van flux-mcp geeft op dezelfde vraag hetzelfde
  antwoord, byte voor byte, ook in de rangschikking van zoekresultaten. De inhoud voor een Flux-versie kan tussen twee
  versies van flux-mcp wel verbeteren: een analyse van Storybook geldt voor elke versie met dezelfde inhoud (ADR-003),
  en een versie die in de catalogus bijkomt, geeft de volgende versie nieuwe diffs (ADR-002). Een antwoord voor een
  Flux-versie is dus onveranderlijk per versie van flux-mcp, niet voor altijd. Elk antwoord noemt die versie in
  `catalog`.
- **Voorspelbare recepten.** Een prompt kan het model en de uitvoerder niet vastleggen. De voorspelbaarheid komt uit
  drie dingen: verplichte verificatie (de e2e-testen uit eis 7.A en `flux_check_markup`), checkpoints, en een vast
  rapportformaat per workflow (sectie 6).
- **Traceerbaar.** Elk antwoord van een tool noemt de effectieve versie en zijn bronnen (sectie 4). Elk rapport noemt
  de versie van flux-mcp, de versies van Flux en de gebruikte id's van pagina's, regels en entries (sectie 6.4).

### 2. De kennis: wat de catalogus heeft en wat later komt

| Kennislaag (planning, sectie 3) | In de catalogus | In de server |
|---|---|---|
| web-types: het *wat* | `<versie>/web-types/` | de API in `flux_get_component`, `flux_check_markup` en de diffs |
| `.llm.md`: het *hoe*, alle kennis die niet uit de web-types of de release notes komt | het eerste deel: de documentatie uit Storybook en haar analyse (ADR-003); volgende delen later | `flux_get_guidance`, `flux_search_docs`, de voorbeelden en `notes` in `flux_get_component` |
| release notes en migratiebestand | `changelog/` en `changelog-analysis/` per ticket (ADR-001) | `flux_get_upgrade`, `flux_find_changes` |
| Figma | niet | de Figma MCP, bij de client |

- **De `.llm.md` is een concept, geen bestand** (bijgesteld op 2026-10-02, door Team Flux): alle kennis over Flux die
  niet via de web-types of de release notes komt. De documentatie uit Storybook en haar analyse zijn er het eerste
  deel van: de gidsen, richtlijnen, patronen en recepten, de voorbeelden per story, en wat de analyse noteert, zoals
  attributen die niet in de web-types staan. De planning hield Storybook nog buiten de kennislaag (11.2); dat moet mee
  (open beslissing 9). De server zegt bij elk antwoord uit welke bron het komt (`sources[].kind`), zodat een recept en
  een rapport zien dat het om documentatie gaat, en niet om een regel met een id en een ernst.
- **Geen apart `migration.json`.** Het machineleesbare migratiebestand uit de planning is de changelog per ticket met
  zijn analyse: per wijziging de componenten, de impact, wat een afnemer moet doen (`action`) en een voorbeeld. Een
  migratiestap heeft als id de id van de entry (de korte sha) en het ticket (`FLUX-810`). Een tweede bestand per
  versie, door een LLM geschreven, zou dezelfde tekst twee keer in git zetten.
- **Codemods nog niet.** Het voorbeeld in de analyse toont vaak oud en nieuw. Een gestructureerd `codemod`-veld in de
  analyse is een uitbreiding voor later. Het is dan structureel, geen reguliere expressie, bv.
  `{ "type": "map-attribute-value", "selector": "vl-voorbeeld", "attribute": "size", "map": { "small": "s" } }`.
  Een gedragswijziging krijgt geen codemod, enkel de actie en wat je moet nakijken (verfijnd op 2026-10-02):
  - **Het LLM bouwt hem mee.** Alles vertrekt van de changelog van Flux zoals hij is; scripts en een LLM bouwen er de
    rest uit op. Een codemod is interpretatie, dus hij hoort in `changelog-analysis/`, naast `action` en `example`:
    de prompt van de analyse vraagt hem enkel bij een mechanische wijziging (een attribuut of element hernoemd of
    weggehaald, een waarde vertaald), uit de commit, de diff en de diff van de web-types.
  - **Gecontroleerd tegen de web-types.** `changelog:build --check` gaat elke codemod na: het oude attribuut of
    element bestaat in de vorige versie, het nieuwe in deze, op dat element. De review-run controleert hem zoals de
    rest van de analyse.
  - **De server past hem niet toe**, want hij wijzigt geen code. `flux_get_upgrade` geeft hem door per entry, en
    `flux_check_markup` kan bij `breaks-in-target` een concrete vervanging geven, met regel en kolom; het model van de
    client voert ze uit.
  - **Weinig waarde in v2.** Van 2.0.0 tot en met 2.20.0 verdwenen er 4 attributen en 2 elementen uit de web-types,
    en enkel `anchor-positioning` → `inline-positioning` op `vl-datepicker` (2.17.0) en `data-vl-size` → `size` op
    `vl-info-tile` (2.5.0) lijken op een hernoeming. FLUX-620 (`title` → `title-label`) staat er niet bij: `title`
    bleef, als deprecated. Het model van `migreren` werkt de `action` en het `example` goed af, en een backfill van de
    71 entries met `action` levert bijna niets op.
  - **Waarde bij v3.** De overstap van v2 naar v3 brengt waarschijnlijk veel mechanische wijzigingen, bv. het
    achtervoegsel `-next` dat wegvalt en hernoemingen tussen de majors, verspreid over een hele toepassing.
- **Volgende delen van de `.llm.md` later.** Komt er kennis bij die niet in Storybook staat, bv. regels met een id en
  een ernst, of conventies voor een project, dan zet een script ze per versie in de catalogus, naast de pagina's uit
  Storybook. Een controle gaat de id's, de verplichte velden en de voorbeelden na, met `flux_check_markup` tegen de
  API van dezelfde versie, zoals `storybook:check` dat voor het eerste deel doet. `flux_get_guidance` toont ze naast
  de pagina's uit Storybook, met een eigen `kind` als bron; voor de norm gaan regels met een id voor. Welke vorm zo'n
  deel heeft, beslist Team Flux; hieronder staat wat de server ervan nodig heeft.
- **CEM later, zonder adapterlaag vooraf.** `web-types.mjs` is de enige module die het formaat kent; de rest werkt met
  wat `loadWebTypes` teruggeeft. Flux vervangt de web-types door een Custom Elements Manifest (planning 11.6), eerst
  als technische omzetting: dezelfde informatie in een ander formaat (bevestigd op 2026-10-02, door Team Flux). Dan
  volstaat een lader die hetzelfde teruggeeft, en een script dat de CEM per versie in de catalogus zet. Een versie van
  vóór de overstap houdt haar web-types; de diff tussen een versie met web-types en een met CEM vergelijkt wat beide
  laders teruggeven, zodat `flux_get_upgrade` en `breaks-in-target` over de overstap heen werken. Een generieke
  `KnowledgeSourceAdapter` voor één formaat bouwen we niet. Brengt de CEM later meer dan de web-types, zoals CSS
  custom properties en parts, dan is dat een uitbreiding van wat de lader teruggeeft.
- **De status van een component** leiden we deterministisch af:
  - `deprecated`: `deprecated` in de web-types;
  - `next`: generatie `v3-next` in de metadata van Storybook (`status.condition.generation`), bv. `vl-tabs-next`;
  - `internal`: een titel met "(intern)" in Storybook. Dat zijn styles (`CSSResult`), pagina's van soort `component`
    of `styles` zonder element, dus enkel in de documentatie;
  - `stable`: al de rest, ook de generaties `legacy` en `TODO`.

  De volledige metadata (`condition`, `evolution`) staat ernaast, zoals `getComponent` ze nu al geeft.

  Generatie `legacy` (39 componentpagina's in 2.20.0, bv. `vl-accordion`) zegt dat een component in v2 nog niet naar
  de nieuwe basis herschreven is: `HTMLElement` of govflanders-CSS. Ze is wel de component om te gebruiken, zonder
  vervanger. Een eigen status `legacy` zou een model doen denken aan de legacy componenten uit de migratiegids naar v2,
  de v1-componenten die verdwijnen, en het een component zonder alternatief laten vermijden. De beschrijving van
  `flux_get_component` zegt daarom dat generatie `legacy` de technische basis is, geen uitfasering.

#### Wat de server van een volgend deel van de `.llm.md` verwacht

Een volgend deel schrijft het Flux-team in flux-web-components; dat is apart werk. Wil de server er stukken van tonen,
dan heeft het een voorspelbare structuur nodig, met een stabiele id per sectie. Als het een Markdown-bestand wordt,
bijvoorbeeld:

~~~markdown
---
version: 2.20.0
---

# Conventies {#conventions}

## Projectstructuur {#conventions.project-structure}
…

# Patronen {#patterns}

## Formuliervalidatie {#pattern.form.validation}
Componenten: vl-…, vl-…
Regels: rule.form.001, rule.form.002
…
```html
<!-- voorbeeldcode -->
```

# Componenten {#components}

## vl-alert {#component.vl-alert}
Trefwoorden: melding, notificatie, foutmelding
Wanneer gebruiken: …
Valkuilen: …

# Regels {#rules}

## Toon validatiefouten bij het veld {#rule.form.001}
Ernst: error · Geldt voor: pattern.form.validation · Sinds: 2.18.0
…
~~~

- **Id's:** `conventions.*`, `pattern.*`, `component.<tag>` en `rule.*`. Een id is uniek binnen een versie en blijft
  over versies heen dezelfde.
- **Regels** zijn de basis voor `valideren` en `review`: een rapport en een ticket verwijzen naar het regel-id. `Sinds`
  zegt vanaf welke versie een regel geldt.
- **Trefwoorden** maken zoeken op functie mogelijk, in het Nederlands ("datumkiezer", "melding"). Tot dan komen ze uit
  de analyse van Storybook (`keywords`, ADR-003).
- **De patronen uit Storybook** (formulier, navigatie, pagina-opbouw, zoeken) zijn bruikbaar als startmateriaal voor
  de eerste patronen.

### 3. Versies

- **Verplicht en expliciet.** Elke tool met kennis per versie vraagt `version`: `2.20.0`, `v2.20.0` of `latest`. Het
  antwoord geeft altijd de effectieve versie. De queries houden hun optionele versie; de MCP-laag maakt ze verplicht,
  zodat een model niet ongemerkt de API van een andere versie krijgt (open beslissing 3).
- **`latest` is de nieuwste versie in de catalogus**, niet de nieuwste release van Flux. `flux_list_versions` zegt
  dat.
- **De versie van het project** is de exacte versie van `@domg-wc/components` in de `package.json`; de vier packages
  hebben dezelfde versie. Staat er een bereik, zoals `^2.12.0`, dan leest een recept de versie uit de lockfile en meldt
  het dat de versie niet gepind is (eis 7.A van de planning).
- **Een versie die niet in de catalogus staat:**
  - een patch op een zijtak: de tool gebruikt de hoogste versie van dezelfde minor in de catalogus, bv. 2.17.0, met
    een `warning` die zegt welke en waarom. De API is die van de minor, de fixes van de patch ontbreken. Welke versies
    patches op een zijtak zijn, staat als vaste lijst in `catalog.mjs`: de vijf uit ADR-002 (2.4.1, 2.15.1,
    2.17.1–2.17.3). Een algemene regel ("elke ontbrekende patch van een gekende minor") zou een tikfout als 2.10.7
    stil laten terugvallen, en een nieuwe 2.20.1 op 2.20.0 in plaats van te melden dat flux-mcp een update nodig
    heeft. Een nieuwe patch op een zijtak vraagt een regel in de lijst; een release van flux-mcp volgt dan toch;
  - een andere versie: `isError`, met de beschikbare versies. Is ze nieuwer dan `latest`, dan zegt de fout ook dat
    flux-mcp een update nodig heeft.
- **`from` van `flux_get_upgrade`** volgt dezelfde regels, met één uitbreiding:
  - een patch op een zijtak geldt als haar minor, ook als basis voor `apiDelta`, `dependencies` en `docs`. Een upgrade
    van 2.17.3 vergelijkt zo met 2.17.0, en de `warning` zegt dat fixes uit 2.17.1–2.17.3 als wijziging kunnen
    verschijnen (ADR-002). Zonder die terugval gaf `getChangesBetween` `complete: true` zonder diffs en zonder
    `warning`, en faalde `getDocsChanges`;
  - een versie vóór de oudste in de catalogus, zoals v1, mag. `apiDelta`, `dependencies` en `docs` ontbreken dan, met
    de reden. Vanaf 1.48.2, de vorige versie van 2.0.0, is de keten van changelogs volledig; vanaf een oudere versie
    zeggen `complete: false` en `warning` dat de wijzigingen van vóór 2.0.0 ontbreken (ADR-001, sectie 9);
  - elke andere versie die niet in de catalogus staat, geeft `isError`, zoals bij `version`.

### 4. Tools

| Tool | Vraag | Query | Vervangt |
|---|---|---|---|
| `flux_list_versions` | welke versies zijn er, en wat staat er per versie? | `listVersions`, `listDocVersions` | — |
| `flux_search_docs` | welke component, welk patroon of welk recept past bij …? | `searchDocs` | `flux_search_components`; `flux_docs_search` |
| `flux_get_component` | hoe gebruik ik deze component in versie X? | `getComponent` | `flux_component`, `flux_component_history` |
| `flux_get_guidance` | welke gidsen, richtlijnen, patronen en recepten zijn er, en wat zeggen ze? | `listPages`, `getPage` | `flux_docs_page`, `flux_docs_list` |
| `flux_get_upgrade` | wat verandert er van X naar Y, voor de componenten die ik gebruik? | `getChangesBetween`, `getDocsChanges` | `flux_get_migration`; `flux_upgrade`, `flux_changelog` |
| `flux_find_changes` | in welke versie zit `FLUX-800`, of een wijziging over …? | `findChanges` | `flux_find_change` |
| `flux_check_markup` | klopt deze markup met de API van versie X, en van Y? | nieuw, `markup.mjs` | — |

In "Vervangt" staan eerst de namen uit het ontwerpvoorstel, na de puntkomma die uit ADR-001 en ADR-003. De tools
volgen de vragen van een afnemer, niet de modules: `flux_get_component` geeft de API, de voorbeelden en de historiek
van een component in één antwoord. `flux_find_changes` komt erbij omdat "in welke versie zit dit ticket" een
gewone vraag van een afnemer is, die in de zes tools van het voorstel geen plaats had.

Voor alle tools geldt:

- **Namen:** snake_case met het prefix `flux_`, in het Engels. Prompts hebben Nederlandse namen (sectie 6).
- **Annotaties:** `readOnlyHint: true`, `idempotentHint: true`, `openWorldHint: false`, en een `title` voor mensen.
  De beschrijving is geschreven voor het model: wanneer gebruik je de tool, wanneer niet, met een voorbeeld.
- **Twee vormen van hetzelfde antwoord.** `structuredContent` volgt een `outputSchema`; `content` geeft hetzelfde
  antwoord als Markdown. De specificatie raadt aan daar de JSON als tekst te herhalen, maar Markdown leest een model
  compacter, en de pagina's zijn al Markdown. Beide komen uit dezelfde gegevens, en de tests controleren dat.
  Claude Code geeft het model echter enkel de JSON van `structuredContent`, en een `resource_link` als tekst; de
  Markdown gebruikt het niet (smoke test met Claude Code 2.1.286, increment 1). Andere clients kunnen `content` tonen.
  We houden beide vormen: de grens geldt voor de JSON, en `structuredContent` blijft machineleesbaar, bv. voor
  flux-agents. We herbekijken dat wanneer we weten welke vorm VS Code en flux-agents gebruiken.
- **Vaste velden:** `version` (de effectieve versie), `catalog` (de versie van flux-mcp), `warnings` en `sources`.
  Een bron is `{ kind, path, url? }`, met `path` relatief aan `catalog/flux/`. `kind` is `web-types`, `packages`,
  `changelog`, `changelog-analysis`, `storybook` of `storybook-analysis`. Wat uit een `*-analysis` komt, schreef een
  LLM, gecontroleerd door een tweede run. Per entry zegt `impactSource` dat al, en per pagina `analysis`.
- **Fouten** zijn een resultaat met `isError: true`, zonder `structuredContent`, en een tekst waarmee het model verder
  kan. Een `CatalogError` heeft die tekst al; verwijst ze naar een andere vraag, dan noemt ze de tool, bv.
  `flux_search_docs`, niet de functie. Een andere fout geeft een algemene tekst, en de details gaan naar stderr. Een
  protocolfout is er enkel voor een onbekende tool of een ongeldige aanvraag.
- **Omvang.** De standaard is `detail: "summary"`. Een antwoord blijft standaard onder 10.000 tokens:
  - **De grens** is 30.000 tekens, gemeten op de JSON van `structuredContent`, de grootste van de twee vormen. Tekens
    in plaats van tokens, zodat de grens niet van een tokenizer afhangt en de cursor deterministisch is. De smoke test
    ging na welke vorm Claude Code aan het model geeft: enkel de JSON. De grens geldt dus voor wat het model leest.
  - **Eén lijst, op volgorde.** Wat een antwoord kan doen groeien, staat in een vaste volgorde, per tool beschreven.
    Een deel stopt bij het laatste item dat nog onder de grens past, en geeft een `nextCursor`; `cursor` haalt het
    volgende deel. Elk deel heeft de vaste velden, en bij `flux_get_upgrade` ook `resolved`.
  - **De cursor** is ondoorzichtig en deterministisch: de tool, een hash van de andere argumenten en de positie. Een
    cursor met andere argumenten geeft `isError`.
  - De tests meten de omvang voor de grootste gevallen.

#### 4.1 `flux_list_versions`

- **Input:** `detail`.
- **Output:** `latest`; per versie de datum, `previous`, of die in de catalogus staat, de tellingen per impact, en
  welke bronnen er zijn: web-types, packages, de analyse van de changelog (`complete`, `partial` of `missing`), en het
  aantal pagina's met en zonder analyse. Daarnaast `coverage`: de oudste en de nieuwste versie, de gaten in de keten,
  en wat er bewust niet in staat (v1 en de patches op een zijtak). Met `detail: "full"` ook de `summary` per versie.

#### 4.2 `flux_search_docs`

- **Input:** `version`, `query` (Nederlands of Engels), `kind` (`component`, `guide`, `guideline`, `pattern`,
  `recipe`, `styles`, `planning`, `flux-team`), `limit` (standaard 10) en `includeFluxTeam`.
- **Output:** per resultaat de pagina, de titel, de soort, de elementen met hun status, de samenvatting, de passage,
  de score en de link naar Storybook; daarnaast `total` en `hiddenFluxTeam`.
- **Standaard verborgen** is enkel het werk van het Flux-team zelf (Bijdragen, Beheren), zoals `searchDocs` nu; het
  komt met `includeFluxTeam` of `kind: "flux-team"`. De planning staat er wel bij: "wanneer komt v3?" is een vraag van
  een afnemer, en zoeken op "v3" geeft drie planningspagina's bovenaan.
- **Werking:** zoals `searchDocs` nu: vaste gewichten voor de titel, de id, de elementen, de zoektermen en de
  samenvatting uit de analyse, en de tekst; bij een gelijke score beslist de id. Zonder analyse van Storybook zijn er
  geen zoektermen en samenvattingen. Zoeken op functie, zoals "datumkiezer", werkt dan enkel als de tekst van de
  pagina het woord bevat.
- Er is geen aparte zoektool voor componenten: een componentpagina noemt haar elementen, en `kind: "component"`
  beperkt de resultaten tot componenten.

#### 4.3 `flux_get_component`

- **Input:**
  - `version`;
  - `component`: een element (`vl-button`, `button`), een Storybook-id (`components-atom-button`) of een link naar
    Storybook. De Figma-description en de documentation link noemen de Storybook-id, Code Connect het element
    (ADR-003, sectie 8); met elk van beide vindt een agent de component. Toont de pagina meerdere elementen (14
    componentpagina's over alle versies, bv. `components-block-next-tabs` met vier), dan geeft de tool het
    hoofdelement: het element waarvan de naam, zonder `vl-`, `map-` en `-next`, het langste einde van de id vormt,
    bv. `components-block-tabs-tabs` → `vl-tabs` en `components-block-next-tabs` → `vl-tabs-next`. Die regel geeft
    voor elk van de 14 precies één element. De andere elementen staan in `related`. Past er geen, dan geeft de tool
    `isError` met de elementen van de pagina;
  - `sections`: een deel van `api`, `examples`, `docs` en `history`; standaard `api` en `examples`;
  - `detail`.
- **Output:**
  - het element, de soort, de status en de beschrijving;
  - `api`: de attributen, properties, slots en events met type, default en `deprecated`, en met `detail: "full"`
    hun beschrijving. Daaronder de `notes` uit de analyse over wat niet in de web-types staat, bv. `ellipsis` van
    `vl-breadcrumb`;
  - `examples`: per story de naam, de link en de code uit de analyse. Zonder analyse enkel de naam en de link, met
    `analysis: "missing"`;
  - `docs`: de pagina als Markdown, met de voorbeelden, de API en absolute links. Zonder die sectie een
    `resource_link` naar `flux://{version}/docs/{page}`;
  - `history`: wat er de vorige versies aan de component veranderde, enkel entries met impact (`getComponentHistory`);
  - `related`: de andere elementen van de pagina en de pagina's waarnaar ze verwijst;
  - `sources`.

  Een element zonder pagina, zoals `vl-map-click-action-pindrop` en `vl-map-layer-action` in 2.20.0, geeft de API,
  zonder pagina en zonder voorbeelden.
- **Fouten:**
  - een onbekend element geeft de dichtstbijzijnde namen ("bedoelde je `vl-button`?"), op bewerkingsafstand, met een
    alfabetische tie-break;
  - bestaat het element in een andere versie, dan zegt de fout dat, bv. "`vl-x` bestaat vanaf 2.18.0" of "`vl-x`
    staat laatst in 2.19.0; zie `flux_get_upgrade`". Daarvoor houdt de server per element bij in welke versies het
    in de web-types staat.

#### 4.4 `flux_get_guidance`

- **Input:** `version`, `id`, `kind` (`guide`, `guideline`, `pattern`, `recipe`, `styles`, `planning`, `flux-team`;
  standaard alle behalve `flux-team`), `appliesTo` (een element), `limit` en `cursor`.
- **Zonder `id`:** een index van `{ id, kind, title, summary }`. In 2.20.0 zijn dat 95 pagina's: 8 gidsen,
  30 richtlijnen, 21 patronen, 15 recepten, 16 over styles en 5 over de planning.
- **`appliesTo`** geeft enkel de pagina's die het element noemen: de naam als heel woord in de tekst of in de
  voorbeelden van de analyse, en enkel namen die in de web-types van die versie staan. Zo telt een class als `vl-u-…`
  of `vl-grid` niet. "Tonen" kan niet: `elements` is leeg voor elke pagina die geen componentpagina is. In 2.20.0
  noemen 11 van deze pagina's `vl-input-field`.
- **Met `id`:** de pagina als Markdown, zoals `getPage` ze samenvoegt, met haar links en `sources`.
- Het werk van het Flux-team (Bijdragen, Beheren) komt enkel met `kind: "flux-team"`, zoals bij `flux_search_docs`.
  Een componentpagina geeft `flux_get_component`.
- **De id is de referentie.** Een rapport verwijst naar de id van een pagina, bv. `patronen-formulier-validatie`, of
  naar een code van `flux_check_markup`. Met een volgend deel van de `.llm.md` met regels komen daar de regel-id's bij
  (`rule.form.001`).

#### 4.5 `flux_get_upgrade`

- **Input:**
  - `to` (verplicht; `latest` mag);
  - `from`: de versie van het project. Zonder `from` geldt de vorige versie van `to`, dus wat er in `to` nieuw is;
  - `components`: de elementen die het project gebruikt;
  - `impact`: een filter; standaard `action`, `opt-in` en `automatic`;
  - `detail` en `cursor`.
- **Output:**
  - `resolved`: `from`, `to`, de versies van de keten, `complete`, `missing`, `warning` en `crossesMajor`;
  - `changes`: per impact de entries met versie, id, ticket, componenten en tekst. Een entry met `action` krijgt
    altijd haar `action`; de uitleg en het voorbeeld komen met `detail: "full"`, of met `components`, als het
    antwoord klein genoeg blijft;
  - `general`: met `components` ook de entries die geen component en geen thema noemen, per impact zoals `changes`.
    Een wijziging aan de globale styling of aan de build raakt elk project, maar valt anders weg uit een filter op
    componenten. Ook een element in de tekst telt als noemen. Over alle versies zijn dat 39 van de 300 entries met een
    impact;
  - `apiDelta`: de netto diff van de web-types tussen `from` en `to`, enkel het contract, voor de gevraagde
    componenten; de beschrijvingen met `detail: "full"`;
  - `unexplained`: de wijzigingen aan het contract zonder changelog-entry (`inChangelog: false`, ADR-001 sectie 6);
  - `dependencies` en `unlistedCommits`;
  - `docs`: welke pagina's erbij kwamen, wijzigden of verdwenen (`getDocsChanges`), voor de gevraagde componenten en
    de gidsen, richtlijnen, patronen en recepten;
  - `summaries`: de samenvatting per versie, met `detail: "full"`;
  - `hiddenNoImpact` en `hiddenDescriptions`.
- **Volgorde bij paginering:** per impact, eerst `action`, dan `opt-in`, dan `automatic`, telkens de entries van
  `changes` en dan die van `general`, per versie oplopend. Daarna `apiDelta`, `unexplained`, `docs`, `dependencies`,
  `unlistedCommits` en, met `detail: "full"`, `summaries`. Zo krijgt een model wat actie vraagt altijd eerst. Dat
  telt: van 2.0.0 naar 2.20.0 zijn er 280 entries met impact, en `apiDelta` is zonder `components` alleen al 69 KB.
- **Een hernoeming over meerdere versies** (a→b in de ene, b→c in een latere) vatten we niet samen. De netto diff
  toont a weg en c erbij, en de entries van beide versies staan in `changes`; het model legt het verband. Automatisch
  samenvatten vraagt interpretatie.
- **Een downgrade** geeft `isError`, zoals `getChangesBetween` nu.
- **Over een major heen.** De catalogus bevat enkel v2: van v1 naar v2 geeft `complete: false`. Komt v3 erbij, dan
  geeft de tool bij `crossesMajor: true` de laatste versie van elke major als mogelijke tussenstap (planning 11.4).
- **De migratie zelf** schrijft het model van de client, uit dit antwoord: de planning (11.4) laat een sterk model één
  migratiedocument schrijven voor een concrete toepassing, over alle tussenliggende versies. Het recept `migreren`
  doet dat.

#### 4.6 `flux_find_changes`

- **Input:** `query` (een ticket, zoals `FLUX-800`, of tekst), `component`, `includeNoImpact` (standaard `true`) en
  `limit`.
- **Output:** per resultaat de versie, de id, het ticket, het type, de impact, de componenten, de tekst en de uitleg;
  daarnaast `coverage`.
- Deze tool heeft bewust geen `version`: hij zoekt over alle versies.

#### 4.7 `flux_check_markup`

- **Input:** `version`, `markup` (tot 50 KB), `syntax` (`lit` of `html`; standaard `lit`) en `targetVersion`.
- **Lit.** De invoer mag een template zijn of een heel `.ts`- of `.js`-bestand; de tool neemt er de templates
  `` html`…` `` uit, en zonder zo'n template de hele tekst. `${…}` wordt een placeholder: een dynamische waarde
  controleert de tool niet. `attr=${…}` is een attribuut, `.prop=${…}` een property, `@event=${…}` een event en
  `?attr=${…}` een boolean attribuut. Een dynamische tag (`unsafeStatic`, `literal`) geeft een `info`.
- **Output:** `findings` met `code`, `severity`, `message`, `element`, `attribute`, `line`, `column`, `suggestion`,
  `source` en, bij `breaks-in-target`, `entry`; daarnaast een telling per ernst en het aantal `vl-*`-elementen.
- **Codes:**

  | Code | Ernst | Wanneer |
  |---|---|---|
  | `unknown-element` | error | een `vl-*`-element dat niet in de web-types staat; met suggesties en "bestaat vanaf …" |
  | `deprecated-element` | warning | `deprecated` in de web-types, met de tekst ervan |
  | `next-element` | info | generatie `v3-next`: een voorloper van v3 |
  | `unknown-attribute` | error | niet in de web-types en geen globaal HTML-attribuut; warning als een analyse het als `not-in-web-types` kent |
  | `invalid-attribute-value` | warning | enkel waar de web-types een lijst van waarden geven: 52 van de 918 attributen in 2.20.0 |
  | `deprecated-attribute` | warning | `deprecated` in de web-types |
  | `boolean-attribute-false` | warning | bv. `disabled="false"`, dat het attribuut net aanzet; voor attributen met default `"false"` of `"true"` |
  | `unknown-property` | warning | `.prop` die niet in de web-types staat en geen standaard property van een HTML-element is |
  | `unknown-event` | warning | `@event` die niet in de web-types staat en geen standaard DOM-event is |
  | `unknown-slot` | warning | `slot="x"` op een direct kind van een `vl-*`-element zonder slot `x` |
  | `breaks-in-target` | error of warning | met `targetVersion`: wat in die versie een bevinding geeft en nu niet, met de ernst van die bevinding; met de entry uit de changelog, of anders `unexplained` |
  | `dynamic-tag` | info | een tag die pas bij het uitvoeren gekend is |
  | `lit-syntax` | error | enkel voor `storybook:check`: `.prop`, `@event` of `?attr` in een voorbeeld, dat gewone HTML is |

- **Buiten scope:** elementen die niet met `vl-` beginnen, behalve als kind voor de controle van de slots.
- **Grens:** de tool toetst enkel de API. Of patronen, toegankelijkheid en UX kloppen, beoordeelt het model met
  `flux_get_guidance`.
- **Eén implementatie.** `server/src/markup.mjs` is een eigen tokenizer voor HTML en lit, zonder dependencies, zoals de
  parser voor MDX. Hij houdt regel en kolom bij, kent commentaar, `<script>`, `<style>` en `<template>`, en neemt als
  ouder van een element het element waarin het staat; in een geneste template het element waarin de `${…}` staat. Een
  slot controleert hij enkel op een direct kind van een `vl-*`-element: het slot-attribuut werkt enkel daar, en het
  dichtstbijzijnde `vl-*`-element zou valse meldingen geven. `storybook:check` gebruikt dezelfde module voor de
  voorbeelden van de analyse, in plaats van `elementsInHtml`; daar weigert ze lit-syntax, zoals voorheen.
- **Onvolledige web-types** geven valse fouten. Een attribuut dat wel in de code staat maar niet in de web-types, zoals
  `ellipsis`, is een error tot een analyse van Storybook het als `not-in-web-types` noteert. De boodschap zegt dat de
  web-types onvolledig kunnen zijn en verwijst naar `flux_get_component`.
- **Waarden en slots zijn een warning** (beslist op 2026-10-01, bij de bouw van increment 2). De eerste versie gaf er
  een error voor. Op de voorbeelden van alle analyses gaf dat 586 bevindingen in 67 analyses, en geen enkele was een
  fout in een voorbeeld: de web-types waren onvolledig. `placement="bottom-end"` en `trigger="click hover"` van
  `vl-popover` zijn geldig volgens de beschrijving van het attribuut, `vl-content-header` heeft de slots `title-link` en
  `context-link` naast `image`, en `vl-wizard` geeft zijn slots zonder naam. Een error zou een agent geldige code laten
  "herstellen". Als warning ziet het model ze nog, met de toegelaten waarden erbij.

### 5. Resources

Tools blijven de primaire interface: een model kan in veel clients zelf geen resource lezen. Resources zijn er voor de
gebruiker, bv. met `@` in Claude Code, en voor clients zonder ondersteuning voor prompts.

| URI | Inhoud | Query |
|---|---|---|
| `flux://versions` | de versies, als JSON | `listVersions`, `listDocVersions` |
| `flux://{version}/changelog` | de changelog van één versie, als Markdown | `getChangelog` |
| `flux://{version}/docs` | de index van de pagina's, als Markdown | `listPages` |
| `flux://{version}/docs/{page}` | één pagina, samengevoegd | `getPage` |
| `flux://{version}/components/{component}` | één component, zoals `flux_get_component` met alle secties | `getComponent` |
| `flux://prompts/{name}` | een recept als tekst | — |
| `flux://templates/{workflow}` | een rapportsjabloon | — |

- **De versie eerst.** Dat vervangt `flux://changelog/{versie}` (ADR-001) en `flux://storybook/{versie}/{pagina}`
  (ADR-003). Alle resources van een versie delen zo een prefix, en de aanvulling gaat van de versie naar de pagina.
- `{version}` mag `latest` zijn; de inhoud noemt de effectieve versie.
- `resources/list` geeft enkel `flux://versions`, de recepten en de sjablonen; 26 versies met samen 5500 pagina's is
  te veel voor een lijst. De rest staat in `resources/templates/list`.
- `completion/complete` vult `{version}`, `{page}` en `{component}` aan.

### 6. Prompts: de workflowrecepten

#### 6.1 Rol

- **Een recept is een workflow** die de ontwikkelaar zelf start: prompts zijn in MCP user-controlled. Het legt vast:
  het doel en de grenzen, de voorwaarden, welke tools in welke volgorde, de checkpoints en de verificatie, en het
  rapportformaat.
- **Geen kennis over een versie in het recept.** Die haalt het model met de tools, voor de versie van het project: de
  server kent die versie niet, want ze staat in de `package.json` van het project. Enkel wat niet van een versie
  afhangt, zoals het rapportsjabloon, gaat als embedded resource mee.
- **Beperkte argumenten.** Ze zijn gestructureerd, zonder vrij veld "opdracht" waarmee de workflow zelf te
  herdefiniëren is.
- **Nederlandse namen**, want ze verschijnen als slash-commando, bv. `/mcp__flux__migreren` in Claude Code met `flux`
  als naam van de server. De namen van de tools blijven Engels.
- **Een aanbevolen model en effort** in de beschrijving van elk recept, als advies: de client beslist. De planning
  (11.4) laat een sterk analysemodel (Fable) de analyse doen en een uitvoeringsmodel (Opus) het bouwen. flux-agents
  past dat intern wel toe.
- **Markdown in de repo.** De recepten staan in `server/prompts/<naam>.md`, de rapportsjablonen in
  `server/templates/<workflow>.md`, zodat Team Flux ze reviewt zoals documentatie. De map `prompts/` in de root blijft
  voor de prompts die de catalogus onderhouden (`changelog-analyse.md`, `storybook-analyse.md`,
  `figma-descriptions.md`, …): die draaien in deze repo, een recept draait in een project.
- **Het renderen** is `{{argument}}` vervangen, plus het sjabloon als embedded resource. Geen andere templating, en
  deterministisch.

#### 6.2 Overzicht

| Prompt | Argumenten | Workflow (planning, sectie 5) | Resultaat | Tools | Increment |
|---|---|---|---|---|---|
| `migreren` | `doelversie` (standaard `latest`) | 5.2 | de migratie en een migratierapport | `flux_get_upgrade` met `components`, `flux_get_component` in de doelversie, `flux_check_markup` met `targetVersion` | 3 |
| `toepassing-aanmaken` | `naam` (verplicht) | 5.1 | een nieuw project uit de flux-starter-app, en een rapport | `flux_get_guidance` (de starter-app), `flux_list_versions`, `flux_check_markup` | 5 |
| `toepassing-analyseren` | `figma` (url van het ontwerp, verplicht) | 5.1 | de analyse van de toepassing in `.flux/analyse/toepassing.md`, geen codewijzigingen | de Figma MCP (bij de client), `flux_get_guidance` (patronen, richtlijnen), `flux_search_docs`, `flux_get_component`, `flux_check_markup` | 5 |
| `toepassing-skelet-bouwen` | geen | 5.1 | de opbouw van de pagina, het menu en een leeg scherm per scherm, en een rapport | `flux_get_guidance` (patronen), `flux_get_component`, `flux_check_markup` | 5 |
| `scherm-analyseren` | `scherm` (id, verplicht), `figma` (frame, optioneel) | 5.1 | de analyse van een scherm in `.flux/analyse/schermen/<scherm>.md`, geen codewijzigingen | de Figma MCP (bij de client), `flux_get_component`, `flux_search_docs`, `flux_get_guidance`, `flux_check_markup`, `flux_find_changes` | 5 |
| `scherm-bouwen` | `scherm` (id, verplicht) | 5.1 | een scherm volgens zijn analyse, en een rapport | `flux_get_component`, `flux_get_guidance`, `flux_check_markup` | 5 |
| `valideren` | `scope` (pad of glob; standaard de hele toepassing) | 5.3 | een afwijkingenrapport, geen codewijzigingen | `flux_get_guidance` (richtlijnen, patronen), `flux_check_markup`, `docs` van `flux_get_upgrade` naar `latest` | 4 |
| `verbeteren` | `rapport` (pad naar een afwijkingenrapport), `afwijkingen` (id's, optioneel) | 5.3 | codewijzigingen, een rapport, en de normkandidaten als ticket | `flux_get_guidance` met de id uit het rapport, `flux_get_component`, `flux_check_markup` | 4 |
| `review` | `basis` (branch; standaard de hoofdbranch) | 5.4 | een reviewrapport op de diff, als commentaar op de PR | `flux_check_markup` op de diff, `flux_get_guidance` | 4 |
| `uitbreiden` | `ticket` (Jira-key) of `figma`, minstens één | 5.1 | een uitbreiding en een rapport | zoals `scherm-analyseren` en `scherm-bouwen` samen, plus `flux_check_markup` op de gewijzigde bestanden | 4 |

- **Het Jira-ticket** (planning 5.4) is geen aparte prompt: `uitbreiden` begint met de analyse van het ticket, met
  `flux_search_docs` en `flux_get_component`. Elke prompt die code wijzigt, eindigt met de processtap (6.3, stap 7).
- **`migreren` eerst.** De kennis ervoor is volledig: elke versie heeft een analyse, en de verificatie
  (`flux_check_markup`, build, lint en e2e) is deterministisch. De prompt `flux-upgrade` uit ADR-001 is deze.
- **`design-naar-code` erbij** in hetzelfde increment: het steunt op de documentatie, de voorbeelden en de API, en de
  Figma-descriptions en Code Connect noemen al de Storybook-id en het element. Sinds 2026-10-05 vervangen door de vijf
  recepten van ontwerp naar toepassing (hieronder).
- **`valideren`, `verbeteren` en `review` daarna.** Ze hebben een norm nodig: de richtlijnen en patronen uit
  Storybook, het eerste deel van de `.llm.md`, zonder regel-id's en zonder ernst per regel.
- **`review` beoordeelt enkel de diff** (beslist op 2026-10-02): wat de branch toevoegt of wijzigt, ook een bestaande
  afwijking op een gewijzigde regel. Een afwijking op een regel die de diff niet raakt, is werk voor `valideren`. Een
  review van de hele gewijzigde bestanden gaf in de fixture 19 meldingen voor een pull request van een paar velden.
- **Van ontwerp naar toepassing in vijf recepten** (beslist op 2026-10-05), in de plaats van `design-naar-code` en
  `nieuwe-toepassing`. We bouwen typisch toepassingen met meerdere schermen, en één recept dat een ontwerp in één
  keer naar code brengt, is daarvoor te veel: er is geen analyse van de toepassing als geheel, geen gedeelde opzet van
  menu en navigatie, en geen analyse per scherm die een mens nakijkt voor er gebouwd wordt. De vijf stappen:
  1. `toepassing-aanmaken` kloont de flux-starter-app (`https://git.omgeving.vlaanderen.be/git/flux/flux-starter-app`;
     de Storybook-pagina `afnemen-starter-app`). De remote `origin` wordt `starter`, zodat het team later wijzigingen
     van de starter kan mergen, zoals bij een fork. Het recept pint de `@domg-wc`-packages op de versie van de starter,
     en zet flux-mcp in de `.mcp.json`. Het draait in de map waarin het project komt; de volgende stappen draaien in het
     project;
  2. `toepassing-analyseren` beschrijft uit het ontwerp de schermen, met een id per scherm, het menu en de navigatie,
     de opbouw van de pagina en de gedeelde componenten;
  3. `toepassing-skelet-bouwen` bouwt daarmee de opbouw, het menu, en per scherm een route met een leeg scherm, met
     enkel de titel;
  4. `scherm-analyseren` beschrijft één scherm zo dat het te bouwen is zonder het ontwerp opnieuw te interpreteren:
     per deel het element, de attributen en de teksten, het gedrag, de data en de acceptatiecriteria;
  5. `scherm-bouwen` vult het lege scherm volgens die analyse, en wijzigt het menu, de routes en andere schermen niet.

  Een analyse wijzigt geen code; het team en de ontwerper reviewen ze in een pull request voor de volgende stap. Zo kan
  elke stap opnieuw draaien als het ontwerp wijzigt, en krijgt elke stap het model dat erbij past: een sterk
  analysemodel voor de analyses, een uitvoeringsmodel voor het bouwen. Een bestaande toepassing die een scherm uit een
  ontwerp krijgt, gebruikt `uitbreiden`. De namen zeggen wat een recept oplevert, met een voorvoegsel per niveau, zodat
  ze bij elkaar staan in de lijst van slash-commando's; `toepassing-starten` viel af, omdat het klinkt als het starten
  van de toepassing.
- `completion/complete` vult `doelversie` aan met de versies.

#### 6.3 Vast stramien per recept

1. **Doel en grenzen.** Wat de workflow wel en niet doet. `migreren` doet bv. geen functionele of visuele wijzigingen
   buiten wat de migratie vraagt.
2. **Voorwaarden** (eis 7.A van de planning):
   - de versie van Flux is exact gepind in de `package.json`;
   - de toepassing start standalone, en de e2e-testen draaien zonder echte backend. Dat neemt de vierde eis van 7.A,
     "backend uitgemockt", mee: voor de verificatie telt dat de e2e-testen herhaalbaar draaien, niet hoe de backend
     gemockt is (beslist op 2026-10-01);
   - er is een e2e-suite, en die is groen.

   Ontbreekt er een, dan stopt het recept en meldt het wat ontbreekt. Voor `migreren` en `verbeteren` blokkeert een
   ontbrekende e2e-suite: zonder testen is het giswerk (planning 5.2).
3. **Kennis ophalen** met de tools, in een vaste volgorde.
4. **Checkpoint.** Het recept toont de analyse of het plan, en wacht op bevestiging voor het code wijzigt: korte
   cycli met een mens ertussen, geen lange autonome run. Een recept dat geen code wijzigt, zoals `valideren`, `review`
   en de analyses `toepassing-analyseren` en `scherm-analyseren`, heeft geen checkpoint (beslist op 2026-10-02): de
   beslissing van mensen valt in de pull request, en stap 7 vraagt bevestiging voor die er komt. De sectie Checkpoint
   zegt dat, zodat het stramien gelijk blijft.
5. **Uitvoeren** in kleine stappen: per component, per afwijking of per scherm.
6. **Verifiëren:**
   - `flux_check_markup` op elk gewijzigd bestand;
   - build, lint en e2e.

   Blijft iets rood na drie pogingen, dan stopt het recept en rapporteert het.
7. **Rapport en proces.** Het recept vult het sjabloon volledig in en schrijft het rapport weg (6.4). Heeft de
   omgeving een koppeling met Jira en Git, dan stelt het voor een branch en een PR aan te maken, met het rapport als
   beschrijving. Het doet dat nooit zonder bevestiging.

#### 6.4 Rapporten

Elk rapport is Markdown met YAML-frontmatter. Het sjabloon komt uit `flux://templates/{workflow}`. Waar het rapport
terechtkomt (open beslissing 6):

- **In `.flux/rapporten/<datum>-<workflow>.md`** in het project, en in git. Bestaat die naam al, dan wordt het
  `<datum>-<workflow>-2.md`, `-3`, …: een rapport overschrijft nooit een ander.
- **Een recept dat code wijzigt** (`migreren`, `toepassing-aanmaken`, `toepassing-skelet-bouwen`, `scherm-bouwen`,
  `uitbreiden`, `verbeteren`) zet het rapport in de PR van die wijziging. `toepassing-aanmaken` heeft nog geen PR: het
  rapport komt in de eerste commit van het project.
- **De analyses** van `toepassing-analyseren` en `scherm-analyseren` (beslist op 2026-10-05) zijn geen rapport maar een
  levend document waarop de volgende stappen steunen: `.flux/analyse/toepassing.md` en
  `.flux/analyse/schermen/<scherm>.md`, in git, zonder datum in de naam. Een nieuwe run werkt het document bij, en
  behoudt wat een mens erin besliste, zoals een antwoord op een open vraag; git houdt de vorige versies bij. De
  analyse krijgt een eigen PR, waarin het team en de ontwerper ze reviewen. Het sjabloon in `flux://templates/` is
  het formaat van het document.
- **`valideren`** wijzigt geen code: het rapport krijgt een eigen PR. Daarin beslissen team en ontwerper per afwijking,
  met commentaar per regel, en zetten ze `uitkomst`; na de merge leest `verbeteren` het rapport. Dat is de menselijke
  beslissing tussen beide uit de planning (5.3 en 7.B).
- **`review`** schrijft geen bestand: een bestand in de branch die het beoordeelt, zou die PR wijzigen. Het rapport
  komt als commentaar op de PR, na bevestiging, of anders als tekst. Het recept geeft het als laatste deel van zijn
  antwoord, tussen `~~~markdown` en `~~~`, in het formaat van de afwijkingen, met een `oordeel`: `goedkeuren`,
  `aanpassen` of `bespreken`.

Een migratierapport:

```markdown
---
workflow: migreren
flux-mcp: 1.4.0
bronversie: 2.12.0
doelversie: 2.20.0
datum: 2026-10-05
resultaat: geslaagd | gedeeltelijk | gestopt
e2e: groen | rood | ontbreekt
---
## Analyse
## Plan
## Uitgevoerd            <!-- per entry: versie, id en ticket -->
## Niet automatisch opgelost
## Verificatie
```

Het afwijkingenrapport van `valideren` heeft per afwijking een kop `### A-007: <in één zin>`, dan de vaste velden
als lijst `- veld: waarde`, en daaronder de beschrijving: wat de toepassing doet, wat de norm vraagt en het voorstel,
met een codefragment. De velden:

- `regel`: de id van een pagina (`patronen-formulier-validatie`), een code van `flux_check_markup`, of later een
  regel-id uit de `.llm.md`. Eén regel per afwijking: raakt één plek twee regels, dan zijn het twee afwijkingen, zodat
  `verbeteren` per regel beslist en een normkandidaat één ticket wordt;
- `locatie`: `pad:regel`, met het pad relatief aan de root van het project en de regel waar het element of de code
  begint;
- `ernst`: `error`, `warning` of `info`, zoals bij `flux_check_markup`;
- `uitkomst`: `volgt-norm`, `normkandidaat` of `te-beslissen`;
- `norm`: "gewijzigd sinds X" of "nieuw sinds X" als de pagina van de regel sinds de gepinde versie X wijzigde of
  erbij kwam, anders `—` (open beslissing 2);
- `vereist`: "migratie naar X of hoger" als het voorstel een element of API vraagt die pas vanaf X bestaat, anders
  `—`. Voor een element zegt `flux_check_markup` op de gepinde versie "bestaat vanaf X"; voor een attribuut of een
  API in JavaScript, zoals `CrossValidationMixin` (2.19.0, FLUX-610), zegt de changelog het (`flux_find_changes`).

Een normkandidaat motiveert in de beschrijving waarom de toepassing beter is dan de norm, of welk gat ze vult. Het
rapport eindigt met de sectie **Normkandidaten** (6.6): per afwijking met `uitkomst: normkandidaat` haar id en één
zin. `uitkomst` beslist: zet het team in de review een andere uitkomst, dan past het die ene regel aan, en
`verbeteren` volgt `uitkomst`, niet de sectie. `verbeteren` neemt het rapport als invoer en werkt enkel de
afwijkingen met `uitkomst: volgt-norm` en zonder `vereist` weg; een afwijking die een migratie vraagt, laat het
liggen met een verwijzing naar `migreren`.

Dit formaat is leesbaar in een PR, met plaats voor uitleg en code, en een beslissing over `uitkomst` is een
commentaar en een diff op één regel. Een tabel heeft geen plaats voor een codefragment, en breekt op een `|` in de
tekst; YAML vraagt een eigen parser voor geneste lijsten, zonder dependencies; een JSON-bestand naast het rapport zet
dezelfde inhoud twee keer in git.

#### 6.5 Voorbeeld: `server/prompts/migreren.md`

~~~markdown
---
name: migreren
title: Migreer naar een nieuwere versie van de Flux web-componenten
description: >
  Brengt deze toepassing van de gepinde versie naar een doelversie: analyse, plan, uitvoering en verificatie.
  Geen functionele wijzigingen. Aanbevolen: een sterk analysemodel voor stap 2, een uitvoeringsmodel voor stap 4.
arguments:
  - name: doelversie
    description: Doelversie (bv. 2.20.0) of "latest"
    required: false
template: migreren
---

Je migreert deze toepassing naar versie {{doelversie}} van de Flux web-componenten. Je wijzigt niets aan de
functionaliteit of de vormgeving, behalve wat de migratie vraagt.

## 1. Voorwaarden
- Lees de versie van @domg-wc/components uit package.json: de bronversie. Is ze niet exact gepind? Stop en meld dat.
- Controleer dat de e2e-testen bestaan en groen zijn op de bronversie. Zo niet: stop en meld dat een migratie zonder
  testen niet te verifiëren is.

## 2. Analyse
- Inventariseer welke vl-elementen de toepassing gebruikt.
- Roep `flux_get_upgrade` aan met from = de bronversie, to = {{doelversie}} en components = die lijst. Haal met
  `cursor` alle delen op. Neem ook `general`, `unexplained`, `dependencies` en `docs` mee.
- Roep `flux_check_markup` aan met version = de bronversie en targetVersion = {{doelversie}} op de bestanden met
  vl-elementen.
- Is `crossesMajor` true? Stel dan een tussenstap voor op de aangeboden versie.
- Vul de secties Analyse en Plan van het sjabloon in.

## 3. Checkpoint
- Toon het plan. Wacht op bevestiging voor je code wijzigt.

## 4. Uitvoering
- Werk het plan af per component, met `flux_get_component` in de doelversie waar je de API of een voorbeeld nodig hebt.
- Zet de versie van de @domg-wc-packages in package.json op de doelversie.

## 5. Verificatie
- Roep `flux_check_markup` aan met version = {{doelversie}} op elk gewijzigd bestand, en los elke error op.
- Draai build, lint en e2e. Blijft iets rood na 3 pogingen? Stop en rapporteer.

## 6. Rapport
- Vul het sjabloon volledig in en schrijf het naar .flux/rapporten/<datum>-migreren.md.

## 7. Proces (optioneel)
- Heeft deze omgeving een koppeling met Jira en Git? Stel dan een branch en een PR voor, met het rapport als
  beschrijving. Voer dat pas uit na bevestiging.
~~~

De server vervangt de argumenten en voegt het sjabloon toe als embedded resource. `server/prompts/migreren.md` werkt
dit voorbeeld uit, met de voorwaarden van 6.3.

#### 6.6 Terugkanaal: normkandidaten

Zonder een vast kanaal terug naar Team Flux draait de terugkoppellus uit de planning (sectie 6) niet.

- `valideren` markeert een afwijking die mogelijk beter is dan de norm, of een gat in de norm vult, als
  `normkandidaat`. Het motiveert dat, met een codefragment en de locatie.
- Het rapport bundelt de kandidaten in de sectie **Normkandidaten**, in een vast formaat dat Team Flux later kan
  verzamelen.
- Het projectteam beslist in de PR van `valideren` welke afwijkingen een normkandidaat blijven (6.4). Indienen komt
  daarna: `verbeteren` leest het gemergde rapport, en eindigt met een voorstel om de kandidaten met
  `uitkomst: normkandidaat` in te dienen (open beslissing 1). Dat is een ticket per kandidaat in het Jira-project
  `FLUX` van Team Flux, met het label `normkandidaat` en de frontmatter van het rapport. Het recept maakt het ticket
  na bevestiging, als de client een koppeling met Jira heeft, en geeft anders de tekst om te plakken.
- Of de toepassing de norm volgt of de norm de toepassing, blijft een beslissing van mensen (planning, sectie 6).

#### 6.7 Hergebruik en versionering

- **flux-agents** haalt de recepten op met `prompts/get` en voert ze uit met het model dat Team Flux kiest. Het voegt
  er zijn eigen integraties aan toe, zoals Jira en de PR. Er is geen tweede, interne versie van een workflow.
- **Versionering.** Een recept en een sjabloon horen bij de versie van flux-mcp, niet bij die van Flux. Ze werken voor
  elke versie in de catalogus, omdat de kennis per versie via de tools komt. Elke wijziging aan een recept krijgt een
  entry in de changelog van flux-mcp.
- **Clients zonder prompts** lezen een recept als `flux://prompts/{name}`.

### 7. De instructies van de server

> Flux-MCP levert kennis over de Flux web-componenten (`@domg-wc/*`) per versie, en recepten voor de Flux-workflows
> als prompts. Neem de versie van `@domg-wc/components` uit de package.json van het project en geef ze mee aan elke
> tool; `latest` is de nieuwste versie in deze catalogus. Zoek met `flux_search_docs`, haal een component op met
> `flux_get_component`, en gidsen, richtlijnen, patronen en recepten met `flux_get_guidance`. Voor een upgrade:
> `flux_get_upgrade`, met de componenten die het project gebruikt. Controleer gegenereerde of gewijzigde markup met
> `flux_check_markup`. De API komt uit de web-types; tekst uit een bron `*-analysis` schreef een LLM. Volg bij een
> Flux-prompt de stappen, de checkpoints en het rapportformaat. De server leest of wijzigt geen code; dat doe jij in
> het project.

Zo luiden ze vanaf increment 3. Tot dan noemen ze enkel de tools en prompts die er al zijn (sectie 10).

### 8. Techniek

- **Geen dependencies**, zoals de rest van de repo. De MCP-laag is eigen code op `node:`-modules, zoals de parser voor
  MDX. De server spreekt JSON-RPC 2.0 over stdio: één bericht per regel op stdin en stdout, logs op stderr. Hij kent
  `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`, `resources/list`,
  `resources/templates/list`, `resources/read`, `prompts/list`, `prompts/get` en `completion/complete`.
- **Revisies van de specificatie:** 2025-06-18, die `title`, `outputSchema`, `structuredContent` en `resource_link`
  bracht, en de nieuwere, zoals 2025-11-25, waar een ongeldige invoer een `isError` is in plaats van een protocolfout.
  Vraagt de client bij `initialize` een revisie die de server kent, dan antwoordt hij met die; anders met de nieuwste
  die hij kent. Oudere revisies, zoals 2025-03-26 met zijn JSON-RPC-batches, niet: Claude Code en VS Code met Copilot
  spreken de nieuwere. De revisie 2026-07-28 werkt zonder handshake bij `initialize`, met de revisie per verzoek en
  `server/discover`; die kent de server nog niet. Claude Code gebruikt bij een server over stdio standaard de
  handshake, en de MCP Inspector 2.9 vraagt 2025-11-25.
- **Schema's als gewone objecten.** De JSON Schema's staan in de definitie van elke tool. Een kleine validator voor
  het deel van JSON Schema dat we gebruiken (`type`, ook als lijst, `enum`, `required`, `properties`,
  `additionalProperties`, `items`, `minLength`, `maxLength`, `minItems`, `maxItems`, `minimum` en `maximum`) geeft bij
  een ongeldige invoer een `isError` met een duidelijke tekst. De tests toetsen er elk antwoord mee aan het
  `outputSchema`.
- **Bestanden:**
  - `server/src/mcp/protocol.mjs`: JSON-RPC over stdio;
  - `server/src/mcp/server.mjs`: de capabilities, de instructies en de registratie;
  - `server/src/mcp/tools.mjs`: per tool de naam, de titel, de beschrijving, de schema's en de handler, die de
    queries oproept;
  - `server/src/mcp/resources.mjs`, `prompts.mjs` en `render.mjs` (de antwoorden als Markdown);
  - `server/src/markup.mjs`: `flux_check_markup`, ook voor `storybook:check`;
  - `server/bin/flux-mcp.mjs`: het startpunt;
  - `server/package.json`: het manifest van het pakket (naam, versie, `bin`, `engines`);
  - `server/CHANGELOG.md`: de changelog van flux-mcp, die mee in het pakket gaat;
  - `server/prompts/` en `server/templates/`;
  - `resources/flux/server/pack.mjs` (`pnpm run flux:server:pack`): bouwt het pakket (zie hieronder), met een run in
    `test/runs/`.
- **Laden:** per versie wanneer ze gevraagd wordt, en daarna in het geheugen, zoals `createCatalog` en `createDocs`
  nu al doen.
- **Aanpassingen aan de queries:**
  - `getChangesBetween` krijgt een lijst van componenten, en geeft bij een filter ook de entries zonder component of
    thema (`general`);
  - `getComponent` aanvaardt ook een Storybook-id of -link, met het hoofdelement van de pagina (sectie 4.3);
  - `listPages` krijgt `appliesTo`: de elementen die een pagina noemt (sectie 4.4);
  - `findChanges` krijgt `component` en `limit`;
  - `listVersions` zegt per versie of de analyse van de changelog `complete`, `partial` of `missing` is;
  - een index van element naar versies, voor de fouten van `flux_get_component` en `flux_check_markup`;
  - de terugval van een patch op een zijtak naar haar minor, uit een vaste lijst (`resolveVersion` en
    `SIDE_BRANCH_PATCHES` in `catalog.mjs`). `getChangesBetween` neemt voor `from` haar minor als basis van de diffs
    (`base`), en `flux_get_upgrade` vraagt `getDocsChanges` vanaf die basis (sectie 3);
  - de meldingen die naar een functie verwijzen ("Zoek met searchDocs of listPages", in `docs.mjs`), worden neutraal;
    de tool voegt de naam van de juiste tool toe.
- **Verdelen als npm-pakket, met de catalogus erin** (open beslissing 4, herbekeken na increment 4, met de grenzen
  voor een volgende herziening). Na elke release van Flux volgt
  `catalog:update` en een release van flux-mcp. Het pakket komt op de registry van Flux. Een project pint de versie
  van flux-mcp, zodat het dezelfde antwoorden krijgt, bv. in `.mcp.json` voor Claude Code:

  ```json
  {
      "mcpServers": {
          "flux": { "command": "npx", "args": ["-y", "@domg/flux-mcp@<versie>"] }
      }
  }
  ```

- **Het pakket is een gebouwde map.** npm neemt niets mee van buiten de pakketmap, en de root van de repo is
  `private`, met de devDependency voor Figma. `flux:server:pack` bouwt daarom `dist/flux-mcp/` (niet in git):
  - **Dezelfde relatieve paden:** `server/src/`, `server/bin/`, `server/prompts/`, `server/templates/` en
    `catalog/flux/`. `CATALOG_DIR` blijft zo `server/src/../../catalog/flux`, en de code weet niet of ze uit de repo of
    uit het pakket draait.
  - **Het manifest** komt uit `server/package.json`: de naam `@domg/flux-mcp` (open beslissing 8), de versie van
    flux-mcp, die elk antwoord in `catalog` noemt, `bin`, `engines` (Node 22 of hoger) en `publishConfig`. De
    root-`package.json` blijft voor de repo.
  - **Uit de catalogus** enkel wat de server leest: per versie `web-types/`, `packages/`, de gebouwde bestanden van
    `changelog/` die `readRelease` leest, `changelog-analysis/` en `storybook/index.json`, en `storybook-analysis/`.
  - **Elke pagina van Storybook één keer**, per inhoud, zoals `storybook-analysis/` al werkt: 5500 pagina's worden
    772 bestanden. Het script zet ze op één plek en laat `file` in de `index.json` van elke versie ernaar wijzen;
    `loadStorybook` volgt `file` al, dus er is geen tweede lader. De sleutel is een hash van de Markdown zelf, niet
    `inputHash`. Die telt ook de code van de stories en de web-types mee, die niet in de Markdown staan, en negeert
    witruimte: `components-block-side-navigation` heeft in 2.4.0 en 2.5.0 dezelfde `inputHash` met een spatie
    verschil. Het pakket is zo 31 MB uitgepakt in plaats van 46 MB, en 4,2 MB gecomprimeerd.
  - Een test bouwt het pakket en start de server eruit.

- **HTTP later.** Streamable HTTP kan vanuit dezelfde kern, met `node:http`, zodra een gedeelde service gewenst is.
  Een project hoeft dan niets te installeren, maar pint de catalogus niet meer zelf.

### 9. Kwaliteitspoort

Het ontwerpvoorstel bundelde vijf controles in een `knowledge:check` voor CI, zodat "documentatie-discipline als
productie-eis" (planning, sectie 9) af te dwingen is. Ze vallen grotendeels samen met wat er al is:

| Controle | Hier |
|---|---|
| 1. web-types en migratiebestand zijn geldig | `changelog:build --check` controleert de gebouwde bestanden en de analyse; `storybook:check` de pagina's en hun analyse |
| 2. de structuur van de `.llm.md` | voor het eerste deel `storybook:check`: de pagina's en hun analyse; voor een volgend deel een eigen controle |
| 3. voorbeelden slagen voor `check_markup` | `storybook:check` controleert de voorbeelden van de analyse met `markup.mjs`, en faalt op elke error |
| 4. elke verwijderde of hernoemde naam heeft een migratie-entry | `inChangelog` in de diff van de web-types; wat zonder entry is, toont `flux_get_upgrade` als `unexplained`, en de review van de analyse vermeldt het in de samenvatting (ADR-001, sectie 5). Geen harde fout: de changelog van Flux schrijven wij niet |
| 5. recepten noemen bestaande tools en sjablonen | een nieuwe test, `server/test/prompts.test.mjs` |

Daarnaast:

- **Golden tests:** `tools/list`, `resources/templates/list` en `prompts/list`, een gerenderd recept, en per tool een
  paar antwoorden op de echte catalogus, byte voor byte. `catalog` krijgt daarin een vaste waarde, zodat ze niet bij
  elke versie van flux-mcp wijzigen. Ze vragen versies die volledig geanalyseerd zijn en nooit `latest`: een nieuwe
  release of de analyse van een oudere versie verandert ze zo niet. `flux_list_versions` telt de analyses per versie
  en heeft daarom een test op zijn vorm, geen golden.
- **Omvang:** elk deel van de standaardantwoorden voor de grootste gevallen blijft onder 30.000 tekens JSON
  (sectie 4): `flux_get_upgrade` van 2.0.0 naar 2.20.0, de grootste component, de grootste pagina. Alle delen samen
  geven hetzelfde als het antwoord zonder grens.
- **Het protocol** testen we in hetzelfde proces, met streams van `node:stream`.
- **Smoke test** na elk increment, met de MCP Inspector (`npx @modelcontextprotocol/inspector --cli`) en met Claude
  Code. De Inspector is geen dependency van de repo. De eerste gaat ook na welke vorm Claude Code aan het model geeft,
  `content`, `structuredContent` of beide (sectie 4, omvang).
- **Evaluatie, op twee niveaus,** apart van `pnpm test`, want ze vraagt een model:
  - 15 à 20 kennisvragen via `claude -p --mcp-config`, zoals de analyse nu Claude Code headless gebruikt (ADR-001).
    Dat toetst of de beschrijvingen het model de juiste tool laten kiezen. Vanaf increment 2, als alle zeven tools er
    zijn: `pnpm run flux:server:eval`, met de vragen in `resources/flux/server/kennisvragen.json`. Bij increment 2
    kozen 20 van de 20 vragen de juiste tool (Sonnet 5.5, effort medium);
  - de recepten van begin tot einde op een kleine toepassing op niveau 7.A, in `server/test/fixtures/app/`:
    `pnpm run flux:server:eval-recipe <recept>`. De toepassing gebruikt echte versies van Flux uit de registry en de
    echte catalogus, niet twee verzonnen versies (beslist op 2026-10-01): dat toetst ook de catalogus en de packages,
    en de gekende verschillen staan in de changelog, bv. FLUX-620 en FLUX-219. `migreren` gaat van 2.12.1 naar 2.20.0
    en moet eindigen met groene e2e-testen en een volledig ingevuld rapport (increment 3); `valideren` moet de
    afwijkingen vinden die er bewust in zitten (increment 4). Bij increment 3 slaagde `migreren` met Opus 5.5,
    effort high: het vond de vier gekende verschillen, paste de e2e-test aan die FLUX-620 brak, en schreef een
    volledig rapport. Bij increment 4, op 2026-10-02, vond `valideren` met Opus 5.5, effort high, de tien afwijkingen
    uit de fixture, met de juiste `norm` en `vereist`, zonder de twee verboden meldingen, en negen andere, bv. een
    ontbrekende skip-link; het wijzigde geen code. `migreren` slaagde opnieuw op de uitgebreide toepassing, met
    FLUX-270 erbij, en liet de afwijkingen voor `valideren` staan. `verbeteren` kreeg het rapport van die run, met de
    uitkomsten van het team: het werkte de 13 afwijkingen met `volgt-norm` weg, liet de 6 andere liggen, paste enkel
    de e2e-test van annuleren bewust aan, en schreef het ticket voor de normkandidaat. De eerste run gaf
    `resultaat: gedeeltelijk`, omdat het recept niet zei dat een afwijking die het bewust liet liggen, niet meetelt;
    met die regel erbij slaagde het. `review` kreeg een pull request op de fixture, met vier afwijkingen in de diff:
    het vond ze alle vier, meldde niets buiten de diff, en gaf `oordeel: aanpassen`. De eerste run meldde terecht een
    checkbox zonder zichtbare tekst die als correct bedoeld was: `label` op `vl-checkbox` vult in 2.12.1 enkel het
    `aria-label`. `uitbreiden` las het ticket CONT-12 uit een nagemaakte Jira naast flux-mcp, bouwde het verplichte
    telefoonnummer met `pattern` en een `vl-form-message` per toestand volgens `patronen-formulier-validatie`, paste de
    bestaande e2e-testen bewust aan, en liet de bestaande afwijkingen staan. Een Figma MCP-server is er in de
    evaluatie niet: de weg van het ontwerp, met de vijf recepten van `toepassing-aanmaken` tot `scherm-bouwen`, is niet
    getoetst. De flux-starter-app vraagt bovendien een login. `toepassing-skelet-bouwen` en `scherm-bouwen` lezen enkel
    Markdown: een fixture met een analyse en een nagemaakte starter kan ze later zonder Figma toetsen.

### 10. Incrementen

Elk increment levert iets bruikbaars op en bouwt op het vorige. Hieronder staat wat erbij hoort; de details staan in
de genoemde secties. Wat bij geen increment staat, hoort er niet bij.

**Voor elk increment:**

- `pnpm test` is groen, met tests voor wat erbij kwam (sectie 9);
- de smoke test met de MCP Inspector en met Claude Code, op het gebouwde pakket;
- de instructies (sectie 7) en de beschrijvingen van de tools noemen enkel tools en prompts die er al zijn. De
  instructies groeien zo mee: tot increment 2 zonder `flux_check_markup`, tot increment 3 zonder de zinnen over
  prompts;
- een entry in de changelog van flux-mcp, `server/CHANGELOG.md`, die mee in het pakket gaat;
- de documentatie: `docs/technisch/server.md` beschrijft wat de server biedt en hoe je hem start, koppelt en test.
  `CLAUDE.md`, de README en de andere pagina's in `docs/technisch/` volgen waar de structuur, een commando of een
  formaat wijzigt.

#### Increment 1: ontsluiten wat er is

De server met de kennis die de catalogus nu heeft, zonder `flux_check_markup` en zonder prompts.

- **Het protocol** (sectie 8):
  - `protocol.mjs`: JSON-RPC 2.0 over stdio;
  - `server.mjs`: de capabilities `tools`, `resources` en `completions`, de instructies en het onderhandelen van de
    revisie;
  - `bin/flux-mcp.mjs`: het startpunt;
  - de methodes `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`, `resources/list`,
    `resources/templates/list`, `resources/read` en `completion/complete`;
  - de validator voor het deel van JSON Schema dat we gebruiken.
- **De tools 4.1 tot 4.6** in `tools.mjs`, met wat sectie 4 voor alle tools vraagt:
  - namen, annotaties en beschrijvingen voor het model;
  - `inputSchema` en `outputSchema`, en `structuredContent` met de Markdown uit `render.mjs`;
  - de vaste velden met `sources`, de fouten, `detail` en de paginering.

  Per tool alles wat in zijn sectie staat, ook:
  - `flux_get_component`: de Storybook-id met het hoofdelement, `related`, de status (sectie 2), de vier secties, en
    de fouten met suggesties en de versies waarin een element bestaat;
  - `flux_get_upgrade`: `general`, `apiDelta`, `unexplained`, `docs` en de volgorde bij paginering. `crossesMajor` is
    enkel een vlag; de tussenstap per major komt met v3 (increment 5).
- **De versies** (sectie 3): `version` verplicht, `latest`, de terugval van de vijf patches op een zijtak, en de
  regels voor `from`.
- **De resources** (sectie 5) van een versie:
  - `flux://versions`, `flux://{version}/changelog`, `flux://{version}/docs`, `flux://{version}/docs/{page}` en
    `flux://{version}/components/{component}`;
  - het aanvullen van `{version}`, `{page}` en `{component}`;
  - `resources/list` geeft enkel `flux://versions`.
- **De aanpassingen aan de queries** uit sectie 8, met hun tests.
- **Het pakket** (sectie 8): `server/package.json`, `flux:server:pack` met een run in `test/runs/`, en een voorbeeld
  voor `.mcp.json` in `docs/technisch/server.md`.
- **De tests uit sectie 9** voor dit increment:
  - het protocol;
  - de golden tests van `tools/list` en `resources/templates/list`, en van een paar antwoorden per tool;
  - de omvang;
  - `content` en `structuredContent` komen uit dezelfde gegevens.

Hoort er niet bij: publiceren op de registry. Dat is de eerste release, en die vraagt open beslissing 8 (de naam).

Af als:
- de server uit het gebouwde pakket in Claude Code de vragen van 4.1 tot 4.6 beantwoordt, voor elke versie in de
  catalogus;
- de smoke test heeft nagegaan welke vorm Claude Code aan het model geeft (sectie 4, omvang), en de grens volgt daaruit.

#### Increment 2: `flux_check_markup`

- **`server/src/markup.mjs`** (sectie 4.7), de tokenizer voor HTML en lit:
  - regel en kolom;
  - commentaar, `<script>`, `<style>` en `<template>`;
  - de ouder van een element;
  - voor lit: de templates uit een bestand, de placeholders, `attr`, `.prop`, `@event`, `?attr` en een dynamische tag.
- **De tool `flux_check_markup`**:
  - alle codes uit 4.7, ook `breaks-in-target` met `targetVersion`, op de index van element naar versies uit
    increment 1;
  - de lijsten van globale HTML-attributen, standaard properties en DOM-events die de controle nodig heeft.
- **`storybook:check`** controleert de voorbeelden van de analyses met `markup.mjs` in plaats van `elementsInHtml`
  (controle 3 in sectie 9). Een bevinding met ernst `error` doet de controle falen. Een review-run bleek niet nodig:
  wat de strengere controle vond, waren gaten in de web-types, en die zijn een warning (sectie 4.7).
- **De kennisvragen uit sectie 9**: 15 à 20 vragen via `claude -p`, nu alle zeven tools er zijn. Ze toetsen de
  beschrijvingen en draaien apart, niet in `pnpm test`.

Af als:
- `storybook:check` met `markup.mjs` groen is op de hele catalogus;
- de tool op de voorbeelden in zijn tests de juiste codes geeft, met regel en kolom;
- de kennisvragen de juiste tool kiezen.

#### Increment 3: de recepten

- **Het mechanisme** (sectie 6.1 en 6.7):
  - de recepten in `server/prompts/<naam>.md`, met frontmatter, en de sjablonen in `server/templates/<workflow>.md`;
  - de registratie, de capability `prompts`, `prompts/list` en `prompts/get`;
  - het renderen: `{{argument}}` vervangen, en het sjabloon als embedded resource;
  - het aanvullen van argumenten, zoals `doelversie`;
  - de resources `flux://prompts/{name}` en `flux://templates/{workflow}`, ook in `resources/list`.
- **De prompts `migreren` (sectie 6.5) en `design-naar-code` (6.2)**, elk volgens het stramien van 6.3, met hun
  rapportsjabloon (6.4) en een aanbevolen model en effort.
- **De voorwaarden** volgen eis 7.A van de planning; "backend uitgemockt" zit in de voorwaarde dat de toepassing
  standalone start en de e2e-testen zonder echte backend draaien (6.3).
- **Controle 5** (`server/test/prompts.test.mjs`), en de golden tests van `prompts/list` en een gerenderd recept.
- **De evaluatie van `migreren`** (sectie 9): van begin tot einde op de toepassing in `server/test/fixtures/app/`, met
  `@domg-wc` 2.12.1 uit de registry van Flux naar 2.20.0, en de echte catalogus. Ze draait apart, niet in `pnpm test`:
  `flux:server:eval-recipe`. Niet 2.12.0: dat package importeert `.raw.css`-bestanden die er niet in zitten (FLUX-604
  in 2.12.1).

Af als: `migreren` de toepassing in de fixture naar 2.20.0 brengt, met groene e2e-testen en een volledig ingevuld
rapport.

#### Increment 4: de norm

Open beslissingen 1 (het kanaal voor normkandidaten), 2 (de norm voor een oudere versie), 5 (regels als tekst) en 6
(rapporten in het project) zijn bij de start bevestigd (sectie 11).

- **De prompts** `valideren`, `verbeteren`, `review` en `uitbreiden` (sectie 6.2), elk volgens 6.3, met hun sjabloon.
  `valideren` maakt het afwijkingenrapport met de normkandidaten (6.4 en 6.6), met `norm` en `vereist` per afwijking
  (open beslissing 2). `verbeteren` laat een afwijking met `vereist` liggen, en stelt na het wegwerken voor de
  normkandidaten in te dienen als ticket in `FLUX` met het label `normkandidaat` (open beslissing 1).
- **De rapporten** volgen 6.4 (open beslissing 6): een eigen PR voor `valideren`, commentaar op de PR voor `review`, en
  `-2`, `-3`, … bij een bestaande naam, ook in `migreren` en `design-naar-code`.
- **De norm** is Storybook: de richtlijnen en patronen van de nieuwste versie via `flux_get_guidance`, met de id van
  een pagina als referentie (4.4), en de codes van `flux_check_markup` op de gepinde versie. Er komen geen nieuwe codes
  bij (open beslissing 5).
- **De evaluatie van `valideren`** op de toepassing in de fixture.

Af als: `valideren` de afwijkingen vindt die bewust in de toepassing in de fixture zitten, en `verbeteren` ze met
`uitkomst: volgt-norm` wegwerkt.

#### Increment 5: wanneer de bron er is

Geen geheel, maar losse onderdelen, elk wanneer zijn aanleiding er is:

| Onderdeel | Aanleiding | Wat | Sectie |
|---|---|---|---|
| een volgend deel van de `.llm.md` | kennis die niet in Storybook staat, bv. regels met een id, staat in flux-web-components | een script dat ze per versie in de catalogus zet, een controle, een eigen `kind` in `flux_get_guidance`, en de regel-id's in de rapporten | 2 |
| CEM | Flux levert een CEM in plaats van web-types (planning 11.6), eerst als technische omzetting | een lader die hetzelfde teruggeeft als `loadWebTypes`, en een script dat de CEM per versie kopieert; de diffs werken over de overstap heen | 2 |
| de vijf recepten van ontwerp naar toepassing | er is een template-repo: de flux-starter-app (gebouwd op 2026-10-05, zonder evaluatie) | `toepassing-aanmaken`, `toepassing-analyseren`, `toepassing-skelet-bouwen`, `scherm-analyseren` en `scherm-bouwen`, met hun sjabloon, in de plaats van `design-naar-code` en `nieuwe-toepassing` | 6.2 |
| codemods | de overstap naar v3, of migraties die veel mechanische wijzigingen vragen | een veld `codemod` dat de analyse van de changelog meebouwt, een controle tegen de web-types in `changelog:build --check`, de review, en een vervanging bij `breaks-in-target` | 2 |
| v3 | `develop-v3` heeft releases | de catalogus voor v3 (ADR-002), en de tussenstap per major in `flux_get_upgrade` | 4.5 |
| Streamable HTTP | een gedeelde service is gewenst | dezelfde kern, met `node:http` | 8 |

### 11. Open beslissingen

Deze keuzes zijn niet aan wie de server bouwt. De ADR gaat telkens uit van het voorstel hieronder, zodat de rest
consistent is; bij het aanvaarden worden ze bevestigd of bijgestuurd. 3, 4 en 7 zijn op 2026-10-01 bevestigd:
increment 1 hangt ervan af. 1, 2, 5 en 6 zijn op 2026-10-02 bevestigd, bij de start van increment 4, en 8 na
increment 4.

1. **Het kanaal voor normkandidaten.** Waar komen ze terecht bij Team Flux? Bevestigd op 2026-10-02: een ticket per
   kandidaat in het Jira-project `FLUX`, met een bestaand issuetype, het label `normkandidaat` en de frontmatter van
   het rapport (6.4 en 6.6). Zo werkt het recept zonder dat een Jira-beheerder eerst een eigen issuetype aanmaakt;
   komen er veel kandidaten, dan kan het label later een eigen type met een eigen bord worden. `verbeteren` stelt het
   indienen voor, na de merge van de PR van `valideren`, waarin het projectteam besliste. Een issue op GitHub valt af:
   flux-web-components is publiek, en een kandidaat toont code en locaties van een interne toepassing. Wie triageert,
   en hoe vaak, spreekt Team Flux af: de planning vraagt er "1 plek" voor, met ontwerper en bibliotheekbeheer
   (sectie 9). De recepten hangen er niet van af.
2. **Tegen welke norm valideer je een toepassing op een oudere versie?** Bevestigd op 2026-10-02: de API tegen de
   gepinde versie, de richtlijnen en patronen tegen de nieuwste. Tegen de norm van de gepinde versie zou een toepassing
   op 2.12.1 met `vl-search` in de functionele header de norm volgen, terwijl het patroon sinds 2.16.0 een
   `vl-input-field` en een `vl-button` gebruikt en `vl-search` deprecated is; normkandidaten zouden dan ook gaan over
   wat de norm intussen al oploste. Twee verfijningen, zonder nieuwe tool of parameter:
   - **"gewijzigd sinds X" of "nieuw sinds X"**, met X de gepinde versie, komt uit `docs` van `flux_get_upgrade` van
     de gepinde versie naar `latest`. Van 2.12.1 naar 2.20.0 zijn dat 6 nieuwe normpagina's, 12 met andere tekst en 8
     waar enkel de code van de stories wijzigde. Vóór 2.11.0 hadden 14 patronen een andere id (`ontwerp-*`); daar
     staan ze als nieuw, wat ze voor die versie ook zijn;
   - **"vereist een migratie naar X of hoger"** al nu, niet pas met `Sinds` uit regels in de `.llm.md`: het recept
     toetst een voorstel met `flux_check_markup` op de gepinde versie, en een `unknown-element` dat in een latere versie
     bestaat, zegt "bestaat vanaf X". De nieuwste norm vraagt zo'n element op geen enkele pagina vanaf 2.13.0, op één
     voor 2.11.0 tot 2.12.1 (`vl-tabs-next`) en op vier vóór 2.9.0. Vraagt de norm een attribuut of een API in
     JavaScript, dan zegt de changelog vanaf welke versie: het patroon *formulier – cross-validatie* gebruikt
     `CrossValidationMixin`, die er pas is sinds 2.19.0 (FLUX-610).
3. **`version` verplicht, of standaard `latest`?** Bevestigd: verplicht, met `latest` als expliciete waarde
   (sectie 3).
4. **De distributie van de kennis.** Optie 1: de catalogus in het npm-pakket, dus een release van flux-mcp per
   release van Flux. Optie 2: per versie ophalen, bv. bij de publicatie van Storybook
   (`…/release-v2/<versie>/…`), en daarna cachen; dat vraagt dat de release van Flux de catalogus mee publiceert.
   Bevestigd: optie 1, als gebouwde pakketmap (sectie 8); herbekijken na increment 3 of wanneer v3 erbij komt.
   Herbekeken op 2026-10-02, na increment 4: optie 1 blijft. Het pakket is 31,3 MB uitgepakt en 4,3 MB
   gecomprimeerd voor 26 versies, en een release van Flux voegt er 1 à 2 MB uitgepakt aan toe: een map per versie
   van ongeveer 1 MB, en 2 tot 88 nieuwe inhouden uit Storybook met hun analyse. Flux maakte 26 releases tussen
   2025-06-06 en 2026-09-18, ongeveer één per 2,5 week; de release van flux-mcp die erop volgt, valt samen met
   `catalog:update`, dat na elke release toch draait. Optie 2 kan niet zoals beschreven: de analyse ontstaat na de
   release van Flux, in deze repo, dus de release van Flux kan de catalogus niet mee publiceren; het zou een eigen
   publicatie per versie vragen, met hosting, en het determinisme per versie van flux-mcp hangt dan af van die
   publicatie. Herzien wanneer:
   - het gecomprimeerde pakket groter wordt dan 15 MB;
   - v3 erbij komt, en de vraag rijst of één pakket beide majors draagt;
   - een gedeelde service over HTTP gewenst is (sectie 8).
5. **Deterministische regelchecks.** Blijven regels tekst die het model toepast, of krijgen sommige een machinaal
   toetsbare vorm in `flux_check_markup`? Bevestigd op 2026-10-02: eerst tekst. De codes van `flux_check_markup`
   blijven de enige machinaal toetsbare regels. In de 51 normpagina's van 2.20.0 schrijven 18 zinnen op 10 pagina's
   iets voor over markup; in de markup te toetsen zijn enkel de regels voor `vl-form-message` (*formulier –
   validatie*) en het verplichte `label` van `vl-input-field` (*zoeken – loading state*). De rest gaat over CSP, de
   principes van WCAG of gedrag na het renderen. Een regel krijgt een code als:
   - de norm hem voorschrijft, met de id van de pagina als bron;
   - hij te toetsen is op één stuk markup, zonder kennis van andere bestanden. `for` van `vl-form-message` valt
     daarom af: in lit is de `id` vaak `${…}` of staat het control in een andere template;
   - hij terugkomt in de rapporten van `valideren`, of de evaluatie toont dat het model hem mist.

   De eerste kandidaat is `state` van `vl-form-message`: de naam van een eigenschap van `ValidityState`, waarvoor de
   web-types geen lijst van waarden geven. Een regelbestand dat flux-mcp zelf naast Storybook bijhoudt, zou het werk
   doen van een volgend deel van de `.llm.md`, en dat schrijft Team Flux.
6. **Rapporten in het project.** Is `.flux/rapporten/` de juiste plek, en gaan rapporten altijd mee in git? Bevestigd
   op 2026-10-02: ja, in de PR van de workflow, zodat de review en `verbeteren` erop kunnen steunen, met twee
   uitzonderingen (sectie 6.4). `valideren` wijzigt geen code en krijgt een PR met enkel het rapport, waarin het team
   per afwijking beslist. `review` schrijft geen bestand in de branch die het beoordeelt, maar commentaar op de PR. Een
   bestaande naam krijgt `-2`, `-3`, …, zodat twee runs op een dag elkaar niet overschrijven. Niet in git is
   vluchtig, en `verbeteren` moet dan op dezelfde machine draaien; in Jira werkt het niet zonder koppeling.
7. **Geen dependencies, of de officiële SDK met TypeScript en Zod,** zoals het ontwerpvoorstel vroeg, voor
   consistentie met flux-agents. Bevestigd: geen dependencies, zoals `CLAUDE.md` vraagt (sectie 8 en de
   alternatieven).
8. **De naam van het pakket** en in welke scope het op de registry van Flux komt. Bevestigd op 2026-10-02:
   `@domg/flux-mcp`, met `publishConfig` naar de registry van Flux (`local-npm`). Een project dat Flux gebruikt, stuurt
   de scope `@domg` al naar die registry, want `@domg/govflanders-style` is een dependency van `@domg-wc/components`.
   `@domg-wc/mcp` valt af: de `@domg-wc`-packages hebben samen de versie van Flux, en `migreren` zet "alle
   `@domg-wc`-packages" op de doelversie; flux-mcp heeft een eigen versie. Zonder scope zou `npx` op de publieke npm
   zoeken. `@domg/govflanders-style` zelf staat in een andere repository (`acd-npm`); of Team Flux in `@domg` mag
   publiceren, gaat het na voor de eerste release. Kan het niet, dan wordt het een eigen scope.
9. **De planning in flux-web-components.** Sectie 4 en 11.1 (de Flux-MCP ook voor afnemers, met prompts) en 11.2
   moeten mee; dat beslist het Flux-team. Sinds 2026-10-02 is de `.llm.md` een concept: alle kennis die niet uit de
   web-types of de release notes komt, met de documentatie uit Storybook en haar analyse als eerste deel. 11.2 houdt
   Storybook nog buiten de kennislaag.

## Alternatieven overwogen

- **De zes tools van het ontwerpvoorstel, letterlijk.** De inhoud nemen we over. `flux_get_migration` heet
  `flux_get_upgrade`, want er is geen migratiebestand en de catalogus spreekt van een upgrade.
  `flux_search_components` zoekt ook in patronen en recepten, dus `flux_search_docs`. `flux_find_changes` komt erbij.
- **De voorlopige mappings van ADR-001 en ADR-003.** Acht tools per module laten een model voor één vraag kiezen
  tussen twee tools, bv. `flux_component` en `flux_component_history`. We ordenen naar de vraag van een afnemer.
- **Eén tool per query.** Elf tools, die elkaar deels overlappen. Elke beschrijving kost context, en een model kiest
  vaker verkeerd.
- **Een `migration.json` naast de changelog.** De analyse per ticket heeft al de impact, de actie en een voorbeeld.
  Een tweede bestand van een LLM zet dezelfde tekst twee keer in git, en moet ook gereviewd worden.
- **De officiële TypeScript SDK met Zod**, zoals het ontwerpvoorstel vroeg. Die regelt het protocol en HTTP, en
  volgt nieuwe revisies. Maar ze brengt dependencies mee, met hun eigen dependencies, en TypeScript vraagt een build,
  tegen de conventie van de repo. Het deel van het protocol dat we nodig hebben is klein, en de queries en de parser
  voor MDX tonen dat eigen code zonder dependencies hier werkt. Consistentie met flux-agents weegt niet door: die
  praat met de server over MCP, niet via zijn code. Wordt het protocol meer dan we willen onderhouden, bv.
  authenticatie voor HTTP, dan herbekijken we dit.
- **Storybook buiten de kennislaag en buiten de server** (planning 11.2). Dan hebben de recepten van het ontwerp en
  `valideren` geen enkele bron voor het *hoe*. ADR-003 besliste al anders, en sinds 2026-10-02 is de documentatie uit
  Storybook met haar analyse het eerste deel van de `.llm.md`.
- **Een LLM in de server** die het migratiedocument schrijft (planning 11.4). Dat is niet deterministisch, en de
  server heeft dan zelf toegang tot een model nodig. Het recept laat het model van de client dat document schrijven,
  uit een reproduceerbaar antwoord.
- **Een zoekindex met MiniSearch** en een vaste configuratie, zoals het ontwerpvoorstel opperde. Een dependency, voor
  hoogstens 233 pagina's per versie; de huidige score is deterministisch en klein genoeg.
- **Een genormaliseerd model met adapters** (`ComponentKnowledge`, `KnowledgeSourceAdapter`), zoals het
  ontwerpvoorstel vroeg. Voor één formaat is dat een laag zonder tweede gebruiker, en de CSS custom properties en
  parts die het model voorzag, staan niet in de web-types. Komt er een CEM, dan geeft een nieuwe lader hetzelfde terug
  als `loadWebTypes` (sectie 2).
- **`latest` als standaard, zonder verplichte versie**, zoals `docs.mjs` nu. Een model dat de versie vergeet, krijgt
  dan zonder het te merken de API van een andere versie.
- **Een patch op een zijtak als fout.** Dat is strikter, maar een project op 2.17.3 krijgt dan geen antwoord, terwijl
  de API die van 2.17.0 is. De `warning` maakt de terugval zichtbaar.
- **De JSON van `structuredContent` ook als tekst**, zoals de specificatie aanraadt voor clients zonder structured
  output. Dat is eenvoudiger, maar Markdown leest een model compacter, en de pagina's zijn al Markdown.
- **Een gehoste server als eerste vorm.** Geen installatie per project en altijd de nieuwste catalogus, maar het
  vraagt hosting, en een project kan de catalogus niet meer pinnen. Het blijft een optie voor later.
- **De root van de repo als pakket.** Geen buildstap, maar ook geen ontdubbeling (46 MB in ongeveer 7800 bestanden),
  en het pakket hangt dan aan de configuratie van de repo: `private`, `devEngines` en de devDependency voor Figma.
- **Afkappen in plaats van pagineren**, met `truncated` en de raad om te filteren. Eenvoudiger, maar een model moet
  dan zelf verfijnen en kan een entry met `action` missen. Pagineren per sectie, met een `section`-parameter, vraagt
  dat het model de secties kent.
- **Een veld `uses` in `index.json`** voor `appliesTo`: de elementen die de stories en de code van een pagina echt
  gebruiken. Nauwkeuriger dan de naam in de tekst, maar het wijzigt het formaat en vraagt `storybook:copy` opnieuw
  voor elke versie. Het kan later, als `flux_check_markup` het ook nodig heeft.

## Gevolgen

- **Nieuwe code:** de MCP-laag en `markup.mjs`, met tests. Het protocol onderhouden we zelf: een nieuwe revisie van
  de specificatie vraagt werk, en de tests leggen het gedrag vast.
- **De queries wijzigen een beetje** (sectie 8), met hun tests. Hun gedrag zonder MCP blijft bruikbaar.
- **flux-mcp wordt een pakket** met een eigen versie en een eigen changelog. Na elke release van Flux volgt een release
  van flux-mcp. `catalog:update` blijft de eerste stap.
- **De analyse van Storybook wordt belangrijk.** Zonder analyse zijn er geen voorbeelden, geen samenvattingen en geen
  zoektermen, en blijft zoeken op functie zwak. Elke versie is geanalyseerd; na een release van Flux volgt de
  analyse van wat nieuw is of wijzigde.
- **De kwaliteit van de web-types bepaalt `flux_check_markup`.** 866 van de 918 attributen hebben geen type, dus
  waarden kunnen we enkel voor 52 controleren, en ook die lijsten en de slots zijn vaak onvolledig: daarom zijn het
  warnings. Een attribuut dat in de web-types ontbreekt, geeft een valse fout tot een analyse het noteert. Die
  gevallen zijn voor het Flux-team om recht te zetten, zoals ADR-003 dat al zegt voor verkeerde doc-urls.
- **Wat een LLM schreef, blijft herkenbaar** in elk antwoord, via `sources[].kind`, `impactSource` en `analysis`.
- **ADR-001 en ADR-003.** Hun voorlopige mapping naar MCP (sectie 8) vervalt; ze verwijzen hierheen sinds deze ADR
  aanvaard is (2026-10-02).
- **`docs/technisch/server.md` en `CLAUDE.md`** beschrijven in increment 1 de server: hoe je hem start, koppelt en
  test. De README en `CLAUDE.md` noemen `server/prompts/` bij de structuur, want daar komen de recepten.
- **Het ontwerpvoorstel** is opgenomen in deze ADR, en het afzonderlijke document is verwijderd.
- **De planning** in Storybook moet mee aangepast worden (open beslissing 9).
- **v3** past erin: `crossesMajor`, de Storybook per major en de catalogus uit `develop-v3` (ADR-002).

## Gerelateerde ADR's

- ADR-001: De changelog per versie klaarzetten voor de MCP-server.
- ADR-002: De historische catalogus van v2 opbouwen.
- ADR-003: De documentatie uit Storybook per versie aanbieden.
