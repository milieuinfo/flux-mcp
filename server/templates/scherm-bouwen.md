---
workflow: scherm-bouwen
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie van de toepassing>
scherm: <de id van het scherm>
figma: <de link of de node-id van het frame, uit de analyse van het scherm>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gedeeltelijk | gestopt>
e2e: <groen | rood | ontbreekt>
---

# <Titel van het scherm>

## Analyse

<Wat de analyse van het scherm vraagt: de acceptatiecriteria, de elementen en de patronen, met de id van hun pagina.
Verschillen tussen de analyse en het frame in Figma. De open vragen zonder antwoord.>

## Plan

<Per acceptatiecriterium wat je bouwt, in welk bestand, met het element en het patroon. De mock en de nieuwe
e2e-testen.>

## Uitgevoerd

<De nieuwe of gewijzigde bestanden, met wat erin staat, per acceptatiecriterium.>

## Niet automatisch opgelost

<Wat een mens moet nakijken of beslissen: een open vraag, een acceptatiecriterium dat niet gebouwd is, een wijziging
buiten het scherm die het scherm vraagt, of een afwijking van de analyse of het ontwerp omdat Flux het anders doet, met
de reden. Of "Niets.">

## Verificatie

<flux_check_markup op de gepinde versie: de errors en warnings in de nieuwe en gewijzigde bestanden, en wat ermee
gebeurde. De build, de lint en de e2e-testen: het commando en het resultaat.>
