# Scripts en bronnen

## De scripts

Alle scripts lopen via `pnpm run` (zie `package.json`); installeer eerst met `pnpm install`.

Een script heet `<spoor>:<onderwerp>:<actie>`, bv. `flux:changelog:build` of `figma:code-connect:publish`, en staat
in `resources/<spoor>/<onderwerp>/<actie>.sh` of `.mjs`. De twee sporen zijn `flux`, de catalogus voor de
MCP-server, en `figma`, wat we naar de Figma-library schrijven.

- Wat de scripts van een spoor delen, zoals `common.sh`, staat in `resources/<spoor>/`.
- Wat beide sporen delen, de bronrepo (`FLUX_REPO`) en de controle van de versie, staat één keer: in
  `resources/common.sh` voor bash en in `resources/common.mjs` voor Node.

Een versie mag met of zonder `v`: `2.20.0` en `v2.20.0` mogen allebei, net als een prerelease zoals
`2.21.0-develop-v2.1`. Een ongeldige versie stopt het script.

## De bronrepo

De scripts halen hun gegevens uit de repo van Flux Web Components. Standaard klonen ze
`https://github.com/milieuinfo/flux-web-components.git` over https naar een tijdelijke map. Die repo is open
source: er zijn geen credentials voor nodig, en in CI hoef je niets in te stellen.

Lokaal gebruik je een bestaande clone met `FLUX_REPO` vóór het commando. Dat scheelt een clone per run en werkt
zonder netwerk:

```bash
FLUX_REPO=~/repos/flux-web-components pnpm run figma:code-connect:copy 2.20.0
```

- De variabele geldt enkel voor dat ene commando; er wordt niets bewaard.
- Je clone moet de gevraagde tag kennen, anders eerst `git fetch --tags`.
- Je clone wordt nooit gewijzigd: `figma:code-connect:copy` kloont ook een lokale bron eerst naar een tijdelijke map.

## Andere bronnen

| Variabele            | Bron                                   | Standaard                                                          |
|----------------------|----------------------------------------|--------------------------------------------------------------------|
| `FLUX_REGISTRY`      | de registry van de packages            | `https://repo.omgeving.vlaanderen.be/artifactory/api/npm/local-npm` |
| `FLUX_STORYBOOK_URL` | de site met de Storybooks              | `https://flux.omgeving.vlaanderen.be`                              |

De tests van de runs wijzen beide naar een lokale server (zie [Tests](tests.md)).
