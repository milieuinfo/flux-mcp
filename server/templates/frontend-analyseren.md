---
workflow: frontend-analyseren
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie van de frontend>
normversie: <x.y.z: de nieuwste versie in de catalogus, waarvan de richtlijnen en patronen de norm zijn>
figma: <de link naar het ontwerp>
datum: <JJJJ-MM-DD: de laatste keer dat de analyse bijgewerkt werd>
---

# <Naam van de frontend>

## Doel

<In een paar zinnen: wat de frontend doet en voor wie, zoals het ontwerp het toont.>

## Schermen

<Per scherm, in de volgorde van het menu, een kop en de vaste velden zoals hieronder. Daarna de frames die geen scherm
worden, met de reden.>

### <id>: <titel>

- route: <het pad, bv. /aanvraag-overzicht>
- figma: <de link of de node-id van het frame>
- toestanden: <de frames die een toestand of een dialoog van dit scherm zijn, of —>

<Wat de gebruiker er doet, in één zin.>

## Navigatie

<Het menu: de schermen erin, hun volgorde en hun groepen. Het patroon, met de id van zijn pagina, en het element. De
overgangen tussen schermen die het ontwerp toont.>

## Pagina-opbouw

<De layout, de header, de functionele header en de footer: per deel het element en de id van het patroon.>

## Gedeelde componenten

<Wat op meer dan één scherm terugkomt: de component in Figma, het vl-element, en de schermen. Of "Geen.">

## Volgorde van bouwen

<De schermen in de volgorde waarin ze geanalyseerd en gebouwd worden, met de reden.>

## Open vragen

<Wat het ontwerp niet beslist, of een patroon dat een nieuwere versie vraagt, met die versie. Een mens zet het antwoord
eronder. Of "Geen.">

## Verificatie

<Hoe elk frame terechtkwam. flux_check_markup op de gepinde versie voor de voorgestelde markup van de opbouw en het
menu: de errors en warnings, en wat ermee gebeurde.>
