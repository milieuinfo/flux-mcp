---
name: migreren
title: Migreer naar een nieuwere versie van de Flux web-componenten
description: >
  Brengt deze toepassing van de gepinde versie van de Flux web-componenten (@domg-wc/*) naar een doelversie:
  voorwaarden, analyse, plan, een checkpoint, uitvoering, verificatie en een migratierapport. Geen functionele of
  visuele wijzigingen buiten wat de migratie vraagt. Aanbevolen: een sterk analysemodel (Fable 5.1) tot het
  checkpoint, en een uitvoeringsmodel (Opus 5.5, effort high) daarna.
arguments:
  - name: doelversie
    description: De doelversie, bv. 2.20.0, of latest voor de nieuwste versie in de catalogus van flux-mcp.
    required: false
    default: latest
template: migreren
---

Je migreert deze toepassing naar versie {{doelversie}} van de Flux web-componenten (`@domg-wc/*`). Je wijzigt niets
aan de functionaliteit of de vormgeving, behalve wat de migratie vraagt.

De kennis over Flux haal je met de tools van flux-mcp, voor de versies van deze toepassing: ga niet uit van wat je
denkt te weten over een versie. Het rapportsjabloon zit bij deze prompt (`flux://templates/migreren`); vul het aan
terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.12.0` en niet `^2.12.0`: dat is de
  bronversie. Staat er een bereik, lees dan de versie uit de lockfile, meld dat ze niet gepind is, en stop.
- De andere `@domg-wc`-packages in package.json hebben dezelfde versie.
- De toepassing start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen op de bronversie: draai ze. Zonder groene e2e-testen is een migratie niet te
  verifiëren.
- De doelversie is nieuwer dan de bronversie. `latest` is de nieuwste versie in de catalogus van flux-mcp; welke dat
  is, zegt `flux_list_versions`.

## 2. Analyse

1. Inventariseer welke `vl-*`-elementen de toepassing gebruikt, en in welke bestanden.
2. Roep `flux_get_upgrade` aan met `from` = de bronversie, `to` = de doelversie en `components` = die elementen. Haal
   met `cursor` alle delen op. Neem ook `general`, `apiDelta`, `unexplained`, `dependencies` en `docs` mee.
3. Roep `flux_check_markup` aan met `version` = de bronversie en `targetVersion` = de doelversie, op elk bestand met
   `vl-*`-elementen. Elke bevinding `breaks-in-target` hoort in het plan.
4. Is `crossesMajor` true, stel dan een tussenstap voor op de laatste versie van de huidige major.
5. Bepaal per wijziging met impact `action` of ze deze toepassing raakt, en wat je doet. Een wijziging met impact
   `opt-in` neem je niet over: ze is een mogelijkheid, geen opdracht. Een wijziging met impact `automatic` raakt de
   toepassing enkel als de uitleg zegt dat iets zichtbaar of testbaar verandert; noem ze dan in de analyse.
6. Vul de secties Analyse en Plan van het rapport in. Noem bij elke wijziging de versie, de id en het ticket.

## 3. Checkpoint

Toon de analyse en het plan, en wacht op bevestiging voor je code wijzigt. Wijzig tot dan niets.

## 4. Uitvoering

- Zet de versie van alle `@domg-wc`-packages in package.json exact op de doelversie, en installeer.
- Werk het plan af, component per component. Haal met `flux_get_component` in de doelversie de API en een voorbeeld
  op waar je ze nodig hebt.
- Wijzig enkel wat de migratie vraagt. Laat geen tijdelijke bestanden achter in het project: een controle die je zelf
  schrijft, ruim je op voor het rapport, of je neemt ze op als e2e-test die blijft.

## 5. Verificatie

- Roep `flux_check_markup` aan met `version` = de doelversie, op elk gewijzigd bestand en elk bestand met
  `vl-*`-elementen, en los elke error op. Een warning over een waarde of een slot kan een gat in de web-types zijn:
  kijk dan de documentatie na met `flux_get_component`.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft. Pas een e2e-test enkel
  aan als de migratie het gedrag bewust wijzigt, en zeg dat in het rapport.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-migreren.md` in het project, met de datum
als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-migreren-2.md`, `-3`, …: overschrijf nooit een rapport.
`resultaat` is `geslaagd` als de verificatie groen is, `gedeeltelijk` als iets niet opgelost is, en `gestopt` als een
voorwaarde ontbrak of de verificatie rood bleef.

## 7. Proces

Heeft deze omgeving een koppeling met Jira of Git, stel dan voor een branch en een pull request te maken, met het
rapport als beschrijving. Doe dat pas na bevestiging.
