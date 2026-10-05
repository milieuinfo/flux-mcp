---
workflow: frontend-verbeteren
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie van de frontend>
rapport: <het pad naar het afwijkingenrapport>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gedeeltelijk | gestopt>
e2e: <groen | rood | ontbreekt>
---

# Verbeteringen aan <naam van de frontend>

## Plan

<Per afwijking die je wegwerkt, met haar id en regel: wat je wijzigt, in welke bestanden, en welke e2e-test bewust
wijzigt. Per afwijking die je laat liggen: de id en waarom, bv. te-beslissen, een normkandidaat, een migratie die ze
vereist, of niet meer aanwezig.>

## Uitgevoerd

<Per afwijking, met haar id: wat er wijzigde en in welk bestand.>

## Niet weggewerkt

<Per afwijking die bleef liggen: de id, de uitkomst en wat er nodig is, bv. "vereist een migratie naar 2.19.0: het
recept frontend-upgraden". Of "Niets.">

## Normkandidaten

<Per afwijking met uitkomst normkandidaat: de tekst van een ticket voor het Jira-project FLUX van Team Flux, met het
label normkandidaat. De titel, de regel, de locatie, de motivering van het team, het codefragment, en de frontmatter
van het afwijkingenrapport. Of "Geen.">

## Verificatie

<flux_check_markup op de gepinde versie: de errors en warnings in de gewijzigde bestanden, en wat ermee gebeurde. De
build, de lint en de e2e-testen: het commando en het resultaat, en welke test bewust wijzigde.>
