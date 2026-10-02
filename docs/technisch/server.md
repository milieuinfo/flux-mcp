# De server

`flux-mcp` is een MCP-server over stdio: hij geeft een LLM-agent kennis over de Flux web-componenten, per versie, uit
de catalogus in `catalog/flux/`. Wat de server aanbiedt en waarom, staat in
[ADR-004](../beslissingen/ADR-004-functionaliteit-mcp-server.md); deze pagina beschrijft hoe hij werkt, hoe je hem
start, koppelt en test. Hij kent increment 1 tot en met 3 van de ADR: de tools en resources op wat de catalogus heeft,
`flux_check_markup`, en de recepten `migreren` en `design-naar-code` als prompts. Van increment 4 zijn er de recepten
`valideren`, `verbeteren`, `review` en `uitbreiden`.

## Starten en koppelen

Uit de repo:

```bash
node server/bin/flux-mcp.mjs
```

De server leest JSON-RPC op stdin, één bericht per regel, en schrijft de antwoorden op stdout; logs gaan naar stderr.
Een client start hem zelf. Voor Claude Code in een project, in `.mcp.json`:

```json
{
    "mcpServers": {
        "flux": { "command": "node", "args": ["/pad/naar/flux-mcp/server/bin/flux-mcp.mjs"] }
    }
}
```

Uit het pakket `@domg/flux-mcp`, eens het gepubliceerd is, op de registry van Flux (open beslissing 8 van ADR-004):

```json
{
    "mcpServers": {
        "flux": { "command": "npx", "args": ["-y", "@domg/flux-mcp@0.4.0"] }
    }
}
```

npx vindt het pakket via de scope `@domg`. Een project dat Flux gebruikt, heeft die al in zijn `.npmrc`, want
`@domg/govflanders-style` is een dependency van `@domg-wc/components`:

```ini
@domg-wc:registry=https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm/
@domg:registry=https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm/
```

Een project pint zo de versie van flux-mcp, en dus de catalogus: dezelfde vraag geeft dan altijd hetzelfde antwoord.
Node 22 of hoger; de server heeft geen dependencies.

## Wat de server aanbiedt

| Tool                 | Vraag                                                                                   |
|----------------------|-----------------------------------------------------------------------------------------|
| `flux_list_versions` | welke versies kent de server, en wat staat er per versie?                               |
| `flux_search_docs`   | welke component, welk patroon of welk recept past bij …?                                |
| `flux_get_component` | hoe gebruik ik deze component in versie X: de API, de voorbeelden, de documentatie, de historiek |
| `flux_get_guidance`  | welke gidsen, richtlijnen, patronen en recepten zijn er, en wat zeggen ze?              |
| `flux_get_upgrade`   | wat verandert er van X naar Y, voor de componenten die ik gebruik?                      |
| `flux_find_changes`  | in welke versie zit `FLUX-800`, of een wijziging over …?                                |
| `flux_check_markup`  | klopt deze markup met de API van versie X, en wat breekt er in versie Y?                |

| Resource                                  | Inhoud                                                  |
|-------------------------------------------|---------------------------------------------------------|
| `flux://versions`                         | de versies, als JSON                                    |
| `flux://{version}/changelog`              | de changelog van één versie, met de analyse             |
| `flux://{version}/docs`                   | de index van de pagina's                                |
| `flux://{version}/docs/{page}`            | één pagina                                              |
| `flux://{version}/components/{component}` | één component, zoals `flux_get_component` met alle secties |

| `flux://prompts/{name}`                   | een recept als tekst, voor een client zonder prompts    |
| `flux://templates/{workflow}`             | het rapportsjabloon van een workflow                    |

