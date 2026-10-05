---
name: frontend-aanmaken
title: Maak een nieuwe frontend uit de flux-starter-app
description: >
  Maakt een nieuw project voor een frontend met de Flux web-componenten (@domg-wc/*), uit de flux-starter-app:
  voorwaarden, de starter lezen, een checkpoint, de naam, de gepinde versie van Flux en flux-mcp in .mcp.json,
  verificatie en een rapport. Stap 1 van ontwerp naar frontend, voor frontend-analyseren. Draait in de map waarin
  het project komt. Aanbevolen: Sonnet 5.5, effort medium.
arguments:
  - name: naam
    description: De naam van de frontend en van zijn map, in kebab-case, bv. containeraanvraag.
    required: true
template: frontend-aanmaken
---

Je maakt een nieuw project voor de frontend {{naam}}, uit de flux-starter-app van Team Flux
(`https://git.omgeving.vlaanderen.be/git/flux/flux-starter-app`), in de map `{{naam}}` onder de huidige map. Je bouwt
geen schermen. Na dit recept heeft de frontend het technisch fundament van de starter, een gepinde versie van Flux,
flux-mcp in de `.mcp.json`, en groene e2e-testen.

Dit is de eerste van vijf recepten van ontwerp naar frontend. Elk is een eigen stap, met een resultaat dat een mens
nakijkt voor de volgende start:

1. `frontend-aanmaken`: dit recept, het project uit de starter;
2. `frontend-analyseren`: de analyse van de frontend uit het ontwerp in Figma, in `.flux/analyse/frontend.md`;
3. `frontend-structuur-bouwen`: de opbouw van de pagina, het menu, en per scherm een route met een leeg scherm;
4. `scherm-analyseren`: de analyse van één scherm, in `.flux/analyse/schermen/<scherm>.md`;
5. `scherm-bouwen`: één scherm, volgens zijn analyse.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over Flux of de starter.
Het rapportsjabloon zit bij deze prompt (`flux://templates/frontend-aanmaken`); vul het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat de ontwikkelaar moet doen.

- De naam `{{naam}}` is kebab-case: kleine letters, cijfers en koppeltekens.
- De map `{{naam}}` bestaat nog niet in de huidige map. Bestaat ze, en is ze een clone van de starter zonder eigen
  wijzigingen, bv. omdat de ontwikkelaar de clone zelf maakte, dan sla je de clone in stap 2 over.
- Git kan de starter lezen: `git ls-remote` op de url geeft de branches. Vraagt git een login, of weigert de server,
  vraag de ontwikkelaar dan om de credentials voor git in te stellen, of om de clone zelf te maken in `{{naam}}`.

## 2. Kennis ophalen

1. Lees met `flux_get_guidance` op `latest` de pagina `afnemen-starter-app`: de opzet van de starter, zijn scripts en
   zijn tooling. Vind je ze niet, zoek dan met `flux_search_docs` naar de starter-app.
2. Roep `flux_list_versions` aan: de nieuwste versie in de catalogus is `latest`.
3. Clone de starter in `{{naam}}`, met zijn geschiedenis. De clone is nog de starter zelf: je wijzigt er niets aan voor
   het checkpoint.
4. Lees in de clone:
   - package.json: de scripts, de versie van Node, de package manager en de versies van de `@domg-wc`-packages;
   - de lockfile en de README;
   - de plekken waar de starter zijn eigen naam gebruikt, bv. package.json, de README, de titel van de pagina, de
     configuratie van de build en de e2e-testen.
5. Bepaal de versie van Flux: de versie van `@domg-wc/components` in package.json, of de versie in de lockfile als er
   een bereik staat. Alle `@domg-wc`-packages krijgen die versie, exact. Is ze ouder dan `latest`, noteer dat dan:
   de volgende stap is dan het recept `frontend-upgraden`.
6. Vul de sectie Opzet van het rapport in.

## 3. Checkpoint

Toon de opzet: de map, de plekken waar de naam komt, de versie van Flux en of ze ouder is dan `latest`, de remotes, en
de `.mcp.json`. Wacht op bevestiging voor je de clone wijzigt.

## 4. Uitvoering

- Hernoem de remote `origin` naar `starter`: zo kan het team later wijzigingen van de starter mergen, zoals bij een
  fork. Voeg geen eigen `origin` toe: die repository maakt het team.
- Geef het project de naam `{{naam}}` op de plekken uit stap 2. Wijzig verder niets aan de code van de starter.
- Pin de `@domg-wc`-packages in package.json exact op de versie uit stap 2, zonder `^` of `~`, en werk de lockfile bij
  met de package manager van de starter.
- Zet flux-mcp in `.mcp.json` in de root van het project, met de versie van flux-mcp die nu draait: het veld `catalog`
  in een antwoord van een tool. Staat er al een `.mcp.json`, voeg de server dan toe en laat de rest staan:

  ```json
  {
      "mcpServers": {
          "flux": { "command": "npx", "args": ["-y", "@domg/flux-mcp@<versie>"] }
      }
  }
  ```

- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het
  rapport.

## 5. Verificatie

- Installeer met de package manager van de starter, in de versie van Node die de starter vraagt.
- Draai de build, de lint, de unit-testen en de e2e-testen met de scripts van de starter, in de variant die zonder
  interactie draait. De e2e-testen draaien zonder echte backend.
- Roep `flux_check_markup` aan met `version` = de gepinde versie op de bestanden van de starter met `vl-*`-elementen.
  Een error is een probleem van de starter: los het niet op, maar meld het in "Niet automatisch opgelost".
- `git status` toont enkel de naam, de versies, de lockfile, `.mcp.json` en het rapport als wijziging.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `{{naam}}/.flux/rapporten/<datum>-frontend-aanmaken.md`, met de
datum als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-frontend-aanmaken-2.md`, `-3`, …: overschrijf nooit
een rapport. `resultaat` is `geslaagd` als de build en de testen groen zijn, `gedeeltelijk` als iets van de starter
rood bleef, en `gestopt` als een voorwaarde ontbrak.

## 7. Proces

Stel voor de wijzigingen en het rapport te committen in de clone, en zeg wat het team nog moet doen: een eigen
repository maken en die als `origin` toevoegen. Doe dat pas na bevestiging.

Sluit af met de volgende stap: start de client in de map `{{naam}}`, zodat de `.mcp.json` er geldt, met de Figma
MCP-server erbij, en draai daar het recept `frontend-analyseren` met de link naar het ontwerp. Is de versie van Flux
ouder dan `latest`, draai dan eerst het recept `frontend-upgraden`.
