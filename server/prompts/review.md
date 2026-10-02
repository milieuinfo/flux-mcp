---
name: review
title: Review de wijzigingen van een branch tegen de norm van de Flux web-componenten
description: >
  Beoordeelt wat deze branch toevoegt of wijzigt tegenover een basisbranch, tegen de norm van de Flux web-componenten
  (@domg-wc/*): de API tegen de gepinde versie, de richtlijnen en patronen tegen de nieuwste versie in de catalogus.
  Een voorbereiding op de menselijke review: het recept wijzigt geen code en schrijft geen bestand, en geeft het
  reviewrapport als commentaar voor de pull request. Aanbevolen: Opus 5.5, effort high.
arguments:
  - name: basis
    description: De branch waartegen je de wijzigingen vergelijkt, bv. main of develop.
    required: false
    default: de hoofdbranch van het project
template: review
---

Je reviewt wat de huidige branch toevoegt of wijzigt tegenover {{basis}}, tegen de norm van de Flux web-componenten
(`@domg-wc/*`), als voorbereiding op de menselijke review. Je beoordeelt enkel de diff: een afwijking op een regel die
de diff niet raakt, is werk voor het recept `valideren`. Je wijzigt geen code en schrijft geen bestand: een bestand in
deze branch zou de pull request wijzigen die je reviewt.

De norm heeft twee delen:

- **de API**: de web-types van de gepinde versie in deze branch, met `flux_check_markup` en `flux_get_component` op
  die versie;
- **de richtlijnen en patronen** van de nieuwste versie in de catalogus, `latest`, met `flux_get_guidance`. Ze hebben
  geen regel-id's: de id van een pagina is de referentie.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over Flux. Het
rapportsjabloon zit bij deze prompt (`flux://templates/review`); vul het aan terwijl je werkt.

## 1. Voorwaarden

- Bepaal de diff: wat deze branch toevoegt of wijzigt sinds ze afsplitste van de basisbranch, met
  `git diff <basis>...HEAD`. Is er geen basisbranch gegeven, neem dan de hoofdbranch van het project. Is er geen diff,
  meld dat en stop.
- De versie van `@domg-wc/components` in package.json van deze branch is exact gepind, bv. `2.12.0` en niet
  `^2.12.0`: dat is de gepinde versie. Staat er een bereik, meld dat en stop. Wijzigt de diff die versie, dan toets je
  tegen de nieuwe, en zeg je in het rapport dat de branch ook een migratie is.

## 2. Kennis ophalen

1. Lees de diff: de gewijzigde bestanden met markup (HTML, en templates in `.js` of `.ts`), en per bestand de regels
   die de diff toevoegt of wijzigt, met hun nummer in de nieuwe versie (`git diff -U0`). Noteer de `vl-*`-elementen
   op die regels, en wat Flux zou kunnen leveren voor wat de diff toevoegt: velden, knoppen, dialogen en meldingen.
2. Roep `flux_get_upgrade` aan met `from` = de gepinde versie, `to` = `latest` en `components` = die elementen. De
   effectieve versie van `to` is de normversie. `docs` zegt welke richtlijnen en patronen sinds de gepinde versie
   erbij kwamen (`added`) of wijzigden (`changed`). Staat de branch al op de nieuwste versie, sla dit dan over. Gebruik
   de rest van het antwoord niet voor afwijkingen: een verschil met een nieuwere API is een migratie.
3. Haal met `flux_get_guidance` op `latest` de index van de richtlijnen (`kind` = `guideline`) en van de patronen
   (`kind` = `pattern`) op, en per element de pagina's die het noemen (`appliesTo`). Lees met `id` elke pagina die
   over iets in de diff gaat, ook de richtlijnen over toegankelijkheid.
4. Haal met `flux_get_component` op de gepinde versie de API en de voorbeelden op van de componenten in de diff, of
   die een eigen element in de diff zouden vervangen.
5. Roep `flux_check_markup` aan met `version` = de gepinde versie op elk gewijzigd bestand met markup: `syntax` =
   `html` voor HTML, `lit` voor `.js` en `.ts`. Hou enkel de bevindingen op regels van de diff. Een warning over een
   waarde, een slot of een attribuut dat niet in de web-types staat, kan een gat in de web-types zijn: kijk de
   documentatie na met `flux_get_component` voor je er een afwijking van maakt.
6. Vul de sectie Diff van het rapport in.

## 3. Checkpoint

Er is geen checkpoint: je wijzigt geen code. De auteur en de reviewers van de pull request beslissen wat ze aanpassen;
stap 7 vraagt bevestiging voor je het rapport als commentaar plaatst. Ga verder.

## 4. Afwijkingen

Leg de diff naast de norm, en schrijf elke afwijking in de sectie Afwijkingen, met de kop en de velden uit het
sjabloon, genummerd vanaf `A-001`:

- **Enkel op een regel van de diff.** `locatie` is `pad:regel`: het pad relatief aan de root van het project, en het
  nummer van een regel die de diff toevoegt of wijzigt, in de nieuwe versie, waar het element of de code begint. Een
  bestaande afwijking op een regel die de diff wijzigt, meld je wel; een afwijking op een regel die de diff niet
  raakt, niet.
- **Eén regel per afwijking.** `regel` is de id van een pagina, precies zoals `flux_get_guidance` ze geeft, of de code
  van een bevinding van `flux_check_markup`. Raakt één plek twee regels, schrijf dan twee afwijkingen.
- **`ernst`**: `error` voor wat stuk of ontoegankelijk is, `warning` voor een afwijking van een richtlijn of patroon,
  `info` voor een kleinigheid. Een bevinding van `flux_check_markup` houdt haar ernst.
- **`norm`**: `gewijzigd sinds <gepinde versie>` als de pagina in `docs` van stap 2 als `changed` staat,
  `nieuw sinds <gepinde versie>` als ze er als `added` staat, en anders `—`. Een code van `flux_check_markup` heeft
  `—`.
- **`vereist`**: `migratie naar <versie> of hoger` als je voorstel een element of API vraagt die de gepinde versie
  niet heeft, en anders `—`. Toets het voorstel met `flux_check_markup` op de gepinde versie; voor een attribuut of
  een API in JavaScript zoek je met `flux_find_changes` in welke versie het kwam.
- **`uitkomst`** is je voorstel:
  - `volgt-norm`: de pull request past het aan;
  - `normkandidaat`: de wijziging doet het beter dan de norm, of vult een gat in de norm;
  - `te-beslissen`: de norm volgen vraagt een keuze buiten de code, of het is niet duidelijk of de pagina hier geldt.
- **De beschrijving** onder de velden: wat de wijziging doet, wat de norm vraagt, en je voorstel om het aan te passen,
  met een codefragment.

Wat geen afwijking is:

- een afwijking op een regel die de diff niet raakt;
- een verschil met een nieuwere versie van de API: dat is een migratie, voor het recept `migreren`;
- wat de norm uitdrukkelijk toelaat, ook als een voorbeeld het anders doet;
- een attribuut, waarde of slot dat niet in de web-types staat maar wel in de documentatie van de component.

## 5. Verificatie

- Elke afwijking heeft alle velden, één regel, en een locatie op een regel die de diff toevoegt of wijzigt.
- Elke `regel` is een id uit `flux_get_guidance` of een code uit `flux_check_markup`.
- Elke error en warning van `flux_check_markup` op een regel van de diff hoort bij een afwijking, of de sectie
  Verificatie zegt waarom niet.
- `git status` toont geen wijziging en geen nieuw bestand: je wijzigde niets.

## 6. Rapport

Vul het sjabloon volledig in, maar schrijf het niet weg. Geef het als laatste deel van je antwoord, tussen een regel
`~~~markdown` en een regel `~~~`, zodat het als commentaar op de pull request te plakken is. `resultaat` is `geslaagd`
als de review de hele diff doorliep, en `gestopt` als een voorwaarde ontbrak. `oordeel` is `aanpassen` als er een
afwijking is met `uitkomst: volgt-norm`, `bespreken` als er enkel normkandidaten of afwijkingen met
`uitkomst: te-beslissen` zijn, en `goedkeuren` als er geen afwijkingen zijn.

## 7. Proces

Kan je in deze omgeving een commentaar op de pull request plaatsen, bv. met de CLI van GitHub of GitLab, stel dan
voor het rapport als commentaar te plaatsen. Doe dat pas na bevestiging. Maak geen commit en geen tickets.
