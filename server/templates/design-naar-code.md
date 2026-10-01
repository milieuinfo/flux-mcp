---
workflow: design-naar-code
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z>
figma: <de link of node-id van het ontwerp>
doel: <het pad of het scherm>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gedeeltelijk | gestopt>
e2e: <groen | rood | ontbreekt>
---

# <Naam van het scherm>

## Ontwerp

<Per deel van het ontwerp: de component in Figma, het vl-element (uit de Code Connect-snippet of flux_get_component)
en de attributen. Delen zonder component, en wat Flux ervoor heeft.>

## Patronen

<De patronen en richtlijnen die het scherm volgt, met de id van hun pagina.>

## Plan

<De structuur van het scherm, de bestanden en waar de code komt.>

## Uitgevoerd

<De nieuwe of gewijzigde bestanden, met wat erin staat, en de nieuwe e2e-test.>

## Niet automatisch opgelost

<Afwijkingen van het ontwerp, met de reden: een component die Flux niet heeft, of een patroon dat het anders doet. Wat
een mens moet nakijken of beslissen; of "Niets.">

## Verificatie

<flux_check_markup: de errors en warnings, en wat ermee gebeurde. De build, de lint en de e2e-testen: het commando en
het resultaat.>
