# Changelog van flux-mcp

Per versie van flux-mcp: wat er aan de server veranderde. Welke versies van Flux de catalogus bevat, zegt de tool
`flux_list_versions`.

## 0.1.0 (nog niet gepubliceerd)

Increment 1 van ADR-004: de kennis die de catalogus heeft, over MCP.

- De tools `flux_list_versions`, `flux_search_docs`, `flux_get_component`, `flux_get_guidance`, `flux_get_upgrade`
  en `flux_find_changes`, met `structuredContent` en Markdown, en een groot antwoord in delen.
- De resources `flux://versions`, `flux://{version}/changelog`, `flux://{version}/docs`,
  `flux://{version}/docs/{page}` en `flux://{version}/components/{component}`, met aanvulling.
- De catalogus van Flux 2.0.0 tot en met 2.20.0, de releases op de hoofdlijn van v2.
