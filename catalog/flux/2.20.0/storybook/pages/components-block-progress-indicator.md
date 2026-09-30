# Progress Indicator

## Doel

Gebruik een `progress-indicator` om de vooruitgang te tonen van een proces dat uit verschillende stappen bestaat.

## Voorbeeld

```js
import { VlProgressIndicatorComponent } from '@domg-wc/components/block';
```

```html
<vl-progress-indicator></vl-progress-indicator>
```

> Story: [vl-progress-indicator - default](/?path=/story/components-block-progress-indicator--progress-indicator-default)

## Configuratie

> API: vl-progress-indicator

## Varianten

### Numerieke indicators

> Story: [vl-progress-indicator - numeric](/?path=/story/components-block-progress-indicator--progress-indicator-numeric)

### Met labels

Labels hebben een maximum breedte en krijgen een ellipsis indien ze langer zijn. De volledige tekst is dan beschikbaar
via de default `title` tooltip.

De laatste stap neemt de beschikbare breedte in, naar gelang de breedte van het
label.

De labels worden verborgen op resoluties kleiner dan 768 pixels.

Kies je voor `showLabels: false` dan worden de labels vervangen door een tooltip.

> Story: [vl-progress-indicator - labels](/?path=/story/components-block-progress-indicator--progress-indicator-labels)

### Statische stappen

In sommige gevallen zijn de stappen louter indicatief en mogen ze niet aanklikbaar zijn. Gebruik in dat geval
het attribuut `static-steps`. Er zullen dan geen `<nav>` en `<button>` elementen gebruikt worden.

> Story: [vl-progress-indicator - statische stappen](/?path=/story/components-block-progress-indicator--progress-indicator-static-steps)

### Focus op de actieve stap

`focus-on-change` zorgt ervoor dat een stap focus krijgt bij het laden van deze stap.

> Story: [vl-progress-indicator - focused](/?path=/story/components-block-progress-indicator--progress-indicator-focused)

### Toekomstige stappen aanklikbaar houden

Doorgaans zijn de stappen na de huidige stap niet aanklikbaar omdat eerst de voorgaande stappen afgewerkt moeten worden.
Indien dit niet gewenst is kan je dit uitschakelen met `enable-future-steps`.

> Story: [vl-progress-indicator - toekomstige stappen aanklikbaar houden](/?path=/story/components-block-progress-indicator--progress-indicator-enable-future-steps)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Progress Bar](https://www.vlaanderen.be/vlaanderen-design-system/componenten/progress-bar)
