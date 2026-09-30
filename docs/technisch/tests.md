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
