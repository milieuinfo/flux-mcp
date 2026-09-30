# Map Action Control

## Doel

Gebruik de `map-action-control` component om een map-actie aan of uit te zetten met behulp van een
[button met toggle](/?path=/docs/components-atom-button--documentatie#toggle).

Een `map-action-control` linken aan een map-actie gebeurt op de volgende manier:
    - plaats op de `map-action-control` het attribuut `action-id` met als waarde bv. 'draw-polygon-action'
    - plaats op de map-actie het attribuut `id` en geef hier dezelfde waarde mee als in de vorige stap

## Voorbeeld

```js
import { VlMapActionControl } from '@domg-wc/map';
```

```html
<vl-map-action-control></vl-map-action-control>
```

> Story: [vl-map-action-control - default](/?path=/story/map-controls-action-control--map-action-control-default)

## Configuratie

> API: vl-map-action-control

## Varianten

### Default actief

> Story: [vl-map-action-control - default active](/?path=/story/map-controls-action-control--map-action-control-default-active)

### Met icoon

> Story: [vl-map-action-control - icon](/?path=/story/map-controls-action-control--map-action-control-icon)

### Meerdere acties

> Story: [vl-map-action-control - multiple](/?path=/story/map-controls-action-control--map-action-control-multiple)
