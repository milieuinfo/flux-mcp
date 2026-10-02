---
workflow: review
flux-mcp: <de versie van flux-mcp: het veld catalog in een antwoord van een tool>
fluxversie: <x.y.z: de gepinde versie in deze branch, waartegen de API getoetst is>
normversie: <x.y.z: de nieuwste versie in de catalogus, waarvan de richtlijnen en patronen de norm zijn>
basis: <de branch waartegen de diff genomen is>
datum: <JJJJ-MM-DD>
resultaat: <geslaagd | gestopt>
oordeel: <goedkeuren | aanpassen | bespreken>
---

# Review van <de branch of de pull request>

## Diff

<De gewijzigde bestanden met markup, en per bestand de regels die de diff toevoegt of wijzigt. De richtlijnen en
patronen die de wijziging raakt, met de id van hun pagina, en wat docs van flux_get_upgrade erover zegt.>

## Afwijkingen

<Per afwijking op een regel van de diff een kop en de vaste velden, zoals hieronder; één regel per afwijking,
genummerd vanaf A-001. Of "Geen.">

### A-001: <wat er afwijkt, in één zin>

- regel: <de id van een pagina uit de norm, of een code van flux_check_markup>
- locatie: <pad:regel, op een regel die de diff toevoegt of wijzigt>
- ernst: <error | warning | info>
- uitkomst: <volgt-norm | normkandidaat | te-beslissen>
- norm: <gewijzigd sinds x.y.z | nieuw sinds x.y.z | —>
- vereist: <migratie naar x.y.z of hoger | —>

<Wat de wijziging doet, wat de norm vraagt, en het voorstel om het aan te passen, met een codefragment. Bij een
normkandidaat ook waarom de wijziging beter is dan de norm, of welk gat in de norm ze vult.>

## Normkandidaten

<Per afwijking met uitkomst normkandidaat: "- A-00x: waarom, in één zin". Of "Geen.">

## Verificatie

<flux_check_markup op de gepinde versie: per gewijzigd bestand de errors en warnings op regels van de diff, en bij
welke afwijking ze horen. Dat de review niets wijzigde: git status.>
