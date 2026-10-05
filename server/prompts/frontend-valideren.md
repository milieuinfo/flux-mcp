---
name: frontend-valideren
title: Valideer deze frontend tegen de norm van de Flux web-componenten
description: >
  Legt deze frontend naast de norm van de Flux web-componenten (@domg-wc/*) en schrijft een afwijkingenrapport,
  zonder code te wijzigen: de API tegen de gepinde versie, de richtlijnen en patronen tegen de nieuwste versie in de
  catalogus. Per afwijking de regel, de plek en een voorstel; wat beter is dan de norm, wordt een normkandidaat. Het
  team beslist in de pull request van het rapport, en het recept frontend-verbeteren werkt de afwijkingen daarna weg.
  Aanbevolen: een sterk analysemodel, bv. Fable 5.1, of Opus 5.5 met effort high.
arguments:
  - name: scope
    description: Wat je valideert, als pad of glob, bv. src/aanvraag/** of index.html.
    required: false
    default: de hele frontend
template: frontend-valideren
---

Je valideert {{scope}} tegen de norm van de Flux web-componenten (`@domg-wc/*`), en schrijft een afwijkingenrapport.
Je wijzigt geen code: het enige bestand dat je schrijft, is het rapport.

De norm heeft twee delen:

- **de API**: de web-types van de gepinde versie van deze frontend, met `flux_check_markup` en `flux_get_component`
  op die versie;
- **de richtlijnen en patronen** van de nieuwste versie in de catalogus, `latest`, met `flux_get_guidance`. Ze hebben
  geen regel-id's: de id van een pagina is de referentie.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over Flux. Het
rapportsjabloon zit bij deze prompt (`flux://templates/frontend-valideren`); vul het aan terwijl je werkt.

## 1. Voorwaarden

- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.12.0` en niet `^2.12.0`: dat is de
  gepinde versie. Staat er een bereik, lees dan de versie uit de lockfile, meld dat ze niet gepind is, en stop.
- Draai de e2e-testen, als het project ze heeft, en noteer het resultaat in `e2e`: `groen`, `rood` of `ontbreekt`. Een
  rode of ontbrekende suite houdt de validatie niet tegen, maar het recept `frontend-verbeteren` heeft ze nodig: zeg
  dat in het rapport.

## 2. Kennis ophalen

1. Inventariseer in de scope de bestanden met markup (HTML, en templates in `.js` of `.ts`), de `vl-*`-elementen die
   ze gebruiken, en wat Flux zou kunnen leveren: de opbouw van de pagina, formulieren en hun foutmeldingen, knoppen,
   bevestigingen en dialogen, meldingen, navigatie en zoeken, met eigen elementen of eigen CSS ervoor.
2. Roep `flux_get_upgrade` aan met `from` = de gepinde versie, `to` = `latest` en `components` = die elementen. De
   effectieve versie van `to` is de normversie. `docs` zegt welke richtlijnen en patronen sinds de gepinde versie
   erbij kwamen (`added`) of wijzigden (`changed`). Staat de frontend al op de nieuwste versie, sla dit dan over.
   Gebruik de rest van het antwoord niet voor afwijkingen: een verschil met een nieuwere API is een migratie.
3. Haal met `flux_get_guidance` op `latest` de index van de richtlijnen (`kind` = `guideline`) en van de patronen
   (`kind` = `pattern`) op, en per element de pagina's die het noemen (`appliesTo`). Lees met `id` elke pagina die over
   iets in de scope gaat, ook de richtlijnen over toegankelijkheid.
4. Haal met `flux_get_component` op de gepinde versie de API en de voorbeelden op van de componenten die de scope
   gebruikt, of die een eigen element in de scope zouden vervangen.
5. Roep `flux_check_markup` aan met `version` = de gepinde versie op elk bestand met markup: `syntax` = `html` voor
   HTML, `lit` voor `.js` en `.ts`. Een warning over een waarde, een slot of een attribuut dat niet in de web-types
   staat, kan een gat in de web-types zijn: kijk de documentatie na met `flux_get_component` voor je er een afwijking
   van maakt.
6. Vul de sectie Analyse van het rapport in.

## 3. Checkpoint

Er is geen checkpoint: je wijzigt geen code. De beslissing per afwijking valt in de pull request van het rapport, door
het team en de ontwerper; stap 7 vraagt bevestiging voor je die maakt. Ga verder.

## 4. Afwijkingen

Leg de scope naast de norm, en schrijf elke afwijking in de sectie Afwijkingen, met de kop en de velden uit het
sjabloon, genummerd vanaf `A-001`:

- **Eén regel per afwijking.** `regel` is de id van een pagina, precies zoals `flux_get_guidance` ze geeft, of de code
  van een bevinding van `flux_check_markup`. Raakt één plek twee regels, schrijf dan twee afwijkingen.
- **`locatie`** is `pad:regel`: het pad relatief aan de root van het project, en het nummer van de regel waar het
  element of de code begint. Niets erachter.
- **`ernst`**: `error` voor wat stuk of ontoegankelijk is, `warning` voor een afwijking van een richtlijn of patroon,
  `info` voor een kleinigheid. Een bevinding van `flux_check_markup` houdt haar ernst.
- **`norm`**: `gewijzigd sinds <gepinde versie>` als de pagina in `docs` van stap 2 als `changed` staat,
  `nieuw sinds <gepinde versie>` als ze er als `added` staat, en anders `—`. Een code van `flux_check_markup` heeft
  `—`.
- **`vereist`**: `migratie naar <versie> of hoger` als je voorstel een element of API vraagt die de gepinde versie
  niet heeft, en anders `—`. Toets het voorstel met `flux_check_markup` op de gepinde versie: een element dat later
  bestaat, meldt "bestaat vanaf". Voor een attribuut, of een API in JavaScript zoals een mixin uit een patroon, zoek
  je met `flux_find_changes` in welke versie het kwam.
- **`uitkomst`** is je voorstel; het team beslist:
  - `volgt-norm`: de frontend wijkt af, en de norm is duidelijk;
  - `normkandidaat`: de frontend doet het beter dan de norm, of vult een gat in de norm;
  - `te-beslissen`: de norm volgen vraagt een keuze buiten de code, bv. in het ontwerp, de backend of de configuratie,
    of het is niet duidelijk of de pagina hier geldt.
- **De beschrijving** onder de velden: wat de frontend doet, wat de norm vraagt, en je voorstel om het op te lossen,
  met een codefragment. Bij een normkandidaat ook waarom de frontend beter is dan de norm, of welk gat hij vult.

Wat geen afwijking is:

- een verschil met een nieuwere versie van de API: dat is een migratie, voor het recept `frontend-upgraden`;
- wat de norm uitdrukkelijk toelaat, ook als een voorbeeld het anders doet;
- een attribuut, waarde of slot dat niet in de web-types staat maar wel in de documentatie van de component.

## 5. Verificatie

- Elke afwijking heeft alle velden, één regel, en een locatie die naar de juiste regel van het bestand wijst.
- Elke `regel` is een id uit `flux_get_guidance` of een code uit `flux_check_markup`.
- Elke error en warning van `flux_check_markup` hoort bij een afwijking, of de sectie Verificatie zegt waarom niet.
- `git status` toont enkel het rapport als nieuw bestand: je wijzigde niets anders.

## 6. Rapport

Vul het sjabloon volledig in, en schrijf het naar `.flux/rapporten/<datum>-frontend-valideren.md` in het project, met
de datum als JJJJ-MM-DD. Bestaat die naam al, gebruik dan `<datum>-frontend-valideren-2.md`, `-3`, …: overschrijf
nooit een rapport. `resultaat` is `geslaagd` als de validatie de hele scope doorliep, en `gestopt` als een voorwaarde
ontbrak. Noem in de sectie Normkandidaten elke afwijking met `uitkomst: normkandidaat`, met haar id en in één zin
waarom.

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request of merge request te maken met
enkel het rapport. Daarin zet het team per afwijking de `uitkomst`; na de merge werkt het recept `frontend-verbeteren`
de afwijkingen met `uitkomst: volgt-norm` weg, en dient het de normkandidaten in. Doe dat pas na bevestiging, en maak
hier geen tickets aan.
