---
workflow: valideren
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie, waartegen de API getoetst is>
normversie: <x.y.z: de nieuwste versie in de catalogus, waarvan de richtlijnen en patronen de norm zijn>
scope: <het pad of de glob die gevalideerd is>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gestopt>
e2e: <groen | rood | ontbreekt>
---

# Validatie van <naam van de toepassing>

## Analyse

<De bestanden in de scope en de vl-elementen die ze gebruiken. De richtlijnen en patronen die van toepassing zijn, met
de id van hun pagina, en wat docs van flux_get_upgrade van fluxversie naar normversie erover zegt. De bevindingen van
flux_check_markup op de gepinde versie.>

## Afwijkingen

<Per afwijking een kop en de vaste velden, zoals hieronder; één regel per afwijking, genummerd vanaf A-001. Of
"Geen.">

### A-001: <wat er afwijkt, in één zin>

- regel: <de id van een pagina uit de norm, of een code van flux_check_markup>
- locatie: <pad:regel>
- ernst: <error | warning | info>
- uitkomst: <volgt-norm | normkandidaat | te-beslissen>
- norm: <gewijzigd sinds x.y.z | nieuw sinds x.y.z | —>
- vereist: <migratie naar x.y.z of hoger | —>

<Wat de toepassing doet, wat de norm vraagt, en het voorstel om het op te lossen, met een codefragment. Bij een
normkandidaat ook waarom de toepassing beter is dan de norm, of welk gat in de norm ze vult.>

## Normkandidaten

<Per afwijking met uitkomst normkandidaat: "- A-00x: waarom, in één zin". Of "Geen.">

## Verificatie

<flux_check_markup op de gepinde versie: per bestand de errors en warnings, en bij welke afwijking ze horen. Voor elke
afwijking met vereist: waar de versie vandaan komt. Dat de toepassing ongewijzigd is: git status.>