| Prompt             | Workflow                                                                             |
|--------------------|--------------------------------------------------------------------------------------|
| `migreren`         | de toepassing naar een nieuwere versie van Flux brengen, met een migratierapport      |
| `design-naar-code` | een scherm bouwen uit een ontwerp in Figma, met de Figma MCP in dezelfde client      |
| `valideren`        | de toepassing naast de norm leggen, zonder code te wijzigen, met een afwijkingenrapport |
| `verbeteren`       | de afwijkingen met uitkomst `volgt-norm` uit een afwijkingenrapport wegwerken           |
| `review`           | wat een branch toevoegt of wijzigt naast de norm leggen, als commentaar voor de PR       |
| `uitbreiden`       | de toepassing uitbreiden met wat een Jira-ticket of een ontwerp in Figma vraagt          |

`completion/complete` vult `{version}`, `{page}` en `{component}` aan, en het argument `doelversie` van een recept.

### Gedrag dat elke tool deelt

- **De versie** is verplicht: `2.20.0`, `v2.20.0` of `latest`, de nieuwste in de catalogus. Een patch op een zijtak
  (2.4.1, 2.15.1, 2.17.1–2.17.3, de lijst `SIDE_BRANCH_PATCHES` in `catalog.mjs`) krijgt het antwoord van haar minor,
  met een waarschuwing. Elke andere versie buiten de catalogus is een fout; een nieuwere zegt dat flux-mcp een update
  nodig heeft. `from` van `flux_get_upgrade` mag ook vóór de oudste versie liggen, zoals v1.
- **Twee vormen.** `structuredContent` volgt het `outputSchema` van de tool; `content` geeft hetzelfde antwoord als
  Markdown (`render.mjs`). Claude Code geeft het model de JSON van `structuredContent`, en een `resource_link` als
  tekst; de Markdown gebruikt het niet (gemeten met Claude Code 2.1.286).
- **Vaste velden:** `version` (de effectieve versie), `catalog` (de versie van flux-mcp), `warnings` en `sources`. Een
  bron is `{ kind, path, url? }`, met `path` relatief aan `catalog/flux/`; een `*` staat voor elke versie. Wat uit een
  bron `*-analysis` komt, schreef een LLM.
- **In delen.** Een antwoord is hoogstens 30.000 tekens JSON (`paging.mjs`). Is het groter, dan krijgt elk deel
  `part` en `parts`, en elk deel behalve het laatste een `nextCursor`; dezelfde vraag met `cursor` geeft het volgende
  deel. Wat kan groeien, staat in een vaste volgorde: bij een upgrade eerst wat actie vraagt. De tekst van een pagina
  wordt gesplitst op lege regels buiten codeblokken.
- **Fouten.** Een fout in de vraag, zoals een onbekend element, is een resultaat met `isError` en een tekst waarmee
  het model verder kan, bv. "Bedoelde je vl-button?". Ongeldige argumenten ook. Een onbekende tool of methode is een
  fout in het protocol.

### `flux_check_markup`

De tool toetst markup aan de web-types van één versie, met `server/src/markup.mjs`. `storybook:check` gebruikt
dezelfde module voor de voorbeelden van de analyses (zie [Storybook](storybook.md)).

- **De invoer** is HTML (`syntax: "html"`) of lit (standaard): een template of een heel `.ts`- of `.js`-bestand. De
  module neemt er de templates `` html`…` `` uit, ook die in een `${…}` van een andere template, en slaat strings en
  commentaar over. Een `${…}` is een placeholder: een dynamische waarde controleert ze niet. `.prop`, `@event` en
  `?attr` zijn een property, een event en een boolean attribuut.
- **De codes:**

  | Code | Ernst | Wanneer |
  |---|---|---|
  | `unknown-element` | error | een `vl-*`-element buiten de web-types; met de namen die erop lijken, of de versies waarin het bestaat |
  | `unknown-attribute` | error | een attribuut buiten de web-types dat geen globaal HTML-attribuut is |
  | `lit-syntax` | error | enkel voor `storybook:check`: `.prop`, `@event` of `?attr` in een voorbeeld, dat gewone HTML is |
  | `breaks-in-target` | error of warning | met `targetVersion`: wat in die versie een bevinding geeft en nu niet, met de entry uit de changelog of `unexplained` |
  | `invalid-attribute-value` | warning | een waarde buiten de lijst die de web-types geven |
  | `unknown-slot` | warning | `slot="x"` op een direct kind van een `vl-*`-element zonder slot `x` |
  | `deprecated-element`, `deprecated-attribute` | warning | `deprecated` in de web-types, met de tekst ervan |
  | `boolean-attribute-false` | warning | `disabled="false"`, dat het attribuut net aanzet |
  | `unknown-property`, `unknown-event` | warning | `.prop` of `@event` buiten de web-types en buiten wat elk HTML-element kent |
  | `next-element` | info | generatie `v3-next`: een voorloper van v3 |
  | `dynamic-tag` | info | een tag die pas bij het uitvoeren gekend is |

