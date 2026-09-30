# De analyse met Claude Code

`changelog:analyse` laat Claude Code schrijven wat niet deterministisch uit de bron te halen is. Het doet dat in twee
headless runs (`claude -p`), zonder tussenkomst van een mens:

1. **De analyse** schrijft, met `prompts/changelog-analyse.md`.
2. **De review** controleert de analyse tegen de bron, verbetert zelf wat niet klopt en meldt dat in een vast
   JSON-formaat. Blijft er iets onopgelost, dan faalt het script.

Wat het script precies doet, staat bij [de changelog](changelog.md#de-analyse).

## Abonnement, geen API-sleutel

De runs lopen op het abonnement waarmee Claude Code aangemeld is (`claude auth login`, bv. Max). Het verbruik telt mee
in de limieten van dat abonnement, zonder kosten per token.

- `claude auth status` moet `"authMethod": "claude.ai"` tonen.
- Het script haalt `ANTHROPIC_API_KEY` en `ANTHROPIC_AUTH_TOKEN` uit de omgeving van `claude`, en stopt als een run
  toch een sleutel gebruikt.

## Wat Claude mag

De runs krijgen `--permission-mode manual`, en de regels voor Edit en Write een absoluut pad. Zo doet Claude enkel wat
`--allowedTools` toelaat, ook als je instellingen een andere modus kiezen of Claude in Bash van map wisselt. Al de rest
wordt geweigerd, en het script toont wat.

Claude leest de code met Read, Grep en Glob in een clone die op de tag uitgecheckt is, en de bronrepo met `git show`,
`ls-tree` en `log`, niet met `git grep`. Het schrijft enkel in `changelog-analysis/` van die versie, en draait
`changelog:build`. Het waarom staat in ADR-001, sectie 5.

## Model, effort en budget

| Variabele             | Betekenis                                                     | Standaard       |
|-----------------------|---------------------------------------------------------------|-----------------|
| `FLUX_CLAUDE_MODEL`   | het model                                                     | `opus`          |
| `FLUX_CLAUDE_EFFORT`  | de effort                                                     | `xhigh`         |
| `FLUX_CLAUDE_BUDGET`  | een maximum per run, in dollar aan API-tarief                 | geen grens      |

Een LLM is niet deterministisch: twee runs geven niet dezelfde tekst.
