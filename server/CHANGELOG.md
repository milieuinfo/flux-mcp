# Changelog van flux-mcp

Per versie van flux-mcp: wat er aan de server veranderde. Welke versies van Flux de catalogus bevat, zegt de tool
`flux_list_versions`.

## 0.5.0 (nog niet gepubliceerd)

Increment 5 van ADR-004, voor zover de bron er is: de flux-starter-app als template-repo.

- Van ontwerp naar toepassing gaat in vijf recepten, elk met een resultaat dat een mens nakijkt voor de volgende stap:
  - `toepassing-aanmaken` (`/mcp__flux__toepassing-aanmaken`) maakt een nieuw project uit de flux-starter-app, met
    een gepinde versie van Flux en flux-mcp in de `.mcp.json`;
  - `toepassing-analyseren` beschrijft uit het ontwerp in Figma de schermen, het menu, de navigatie, de opbouw van de
    pagina en de gedeelde componenten, in `.flux/analyse/toepassing.md`, zonder code te wijzigen;
  - `toepassing-skelet-bouwen` bouwt daarmee de opbouw, het menu, en per scherm een route met een leeg scherm;
  - `scherm-analyseren` beschrijft één scherm uit zijn frame in Figma, in `.flux/analyse/schermen/<scherm>.md`,
    zonder code te wijzigen;
  - `scherm-bouwen` bouwt één scherm volgens die analyse.
- Een analyse is een levend document in `.flux/analyse/`: een nieuwe run werkt het bij, en behoudt wat een mens erin
  besliste.
- Het recept `design-naar-code` verdwijnt: `scherm-analyseren` en `scherm-bouwen` nemen het over, in een toepassing
  die met `toepassing-skelet-bouwen` opgezet is. Een bestaande toepassing die een scherm uit een ontwerp krijgt,
  gebruikt `uitbreiden`.
- De weg van het ontwerp heeft nog geen evaluatie met `flux:server:eval-recipe`: daar is geen Figma MCP-server, en de
  flux-starter-app vraagt een login.

## 0.4.0 (nog niet gepubliceerd)

Increment 4 van ADR-004: de norm.

- Het recept `valideren` (`/mcp__flux__valideren`) legt de toepassing naast de norm en schrijft een
  afwijkingenrapport, zonder code te wijzigen: de API tegen de gepinde versie, de richtlijnen en patronen tegen
  `latest`. Per afwijking de regel, de plek, de ernst, een voorgestelde uitkomst, of de pagina sinds de gepinde versie
  wijzigde, en of het voorstel een migratie vraagt. Het team beslist in de pull request van het rapport.
- Het recept `verbeteren` (`/mcp__flux__verbeteren`) werkt de afwijkingen weg die het team in een afwijkingenrapport
  op `volgt-norm` zette. Het laat liggen wat te beslissen is of een migratie vraagt, en stelt per normkandidaat een
  ticket voor in het Jira-project `FLUX`, met het label `normkandidaat`.
- Het recept `review` (`/mcp__flux__review`) legt wat een branch toevoegt of wijzigt naast de norm, als voorbereiding
  op de menselijke review. Het schrijft geen bestand, en geeft het reviewrapport als commentaar voor de pull request,
  met een oordeel: goedkeuren, aanpassen of bespreken.
- Het recept `uitbreiden` (`/mcp__flux__uitbreiden`) breidt de toepassing uit met wat een Jira-ticket of een ontwerp
  in Figma vraagt, volgens de norm, en laat bestaande afwijkingen buiten de uitbreiding staan.
- Een rapport overschrijft nooit een ander: bestaat de naam al, dan krijgt het `-2`, `-3`, …. Dat geldt ook voor
  `migreren` en `design-naar-code`.
- Het pakket heet `@domg/flux-mcp`, en publiceert naar de registry van Flux; een project start het met
  `npx -y @domg/flux-mcp@<versie>`.
- `flux:server:eval-recipe valideren` valideert de kleine toepassing, die nu ook bewuste afwijkingen van de norm
  heeft: met Opus 5.5, effort high, vindt het recept in een vijftal minuten de tien verwachte afwijkingen, met de
  juiste regel, plek, `norm` en `vereist`. `migreren` slaagt nog op dezelfde toepassing, nu ook met FLUX-270.
- `flux:server:eval-recipe verbeteren` geeft het recept het rapport van die run, met de uitkomsten die het team zette:
  het werkt de afwijkingen met `volgt-norm` weg en laat de rest liggen, met Opus 5.5, effort high, in een vijftal
  minuten.
- `flux:server:eval-recipe review` geeft het recept een pull request op dezelfde toepassing: het vindt de vier
  afwijkingen in de diff en meldt niets daarbuiten, met Opus 5.5, effort high, in een tweetal minuten.
- `flux:server:eval-recipe uitbreiden` geeft het recept het ticket CONT-12 uit een nagemaakte Jira: het bouwt een
  verplicht telefoonnummer volgens de norm en laat de bestaande afwijkingen staan, met Opus 5.5, effort high, in een
  viertal minuten.

## 0.3.0 (nog niet gepubliceerd)

Increment 3 van ADR-004: de recepten.

- De recepten `migreren` en `design-naar-code` als prompts, met hun rapportsjabloon als embedded resource; in Claude
  Code `/mcp__flux__migreren` en `/mcp__flux__design-naar-code`.
- Voor clients zonder prompts: `flux://prompts/{name}` en `flux://templates/{workflow}`.
- Een voorwaarde van elk recept: de toepassing start standalone en de e2e-testen draaien zonder echte backend.
- De instructies noemen de recepten.
- `flux:server:eval-recipe migreren` voert het recept uit op een kleine toepassing met `@domg-wc` 2.12.1 en
  controleert het resultaat: de migratie naar 2.20.0 slaagt met Opus 5.5, effort high, in een vijftal minuten.

## 0.2.0 (nog niet gepubliceerd)

Increment 2 van ADR-004: `flux_check_markup`.

- De tool `flux_check_markup` toetst HTML, een lit-template of een heel `.ts`- of `.js`-bestand aan de web-types van
  een versie, met regel en kolom. Met `targetVersion` meldt ze wat er in die versie breekt, met de entry uit de
  changelog.
- Waarden en slots buiten de web-types zijn een warning: daar zijn de web-types vaak onvolledig.
- De instructies en de beschrijvingen van `flux_get_component` en `flux_get_upgrade` noemen `flux_check_markup`.
- `flux:server:eval` toetst met 20 kennisvragen of een model de juiste tool kiest: 20 van 20 met Sonnet 5.5, effort
  medium.

## 0.1.0 (nog niet gepubliceerd)

Increment 1 van ADR-004: de kennis die de catalogus heeft, over MCP.

- De tools `flux_list_versions`, `flux_search_docs`, `flux_get_component`, `flux_get_guidance`, `flux_get_upgrade`
  en `flux_find_changes`, met `structuredContent` en Markdown, en een groot antwoord in delen.
- De resources `flux://versions`, `flux://{version}/changelog`, `flux://{version}/docs`,
  `flux://{version}/docs/{page}` en `flux://{version}/components/{component}`, met aanvulling.
- De catalogus van Flux 2.0.0 tot en met 2.20.0, de releases op de hoofdlijn van v2.
