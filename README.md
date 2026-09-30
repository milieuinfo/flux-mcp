# flux-mcp

Een MCP-server (Model Context Protocol) die LLM-agents informatie geeft over **Flux Web Components**: per Flux-release
wat er bij een upgrade verandert. De server zelf komt nog; wat er is, zijn de catalogus, de scripts die hem vullen en
de queries waarop de server zal steunen.

Daarnaast verrijkt de repo de FLUX Figma-library met Code Connect snippets, component descriptions en documentation
links. De twee sporen staan los van elkaar, en de server kent Figma niet; wat ze delen, is de kennis per component,
die hier in git leeft.

## Aan de slag

Node 22 en pnpm 11; `devEngines` weigert npm.

```bash
pnpm install
pnpm test
```

Na een Flux-release:

- **de catalogus:** `pnpm run flux:catalog:update X.Y.Z` doet alles, ook de analyse door Claude Code;
- **Figma:** acht stappen, van de templates tot de library in Figma (zie [Figma](docs/technisch/figma.md)).

Met een lokale clone van de bronrepo zet je `FLUX_REPO=~/pad/naar/flux-web-components` vóór het commando.

## Structuur

| Map                  | Inhoud                                                                                       |
|----------------------|----------------------------------------------------------------------------------------------|
| `catalog/flux/`      | de catalogus per Flux-release: web-types, packages en changelog, met de analyse              |
| `catalog/figma/`     | wat naar Figma gaat: `code-connect/v2/` (de templates) en `descriptions/v2/` (de kennis)     |
| `server/`            | de queries op de catalogus en hun tests; later de MCP-server                                 |
| `resources/`         | de scripts, per spoor: `flux` en `figma`                                                     |
| `prompts/`           | de prompts voor agents: de analyse en de review van de catalogus, de Figma-descriptions      |
| `test/`              | de tests van wat buiten de server valt, zoals de modules van de scripts                      |
| `docs/technisch/`    | de technische documentatie                                                                   |
| `docs/beslissingen/` | de ADR's: wat we beslisten en waarom; `ADR-000-template.md` is het sjabloon                  |
| `tsconfig.json`      | enkel om de templates in de catalogus te laten typechecken; er wordt niets gecompileerd      |

## Documentatie

| Onderwerp                                             | Waarover                                                            |
|-------------------------------------------------------|---------------------------------------------------------------------|
| [Scripts en bronnen](docs/technisch/scripts.md)       | hoe je de scripts draait, en waar ze hun gegevens halen             |
| [De catalogus](docs/technisch/catalogus.md)           | wat erin staat, bijwerken na een release of voor een reeks versies  |
| [De changelog](docs/technisch/changelog.md)           | wat er per versie verandert: bronnen, build en analyse              |
| [Claude Code](docs/technisch/claude-code.md)          | hoe de analyse draait: abonnement, rechten en model                 |
| [De server](docs/technisch/server.md)                 | de queries op de catalogus                                          |
| [Figma](docs/technisch/figma.md)                      | Code Connect en de component descriptions                           |

De beslissingen en het waarom staan in de ADR's onder [`docs/beslissingen/`](docs/beslissingen/):

- [ADR-001](docs/beslissingen/ADR-001-changelog-voor-de-mcp-server.md): de changelog per versie;
- [ADR-002](docs/beslissingen/ADR-002-historische-catalogus-v2.md): de historische catalogus van v2.
