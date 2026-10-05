---
name: frontend-structuur-bouwen
title: Bouw de structuur van een nieuwe frontend uit zijn analyse
description: >
  Bouwt de structuur van de frontend uit .flux/analyse/frontend.md, met de Flux web-componenten (@domg-wc/*) in de
  gepinde versie en volgens de norm: de opbouw van de pagina, het menu, en per scherm een route met een leeg scherm,
  met een e2e-test die elk scherm opent. Voorwaarden, een plan, een checkpoint, uitvoering, verificatie en een rapport.
  Stap 3 van ontwerp naar frontend, na frontend-analyseren en voor scherm-analyseren. Aanbevolen: Opus 5.5, effort
  high.
template: frontend-structuur-bouwen
---

Je bouwt de structuur van deze frontend uit zijn analyse in `.flux/analyse/frontend.md`: de opbouw van de pagina, het
menu volgens het patroon uit de analyse, en per scherm een route met een leeg scherm. Een leeg scherm heeft enkel zijn
titel, in de opbouw van de pagina; de inhoud komt per scherm met de recepten `scherm-analyseren` en `scherm-bouwen`.
Je bouwt geen inhoud, data of logica in de schermen.

Wat je bouwt, volgt de norm: de API van de gepinde versie van deze frontend, en de richtlijnen en patronen van de
nieuwste versie in de catalogus, `latest`.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over een component. Het
rapportsjabloon zit bij deze prompt (`flux://templates/frontend-structuur-bouwen`); vul het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- `.flux/analyse/frontend.md` bestaat, met de schermen en de navigatie. Ontbreekt ze, dan komt eerst het recept
  `frontend-analyseren`.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.20.0` en niet `^2.20.0`: dat is de
  gepinde versie.
- De frontend start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen: draai ze.

## 2. Analyse

1. Lees de analyse van de frontend: de schermen met hun id, titel en route, de navigatie, de opbouw van de pagina en
   de gedeelde componenten. Een open vraag over het menu of de routes zonder antwoord neem je mee naar het checkpoint.
2. Lees in de frontend hoe hij nu opgebouwd is: het startpunt, hoe hij van pagina wisselt, de conventies voor een
   pagina of een component, de voorbeeldinhoud van de starter, en de e2e-testen. Bouw met wat de frontend al heeft.
   Heeft hij geen router, stel er dan een voor bij het checkpoint, met de reden.
3. Haal met `flux_get_guidance` op `latest` met `id` de pagina's op die de analyse noemt bij Navigatie en
   Pagina-opbouw, en lees hun voorbeelden. Haal met `flux_get_component` op de gepinde versie de API op van de
   elementen die je gebruikt. Neem de API over, niet wat je over de component denkt te weten.
4. Toets de markup van de opbouw en het menu met `flux_check_markup` op de gepinde versie. Vraagt een patroon een
   element of API die de gepinde versie niet heeft, bouw dan wat de gepinde versie kan, en noem het patroon en de
   versie die het vraagt in "Niet automatisch opgelost".
5. Vul de secties Analyse en Plan van het rapport in: de opbouw en het menu met hun element en de id van het patroon,
   per scherm de route en het bestand, de voorbeeldinhoud die verdwijnt, en de e2e-test.

## 3. Checkpoint

Toon het plan, met de open vragen, en wacht op bevestiging voor je code wijzigt. Wijzig tot dan niets.

## 4. Uitvoering

- Bouw de opbouw van de pagina en het menu één keer, gedeeld door alle schermen, volgens de analyse en het patroon.
- Maak per scherm uit de analyse een route en een leeg scherm met enkel zijn titel, als kop van de pagina zoals het
  patroon het doet. Het bestand heet naar de id van het scherm, volgens de conventies van het project. Een scherm dat
  niet in het menu staat, bv. een detail, krijgt een route maar geen item in het menu.
- Verwijder de voorbeeldinhoud van de starter die geen scherm uit de analyse is, met haar testen. Laat de rest van de
  starter staan.
- Gebruik een Flux-component of een patroon waar er een is, en geen eigen variant ervan. Geen eigen CSS voor wat een
  component of een utility-class van Flux al doet.
- Schrijf een e2e-test die elk scherm opent via het menu en via zijn route, en nagaat dat de titel klopt. Heeft het
  patroon een actief item in het menu, ga dat dan ook na.
- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het
  rapport, of je neemt ze op als e2e-test die blijft.

## 5. Verificatie

- Roep `flux_check_markup` aan met `version` = de gepinde versie op elk nieuw of gewijzigd bestand, en los elke error
  op. Een warning over een waarde, een slot of een attribuut dat niet in de web-types staat, kan een gat in de
  web-types zijn: kijk dan de documentatie na met `flux_get_component`.
- Elk scherm uit de analyse heeft een route en een bestand.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-frontend-structuur-bouwen.md` in het
project, met de datum als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-frontend-structuur-bouwen-2.md`, `-3`,
…: overschrijf nooit een rapport. `resultaat` is `geslaagd` als elk scherm uit de analyse een route heeft en de
verificatie groen is, `gedeeltelijk` als een scherm ontbreekt, en `gestopt` als een voorwaarde ontbrak of de
verificatie rood bleef.

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request of merge request te maken, met
de wijzigingen en het rapport, en het rapport als beschrijving. Doe dat pas na bevestiging. Daarna volgen per scherm, in
de volgorde van de analyse, het recept `scherm-analyseren` en het recept `scherm-bouwen`.
