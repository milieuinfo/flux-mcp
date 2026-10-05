---
name: scherm-bouwen
title: Bouw één scherm uit zijn analyse, met de Flux web-componenten
description: >
  Bouwt één scherm van deze toepassing uit zijn analyse in .flux/analyse/schermen/<scherm>.md, met de Flux
  web-componenten (@domg-wc/*) in de gepinde versie en volgens de norm: voorwaarden, een plan, een checkpoint,
  uitvoering met een e2e-test per acceptatiecriterium, verificatie en een rapport. Het menu, de routes en andere
  schermen wijzigt het niet. Stap 5 van ontwerp naar toepassing, na scherm-analyseren. Aanbevolen: Opus 5.5, effort
  high.
arguments:
  - name: scherm
    description: De id van het scherm, zoals in .flux/analyse/toepassing.md, bv. aanvraag-overzicht.
    required: true
template: scherm-bouwen
---

Je bouwt het scherm `{{scherm}}` van deze toepassing uit zijn analyse in `.flux/analyse/schermen/{{scherm}}.md`, met
de Flux web-componenten (`@domg-wc/*`). Het team en de ontwerper reviewden die analyse: ze is je plan. Je vult het lege
scherm uit het skelet met wat de analyse beschrijft: de opbouw, het gedrag en de data, zonder logica of data die ze
niet vraagt. Het menu, de routes, de opbouw van de pagina en de andere schermen wijzig je niet.

Wat je bouwt, volgt de norm: de API van de gepinde versie van deze toepassing, en de richtlijnen en patronen van de
nieuwste versie in de catalogus, `latest`.

De kennis over Flux haal je met de tools van flux-mcp, voor de versie van deze toepassing: ga niet uit van wat je
denkt te weten over een component. Het rapportsjabloon zit bij deze prompt (`flux://templates/scherm-bouwen`); vul het
aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- `.flux/analyse/schermen/{{scherm}}.md` bestaat. Ontbreekt ze, dan komt eerst het recept `scherm-analyseren`.
- Het scherm bestaat in de toepassing, met zijn route uit `.flux/analyse/toepassing.md`. Ontbreekt het, dan komt eerst
  het recept `toepassing-skelet-bouwen`.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.20.0` en niet `^2.20.0`: dat is de
  gepinde versie.
- De toepassing start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen: draai ze.

## 2. Analyse

1. Lees de analyse van het scherm: de opbouw, het gedrag, de data, de patronen en de acceptatiecriteria. Lees in de
   analyse van de toepassing de routes van de schermen waarnaar dit scherm leidt.
2. Lees in de toepassing het lege scherm, de conventies van het project, en wat er al is aan data, mocks en
   e2e-testen.
3. Haal met `flux_get_component` op de gepinde versie de API en de voorbeelden op van elk element in de analyse, en met
   `flux_get_guidance` op `latest` met `id` elke pagina die ze noemt. De analyse zegt welk element; de tools zeggen
   hoe het werkt.
4. Heeft deze client de Figma MCP-server, bekijk dan het frame uit de analyse om na te gaan dat de analyse het ontwerp
   volgt. Wijkt ze af, volg dan de analyse, want die is gereviewd, en noem het verschil bij het checkpoint.
5. Vul de secties Analyse en Plan van het rapport in: per acceptatiecriterium wat je bouwt, in welk bestand, met het
   element en de id van het patroon, de mock, en de e2e-testen.

## 3. Checkpoint

Toon het plan, met de open vragen in de analyse die nog geen antwoord hebben, en wacht op bevestiging voor je code
wijzigt. Wijzig tot dan niets.

## 4. Uitvoering

- Bouw het plan, stuk per stuk, met de conventies van het project.
- Gebruik een Flux-component of een patroon waar de analyse er een noemt, en geen eigen variant ervan. Geen eigen CSS
  voor wat een component of een utility-class van Flux al doet.
- Wijzig enkel het scherm en wat het zelf nodig heeft, zoals zijn mock. Een link naar een ander scherm gebruikt de
  route uit de analyse van de toepassing. Vraagt het scherm een wijziging aan het menu, de routes, de opbouw van de
  pagina, een gedeelde component of een ander scherm, doe ze dan niet, en noem ze in "Niet automatisch opgelost".
- Schrijf een e2e-test voor elk acceptatiecriterium. De e2e-test van het skelet blijft groen.
- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het
  rapport, of je neemt ze op als e2e-test die blijft.

## 5. Verificatie

- Roep `flux_check_markup` aan met `version` = de gepinde versie op elk nieuw of gewijzigd bestand, en los elke error
  op. Een warning over een waarde, een slot of een attribuut dat niet in de web-types staat, kan een gat in de
  web-types zijn: kijk dan de documentatie na met `flux_get_component`.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-scherm-bouwen.md` in het project, met de
datum als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-scherm-bouwen-2.md`, `-3`, …: overschrijf nooit een
rapport. `resultaat` is `geslaagd` als elk acceptatiecriterium gebouwd is en de verificatie groen is, `gedeeltelijk`
als een acceptatiecriterium niet gebouwd is, en `gestopt` als een voorwaarde ontbrak of de verificatie rood bleef. Een
afwijking van de analyse of het ontwerp, omdat Flux het anders doet, hoort in "Niet automatisch opgelost".

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request te maken, met de wijzigingen
en het rapport, en het rapport als beschrijving. Doe dat pas na bevestiging. Daarna volgt het volgende scherm uit de
volgorde in de analyse van de toepassing, met het recept `scherm-analyseren`.
