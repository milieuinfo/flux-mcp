---
name: frontend-analyseren
title: Analyseer een nieuwe frontend uit zijn ontwerp in Figma
description: >
  Analyseert de frontend als geheel uit zijn ontwerp in Figma, met de Flux web-componenten (@domg-wc/*) in de
  gepinde versie en volgens de norm: de schermen, het menu en de navigatie, de opbouw van de pagina en de gedeelde
  componenten, in .flux/analyse/frontend.md. Wijzigt geen code. Stap 2 van ontwerp naar frontend, na
  frontend-aanmaken en voor frontend-structuur-bouwen. Vraagt de Figma MCP-server in deze client. Aanbevolen: een
  sterk analysemodel (Fable 5.1).
arguments:
  - name: figma
    description: De link naar het ontwerp in Figma, het bestand of de pagina met alle schermen.
    required: true
template: frontend-analyseren
---

Je analyseert deze frontend als geheel, uit zijn ontwerp in Figma: {{figma}}. Je schrijft geen code. Het resultaat
is een analyse in `.flux/analyse/frontend.md`, die het team en de ontwerper reviewen. De volgende recepten steunen
erop: `frontend-structuur-bouwen` bouwt er het menu, de routes en de lege schermen mee, en `scherm-analyseren` en
`scherm-bouwen` werken er elk scherm mee uit. Hou de analyse beknopt: de details van een scherm horen in de analyse
van dat scherm.

De norm heeft twee delen: de API van de gepinde versie van deze frontend, en de richtlijnen en patronen van de
nieuwste versie in de catalogus, `latest`. Zo vertrekt de frontend van de norm.

De kennis over Flux haal je met de tools van flux-mcp: ga niet uit van wat je denkt te weten over een component. Het
sjabloon van de analyse zit bij deze prompt (`flux://templates/frontend-analyseren`); vul het aan terwijl je werkt.

## 1. Voorwaarden

Controleer deze voorwaarden. Klopt er een niet, stop dan, en meld wat ontbreekt en wat het project moet doen.

- Deze client heeft de Figma MCP-server. Zonder kan je het ontwerp niet lezen.
- De versie van `@domg-wc/components` in package.json is exact gepind, bv. `2.20.0` en niet `^2.20.0`: dat is de
  gepinde versie.
- Bestaat `.flux/analyse/frontend.md` al, lees het dan. Je werkt het bij naar het ontwerp, en behoudt wat een mens
  erin besliste, zoals een antwoord op een open vraag. De id van een scherm die de code of een analyse van een scherm
  al gebruikt, wijzig je niet.

## 2. Kennis ophalen

1. Lees het ontwerp met de Figma MCP-server: de pagina's en de frames, met hun naam, en de verbindingen van een
   prototype als die er zijn. Bekijk elk frame op hoofdlijnen: welk scherm het is, wat de gebruiker er doet, en waar
   het naartoe leidt. Een frame kan ook een toestand van een ander scherm zijn, bv. een fout of een lege lijst, of een
   dialoog.
2. Bepaal de schermen: een scherm heeft een eigen route. Geef elk scherm een id in kebab-case uit zijn titel, bv.
   `aanvraag-overzicht`. Die id is het argument `scherm` van de volgende recepten, de naam van zijn analyse en de basis
   van zijn route.
3. Haal met `flux_get_guidance` op `latest` de index van de patronen (`kind` = `pattern`) en van de richtlijnen
   (`kind` = `guideline`) op. Lees met `id` de pagina's over de opbouw van een pagina en over navigatie die bij het
   ontwerp passen, en de richtlijnen over navigatie en toegankelijkheid.
4. Zoek voor wat op meer dan één scherm terugkomt, zoals de header, het menu, de footer en gedeelde componenten, met
   `flux_search_docs` welke Flux-component past. Een component uit de FLUX-library in Figma heeft een Code
   Connect-snippet die het `vl-*`-element noemt. Haal met `flux_get_component` op de gepinde versie de API en de
   voorbeelden op.
5. Toets de markup die je voorstelt voor de opbouw van de pagina en het menu met `flux_check_markup` op de gepinde
   versie. Vraagt een patroon een element of API die de gepinde versie niet heeft, noteer dan het patroon en de versie
   die het vraagt bij Open vragen. Een element dat later bestaat, meldt "bestaat vanaf"; voor een attribuut of een API
   in JavaScript zoek je met `flux_find_changes` in welke versie het kwam.

## 3. Checkpoint

Er is geen checkpoint: je wijzigt geen code. Het team en de ontwerper reviewen de analyse in een pull request; stap 7
vraagt bevestiging voor je die maakt. Ga verder.

## 4. Analyse

Vul het sjabloon in:

- **Schermen**: per scherm de id, de titel, de route, het frame in Figma en in één zin wat de gebruiker er doet. Een
  frame dat een toestand of een dialoog van een scherm is, noem je bij dat scherm. Een frame dat geen scherm wordt,
  bv. een variant of een verouderd ontwerp, noem je met de reden.
- **Navigatie**: het menu, met de schermen erin, hun volgorde en hun groepen; het patroon, met de id van zijn pagina,
  en het element; en de overgangen tussen schermen die het ontwerp toont, bv. van een lijst naar het detail.
- **Pagina-opbouw**: de layout, de header, de functionele header en de footer, elk met het element en de id van het
  patroon.
- **Gedeelde componenten**: wat op meer dan één scherm terugkomt, met het element en de schermen.
- **Volgorde van bouwen**: de schermen in de volgorde waarin ze geanalyseerd en gebouwd worden, eerst wat andere
  schermen nodig hebben.
- **Open vragen**: wat het ontwerp niet beslist, bv. een scherm zonder ingang of de rollen van gebruikers, en een
  patroon dat een nieuwere versie vraagt.

De velden, de teksten en het gedrag van een scherm horen niet in deze analyse: die zijn voor het recept
`scherm-analyseren`.

## 5. Verificatie

- Elk frame uit het ontwerp is een scherm, een toestand of dialoog van een scherm, of staat met zijn reden bij de
  frames die geen scherm worden.
- Elke id van een scherm is kebab-case en uniek, en elke route is uniek.
- Elke id van een pagina komt uit `flux_get_guidance`, en `flux_check_markup` geeft op de voorgestelde markup geen
  error. Een warning over een waarde of een slot kan een gat in de web-types zijn: kijk dan de documentatie na met
  `flux_get_component`.
- `git status` toont enkel `.flux/analyse/frontend.md` als nieuw of gewijzigd bestand.

## 6. Rapport

De analyse is het rapport van dit recept. Schrijf ze naar `.flux/analyse/frontend.md` in het project, met `datum`
als JJJJ-MM-DD. Het is een levend document: bestaat het al, werk het dan bij zoals stap 1 zegt. Git houdt de vorige
versies bij.

## 7. Proces

Heeft deze omgeving een koppeling met Git, stel dan voor een branch en een pull request of merge request te maken met
enkel de analyse. Daarin reviewen het team en de ontwerper de schermen en de navigatie, en beantwoorden ze de open
vragen. Doe dat pas na bevestiging. Na de merge volgt het recept `frontend-structuur-bouwen`.
