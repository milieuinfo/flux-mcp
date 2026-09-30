# Figma: Code Connect en de component descriptions

Deze repo verrijkt de FLUX Figma-library met wat we over de componenten weten: de Code Connect snippets, de component
descriptions en de documentation links. Een agent vindt die via de Figma MCP-server, terwijl hij in Figma werkt.

## Na een release

Voor versie `X.Y.Z`, met `FIGMA_TOKEN` in je omgeving:

1. `pnpm run figma:web-components:copy-figma X.Y.Z`: de templates van tag `vX.Y.Z` naar de catalogus.
2. `pnpm run figma:code-connect:publish --dry-run`: valideert tegen Figma, publiceert niets.
3. `pnpm run figma:code-connect:publish`: publiceert de snippets (of via Jenkins, `CODE_CONNECT_ACTION` publish).
4. `pnpm run figma:descriptions:write X.Y.Z`: de payload met de descriptions en de documentation links.
5. Commit de catalogus.
6. Maak in Figma een branch van de library.
7. Laat een AI-agent met de Figma MCP `prompts/figma-descriptions.md` uitvoeren op die branch. Hij toont wat verschilt
   en schrijft pas na je akkoord.
8. Review de branch, merge hem en publiceer de library.

Een description pas je aan in `catalog/figma/descriptions/v2/<soort>/<naam>.figma.md` (via een PR), nooit rechtstreeks
in Figma. Bij de volgende release neemt stap 7 ze mee; wil je ze eerder in Figma, herhaal dan stap 4 en 6 tot 8.

## Code Connect

De templates horen bij Flux Web Components, maar worden van hieruit gepubliceerd. Na een release staan ze in
`catalog/figma/code-connect/v2/`, zodat we altijd weten wat er in Figma staat.

```bash
pnpm run figma:web-components:copy-figma 2.20.0    # kopieert tag v2.20.0 naar de catalogus
pnpm run figma:code-connect:publish --dry-run      # valideert de templates, publiceert niets
pnpm run figma:code-connect:publish                # publiceert naar Figma
pnpm run figma:code-connect:unpublish              # haalt die snippets weer weg
pnpm run figma:code-connect:publish --library v3 --dry-run   # een andere library, als er meerdere zijn
```

**Eén versie tegelijk.** De catalogus houdt geen Flux-versies naast elkaar: een nieuwe kopie vervangt de vorige, git
bewaart de historiek en `manifest.json` zegt welke release erin zit.

**De map is de Figma-library.** Een nieuwe Flux-major komt altijd met een nieuwe library-file met hetzelfde nummer:
2.21.0 hoort bij `v2`, 3.0.0 bij `v3`. Wie een versie meekrijgt, leidt de library daaruit af, en een nieuwe library
komt er vanzelf naast te staan. `publish` en `unpublish` krijgen geen versie: ze nemen de library in de catalogus, en
pas als er meerdere zijn, kies je met `--library` (`3` en `v3` mogen allebei).

**`figma:web-components:copy-figma`**

- haalt de tag `v<versie>`, of met `--ref` een andere git ref, uit de [bronrepo](scripts.md#de-bronrepo);
- vraagt altijd een versie: het vervangt de hele catalogus, dus dat mag niet per ongeluk gebeuren;
- zet de templates plat, één map per soort (`atom`, `block`, `compliance`, `form`, `map`, `styles`), zonder de mappen
  van de bronrepo. De helpers die de templates importeren, zoals `escape-html.ts`, komen in `util/`; het script
  herschrijft de imports en de include-patronen in `figma.config.json` daarop.

**Publiceren** vraagt `FIGMA_TOKEN`, een Figma token met `File content: read` en `Code Connect: write`; voor een dry
run volstaat `File content: read`. Lokaal zet je het vóór het commando:

```bash
FIGMA_TOKEN=<token> pnpm run figma:code-connect:publish --dry-run
```

- Figma bewaart per node en per label één snippet. Publiceren vervangt dus wat er voor die nodes stond. Terug naar een
  vorige stand doe je door die opnieuw te publiceren, niet met `unpublish`.
- De Code Connect CLI is een devDependency, met een gepinde versie: we publiceren met dezelfde versie als waarmee de
  templates gevalideerd zijn.

**In Jenkins** draaien dezelfde scripts. Start de pipeline via "Build with Parameters" met `CODE_CONNECT_ACTION` (dry
run, publish of unpublish); het token komt uit de credential `flux-web-componenten/figma_cli`, dezelfde secret text als
in flux-web-components. De parameter staat standaard op `geen`, zodat een gewone branch- of PR-build niets naar Figma
stuurt en ook niet naar de credential zoekt. `install-pnpm.sh` installeert eerst dezelfde pnpm-versie als
flux-web-components; dat is het enige script dat niet via `pnpm run` kan, omdat pnpm er dan nog niet is.

## De kennis per component en de descriptions

`catalog/figma/descriptions/v2/<soort>/<naam>.figma.md` bundelt wat een ontwerper, een developer of een AI over één
component in Figma moet weten; sommige van die componenten bestaan enkel in Figma. Het bestand heet zoals het Code
Connect template waar het bij hoort: `descriptions/v2/atom/vl-button.figma.md` hoort bij
`code-connect/v2/atom/vl-button.figma.ts`. De kennis loopt door over Flux-releases heen: ze hoort bij de Figma-library,
niet bij een versie van de web componenten.

```markdown
---
storybook: components-atom-button
---

# vl-button

## Figma

Knop voor een actie op de pagina.

• …
```

- `storybook` is de id van de documentatiepagina, zonder `--documentatie`.
- Onder `## Figma` staat de tekst die als component description in Figma komt. De Figma MCP geeft die aan een AI mee
  als "usage descriptions … best practices", samen met de documentation link. Schrijf ze voor wie ontwerpt of van
  design naar code gaat: wat het component is, waar het vaak misloopt en wat er voor toegankelijkheid in de code moet
  gebeuren. Details horen in Storybook.

Na een `figma:web-components:copy-figma` bouw je de payload voor die versie:

```bash
pnpm run figma:descriptions:write 2.20.0    # dist/descriptions/2.20.0.json
```

Het script leidt de library af uit de major van de versie, koppelt elk bestand via het template aan zijn Figma node,
controleert of de Storybook-pagina in die release bestaat en weigert teksten boven 1200 tekens. Onder elke description
zet het een regel dat de tekst gegenereerd is uit dat `.figma.md` bestand en niet in Figma aangepast mag worden. De
payload is wegwerp en staat in `.gitignore`: de versie bepaalt enkel naar welke Storybook-release de documentation
links wijzen. Genereer ze opnieuw wanneer je naar Figma schrijft.

**Naar Figma** kan niet vanuit een script of Jenkins: descriptions en documentation links zijn enkel via de Plugin API
te wijzigen, niet via de REST API. Daarom:

1. De developer maakt in de Figma-file van de library een branch.
2. Een AI-agent met de Figma MCP schrijft de descriptions en de documentation links in die branch weg, met
   `dist/descriptions/<versie>.json`, dat de teksten al koppelt aan de juiste Figma node en Storybook-versie. De
   werkwijze staat in `prompts/figma-descriptions.md`: hij toont eerst wat verschilt en schrijft pas na akkoord.
3. De developer reviewt de wijzigingen in de branch, merget ze en publiceert de library.
