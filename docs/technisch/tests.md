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
