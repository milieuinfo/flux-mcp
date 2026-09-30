# ADR-002: De historische catalogus van v2 opbouwen

## Status
Aanvaard

## Datum
2026-09-28

## Context

Ticket: FLUX-812.

De catalogus beantwoordt per versie de vraag van een afnemer: wat verandert er als ik van versie X naar versie Y
upgrade? ADR-001 beslist hoe een versie opgebouwd wordt, maar niet welke versies erin horen. Afnemers zitten op
allerlei 2.x-versies: een upgrade van 2.12.0 naar 2.20.0 is pas volledig te beantwoorden als elke versie daartussen
in de catalogus staat, anders geeft ze `complete: false`.

Sinds ADR-001 bestaat alles om één versie op te bouwen. `catalog:update` haalt de bronnen op, laat Claude Code de
analyse schrijven en controleren, en bouwt de catalogus. Wat nog ontbreekt: welke versies we opnemen, in welke
volgorde, en hoe we met het volume omgaan.

### Welke versies er zijn

Flux maakt zijn releases op de branch `develop-v2`, met een commit `chore(release): 2.x.y` (semantic-release). Op
de hoofdlijn van die branch (first-parent) staan 26 releases: 2.0.0 tot en met 2.20.0. Dat zijn alle minors, plus
vijf patches: 2.0.1, 2.0.2, 2.8.1, 2.10.1 en 2.12.1.

- **Patches op een zijtak.** Vijf tags liggen niet op `develop-v2`: 2.4.1, 2.15.1, 2.17.1, 2.17.2 en 2.17.3. Geen
  minor volgt erop, en de changelog van de hoofdlijn vermeldt ze niet. 2.17.3 heeft ook geen Storybook.
- **De keten volgt de hoofdlijn.** De vorige versie van een release komt uit de compare-url van haar changelog.
  2.1.0 volgt zo op 2.0.2, 2.9.0 op 2.8.1, 2.11.0 op 2.10.1 en 2.13.0 op 2.12.1. Zonder die patches breekt de
  keten op vier plaatsen.
- **2.0.0 volgt op 1.48.2.** De repo heette toen nog `uigov-web-components`. v1 hoort niet in de catalogus.

### Wat de bronnen geven

Voor elk van de 26 versies (2.0.0 tot en met 2.20.0) is nagegaan dat de bronnen er zijn:

- de tag, met de 5 web-types-bestanden;
- `resources/changelog/CHANGELOG.md` in die tag, met de sectie van die versie;
- de Storybook van die release: `index.json` geeft HTTP 200;
- de vier packages op Artifactory.

### Het volume

De 26 versies tellen samen 406 entries. De grootste zijn 2.12.0 (43), 2.11.0 (31), 2.0.0 (30, met de breaking
change naar v2) en 2.9.0 (30). De patches hebben er 1 of 2.

Een proefrun van de analyse en de review op 2.20.0 (18 entries) nam samen 91 beurten met Opus: 19 voor de analyse,
72 voor de review. De runs lopen op het Max-abonnement (ADR-001, sectie 5). Dat kost niets per token, maar valt wel
onder de limieten van het abonnement, per venster van vijf uur en per week. Alles in één keer past daar niet in.

## Beslissing

### 1. De releases van develop-v2, niets anders

We nemen elke release op waarvoor op de hoofdlijn van `develop-v2` een commit `chore(release): 2.x.y` staat. Dat
zijn er 26, van 2.0.0 tot en met 2.20.0. Een script bepaalt die lijst uit de bronrepo, zodat niemand ze met de hand
bijhoudt:

```bash
git log origin/develop-v2 --first-parent --format=%s | grep -E '^chore\(release\): 2\.[0-9]+\.[0-9]+( |$)'
```

Dat doet `releaseVersions` in `resources/flux/source-repo.mjs`. Met een lokale clone leest het
`origin/develop-v2`, anders een clone van enkel de commits van die branch. Een prerelease zoals `2.4.0-beta.1` telt
niet mee.

Zo is de keten volledig van 2.0.0 tot 2.20.0, en kan de catalogus elke upgrade binnen v2 beantwoorden. Patches
op een zijtak nemen we niet op.

### 2. Van oud naar nieuw

We verwerken de versies oplopend. De vorige versie staat er dan telkens al: elke versie krijgt meteen haar diff
van de web-types en van de dependencies, en de analyse ziet die al de eerste keer.

### 3. Twee fasen: eerst de feiten, dan de analyse