- **Onvolledige web-types.** Een element of attribuut dat een analyse van Storybook in die versie als
  `not-in-web-types` noteert, is een warning in plaats van een error. Waarden en slots zijn altijd een warning: daar
  zijn de web-types vaak onvolledig. In de catalogus vond de controle 586 zulke bevindingen in 67 analyses, en geen
  enkele was een fout in een voorbeeld, bv. `placement="bottom-end"` van `vl-popover`, of de slots `title-link` en
  `context-link` van `vl-content-header`.

### De recepten

Een recept is een workflow die de ontwikkelaar zelf start; in Claude Code met `/mcp__flux__migreren 2.20.0` als de
server `flux` heet. Het recept staat als Markdown met frontmatter in `server/prompts/<naam>.md`, het rapportsjabloon in
`server/templates/<workflow>.md` (ADR-004, sectie 6):

- **De frontmatter:** `name`, `title`, `description` (met een aanbevolen model en effort), `arguments` (per argument
  `name`, `description`, `required` en `default`) en `template`. `prompts.mjs` leest een klein deel van YAML; een
  onbekende sleutel, een argument dat de tekst niet gebruikt of een `{{naam}}` zonder argument is een fout bij het
  laden.
- **Het renderen** vervangt enkel `{{argument}}`, met de standaardwaarde als het ontbreekt. `prompts/get` geeft de
  tekst als bericht van de gebruiker, en het sjabloon als embedded resource.
- **Het stramien** (ADR-004, 6.3): voorwaarden, kennis ophalen, een checkpoint voor er code wijzigt, uitvoeren,
  verifiëren met `flux_check_markup`, de build en de e2e-testen, en een rapport in `.flux/rapporten/` van het project.
  Bestaat de naam van het rapport al, dan krijgt het `-2`, `-3`, …. Een voorwaarde is dat de toepassing standalone
  start en de e2e-testen draaien zonder echte backend.
- **`valideren`** wijzigt geen code en heeft daarom geen checkpoint: de beslissing per afwijking valt in de pull
  request van het rapport. Het toetst de API tegen de gepinde versie, de richtlijnen en patronen tegen `latest`, en
  schrijft de afwijkingen in het formaat van ADR-004 (6.4).
- **`verbeteren`** leest dat rapport na de merge, en werkt enkel de afwijkingen met `uitkomst: volgt-norm` weg die de
  gepinde versie toelaat. Het wijzigt het afwijkingenrapport niet, en stelt per normkandidaat een ticket voor in het
  Jira-project `FLUX`, met het label `normkandidaat` (ADR-004, 6.6).
- **`review`** beoordeelt enkel wat de diff tegenover `basis` toevoegt of wijzigt, ook een bestaande afwijking op een
  gewijzigde regel. Het schrijft geen bestand, want dat zou de PR wijzigen die het beoordeelt: het geeft het rapport
  als laatste deel van zijn antwoord, tussen `~~~markdown` en `~~~`, met een `oordeel` (`goedkeuren`, `aanpassen` of
  `bespreken`), en stelt voor het als commentaar op de PR te plaatsen.
- **`uitbreiden`** leest het ticket met de koppeling met Jira van de client, of vraagt de ontwikkelaar de tekst als die
  er niet is, en een ontwerp met de Figma MCP. Wat het bouwt, volgt de norm; bestaande afwijkingen buiten de
  uitbreiding laat het staan.
- Elke wijziging aan een recept krijgt een entry in `server/CHANGELOG.md`.

