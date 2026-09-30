# Typography

## Doel

Gebruik de `typography` component om de standaard elementen binnen een container visueel te stylen. De typography
component wordt voornamelijk gebruikt om de inhoud van een wysiwyg-editor te stylen zonder extra klassen toe te
voegen voor elk element.

## Voorbeeld

```js
import { VlTypographyComponent } from '@domg-wc/components/block';
```

```html
<vl-typography></vl-typography>
```

## Default

> Story: [vl-typography - default](/?path=/story/components-block-typography--typography-default)

## Configuratie

> API: vl-typography

## Anchor-navigatie (same-page links)

Same-page anchor-links (bv. `<a href="#mijn-sectie">`) werken binnen `vl-typography`. Omdat de component zijn
content naar een shadow root kopieert, vindt de native fragment-navigatie het doel-`id` niet meer; daarom neemt
`vl-typography` deze navigatie zelf over. Je hoeft hiervoor niets te configureren - het volstaat dat het doel een
`id` heeft. Een klik op zo'n link:

- scrollt naar het element met het overeenkomstige `id` - ook als dat doel elders op de pagina staat (in de light
  DOM of in een andere shadow root)
- verplaatst de focus mee naar het doel (WCAG 2.4.3 Focus Order)

### URL-hash bijwerken (opt-in)

Standaard wordt de URL-hash **niet** aangepast bij een anchor-klik. Dat is bewust: automatisch een
`history.pushState` doen kan botsen met bv. een SPA-router. Wil je dat een klik de URL-hash wél bijwerkt
(deelbaar/bookmarkbaar, zonder dubbele history-entry), zet dan het `update-url-hash`-attribuut:

```html
<vl-typography update-url-hash>
    <p><a href="#mijn-sectie">Ga naar de sectie</a></p>
    ...
</vl-typography>
```

> Story: [vl-typography - anchors](/?path=/story/components-block-typography--typography-anchors)

### Navigeren vanuit een element buiten vl-typography

Wil je vanuit een willekeurig element (bv. een knop) buiten de component naar een doel binnen `vl-typography`
navigeren - dwars doorheen shadow DOM-grenzen - gebruik dan de `dispatchNavigateToAnchor`-utility uit
`@domg-wc/common`:

```js
import { dispatchNavigateToAnchor } from '@domg-wc/common';
```

```html
<button @click=${(event) => dispatchNavigateToAnchor(event.currentTarget, '#mijn-sectie')}>
    Ga naar de sectie
</button>
```

`dispatchNavigateToAnchor(source, hash)` stuurt het `vl-navigate-to-anchor`-event vanaf het bron-element;
de centrale listener zoekt het doel pagina-breed op (door alle open shadow roots en de light DOM) en navigeert
ernaartoe. De functie geeft `true` terug wanneer er effectief een doel gevonden en aangedaan werd, zodat je de
native navigatie enkel hoeft te onderdrukken wanneer er genavigeerd is.

> Story: [vl-typography - anchors (externe link)](/?path=/story/components-block-typography--typography-anchors-external-link)

### Utilities in `@domg-wc/common`

De onderliggende logica is herbruikbaar en niet aan `vl-typography` gebonden. Wie zelf een component bouwt die
content in een shadow root rendert, kan dezelfde same-page navigatie activeren met:

- **`enableAnchorNavigation()`** - Installeert (idempotent, pagina-breed en voor de paginalevensduur) de centrale
  `vl-navigate-to-anchor`- en `hashchange`-listeners plus een initiële deep-link-check. Meerdere aanroepen
  installeren slechts één keer.
- **`handleAnchorClick(event, { updateHash })`** - Herbruikbare click-guard die een echte klik op een same-page
  `<a href="#...">` vertaalt naar het navigatie-event. Hang hem aan een shadow root (voor één component) óf aan
  `document` (voor álle anchors op de pagina). Modifier-/middenklikken en links naar een ander pad blijven
  ongemoeid. `updateHash` is opt-in (default `false`).
- **`dispatchNavigateToAnchor(source, hash, { updateHash })`** - Laat eender welke link/component (ook diep in
  shadow DOM) naar een anchor navigeren via het composed custom event. Geeft `true` terug bij een treffer.
  `updateHash` is default `false`.
- **`navigateToAnchor(hash, { updateHash })`** - Lager niveau: zoekt het doel pagina-breed op, scrollt ernaartoe en
  verplaatst de focus. Werkt de URL-hash enkel bij als `updateHash` `true` is (default `false`).

`vl-typography` gebruikt dit zelf door `handleAnchorClick` aan zijn shadow root te hangen en `enableAnchorNavigation()`
te activeren - er zit geen navigatielogica meer in de component zelf.

## Gekende beperkingen

> [!WARNING]
> **Opgelet**
> De vl-typography component kan niet goed om met interactieve elementen zoals knoppen of formulieren. Het is
> aangeraden om dit component enkel te gebruiken voor statische content.

We raden dus aan om interactieve componenten buiten `vl-typography`-tags te definiëren en de `vl-typography` enkel
te gebruiken om statische native html te stylen.

Als je dan toch een interactief element in een `vl-typography`-tag wil gebruiken en de events van dat element wil
afhandelen, kan je dit doen door een event listener toe te voegen aan de `vl-typography`-tag.

In Lit kan dit bijvoorbeeld als volgt:

```html
<vl-typography @vl-click=${this.handleButtonClick}>
   <vl-button>Indienen</vl-button>
</vl-typography>
```

## Varianten

> Story: [vl-typography - anchors](/?path=/story/components-block-typography--typography-anchors)

> Story: [vl-typography - anchors (externe link)](/?path=/story/components-block-typography--typography-anchors-external-link)

> Story: [vl-typography - titles](/?path=/story/components-block-typography--typography-titles)

> Story: [vl-typography - lists](/?path=/story/components-block-typography--typography-lists)

> Story: [vl-typography - markup](/?path=/story/components-block-typography--typography-markup)

> Story: [vl-typography - table](/?path=/story/components-block-typography--typography-table)

> Story: [vl-typography - parameters](/?path=/story/components-block-typography--typography-parameters)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Typography](https://www.vlaanderen.be/vlaanderen-design-system/componenten/typography)
