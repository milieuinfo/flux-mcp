# Map Features Layer

## Doel

Gebruik de `map-features-layer` component om een kaartlaag af te beelden waarbij je een set van te tonen features kan
stellen.

Deze component erft over van de `VlMapVectorLayer` klasse, die op zijn beurt overerft van de `VlMapLayer` klasse.

## Voorbeeld

```js
import { VlMapFeaturesLayer } from '@domg-wc/map';
```

```html
<vl-map-features-layer></vl-map-features-layer>
```

> Story: [vl-map-features-layer - default](/?path=/story/map-layer-vector-layer-features-layer--map-features-layer-default)

## OpenLayers Feature-objecten rechtstreeks toevoegen

Naast de GeoJSON-flows (`features`-attribuut, `addFeature`, `addFeatureCollection`) kan je ook OpenLayers
`Feature`-objecten rechtstreeks op de laag zetten met `addFeatures(features)` (toevoegen) en `setFeatures(features)`
(alles vervangen). Properties gezet via `feature.set(...)` en `feature.setId(...)` blijven daarbij behouden - er
gebeurt geen GeoJSON-serialisatie.

Let op: anders dan de GeoJSON-flows transformeren deze methodes de geometrie niet. De features moeten dus al in de
kaartprojectie staan. Net als `addFeature` falen ze stil wanneer ze vóór `connectedCallback` worden aangeroepen.

```js
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

const feature = new Feature({ geometry: new Point([x, y]) });
feature.setId(1);
feature.set('emissiebron', emissiebron);

layer.setFeatures([feature]);
```

## Configuratie

> API: vl-map-features-layer