## De code

| Bestand                         | Wat                                                                                   |
|---------------------------------|---------------------------------------------------------------------------------------|
| `server/bin/flux-mcp.mjs`       | het startpunt: de server over stdio                                                   |
| `server/src/mcp/protocol.mjs`   | JSON-RPC 2.0 over stdio, één bericht per regel                                        |
| `server/src/mcp/server.mjs`     | de capabilities, de instructies, de revisies van de specificatie en de methodes       |
| `server/src/mcp/tools.mjs`      | per tool de naam, de beschrijving, de schema's en het antwoord, uit de queries        |
| `server/src/mcp/resources.mjs`  | de resources en het aanvullen                                                         |
| `server/src/mcp/render.mjs`     | de antwoorden als Markdown                                                            |
| `server/src/mcp/paging.mjs`     | de delen en de cursor                                                                 |
| `server/src/mcp/schema.mjs`     | een kleine validator voor JSON Schema: de argumenten, en in de tests de antwoorden    |
| `server/src/markup.mjs`         | de tokenizer voor HTML en lit, en de controle van `flux_check_markup` en `storybook:check` |
| `server/src/mcp/prompts.mjs`    | de recepten: laden, renderen, `prompts/list`, `prompts/get` en hun resources          |
| `server/prompts/`, `server/templates/` | de recepten en hun rapportsjablonen                                            |
| `server/package.json`           | het manifest van het pakket: naam, versie, `bin` en `engines`                          |
| `server/CHANGELOG.md`           | wat er per versie van flux-mcp veranderde                                             |

De server ondersteunt de revisies 2025-06-18 en 2025-11-25 van de specificatie: vraagt de client er een, dan antwoordt
hij met die, anders met de nieuwste. De revisie 2026-07-28, zonder handshake bij `initialize`, kent hij nog niet;
Claude Code gebruikt bij een server over stdio de handshake.

## De queries

De tools steunen op de queries, gewone functies met tests. Een fout in de vraag, zoals een onbekende versie, geeft
een `CatalogError`; `details` vertelt de MCP-laag wat ze kan aanvullen, zoals de namen die op een onbekend element
lijken.

### De changelog: `server/src/catalog.mjs`

| Functie                                  | Vraag                                                                          |
|------------------------------------------|--------------------------------------------------------------------------------|
| `listVersions()`                         | welke versies zijn er? Ook of de analyse van de changelog er is (`changelogAnalysis`) |
| `getChangelog(versie, filters)`          | wat veranderde er in één versie? Filters: type, impact, component, label       |
| `getChangesBetween(van, tot, filters)`   | wat verandert er bij een upgrade? Zie hieronder                                |
| `getComponentHistory(component, bereik)` | wat veranderde er per versie aan één component?                                |
| `findChanges(zoekterm, filters)`         | in welke versie zit `FLUX-800`, of een wijziging over "window ready"? Zoekt ook in de uitleg; filters: component, limit |
| `resolve(versie)`, `resolveVersion`      | welke versie van de catalogus beantwoordt een gevraagde versie (`latest`, een patch op een zijtak)? |
| `elementVersions(element)`               | in welke versies staat een element in de web-types?                            |

`getChangesBetween` geeft per impact, eerst wat actie vraagt, en per component, met de netto diff van de web-types en
de dependencies, en de commits buiten de changelog. `component` mag een lijst zijn; dan geeft `general` per impact ook
de entries die geen component, thema of element noemen, want die raken elk project. Voor een patch op een zijtak
vertrekken de diffs van haar minor (`base`).

**Wat standaard wegvalt.** Bij een upgrade telt enkel wat het project raakt. `getChangesBetween` en
`getComponentHistory` laten daarom standaard weg:

- entries met impact `none`: `hiddenNoImpact` zegt hoeveel, `includeNoImpact` toont ze toch;
- elementen waarvan in de web-types enkel de tekst wijzigde: `hiddenDescriptions` zegt hoeveel, `includeDescriptions`
  toont ze toch.