- **Fase 1, zonder LLM.** De bronnen van alle 26 versies en dan `changelog:build --all`; daarna `--check` en de
  tests (stap 4). Dat is deterministisch en snel. Hier blijkt of de oude changelogs goed parsen. De randgevallen die
  we kennen, een link rond `@ts-ignore` in 2.0.0 en een ticket zonder nummer (`FLUX - vl-footer, vl-footer-next - …`)
  in 2.9.0, vangt de parser al op. Een nieuwe fout los je op voor er een LLM aan te pas komt.
- **Fase 2, de analyse en de review per versie**, door Claude Code, in reeksen binnen de limieten van het
  abonnement.

Na fase 1 staan alle versies al in de queries, met de afgeleide impact (`impactSource: "derived"`). Fase 2
vervangt die versie per versie door de analyse.

### 4. Hervatbaar, met één script

Een nieuw script `catalog:backfill <van> <tot>` voert beide fasen uit voor de releases in dat bereik:

- fase 1 slaat een versie over waarvan de bronnen er al staan;
- fase 2 slaat een versie over waarvan elke entry een analyse heeft en die een `summary` heeft. Met
  `--max <aantal>` analyseert het hoogstens zoveel versies in één run, en meldt het wat overblijft;
- is het bereik daarna volledig geanalyseerd en voegde deze run iets toe, dan vult het de versie aan die in de
  catalogus op `<tot>` volgt, als die al een volledige analyse had: ze kreeg nieuwe diffs. Een volgende versie
  zonder analyse hoort bij een latere reeks;
- tot slot `changelog:build --all` en `--check`;
- met `--skip-analysis` doet het enkel fase 1.

Stopt een run, bv. op een limiet of een netwerkfout, dan herneem je ze met hetzelfde commando. Voor één nieuwe
release blijft `catalog:update` het script.

### 5. Opus met effort xhigh

De analyse en de review draaien met Opus op effort `xhigh`, de standaard van `changelog:analyse`. Een meting op
2.0.0 tot en met 2.1.0 (40 entries), telkens analyse en review van nul, gaf:

| | `high` | `xhigh` |
|---|---|---|
| beurten | 428 | 694 |
| tijd | 35 min | 58 min |
| tokens uit de cache | 39 M | 89 M |
| tokens uitvoer | 127 k | 283 k |
| lijstprijs via de API, niet aangerekend | $18 | $35 |
| verbeteringen door de review | 5 | 10 |

De impact verschilt enkel in 2.0.0, bij vier entries. Twee daarvan zijn fouten van `high`, nagekeken in de
bronrepo en de registry:

- **UIG-3271.** `@domg-wc/components` 1.48.2 bracht vijf `@govflanders/vl-ui-*`-bibliotheken mee, 2.0.0 geen
  enkele. `high` zei "je hoeft niets te doen", `xhigh` gaf `action`.
- **UIG-3275.** Commit `9a479bf` haalde de grid-, layout- en typography-styling van Digitaal Vlaanderen uit de
  globale styling. `high` gaf `opt-in`, `xhigh` gaf `action`.

De twee andere zijn nuance: een opmaakcommit en het opkuisen van de ontwikkelomgeving zijn voor `xhigh` `none`,
voor `high` `automatic`. In de andere versies is de impact gelijk en is `xhigh` iets preciezer. Beide vondsten
volgden uit feiten die `high` ook had, dus uit grondiger werk, niet uit andere tools.

Een gemiste breaking change is de duurste fout voor een afnemer. Het dubbele verbruik vraagt enkel meer van de
limieten van het abonnement, niet meer geld.

### 6. Commits

- **Fase 1:** één commit met de bronnen en de gebouwde bestanden van de 26 versies. Een fix aan de scripts komt
  daarvoor in een eigen commit, met een test voor het randgeval.
- **Fase 2:** één commit met de analyse van alle versies, met het verbruik in de beschrijving.

### 7. Stappenplan

1. **Voorbereiden.**
   - Werk de lokale clone bij: `git -C ~/pad/naar/flux-web-components fetch origin develop-v2 --tags`.
   - Kijk de aanmelding na: `claude auth status` toont `"authMethod": "claude.ai"`.
2. **`catalog:backfill` bouwen.** Het script en de selectie van releases, met tests voor die selectie. Werk ook
   de documentatie bij, en laat ADR-001 (sectie 9 en het alternatief "Oudere versies aanvullen") naar deze ADR
   verwijzen.
3. **Fase 1 draaien.**

   ```bash
   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:catalog:backfill --skip-analysis 2.0.0 2.20.0
   ```

