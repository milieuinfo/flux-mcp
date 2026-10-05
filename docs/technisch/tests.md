# Tests

`pnpm test` draait twee soorten tests met `node --test`:

- **`server/test/`** test de server: de omzetting, de build en de queries, met inline fragmenten voor de randgevallen
  en een kopie van de echte catalogus voor de rest.
- **`test/`** test wat buiten de server valt: de modules van de scripts, en in `test/runs/` de runs van de scripts
  zelf.

De runs draaien zoals met `pnpm run`, in een kopie van de repo (`resources/workspace.mjs`), zodat de catalogus in de
repo ongemoeid blijft. Hun bron is nagemaakt:

- een flux-web-components (`test/helpers/flux-repo.mjs`) met één component en drie releases op `develop-v1`;
- een lokale server met `index.json` van Storybook en de registry, via `FLUX_STORYBOOK_URL` en `FLUX_REGISTRY`;
- een `claude` (`test/helpers/claude.mjs`) voor de analyses: de test kijkt wat het script aan Claude Code meegeeft, en
  wat het met het antwoord doet.

Of de catalogus in git nog klopt met de echte bron, controleert `flux:catalog:check`. Dat vraagt de bronrepo, de
registry en Storybook, en hoort daarom niet bij `pnpm test` (zie [De catalogus](catalogus.md#controleren)).

## De server

`server/test/mcp/` test de MCP-laag:

- het protocol, de validator voor JSON Schema en de delen, met inline fragmenten;
- de server op de echte catalogus (`server.test.mjs`): elk antwoord volgt het `outputSchema` van zijn tool, de
  Markdown komt uit `structuredContent`, en de grootste antwoorden komen in delen onder de grens die samen het hele
  antwoord geven;
- golden tests: `tools/list`, `resources/templates/list` en een paar antwoorden per tool, byte voor byte, in
  `server/test/mcp/golden/`. Ze vragen versies die volledig geanalyseerd zijn en nooit `latest`, zodat een nieuwe
  release of de analyse van een oudere versie ze niet verandert. Wijzigt een antwoord bewust, maak de
  bestanden dan opnieuw en lees het verschil na in git:

  ```bash
  FLUX_UPDATE_GOLDEN=1 pnpm test
  ```

`test/runs/server.test.mjs` bouwt het pakket met `flux:server:pack` en controleert dat de server eruit dezelfde
antwoorden geeft als uit de repo.

`server/test/markup.test.mjs` test de controle van markup met inline fragmenten en nagemaakte web-types: elke code, met
regel en kolom. `server.test.mjs` heeft er golden antwoorden voor, ook een migratie met `targetVersion`.

`flux:server:eval`, de kennisvragen voor een model, hoort niet bij `pnpm test`: het draait Claude Code op het
abonnement (zie [De server](server.md#de-kennisvragen)). De run in `test/runs/server.test.mjs` test het script met de
nagemaakte `claude`.

`server/test/mcp/prompts.test.mjs` is controle 5 uit ADR-004: elk recept in `server/prompts/` noemt enkel tools die er
zijn en zijn eigen sjabloon, en volgt het stramien. `server.test.mjs` heeft golden antwoorden voor `prompts/list` en een
gerenderd recept. `test/recipe-check.test.mjs` test wat `flux:server:eval-recipe` na een run controleert, ook het
formaat van de afwijkingen in een afwijkingenrapport. Het toetst de verwachtingen in
`server/test/fixtures/frontend-valideren.json` aan de echte catalogus en de toepassing: elke locatie bestaat, `norm` is
wat `getDocsChanges` zegt, en een code komt op die plek uit `flux_check_markup`. Het afwijkingenrapport voor
`frontend-verbeteren` moet in dat formaat staan, met elke uitkomst erin. Voor
`server/test/fixtures/frontend-wijzigingen-reviewen.json` past de test de patch van de pull request toe op een kopie van
de toepassing, en gaat na dat elke verwachte afwijking in de diff ligt. `test/jira-stub.test.mjs` test de nagemaakte
Jira die de evaluatie van `frontend-uitbreiden` naast flux-mcp start. De run zelf hoort niet bij `pnpm test` (zie [De
server](server.md#de-evaluatie-van-een-recept)).
