# flux-mcp

MCP-server (Model Context Protocol) voor **Flux**: stelt de Flux-catalogus en bijhorende resources beschikbaar
aan LLM-agents en tooling via MCP. De server zelf kent Figma niet.

Daarnaast verrijkt deze repo de FLUX Figma-library met wat we over de componenten weten, om te beginnen met
de Code Connect snippets. Een agent vindt die niet hier, maar via de Figma MCP-server, terwijl hij in Figma
werkt. Die twee sporen staan los van elkaar; wat ze delen is de kennis per component, die hier in git leeft.

## Structuur

| Folder                | Inhoud                                                              |
|-----------------------|---------------------------------------------------------------------|
| `server/`             | de MCP-server zelf                                                  |
| `catalog/figma/`      | wat we naar Figma schrijven: `code-connect/v2/` (de templates)       |
| `prompts/`            | MCP-prompts die de server aanbiedt (concept)                        |
| `resources/`          | scripts enzo                                                        |

Alle scripts lopen via `pnpm run` (zie `package.json`); installeer eerst met `pnpm install`.

## TL;DR: Figma na een release

Voor versie `X.Y.Z`; `FIGMA_TOKEN` staat in je omgeving. Details in de secties hieronder.

1. `pnpm run figma:web-components:copy-figma X.Y.Z`: templates van tag `vX.Y.Z` naar de catalogus.
2. `pnpm run figma:code-connect:publish --dry-run`: valideert tegen Figma, publiceert niets.
3. `pnpm run figma:code-connect:publish`: publiceert de snippets (of via Jenkins, `CODE_CONNECT_ACTION` publish).
4. Commit de catalogus.

## Bronrepo

Alle scripts hier halen hun gegevens uit de repo van Flux Web Components. Dat gebeurt vanzelf: ze klonen
`https://github.com/milieuinfo/flux-web-components.git` over https naar een tijdelijke map. Die repo is open
source, dus er zijn geen credentials voor nodig en in CI hoef je niets in te stellen.

Lokaal kan je een bestaande clone gebruiken door `FLUX_REPO` vóór het commando te zetten:

```bash
FLUX_REPO=~/repos/flux-web-components pnpm run figma:web-components:copy-figma 2.20.0
```

Dat scheelt een clone per run en werkt zonder netwerk. De variabele geldt enkel voor dat ene commando, er
wordt niets bewaard. Zorg wel dat je clone de gevraagde tag kent, anders eerst `git fetch --tags`.

Je eigen clone wordt nooit gewijzigd: `figma:web-components:copy-figma` kloont ook een lokale bron eerst naar
een tijdelijke map.

## Code Connect

De Figma Code Connect templates horen bij Flux Web Components, maar worden van hieruit gepubliceerd. Na een
npm release halen we de templates van die release op in `catalog/figma/code-connect/v2/`, zodat we altijd
weten wat er in Figma staat. De catalogus houdt geen Flux-versies naast elkaar: een nieuwe kopie vervangt de
vorige, git bewaart de historiek en `manifest.json` zegt welke release erin zit.

```bash
pnpm run figma:web-components:copy-figma 2.20.0    # kopieert tag v2.20.0 naar de catalogus
pnpm run figma:code-connect:publish --dry-run      # valideert de templates, publiceert niets
pnpm run figma:code-connect:publish                # publiceert naar Figma
pnpm run figma:code-connect:unpublish              # haalt die snippets weer weg
```

De map is de Figma-library. Een nieuwe Flux-major komt altijd samen met een nieuwe library-file met hetzelfde
nummer: 2.21.0 hoort bij `v2`, 3.0.0 bij `v3`. Wie een versie meekrijgt, leidt de library daaruit af, en een
nieuwe library komt er vanzelf naast te staan. `publish` en `unpublish` krijgen geen versie: die nemen de
library die in de catalogus staat, en pas als er meerdere zijn kies je met `--library`:

```bash
pnpm run figma:code-connect:publish --library v3 --dry-run
```

De Code Connect CLI is een devDependency in `package.json`. In Jenkins installeert `install-pnpm.sh` eerst
dezelfde pnpm-versie als flux-web-components; dat is het enige script dat niet via `pnpm run` kan, omdat pnpm
er dan nog niet is.

Publiceren en unpublishen vragen `FIGMA_TOKEN`, een Figma token met `File content: read` en
`Code Connect: write`. Voor een dry run volstaat `File content: read`. Lokaal zet je het vóór het commando:

```bash
FIGMA_TOKEN=<token> pnpm run figma:code-connect:publish --dry-run
```

In Jenkins draaien dezelfde scripts. Start de pipeline via "Build with Parameters" met `CODE_CONNECT_ACTION`
(dry run, publish of unpublish); het token komt daar uit de credential `flux-web-componenten/figma_cli`,
dezelfde secret text als in flux-web-components. De parameter staat standaard op `geen`, zodat een gewone
branch- of PR-build niets naar Figma stuurt en ook niet naar de credential zoekt.

Goed om te weten:

- Figma bewaart per node en per label één snippet. Publiceren vervangt dus wat er voor die nodes stond. Terug
  naar een vorige stand doe je door die opnieuw te publiceren, niet met `figma:code-connect:unpublish`.
- De catalogus is plat: één map per soort (`atom`, `block`, `compliance`, `form`, `map`, `styles`), zonder de
  mappen van de bronrepo. De helpers die de templates importeren, zoals `escape-html.ts`, komen in `util/`;
  `figma:web-components:copy-figma` herschrijft de imports en de include-patronen in `figma.config.json` daarop.
- `figma:web-components:copy-figma` haalt de tag `v<versie>`. De versie is verplicht: het script vervangt de
  hele catalogus, dus dat mag niet per ongeluk gebeuren. Met `--ref` kies je een andere git ref; welke repo
  hij aanspreekt staat hierboven onder Bronrepo.
- `--library` bestaat enkel op `publish` en `unpublish`, want daar valt niets af te leiden; `3` en `v3` mogen
  allebei.
- De versie van de Code Connect CLI staat gepind in `package.json`: we publiceren met dezelfde versie als
  waarmee de templates gevalideerd zijn.

## Status

Project in opstart. Setup, gebruik en architectuur volgen.
