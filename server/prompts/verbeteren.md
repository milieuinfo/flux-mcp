---
name: verbeteren
title: Werk de afwijkingen van de norm weg uit een afwijkingenrapport
description: >
  Werkt in deze toepassing de afwijkingen van de norm van de Flux web-componenten (@domg-wc/*) weg die het team in een
  afwijkingenrapport van valideren op volgt-norm zette: voorwaarden, het rapport lezen, een plan, een checkpoint,
  uitvoering per afwijking, verificatie en een rapport. Laat liggen wat te beslissen is of een migratie vraagt, en
  stelt voor de normkandidaten als ticket in te dienen. Aanbevolen: Opus 5.5, effort high.
arguments:
  - name: rapport
    description: Het pad naar het afwijkingenrapport van valideren, bv. .flux/rapporten/2026-10-02-valideren.md.
    required: true
  - name: afwijkingen
    description: Enkel deze afwijkingen, bv. A-002, A-008. Standaard alle met uitkomst volgt-norm.
    required: false
    default: alle afwijkingen met uitkomst volgt-norm
template: verbeteren
---

Je werkt in deze toepassing de afwijkingen van de norm van de Flux web-componenten (`@domg-wc/*`) weg uit het
afwijkingenrapport {{rapport}}. Welke afwijkingen: {{afwijkingen}}. Het team besliste in de review van dat rapport
per afwijking de `uitkomst`; je volgt die, en je wijzigt niets anders aan de functionaliteit of de vormgeving.

De norm is dezelfde als bij `valideren`: de API van de gepinde versie van deze toepassing, en de richtlijnen en
patronen van de nieuwste versie in de catalogus, `latest`. De kennis over Flux haal je met de tools van flux-mcp: ga
niet uit van wat je denkt te weten over Flux. Het rapportsjabloon zit bij deze prompt (`flux://templates/verbeteren`);
vul het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- Het afwijkingenrapport bestaat, met `workflow: valideren` in de frontmatter en een sectie Afwijkingen.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.12.0` en niet `^2.12.0`: dat is de
  gepinde versie. Is ze anders dan `fluxversie` van het rapport, meld dat dan: de locaties kunnen verschoven zijn, en
  `vereist` toets je tegen de gepinde versie van nu.
- De toepassing start standalone, en de e2e-testen draaien zonder echte backend.
- Er is een e2e-suite, en die is groen: draai ze. Zonder groene e2e-testen is een verbetering niet te verifiëren.

## 2. Het rapport lezen

1. Lees de afwijkingen uit de sectie Afwijkingen: per kop `### A-…` de velden `regel`, `locatie`, `uitkomst` en
   `vereist`, en de beschrijving met het voorstel.
2. Kies welke je wegwerkt: de afwijkingen met `uitkomst: volgt-norm` en `vereist: —`, of met een `vereist` die de
   gepinde versie al haalt. Noemt het argument afwijkingen id's, neem dan enkel die. De rest laat je liggen:
   - `te-beslissen`: het team besliste nog niet;
   - `normkandidaat`: misschien volgt de norm de toepassing; stap 8 stelt een ticket voor;
   - een `vereist` die de gepinde versie niet haalt: daarvoor is eerst het recept `migreren` nodig.
3. Zoek elke afwijking die je wegwerkt op in de code. De locatie wijst naar waar ze stond toen het rapport geschreven
   werd; staat ze daar niet meer, zoek ze dan op haar inhoud. Is ze weg, noteer ze dan als niet meer aanwezig.

## 3. Kennis ophalen

1. Lees per afwijking de pagina van haar regel met `flux_get_guidance`: `version` = `latest` en `id` = de regel. Is
   de regel een code van `flux_check_markup`, dan zegt de beschrijving in het rapport wat er schort.
2. Haal met `flux_get_component` op de gepinde versie de API en de voorbeelden op van de componenten die je gebruikt.
3. Toets elk voorstel met `flux_check_markup` op de gepinde versie voor je het overneemt. Het voorstel in het rapport
   is een vertrekpunt: wijken de norm of de API ervan af, volg dan de norm en de API.
4. Vul de sectie Plan van het rapport in.

## 4. Checkpoint

Toon het plan: per afwijking wat je wijzigt en welke e2e-test bewust wijzigt, en welke afwijkingen je laat liggen, met
de reden. Wacht op bevestiging voor je code wijzigt. Wijzig tot dan niets.

## 5. Uitvoering

- Werk de afwijkingen af, één per één, in de volgorde van het rapport. Raken twee afwijkingen dezelfde plek, werk ze
  dan samen af.
- Wijzig enkel wat de afwijking vraagt. Een afwijking die je laat liggen, blijft ook in de code staan.
- Pas een e2e-test enkel aan als de afwijking het gedrag bewust wijzigt, bv. een native dialoog die een modal wordt,
  en zeg dat in het rapport.
- Wijzig het afwijkingenrapport niet: het is de beslissing van het team. Wat je deed, staat in je eigen rapport.
- Laat geen tijdelijke bestanden achter in het project: een controle die je zelf schrijft, ruim je op voor het
  rapport, of je neemt ze op als e2e-test die blijft.

## 6. Verificatie

- Roep `flux_check_markup` aan met `version` = de gepinde versie op elk gewijzigd bestand, en los elke error op. Een
  warning over een waarde, een slot of een attribuut dat niet in de web-types staat, kan een gat in de web-types
  zijn: kijk dan de documentatie na met `flux_get_component`.
- Draai de build, de lint en de e2e-testen van het project, voor zover het die scripts heeft.
- Blijft iets rood na drie pogingen, stop dan en rapporteer wat er rood blijft.

## 7. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-verbeteren.md` in het project, met de datum
als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-verbeteren-2.md`, `-3`, …: overschrijf nooit een rapport.
Noem in het plan elke afwijking uit het afwijkingenrapport, met haar id. `resultaat` zegt hoe het ging met de
afwijkingen die je in stap 2 koos:

- `geslaagd`: elke gekozen afwijking is weggewerkt, of niet meer aanwezig, en de verificatie is groen. Wat je in stap
  2 liet liggen, telt niet mee: dat vroeg de uitkomst of `vereist`, en het staat in "Niet weggewerkt";
- `gedeeltelijk`: je kon een gekozen afwijking niet wegwerken;
- `gestopt`: een voorwaarde ontbrak, of de verificatie bleef rood.

Schrijf in de sectie Normkandidaten per afwijking met `uitkomst: normkandidaat` de tekst van haar ticket.

## 8. Proces

- Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request te maken, met de wijzigingen
  en dit rapport, en het rapport als beschrijving.
- Stel voor elke normkandidaat een ticket voor in het Jira-project `FLUX` van Team Flux, met het label
  `normkandidaat` en de tekst uit de sectie Normkandidaten. Heeft deze omgeving geen koppeling met Jira, geef dan die
  tekst om te plakken.
- Doe dat pas na bevestiging.