`getChangelog` en `findChanges` tonen alles, want een afnemer mag weten wat er nieuw is.

**Een onderbroken keten.** Ontbreekt er een versie tussen `van` en `tot`, dan zegt `getChangesBetween` dat met
`complete: false`, `missing` en een `warning`. De catalogus bevat de releases op de hoofdlijn van `develop-v2`, vanaf
2.0.0 (ADR-002): een upgrade vanaf v1 is niet volledig te beantwoorden.

### De documentatie: `server/src/docs.mjs`

Zonder versie geldt de nieuwste in de catalogus; elk antwoord zegt welke versie het is.

| Functie                         | Vraag                                                                            |
|---------------------------------|----------------------------------------------------------------------------------|
| `listDocVersions()`             | welke versies hebben documentatie, met hoeveel pagina's en analyses?             |
| `listPages(versie, filters)`    | welke pagina's zijn er? Filters: soort, element (de pagina toont het) en `appliesTo` (de pagina noemt het) |
| `getPage(versie, pagina)`       | één pagina met haar voorbeelden, de API uit de web-types en absolute links       |
| `getComponent(versie, element)` | alles over één component: de API, de voorbeelden per story, de status, de opmerkingen, de historiek en `related` |
| `searchDocs(zoekterm, filters)` | welke pagina's gaan over een onderwerp? Zoekt in de titels, de tekst, en de samenvatting en zoektermen van de analyse |
| `getDocsChanges(van, tot)`      | welke pagina's kwamen erbij, wijzigden of verdwenen tussen twee versies?         |

`pagina` in `getPage` is een id, een element (`vl-button`, `button`) of een Storybook-link. `element` in
`getComponent` ook: met een id of link geeft het het hoofdelement van de pagina (`mainElement`), de andere elementen
staan in `related`. `statusOf` leidt de status van een element af: `deprecated`, `next`, `internal` of `stable`.

De pagina's van het Flux-team zelf (Bijdragen, Beheren) laten `listPages`, `searchDocs` en `getDocsChanges` standaard
weg; `hiddenFluxTeam` zegt hoeveel, en met `includeFluxTeam` toon je ze toch.

## Het pakket

```bash
pnpm run flux:server:pack
```

bouwt `dist/flux-mcp/` (niet in git): de server en de catalogus, met dezelfde relatieve paden als in de repo, zodat de
code niet weet of ze uit de repo of uit het pakket draait. Het manifest komt uit `server/package.json`, zonder
`private`. Uit de catalogus gaat enkel mee wat de server leest, en elke pagina van Storybook staat er één keer in,
per inhoud: `file` in de `index.json` van elke versie wijst naar `catalog/flux/storybook-pages/<id>/<hash>.md`. Zo
worden 5500 pagina's 772 bestanden, en is het pakket 4,2 MB gecomprimeerd.

Publiceren is een release van `@domg/flux-mcp`: `pnpm publish dist/flux-mcp`, naar de registry uit `publishConfig`.
Na elke release van Flux volgen `catalog:update`, een nieuwe versie in `server/package.json` met een entry in
`server/CHANGELOG.md`, en een release van flux-mcp. Kijk daarbij de omvang na met `npm pack --dry-run` in
`dist/flux-mcp`: wordt het gecomprimeerde pakket groter dan 15 MB, herbekijk dan beslissing 4 van ADR-004 (de
catalogus in het pakket). Bij 26 versies is het 4,3 MB; een release van Flux voegt er ongeveer 0,2 MB aan toe.

## Testen

`pnpm test` draait ook de tests van de server (zie [Tests](tests.md)): het protocol, de validator, de delen, en de
server op de echte catalogus met golden tests. Na een increment volgt een smoke test op het gebouwde pakket:

```bash
pnpm run flux:server:pack
npx @modelcontextprotocol/inspector@latest --cli node dist/flux-mcp/server/bin/flux-mcp.mjs --method tools/list
claude -p "Welke status heeft vl-alert in Flux 2.20.0?" --mcp-config <config> --strict-mcp-config \
    --allowedTools "mcp__flux__*" --output-format stream-json --verbose
```

