# Controle van markup tegen Flux 2.20.0

5 vl-elementen gecontroleerd (lit); error: 1, warning: 5, info: 0.

- **warning** `invalid-attribute-value` op 6:23 <vl-alert> `type` — 'oops' is geen waarde van 'type' op <vl-alert> volgens de web-types. Die kunnen onvolledig zijn: de beschrijving van het attribuut laat soms meer toe.
  - Voorstel: Kies uit 'info', 'success', 'warning', 'error'.
- **warning** `boolean-attribute-false` op 6:35 <vl-alert> `closable` — closable="false" zet 'closable' op <vl-alert> net aan: een boolean attribuut geldt zodra het er staat.
  - Voorstel: Laat het attribuut weg, of gebruik ?closable=${…}.
- **warning** `unknown-slot` op 8:23 <vl-alert> `slot` — vl-alert heeft geen slot 'ondertitel' in de web-types; de slots zijn title, actions. De web-types kunnen onvolledig zijn; kijk de documentatie van de component na.
- **warning** `unknown-attribute` op 10:28 <vl-breadcrumb> `ellipsis` — <vl-breadcrumb> heeft geen attribuut 'ellipsis' in de web-types. Een analyse van Storybook noteert het als niet in de web-types.
- **warning** `deprecated-element` op 15:13 <vl-share-buttons> — <vl-share-buttons> is deprecated. Deprecated en wordt verwijderd in v3. Gebruik een vl-button met cta-link, icon en label.
- **error** `unknown-element` op 16:13 <vl-buton> — <vl-buton> staat niet in de web-types van deze versie.
  - Voorstel: vl-button

Bronnen in de catalogus van flux-mcp 0.0.0-test: `2.20.0/web-types/` (web-types), `2.20.0/storybook/index.json` (storybook), `storybook-analysis/` (storybook-analysis).

Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.
