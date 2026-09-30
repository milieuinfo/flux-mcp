# Map Layer Circle Style

## Doel

Gebruik de `map-layer-circle-style` component om een
[features-layer](/?path=/docs/map-layer-vector-layer-features-layer--map-features-layer-default) te stylen.

Deze component erft over van de [map-layer-style](/?path=/docs/map-layer-style--map-layer-style-default) component.

## Voorbeeld

```js
import { VlMapLayerCircleStyle } from '@domg-wc/map';
```

```html
<vl-map-layer-circle-style></vl-map-layer-circle-style>
```

> Story: [vl-map-layer-circle-style - default](/?path=/story/map-layer-style-layer-circle-style--map-layer-circle-style-default)

## Configuratie

> API: vl-map-layer-circle-style

## Varianten

### Met tekst

> Story: [vl-map-layer-circle-style - text](/?path=/story/map-layer-style-layer-circle-style--map-layer-circle-style-text)

### Clustered

> Story: [vl-map-layer-circle-style - clustered](/?path=/story/map-layer-style-layer-circle-style--map-layer-circle-style-clustered)

### Cluster coëfficiënt

Standaard zal een cluster de grootte overnemen van de ingestelde `size` * 1.5.

Als de cluster 10 of meer features bevat, zal de grootte verhoogd worden met een coëfficiënt van 2.
Per verhoogde machtsverheffing wordt dat coëfficiënt verhoogd met 1.
    - meer dan 10 features: `size` x 2
    - meer dan 100 features: `size` x 3
    - meer dan 1000 features: `size` x 4
    - enzovoort..

Het is ook mogelijk te kiezen de verhouding van het coëfficiënt aan te passen door de `cluster-multiplier` in
te stellen.

Dan zal de uiteindelijke grootte van een cluster op volgende manier bepaald worden:
    - `size` x `coëfficiënt` x `cluster-multiplier`

## Referenties

### Legacy Documentatie

[Legacy Storybook - Map Layer Circle Style](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-layer-circle-style--default)

[Legacy Documentatie - Map Layer Circle Style](https://webcomponenten.omgeving.vlaanderen.be/doc/VlMapLayerCircleStyle.html)

[Legacy Demo - Map Layer Circle Style](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map-circle-style.html)