Draai de Inspector buiten deze repo: `devEngines` weigert npx hier. Vraag `@latest`: zonder versie neemt npx soms een
oude Inspector uit zijn cache, zoals de verouderde v1. Met `--method prompts/list` en `--method prompts/get
--prompt-name <recept> --prompt-args <argument>=<waarde>` zie je de recepten zoals een client ze krijgt. Met
`--output-format stream-json` zie je in het transcript van Claude Code wat het model van een tool kreeg.

### De kennisvragen

```bash
pnpm run flux:server:eval                          # Sonnet 5.5, effort medium
pnpm run flux:server:eval --model claude-opus-5-5 --effort high
```

toetst of een model met de beschrijvingen van de tools de juiste tool kiest. Per vraag in
`resources/flux/server/kennisvragen.json` draait Claude Code headless, met enkel deze server (`--tools ""`) en in een
lege map, en het script vergelijkt de eerste tool van flux-mcp met de tools die goed zijn. Het faalt als een vraag een
andere tool kiest. De runs lopen op het abonnement van Claude Code en horen niet bij `pnpm test`. Wijzig je de
beschrijving van een tool of de instructies, draai het dan opnieuw.

### De evaluatie van een recept

```bash
pnpm run flux:server:eval-recipe migreren          # Opus 5.5, effort high
pnpm run flux:server:eval-recipe migreren --keep   # laat de toepassing na de run staan
```

voert een recept van begin tot einde uit op een echte toepassing, en controleert daarna zelf het resultaat.
`server/test/fixtures/<recept>.json` zegt welke toepassing het krijgt, met welke argumenten, en wat er moet kloppen;
de toepassing staat in `server/test/fixtures/app/` (zie haar README). Het script:

1. kopieert de toepassing naar een tijdelijke map, met git, en installeert ze; de e2e-testen moeten er groen zijn;
2. start het recept als slash-commando in Claude Code, met enkel deze server. Bij het checkpoint hervat het de sessie
   met "akkoord";
3. controleert de versies in package.json, de build en de e2e-testen, `flux_check_markup` op de HTML, de gekende
   verschillen, het rapport, en dat het recept geen ander nieuw bestand achterliet
   (`resources/flux/server/recipe-check.mjs`). Met `unchanged` mag het recept ook geen bestand wijzigen, en met
   `deviations` controleert het de afwijkingen in het rapport: het formaat uit ADR-004 (sectie 6.4), elke verwachte
   afwijking met haar regel op een van haar locaties en met haar `norm` en `vereist`, en geen verboden afwijking.
   Andere afwijkingen mogen: het model kan er meer vinden dan verwacht.

Voor `migreren` is dat de containeraanvraag op `@domg-wc` 2.12.1, naar 2.20.0. Voor `valideren` is het dezelfde
toepassing, met de afwijkingen die haar README beschrijft. `verbeteren` krijgt er met `add` een afwijkingenrapport bij,
`server/test/fixtures/verbeteren/`: het rapport van een run van `valideren`, met de uitkomsten die het team zette.
`review` krijgt een pull request: met `pr` past de evaluatie de patch `server/test/fixtures/review/type-container.patch`
toe als commit op een branch boven op `main`. Met `answer` leest ze het rapport uit het antwoord, en met
`deviations.diffOnly` moet elke afwijking op een regel van die patch staan. `uitbreiden` krijgt met `jira` een
nagemaakte Jira naast flux-mcp (`resources/flux/server/jira-stub.mjs`), met het ticket CONT-12 uit
`server/test/fixtures/uitbreiden/tickets.json`; een commentaar op het ticket komt in `jira.log` van de run.

Het script vraagt netwerk (de registry van Flux, npm, en chromium voor Playwright) en draait pnpm met een lege
gebruikersconfiguratie: de packages van Flux zijn publiek, en een verlopen token in `~/.npmrc` laat een installatie
anders falen. Een run duurt lang en loopt op het abonnement van Claude Code; ze hoort niet bij `pnpm test`.