4. **Fase 1 nakijken.**
   - Per versie de uitvoer van `changelog:build`: de tellingen per type. "Geen diff" mag enkel bij 2.0.0 staan.
   - `changelog:build --check` en `pnpm test`.
   - `getChangesBetween('2.0.0', '2.20.0')` geeft `complete: true`.
   - Een parserprobleem los je op met een test voor dat randgeval. Draai daarna fase 1 opnieuw; wat klaar is,
     slaat het over.
5. **Fase 1 committen.**
6. **Fase 2 draaien, in reeksen.**

   ```bash
   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:catalog:backfill 2.0.0 2.20.0
   ```

   Een reeks beperk je met een lager `<tot>` of met `--max <aantal>`. Stopt het op een limiet, draai later
   hetzelfde commando. Na elke reeks:
   - bekijk de diff van `changelog-analysis/`;
   - neem een steekproef van nieuwe beweringen en controleer ze in de bronrepo. Die steekproef toetst de
     werkwijze, niet elke analyse: die leest een mens niet na (ADR-001).
7. **Afsluiten.**
   - `changelog:build --all`, `--check` en `pnpm test`.
   - Controleer dat elke versie van 2.0.0 tot 2.20.0 een `summary` heeft, en voor elke entry
     `impactSource: "analysis"`.
   - Commit fase 2.

## Alternatieven overwogen

- **Enkel minors.** Dan breekt de keten op 2.1.0, 2.9.0, 2.11.0 en 2.13.0. De 7 fixes uit de vijf patches op de
  hoofdlijn vallen weg, en die vier minors krijgen geen diffs. Een variant laat een minor de patches ervoor
  opnemen, maar wijkt dan af van hoe Flux zijn releases opbouwt. Ze vraagt ook aanpassingen aan
  `changelog:cleanup`, aan de keten en aan de commits.
- **Alle tags, ook de patches op een zijtak.** Die staan niet op `develop-v2` en niet in de changelog van de
  hoofdlijn, en geen upgrade loopt erdoor. 2.17.3 heeft bovendien geen Storybook.
- **Van nieuw naar oud.** Dan krijgt elke versie haar diffs pas wanneer haar vorige versie erbij komt, en moet elke
  analyse een tweede keer, om ze aan te vullen.
- **Alles in één run, zonder fasen.** Een parserfout of een limiet midden in de reeks laat dan een half
  geanalyseerde catalogus achter. Fouten in de feiten komen ook pas na een analyse aan het licht.
- **De oude versies uit de volledige `CHANGELOG.md` van 2.20.0, zonder de bronnen per tag.** ADR-001 verwierp dat
  al: zonder de web-types en de packages van elke versie zijn er geen diffs en geen Storybook-links.
- **Een lichter model of geen review voor de oude versies.** Dat spaart de limieten, maar voor die versies stellen
  afnemers net hun upgrade-vragen, dus dezelfde kwaliteit is nodig. Knellen de limieten, dan kan je per reeks
  een ander model of een andere effort kiezen met `FLUX_CLAUDE_MODEL` en `FLUX_CLAUDE_EFFORT`.
- **Effort `high` in plaats van `xhigh`.** Dat vraagt ongeveer de helft van de limieten, maar miste in 2.0.0 twee
  breaking changes (sectie 5).

## Gevolgen

- **v2 volledig gedekt.** De catalogus dekt de hoofdlijn van v2: `getChangesBetween` geeft `complete: true` voor
  elk paar van 2.0.0 tot 2.20.0.
- **Geen diffs voor 2.0.0,** want de vorige versie 1.48.2 staat niet in de catalogus. Een upgrade vanaf v1 blijft
  als onvolledig gemeld.
- **Patches op een zijtak staan niet in de catalogus.** Een upgrade vanaf 2.17.3 toont de wijzigingen van 2.18.0
  tegenover 2.17.0, dus ook fixes die al in 2.17.1–2.17.3 zaten. Een diff van de web-types en de dependencies is
  er dan niet, want 2.17.3 staat niet in de catalogus.
- **Fase 2 vraagt meerdere sessies op het abonnement.** Op `xhigh` schatten we de versies na 2.1.0 op 6,5 à 9 uur
  rekentijd en 500 à 750 miljoen tokens uit de cache, ongeveer het dubbele van `high`.
- **ADR-001 verwijst naar deze ADR,** in sectie 9 en in het alternatief "Oudere versies aanvullen". Een onderbroken
  keten melden blijft.
- **Nieuwe releases** gaan zoals voorheen met `catalog:update`. `catalog:backfill` is voor een reeks.
- **v3.** Dezelfde aanpak werkt met `develop-v3`.

## Gerelateerde ADR's

- ADR-001: De changelog per versie klaarzetten voor de MCP-server.
