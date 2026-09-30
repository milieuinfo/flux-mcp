# flux-mcp

Een MCP-server (Model Context Protocol) die LLM-agents informatie geeft over **Flux Web Components**, per Flux-release.
De server zelf komt nog; wat er is, zijn de catalogus en de scripts die hem vullen.

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

- **de catalogus:** `pnpm run flux:web-types:copy X.Y.Z` haalt de web-types van die release op;
- **Figma:** acht stappen, van de templates tot de library in Figma (zie [Figma](docs/technisch/figma.md)).

Met een lokale clone van de bronrepo zet je `FLUX_REPO=~/pad/naar/flux-web-components` vóór het commando.

## Structuur

| Map                  | Inhoud                                                                                       |
|----------------------|----------------------------------------------------------------------------------------------|
| `catalog/flux/`      | de catalogus per Flux-release: de web-types                                                  |
| `catalog/figma/`     | wat naar Figma gaat: `code-connect/v2/` (de templates) en `descriptions/v2/` (de kennis)     |
| `server/`            | het lezen en vergelijken van de web-types, met tests; later de MCP-server                    |
| `resources/`         | de scripts, per spoor: `flux` en `figma`                                                     |
| `prompts/`           | de prompts voor agents, zoals die voor de Figma-descriptions                                 |
| `docs/technisch/`    | de technische documentatie                                                                   |
| `tsconfig.json`      | enkel om de templates in de catalogus te laten typechecken; er wordt niets gecompileerd      |

## Documentatie

| Onderwerp                                             | Waarover                                                            |
|-------------------------------------------------------|---------------------------------------------------------------------|
| [Scripts en bronnen](docs/technisch/scripts.md)       | hoe je de scripts draait, en waar ze hun gegevens halen             |
| [De catalogus](docs/technisch/catalogus.md)           | wat erin staat, en de web-types ophalen en vergelijken              |
| [Figma](docs/technisch/figma.md)                      | Code Connect en de component descriptions                           |
