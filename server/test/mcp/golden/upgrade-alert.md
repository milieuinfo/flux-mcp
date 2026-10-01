# Upgrade van Flux 2.19.0 naar 2.20.0

Versies: 2.20.0; de keten is volledig. Componenten: vl-alert.

## Nieuwe mogelijkheden (opt-in)

**2.20.0 · FLUX-809 · `f2a3414` · feature · vl-alert — banner variant**

**Uitleg:** `vl-alert` heeft een nieuw attribuut `banner` voor een melding over de volledige breedte van de pagina: zonder afgeronde hoeken, met de titel en de boodschap na elkaar op dezelfde regel. De component zet zelf een streepje tussen titel en boodschap wanneer er beide zijn (zet het dus niet in de content), gebruikt altijd de `small` opmaak en is niet bedoeld in combinatie met `naked`. Staat de banner al bij het laden op de pagina, geef hem dan `alert-role="no-role"`, zodat een schermlezer de gebruiker er niet mee onderbreekt. Voor iedereen verandert wel dit: elke `vl-alert` met `closable` krijgt rechts 4rem binnenmarge, zodat de eerste tekstregel niet meer onder de sluitknop doorloopt.

**Voorbeeld:**

```html
<vl-alert banner closable alert-role="no-role" size="small" type="warning" icon="warning" title="Juridische waarde">
    <span>De door deze toepassing gegenereerde informatie heeft geen juridische waarde.</span>
</vl-alert>
```

## API-wijzigingen in de web-types, netto van 2.19.0 naar 2.20.0

- **vl-alert** gewijzigd
  - attributen erbij: `banner` (default `false`)

## Documentatie

- nieuw: `recepten-van-npm-naar-pnpm` — Recepten/Van npm naar pnpm (recipe)
- gewijzigd: `afnemen-aan-de-slag` — Afnemen/Aan De Slag (guide)
- gewijzigd: `afnemen-artifacts` — Afnemen/Artifacts (guide)
- gewijzigd: `afnemen-starter-app` — Afnemen/Starter App (guide)
- gewijzigd: `afnemen-migratie-v2-aanpak` — Afnemen/Migratie v2 - Aanpak (guide)
- gewijzigd: `afnemen-migratie-v2-faq` — Afnemen/Migratie v2 - FAQ (guide)
- gewijzigd: `richtlijnen-toegankelijkheid-praktijk-gekende-beperkingen-wip` — Richtlijnen/Toegankelijkheid - Praktijk/Gekende Beperkingen [WIP] (guideline)
- gewijzigd: `patronen-formulier-blur-validatie` — Patronen/Formulier/blur validatie (pattern)
- gewijzigd: `patronen-pagina-opbouw` — Patronen/Pagina Opbouw (pattern)
- gewijzigd: `components-block-alert` — Components - Block/alert (component)

## Dependencies, netto van 2.19.0

Geen wijzigingen aan de dependencies.

Verborgen: 5 entries zonder impact (impact 'none').

Bronnen in de catalogus van flux-mcp 0.0.0-test: `2.20.0/changelog/` (changelog), `2.20.0/changelog-analysis/` (changelog-analysis), `2.19.0/web-types/` (web-types), `2.20.0/web-types/` (web-types), `2.19.0/packages/` (packages), `2.20.0/packages/` (packages), `2.19.0/storybook/index.json` (storybook), `2.20.0/storybook/index.json` (storybook).

Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.
