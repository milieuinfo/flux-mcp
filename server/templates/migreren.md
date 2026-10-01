---
workflow: migreren
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
bronversie: <x.y.z>
doelversie: <x.y.z>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gedeeltelijk | gestopt>
e2e: <groen | rood | ontbreekt>
---

# Migratie naar Flux <doelversie>

## Analyse

<De vl-elementen die de toepassing gebruikt, met hun bestanden. Per wijziging die de toepassing raakt: de versie, de
id, het ticket en wat ze betekent. Ook wat general, unexplained en dependencies zeggen, en de bevindingen
breaks-in-target van flux_check_markup.>

## Plan

<Per component de stappen, met de wijziging (versie, id, ticket) die ze vraagt.>

## Uitgevoerd

<Per stap wat er wijzigde en in welk bestand, met de wijziging die het vroeg.>

## Niet automatisch opgelost

<Wat een mens moet nakijken of beslissen, met de reden; of "Niets.">

## Verificatie

<flux_check_markup op de doelversie: de errors en warnings, en wat ermee gebeurde. De build, de lint en de
e2e-testen: het commando en het resultaat.>
