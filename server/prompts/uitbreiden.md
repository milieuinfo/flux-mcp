---
name: uitbreiden
title: Breid deze toepassing uit vanuit een ticket of een ontwerp, met de Flux web-componenten
description: >
  Breidt een bestaande toepassing uit met wat een Jira-ticket of een ontwerp in Figma vraagt, met de Flux
  web-componenten (@domg-wc/*) in de gepinde versie en volgens de norm: voorwaarden, de analyse van het ticket, de
  componenten en patronen ophalen, een plan, een checkpoint, uitvoering, verificatie en een rapport. Bestaande
  afwijkingen buiten de uitbreiding laat het staan. Vraagt een koppeling met Jira of de Figma MCP-server in deze
  client. Aanbevolen: een sterk analysemodel (Fable 5.1) tot het checkpoint, en Opus 5.5, effort high, daarna.
arguments:
  - name: ticket
    description: De key van het Jira-ticket, bv. CONT-12.
    required: false
    default: geen
  - name: figma
    description: De link naar het ontwerp in Figma, of de node-id van het frame.
    required: false
    default: geen
template: uitbreiden
---

Je breidt deze toepassing uit met wat een Jira-ticket of een ontwerp in Figma vraagt, met de Flux web-componenten
(`@domg-wc/*`). Het ticket: {{ticket}}. Het ontwerp: {{figma}}. Je bouwt enkel wat het ticket of het ontwerp vraagt, en
wat je bouwt, volgt de norm: de API van de gepinde versie van deze toepassing, en de richtlijnen en patronen van de
nieuwste versie in de catalogus, `latest`. Zo groeit de toepassing bij elke uitbreiding naar de norm toe. Bestaande
afwijkingen buiten de uitbreiding laat je staan: die zijn voor de recepten `valideren` en `verbeteren`.

De kennis over Flux haal je met de tools van flux-mcp, voor de versie van deze toepassing: ga niet uit van wat je
denkt te weten over een component. Het rapportsjabloon zit bij deze prompt (`flux://templates/uitbreiden`); vul het
aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- Er is een ticket, een ontwerp, of beide: minstens een van beide is niet `geen`.
- Een ticket lees je met de koppeling met Jira van deze client. Heeft de client er geen, vraag de ontwikkelaar dan de
  titel, de beschrijving en de acceptatiecriteria van het ticket, en wacht tot je ze hebt. Een ontwerp lees je met de
  Figma MCP-server; zonder kan je het ontwerp niet lezen.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.12.0` en niet `^2.12.0`: dat is de
  gepinde versie.
- De toepassing start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen: draai ze.

## 2. Analyse

1. Lees het ticket: wat het vraagt, de acceptatiecriteria, welke schermen en componenten het raakt, en welke vragen
   openstaan. Lees het ontwerp met de Figma MCP-server: de structuur, en per component de Code Connect-snippet uit de
   FLUX-library, met het `vl-*`-element en zijn attributen.
2. Lees in de toepassing de plek waar de uitbreiding komt, de conventies van het project en de e2e-testen die ze raakt.
3. Zoek met `flux_search_docs` welke Flux-component past bij wat het ticket vraagt, en haal met `flux_get_component` op
   de gepinde versie de API en de voorbeelden op. Neem de API over, niet wat je over de component denkt te weten.
4. Haal met `flux_get_guidance` op `latest` de patronen (`kind` = `pattern`) en richtlijnen (`kind` = `guideline`)
   op die bij de uitbreiding passen, bv. voor formulieren en validatie, navigatie, bevestigingen of toegankelijkheid,
   en per element de pagina's die het noemen (`appliesTo`). Lees ze met `id`.
5. Toets wat je van plan bent met `flux_check_markup` op de gepinde versie. Vraagt een patroon een element of API die
   de gepinde versie niet heeft, bouw dan wat de gepinde versie kan, en noem het patroon en de versie die het vraagt
   in "Niet automatisch opgelost". Een element dat later bestaat, meldt "bestaat vanaf"; voor een attribuut of een API
   in JavaScript zoek je met `flux_find_changes` in welke versie het kwam.
6. Vul de secties Analyse en Plan van het rapport in: per acceptatiecriterium wat je bouwt, met het element en de id
   van het patroon, de nieuwe e2e-testen, en welke bestaande test bewust wijzigt.

## 3. Checkpoint

Toon de analyse en het plan, met de open vragen, en wacht op bevestiging voor je code wijzigt. Wijzig tot dan niets.
Heeft deze client een koppeling met Jira, stel dan voor de analyse als commentaar op het ticket te plaatsen, en doe dat
pas na bevestiging.

## 4. Uitvoering

- Bouw het plan, stap per stap, met de conventies van het project.
- Gebruik een Flux-component of een patroon waar er een is, en geen eigen variant ervan. Geen eigen CSS voor wat een
  component of een utility-class van Flux al doet.
- Wijzig enkel wat de uitbreiding vraagt. Een bestaande afwijking buiten de uitbreiding laat je staan, ook als ze er
  vlak naast staat.
- Schrijf een e2e-test voor elk acceptatiecriterium dat gedrag beschrijft. Pas een bestaande e2e-test enkel aan als de
  uitbreiding het gedrag bewust wijzigt, bv. met een nieuw verplicht veld, en zeg dat in het rapport.
- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het
  rapport, of je neemt ze op als e2e-test die blijft.

## 5. Verificatie

- Roep `flux_check_markup` aan met `version` = de gepinde versie op elk nieuw of gewijzigd bestand, en los elke error
  op. Een warning over een waarde, een slot of een attribuut dat niet in de web-types staat, kan een gat in de
  web-types zijn: kijk dan de documentatie na met `flux_get_component`.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-uitbreiden.md` in het project, met de datum
als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-uitbreiden-2.md`, `-3`, …: overschrijf nooit een rapport.
`resultaat` is `geslaagd` als elk acceptatiecriterium gebouwd is en de verificatie groen is, `gedeeltelijk` als een
acceptatiecriterium niet gebouwd is, en `gestopt` als een voorwaarde ontbrak of de verificatie rood bleef.

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request te maken, met de wijzigingen
en het rapport, en het rapport als beschrijving. Heeft ze een koppeling met Jira, stel dan voor de pull request aan het
ticket te koppelen. Doe dat pas na bevestiging.
