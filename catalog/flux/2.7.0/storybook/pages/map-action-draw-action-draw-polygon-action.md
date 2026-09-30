# Map Draw Polygon Action

Gebruik het `map-draw-polygon-action` component om een polygon te tekenen op een
[map-features-layer](/?path=/docs/map-layer-vector-layer-features-layer--map-features-layer-default).

Dit component erft over van de `VlMapDrawAction` klasse, die op zijn beurt overerft van de `VlMapLayerAction` klasse,
die op zijn beurt overerft van de `VlMapAction` klasse.

## Ongeldige polygonen

Wanneer je op de kaart een ongeldige polygon tekent, bijvoorbeeld één die zichzelf kruist, dan krijgt deze standaard
een rode "invalid" stijl.
[Zie de vl-map documentatie voor meer informatie](/?path=/docs/map-map--documentatie#ongeldige-geometrieën).

## Voorbeeld

```js
import { VlMapDrawPolygonAction } from '@domg-wc/map';
```

```html
<vl-map-draw-polygon-action></vl-map-draw-polygon-action>
```

> Story: [vl-map-draw-polygon-action - default](/?path=/story/map-action-draw-action-draw-polygon-action--map-draw-polygon-action-default)

## Configuratie

> API: vl-map-draw-polygon-action

## Varianten

### Snapping

> Story: [vl-map-draw-polygon-action - snapping](/?path=/story/map-action-draw-action-draw-polygon-action--map-draw-polygon-action-snapping)

## Referenties

### Legacy Documentatie

[Legacy Storybook - Map Draw Polygon Action](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-draw-polygon-action--default)

[Legacy Documentatie - Map Draw Polygon Action](https://webcomponenten.omgeving.vlaanderen.be/doc/VlMapDrawPolygonAction.html)

[Legacy Demo - Map Draw Polygon Action](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map-draw-actions.html)
