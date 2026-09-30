# Info Tile

## Doel

Gebruik de `info-tile` component in informatieve en interactieve dashboards.

## Voorbeeld

```js
import { VlInfoTile } from '@domg-wc/components/block';
```

```html
<vl-info-tile></vl-info-tile>
```

> Story: [vl-info-tile - default](/?path=/story/components-block-info-tile--info-tile-default)

## Configuratie

> API: vl-info-tile

## Varianten

### Small

> Story: [vl-info-tile - small](/?path=/story/components-block-info-tile--info-tile-small)

### Medium

> Story: [vl-info-tile - medium](/?path=/story/components-block-info-tile--info-tile-medium)

### Large

> Story: [vl-info-tile - large](/?path=/story/components-block-info-tile--info-tile-large)

### Alt

> Story: [vl-info-tile - alt](/?path=/story/components-block-info-tile--info-tile-alt)

### Success

> Story: [vl-info-tile - success](/?path=/story/components-block-info-tile--info-tile-success)

### Warning

> Story: [vl-info-tile - warning](/?path=/story/components-block-info-tile--info-tile-warning)

### Error

> Story: [vl-info-tile - error](/?path=/story/components-block-info-tile--info-tile-error)

### Gecentreerd

> Story: [vl-info-tile - centered](/?path=/story/components-block-info-tile--info-tile-centered)

### Verticaal vullend

Hiermee krijgt de info tile een hoogte van 100%. Dit werkt enkel indien de container ook een vaste hoogte heeft.

Dit werkt best in combinatie met een `.vl-grid`, met verschillende `vl-info-tile` componenten als directe kinderen, die elk de CSS-klassen `.vl-column` en `.vl-column--align-self-stretch` hebben (met daarbij klassen voor de kolom breedte en eventuele responsieve klassen).

> Story: [vl-info-tile - full height](/?path=/story/components-block-info-tile--info-tile-full-height)

### Heading

Je kan een heading (h1-h6) laten renderen in de info-tile door gebruik te maken van de `heading-level` attribute.

> Story: [vl-info-tile - heading level](/?path=/story/components-block-info-tile--info-tile-heading-level)

### Met toggle

> Story: [vl-info-tile - toggleable](/?path=/story/components-block-info-tile--info-tile-toggleable)

> **Let op:** Gebruik het `subtitle` slot niet wanneer de info tile `toggleable` is. De subtitle hoort bij de content,
maar is geen onderdeel van het getogglede gedeelte.

### Met menu

> Story: [vl-info-tile - menu slot](/?path=/story/components-block-info-tile--info-tile-menu-slot)

### Clickable

Maakt de info-tile aanklikbaar. Dit is niet combineerbaar met het `data-vl-toggleable`-attribuut.
In dit voorbeeld wordt dit gebruikt in combinatie met een menu-slot.

> Story: [vl-info-tile - clickable](/?path=/story/components-block-info-tile--info-tile-clickable)

### Highlight

> Story: [vl-info-tile - highlight](/?path=/story/components-block-info-tile--info-tile-highlight)

### Highlight left

> Story: [vl-info-tile - highlight left](/?path=/story/components-block-info-tile--info-tile-highlight-left)

## CSS variabelen

De achtergrondkleur, randkleur en iconkleur van het icon badge zijn aanpasbaar via CSS variabelen.

- **`--vl-info-tile-icon-background-color`** (standaard: `var(--vl-color--background-subtle)`): de achtergrondkleur van het icon badge.
- **`--vl-info-tile-icon-border-color`** (standaard: `var(--vl-color--border-default)`): de randkleur van het icon badge.
- **`--vl-info-tile-icon-color`** (standaard: `inherit`): de kleur van het icon zelf.

```css
vl-info-tile {
    --vl-info-tile-icon-background-color: var(--vl-color--icon-success);
    --vl-info-tile-icon-border-color: var(--vl-color--border-success-subtle);
    --vl-info-tile-icon-color: var(--vl-color--border-inverse);
}
```

> Story: [vl-info-tile - icon primary background](/?path=/story/components-block-info-tile--info-tile-icon-primary-background)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Info Tile](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-info-tile)
