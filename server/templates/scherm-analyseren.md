---
workflow: scherm-analyseren
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie van de frontend>
normversie: <x.y.z: de nieuwste versie in de catalogus, waarvan de richtlijnen en patronen de norm zijn>
scherm: <de id van het scherm>
figma: <de link of de node-id van het frame>
datum: <JJJJ-MM-DD: de laatste keer dat de analyse bijgewerkt werd>
---

# <Titel van het scherm>

## Doel

<In een paar zinnen: wat de gebruiker op dit scherm doet, en vanwaar het scherm bereikbaar is.>

## Opbouw

<Per deel van boven naar onder: de component in Figma, het vl-element met zijn attributen, en de teksten uit het
ontwerp. Een fragment van de markup waar dat duidelijker is.>

## Gedrag

<Per interactie wat er gebeurt. De toestanden, zoals leeg, laden, fout en succes, met hun frame. De validatie, met de
foutmeldingen. De navigatie naar andere schermen, met hun id en route.>

## Data

<Wat het scherm toont en verstuurt, per veld met een voorbeeld, en de mock waarmee de e2e-testen zonder backend
draaien.>

## Patronen en richtlijnen

<De pagina's die gelden, met hun id, en wat ze voor dit scherm vragen.>

## Acceptatiecriteria

<Genummerd, AC-1, AC-2, …: wat de gebruiker doet en wat er dan te zien is, elk te toetsen met een e2e-test.>

## Niet in Flux

<De delen zonder Flux-component, met wat flux_search_docs vond en wat je voorstelt. Of "Niets.">

## Open vragen

<Wat het ontwerp niet beslist, of een patroon dat een nieuwere versie vraagt, met die versie. Een mens zet het antwoord
eronder. Of "Geen.">

## Verificatie

<flux_check_markup op de gepinde versie voor de voorgestelde fragmenten: de errors en warnings, en wat ermee
gebeurde.>
