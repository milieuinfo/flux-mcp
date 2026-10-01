---
name: design-naar-code
title: Bouw een scherm uit een ontwerp in Figma met de Flux web-componenten
description: >
  Bouwt een basisimplementatie van een scherm uit een ontwerp in Figma, met de Flux web-componenten (@domg-wc/*) in de
  gepinde versie van deze toepassing: voorwaarden, het ontwerp lezen met de Figma MCP, de componenten en patronen
  ophalen, een plan, een checkpoint, uitvoering, verificatie en een rapport. Vraagt de Figma MCP-server in deze
  client. Aanbevolen: Opus 5.5, effort high.
arguments:
  - name: figma
    description: De link naar het ontwerp in Figma, of de node-id van het frame.
    required: true
  - name: doel
    description: Waar de code komt, als pad of als naam van een scherm.
    required: false
    default: niet opgegeven; stel een plek voor bij het checkpoint
template: design-naar-code
---

Je bouwt het ontwerp {{figma}} uit Figma als scherm in deze toepassing, met de Flux web-componenten
(`@domg-wc/*`). Waar het komt: {{doel}}. Je bouwt een basisimplementatie: de structuur, de componenten en hun
gedrag zoals het ontwerp ze toont, zonder logica of data die het ontwerp niet vraagt.

De kennis over Flux haal je met de tools van flux-mcp, voor de versie van deze toepassing: ga niet uit van wat je
denkt te weten over een component. Het rapportsjabloon zit bij deze prompt (`flux://templates/design-naar-code`); vul
het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.20.0` en niet `^2.20.0`. Dat is de
  versie die je aan elke tool van flux-mcp meegeeft.
- De toepassing start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen: draai ze.
- Deze client heeft de Figma MCP-server. Zonder kan je het ontwerp niet lezen.

## 2. Het ontwerp

1. Lees het ontwerp met de Figma MCP: de structuur van het frame, de componenten en hun varianten, en de teksten.
2. Haal per component uit de FLUX-library de Code Connect-snippet op: die noemt het `vl-*`-element en zijn
   attributen. De beschrijving van een component in Figma noemt de id van zijn pagina in Storybook.
3. Noteer wat geen component uit de library is: eigen opmaak, afbeeldingen, of een component die je niet herkent.

## 3. Kennis ophalen

1. Roep per component `flux_get_component` aan met de versie van de toepassing, en met het element uit de snippet of
   de Storybook-id uit de beschrijving. Neem de API en de voorbeelden over, niet wat je over de component denkt te
   weten.
2. Zoek voor elk deel zonder component met `flux_search_docs` of Flux er een heeft.
3. Haal met `flux_get_guidance` de patronen op die bij het scherm passen, bv. voor de opbouw van een pagina, een
   formulier of de navigatie: `kind` = `pattern`, en `appliesTo` voor de elementen die je gebruikt.
4. Vul de secties Ontwerp en Plan van het rapport in: per deel van het ontwerp het element, en het patroon dat je
   volgt.

## 4. Checkpoint

Toon het plan: de structuur van het scherm, de elementen, de patronen, en waar de code komt. Wacht op bevestiging voor
je code schrijft.

## 5. Uitvoering

- Bouw het scherm volgens het plan, stuk per stuk, met de conventies van dit project.
- Gebruik een Flux-component of een patroon waar het ontwerp er een toont, en geen eigen variant ervan. Geen eigen CSS
  voor wat een component of een utility-class van Flux al doet.
- Schrijf een e2e-test die het scherm opent en het belangrijkste gedrag nagaat.
- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het rapport.

## 6. Verificatie

- Roep `flux_check_markup` aan met de versie van de toepassing op elk nieuw of gewijzigd bestand, en los elke error
  op. Een warning over een waarde of een slot kan een gat in de web-types zijn: kijk dan de documentatie na met
  `flux_get_component`.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 7. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-design-naar-code.md` in het project, met
de datum als JJJJ-MM-DD. `resultaat` is `geslaagd` als de verificatie groen is, `gedeeltelijk` als iets niet opgelost
is, en `gestopt` als een voorwaarde ontbrak of de verificatie rood bleef. Een afwijking van het ontwerp, omdat Flux
het anders doet, hoort in "Niet automatisch opgelost".

## 8. Proces

Heeft deze omgeving een koppeling met Jira of Git, stel dan voor een branch en een pull request te maken, met het
rapport als beschrijving. Doe dat pas na bevestiging.
