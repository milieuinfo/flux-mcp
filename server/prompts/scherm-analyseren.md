---
name: scherm-analyseren
title: Analyseer één scherm uit zijn ontwerp in Figma
description: >
  Analyseert één scherm uit zijn frame in Figma, met de Flux web-componenten (@domg-wc/*) in de gepinde versie en
  volgens de norm: de opbouw met per deel het element, het gedrag, de data, de patronen en de acceptatiecriteria, in
  .flux/analyse/schermen/<scherm>.md. Wijzigt geen code. Stap 4 van ontwerp naar frontend, na
  frontend-structuur-bouwen en voor scherm-bouwen. Vraagt de Figma MCP-server in deze client. Aanbevolen: een sterk
  analysemodel (Fable 5.1).
arguments:
  - name: scherm
    description: De id van het scherm, zoals in .flux/analyse/frontend.md, bv. aanvraag-overzicht.
    required: true
  - name: figma
    description: De link naar het frame in Figma, of de node-id, als het een ander frame is dan in de analyse.
    required: false
    default: het frame bij dit scherm in .flux/analyse/frontend.md
template: scherm-analyseren
---

Je analyseert het scherm `{{scherm}}` van deze frontend uit zijn ontwerp in Figma: {{figma}}. Je schrijft geen
code. Het resultaat is een analyse in `.flux/analyse/schermen/{{scherm}}.md`, die het team en de ontwerper reviewen,
en waarmee het recept `scherm-bouwen` het scherm bouwt. De analyse moet volstaan om het scherm te bouwen zonder het
ontwerp opnieuw te interpreteren: per deel het element, de attributen en de teksten, het gedrag en de data.

De norm heeft twee delen: de API van de gepinde versie van deze frontend, en de richtlijnen en patronen van de
nieuwste versie in de catalogus, `latest`.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over een component. Het
sjabloon van de analyse zit bij deze prompt (`flux://templates/scherm-analyseren`); vul het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- Deze client heeft de Figma MCP-server. Zonder kan je het ontwerp niet lezen.
- `.flux/analyse/frontend.md` bestaat, en noemt het scherm `{{scherm}}`. Ontbreekt het, dan komt eerst het recept
  `frontend-analyseren`, dat het scherm toevoegt.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.20.0` en niet `^2.20.0`: dat is de
  gepinde versie.
- Bestaat `.flux/analyse/schermen/{{scherm}}.md` al, lees het dan. Je werkt het bij naar het ontwerp, en behoudt wat
  een mens erin besliste, zoals een antwoord op een open vraag.

## 2. Kennis ophalen

1. Lees in de analyse van de frontend het scherm: de titel, de route, het frame en de toestanden. Lees ook wat de
   schermen delen: de navigatie, de opbouw van de pagina en de gedeelde componenten. Die horen niet bij dit scherm:
   het komt in de opbouw die er is.
2. Lees het frame met de Figma MCP-server, en de frames van zijn toestanden: de structuur, de componenten met hun
   varianten, en de teksten. Haal per component uit de FLUX-library de Code Connect-snippet op: die noemt het
   `vl-*`-element en zijn attributen. De beschrijving van een component in Figma noemt de id van zijn pagina in
   Storybook.
3. Roep per component `flux_get_component` aan met de gepinde versie, en met het element uit de snippet of de
   Storybook-id uit de beschrijving. Neem de API en de voorbeelden over, niet wat je over de component denkt te weten.
4. Zoek voor elk deel zonder component met `flux_search_docs` of Flux er een heeft.
5. Haal met `flux_get_guidance` op `latest` de patronen (`kind` = `pattern`) en richtlijnen (`kind` = `guideline`) op
   die bij het scherm passen, bv. voor formulieren en validatie, tabellen, zoeken, bevestigingen of toegankelijkheid,
   en per element de pagina's die het noemen (`appliesTo`). Lees ze met `id`.
6. Toets de markup die je per deel voorstelt met `flux_check_markup` op de gepinde versie. Vraagt een patroon een
   element of API die de gepinde versie niet heeft, noteer dan het patroon en de versie die het vraagt bij Open
   vragen. Een element dat later bestaat, meldt "bestaat vanaf"; voor een attribuut of een API in JavaScript zoek je
   met `flux_find_changes` in welke versie het kwam.
7. Lees in de frontend het lege scherm uit de structuur, als het er al is, en wat er al is aan data, services en
   mocks: de analyse gebruikt de namen die er zijn.

## 3. Checkpoint

Er is geen checkpoint: je wijzigt geen code. Het team en de ontwerper reviewen de analyse in een pull request; stap 7
vraagt bevestiging voor je die maakt. Ga verder.

## 4. Analyse

Vul het sjabloon in:

- **Opbouw**: per deel van het scherm, van boven naar onder, de component in Figma, het `vl-*`-element met zijn
  attributen, en de teksten letterlijk uit het ontwerp. Geef een fragment van de markup waar dat duidelijker is.
- **Gedrag**: wat er gebeurt bij elke interactie; de toestanden, zoals leeg, laden, fout en succes, met hun frame; de
  validatie van een formulier, met de foutmeldingen; en de navigatie naar andere schermen, met hun id en route uit de
  analyse van de frontend.
- **Data**: wat het scherm toont en verstuurt, per veld met een voorbeeld. De frontend draait zonder echte backend:
  beschrijf de mock waarmee de e2e-testen draaien. Toont het ontwerp niet wat de backend levert, noteer het dan als
  open vraag.
- **Patronen en richtlijnen**: de pagina's die gelden, met hun id, en wat ze voor dit scherm vragen.
- **Acceptatiecriteria**: genummerd, elk toetsbaar met een e2e-test: wat de gebruiker doet, en wat er dan te zien is.
- **Niet in Flux**: de delen zonder Flux-component, met wat je voorstelt.
- **Open vragen**: wat het ontwerp niet beslist.

Het menu, de opbouw van de pagina en de gedeelde componenten horen niet in deze analyse: die staan in de analyse van
de frontend. Wijkt het frame daarvan af, noteer het dan als open vraag.

## 5. Verificatie

- Elk deel van het frame staat in de Opbouw, en elke toestand uit de analyse van de frontend staat bij Gedrag.
- `flux_check_markup` geeft op de voorgestelde fragmenten geen error. Een warning over een waarde, een slot of een
  attribuut dat niet in de web-types staat, kan een gat in de web-types zijn: kijk dan de documentatie na met
  `flux_get_component`.
- Elke id van een pagina komt uit `flux_get_guidance`, en elk scherm waarnaar dit scherm leidt, staat in de analyse
  van de frontend.
- Elk acceptatiecriterium is te toetsen met een e2e-test zonder echte backend.
- `git status` toont enkel `.flux/analyse/schermen/{{scherm}}.md` als nieuw of gewijzigd bestand.

## 6. Rapport

De analyse is het rapport van dit recept. Schrijf ze naar `.flux/analyse/schermen/{{scherm}}.md` in het project, met
`datum` als JJJJ-MM-DD. Het is een levend document: bestaat het al, werk het dan bij zoals stap 1 zegt. Git houdt de
vorige versies bij.

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request of merge request te maken met
enkel de analyse. Daarin reviewen het team en de ontwerper het scherm, en beantwoorden ze de open vragen. Doe dat pas na
bevestiging. Na de merge volgt het recept `scherm-bouwen` voor `{{scherm}}`.
