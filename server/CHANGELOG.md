# Changelog van flux-mcp

Per versie van flux-mcp: wat er aan de server veranderde. Welke versies van Flux de catalogus bevat, zegt de tool
`flux_list_versions`.

## 0.3.0 (nog niet gepubliceerd)

Increment 3 van ADR-004: de recepten.

- De recepten `migreren` en `design-naar-code` als prompts, met hun rapportsjabloon als embedded resource; in Claude
  Code `/mcp__flux__migreren` en `/mcp__flux__design-naar-code`.
- Voor clients zonder prompts: `flux://prompts/{name}` en `flux://templates/{workflow}`.
- Een voorwaarde van elk recept: de toepassing start standalone en de e2e-testen draaien zonder echte backend.
- De instructies noemen de recepten.
- `flux:server:eval-recipe migreren` voert het recept uit op een kleine toepassing met `@domg-wc` 2.12.1 en
  controleert het resultaat: de migratie naar 2.20.0 slaagt met Opus 5.5, effort high, in een vijftal minuten.

## 0.2.0 (nog niet gepubliceerd)

Increment 2 van ADR-004: `flux_check_markup`.

- De tool `flux_check_markup` toetst HTML, een lit-template of een heel `.ts`- of `.js`-bestand aan de web-types van
  een versie, met regel en kolom. Met `targetVersion` meldt ze wat er in die versie breekt, met de entry uit de
  changelog.
- Waarden en slots buiten de web-types zijn een warning: daar zijn de web-types vaak onvolledig.
- De instructies en de beschrijvingen van `flux_get_component` en `flux_get_upgrade` noemen `flux_check_markup`.
- `flux:server:eval` toetst met 20 kennisvragen of een model de juiste tool kiest: 20 van 20 met Sonnet 5.5, effort
  medium.

## 0.1.0 (nog niet gepubliceerd)

Increment 1 van ADR-004: de kennis die de catalogus heeft, over MCP.

- De tools `flux_list_versions`, `flux_search_docs`, `flux_get_component`, `flux_get_guidance`, `flux_get_upgrade`
  en `flux_find_changes`, met `structuredContent` en Markdown, en een groot antwoord in delen.
- De resources `flux://versions`, `flux://{version}/changelog`, `flux://{version}/docs`,
  `flux://{version}/docs/{page}` en `flux://{version}/components/{component}`, met aanvulling.
- De catalogus van Flux 2.0.0 tot en met 2.20.0, de releases op de hoofdlijn van v2.
