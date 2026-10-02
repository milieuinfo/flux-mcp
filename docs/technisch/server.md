# De server

De MCP-koppeling bestaat nog niet. Wat er is, zijn de queries op de catalogus, als gewone functies met tests. De
MCP-server hangt ze later aan tools en resources; welke, staat als voorstel in
[ADR-004](../beslissingen/ADR-004-functionaliteit-mcp-server.md).

Een fout in de vraag, zoals een onbekende versie, geeft een `CatalogError`.

## De changelog: `server/src/catalog.mjs`

| Functie                                  | Vraag                                                                          |
|------------------------------------------|--------------------------------------------------------------------------------|
| `listVersions()`                         | welke versies zijn er?                                                         |
| `getChangelog(versie, filters)`          | wat veranderde er in één versie? Filters: type, impact, component, label       |
| `getChangesBetween(van, tot, filters)`   | wat verandert er bij een upgrade? Zie hieronder                                |
| `getComponentHistory(component, bereik)` | wat veranderde er per versie aan één component?                                |
| `findChanges(zoekterm)`                  | in welke versie zit `FLUX-800`, of een wijziging over "window ready"? Zoekt ook in de uitleg |

`getChangesBetween` geeft per impact, eerst wat actie vraagt, en per component, met de netto diff van de web-types en
de dependencies, en de commits buiten de changelog.

**Wat standaard wegvalt.** Bij een upgrade telt enkel wat het project raakt. `getChangesBetween` en
`getComponentHistory` laten daarom standaard weg:

- entries met impact `none`: `hiddenNoImpact` zegt hoeveel, `includeNoImpact` toont ze toch;
- elementen waarvan in de web-types enkel de tekst wijzigde: `hiddenDescriptions` zegt hoeveel, `includeDescriptions`
  toont ze toch.

`getChangelog` en `findChanges` tonen alles, want een afnemer mag weten wat er nieuw is.

**Een onderbroken keten.** Ontbreekt er een versie tussen `van` en `tot`, dan zegt `getChangesBetween` dat met
`complete: false`, `missing` en een `warning`. De catalogus bevat de releases op de hoofdlijn van `develop-v2`, vanaf
2.0.0 (ADR-002): een upgrade vanaf v1 of vanaf een patch op een zijtak is niet volledig te beantwoorden.

## De documentatie: `server/src/docs.mjs`

Zonder versie geldt de nieuwste in de catalogus; elk antwoord zegt welke versie het is.

| Functie                         | Vraag                                                                            |
|---------------------------------|----------------------------------------------------------------------------------|
| `listDocVersions()`             | welke versies hebben documentatie, met hoeveel pagina's en analyses?             |
| `listPages(versie, filters)`    | welke pagina's zijn er? Filters: soort (`component`, `pattern`, `recipe`, …) en element |
| `getPage(versie, pagina)`       | één pagina met haar voorbeelden, de API uit de web-types en absolute links       |
| `getComponent(versie, element)` | alles over één component: de API, de voorbeelden per story, de status, de opmerkingen en de historiek uit de changelog |
| `searchDocs(zoekterm, filters)` | welke pagina's gaan over een onderwerp? Zoekt in de titels, de tekst, en de samenvatting en zoektermen van de analyse |
| `getDocsChanges(van, tot)`      | welke pagina's kwamen erbij, wijzigden of verdwenen tussen twee versies?         |

`pagina` in `getPage` is een id, een element (`vl-button`, `button`) of een Storybook-link.

De pagina's van het Flux-team zelf (Bijdragen, Beheren) laten `listPages`, `searchDocs` en `getDocsChanges` standaard
weg; `hiddenFluxTeam` zegt hoeveel, en met `includeFluxTeam` toon je ze toch.
