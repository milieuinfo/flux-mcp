---
workflow: frontend-aanmaken
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie van de frontend>
naam: <de naam van de frontend>
starter: <de commit van de flux-starter-app waarvan het project vertrekt>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gedeeltelijk | gestopt>
e2e: <groen | rood | ontbreekt>
---

# <Naam van de frontend>

## Opzet

<De map, en de plekken waar de starter zijn eigen naam gebruikte. De versie van Flux, waar ze vandaan komt, en of ze
ouder is dan latest. De remotes. De scripts van de starter, de package manager en de versie van Node.>

## Uitgevoerd

<De gewijzigde bestanden, met wat erin wijzigde, en de .mcp.json.>

## Niet automatisch opgelost

<Wat een mens moet nakijken of doen: een rode test of een error van flux_check_markup in de starter, een versie van
Flux ouder dan latest, de eigen repository als origin. Of "Niets.">

## Verificatie

<De installatie, de build, de lint en de testen: het commando en het resultaat. flux_check_markup op de gepinde
versie: de errors en warnings in de starter. git status.>

## Volgende stap

<Het recept dat nu volgt: frontend-upgraden als de versie ouder is dan latest, anders frontend-analyseren, met
de link naar het ontwerp en de Figma MCP-server in de client.>
