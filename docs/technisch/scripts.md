# Scripts en bronnen

## De scripts

Alle scripts lopen via `pnpm run` (zie `package.json`); installeer eerst met `pnpm install`. De twee sporen zijn
`flux`, de catalogus voor de MCP-server, en `figma`, wat we naar de Figma-library schrijven.

De flux-scripts nemen een versie met of zonder `v`: `2.20.0` en `v2.20.0` mogen allebei, net als een prerelease
zoals `2.21.0-develop-v2.1`. Een ongeldige versie stopt het script.

## De bronrepo

De scripts halen hun gegevens uit de repo van Flux Web Components. Standaard klonen ze
`https://github.com/milieuinfo/flux-web-components.git` over https naar een tijdelijke map. Die repo is open
source: er zijn geen credentials voor nodig, en in CI hoef je niets in te stellen.

Lokaal gebruik je een bestaande clone met `FLUX_REPO` vóór het commando. Dat scheelt een clone per run en werkt
zonder netwerk:

```bash
FLUX_REPO=~/repos/flux-web-components pnpm run figma:web-components:copy-figma 2.20.0
```

- De variabele geldt enkel voor dat ene commando; er wordt niets bewaard.
- Je clone moet de gevraagde tag kennen, anders eerst `git fetch --tags`.
- Je clone wordt nooit gewijzigd: `figma:web-components:copy-figma` kloont ook een lokale bron eerst naar een
  tijdelijke map.

## Andere bronnen

| Variabele            | Bron                                   | Standaard                                                          |
|----------------------|----------------------------------------|--------------------------------------------------------------------|
| `FLUX_REGISTRY`      | de registry van de packages            | `https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm` |
