# CLAUDE.md

Richtlijnen voor AI-agents die in deze repo werken. De details staan in `README.md`; lees die eerst wanneer je aan
een onderdeel begint.

## Taal

Alle communicatie is in het Nederlands. Dat geldt voor:

- je antwoorden en vragen aan de gebruiker;
- commit messages en PR-beschrijvingen;
- documentatie: README, ADR's en prompts;
- commentaar in de code, en foutmeldingen en uitvoer van scripts;
- teksten die in de catalogus terechtkomen.

Namen in de code (functies, variabelen, JSON-sleutels) blijven Engels, zoals nu.

## Wat deze repo is

`flux-mcp` bouwt een MCP-server die informatie over **Flux Web Components** (de bronrepo
`https://github.com/milieuinfo/flux-web-components`) aanbiedt aan LLM-agents.

## Conventies

- **Geen dependencies** in de scripts en de server: Node 22, ESM `.mjs`, en enkel `node:`-modules.
- **Deterministisch.** Een gebouwd bestand heeft geen tijdstempel en een vaste volgorde, en opnieuw bouwen geeft
  hetzelfde bestand. Gebouwde bestanden komen in git; `--check` bewaakt dat ze kloppen.
- **Code-stijl:**
  - 4 spaties, enkele quotes en regels van maximaal 120 tekens;
  - commentaar in het Nederlands, dat uitlegt waarom, bovenaan elk bestand met het gebruik;
  - foutmeldingen die zeggen wat je moet doen, bv. welk script eerst moet draaien.
- **Tests** gebruiken inline fragmenten voor randgevallen en een kopie van de echte catalogus voor de rest.
  Wijzig je gedrag, pas dan de tests mee aan.
- **Documentatie mee bijwerken.** Wijzigt een script of een formaat, werk dan de README bij.

## Git

- Commit en push enkel wanneer de gebruiker erom vraagt.
- Commit message: `<type>: FLUX-<nr> - <onderwerp> - <wat>`, bv.
  `feat: FLUX-812 - changelog - per ticket, deterministisch en LLM in aparte mappen`. Types zijn `feat`, `fix` en
  `chore`. Daaronder een body in het Nederlands die uitlegt wat er verandert en waarom.
- Werk op een featurebranch (`feature/FLUX-<nr>-…`); `main` is de hoofdbranch.
