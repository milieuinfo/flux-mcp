# Map Select Actions

## Doel

Gebruik het `map-select-actions` component om features op meerdere
[map-features-layers](/?path=/docs/map-layer-vector-layer-features-layer--map-features-layer-default) te selecteren.

Deze component erft over van de
[map-select-action](/?path=/docs/map-action-layer-action-select-action--map-select-action-default) component.

## Voorbeeld

```js
import { VlMapSelectActions } from '@domg-wc/map';
```

```html
<vl-map-select-actions></vl-map-select-actions>
```

> Story: [vl-map-select-actions - default](/?path=/story/map-action-layer-action-select-action-select-actions--map-select-actions-default)

**Toon code**

```ts
import { html } from 'lit';

const featuresLayer1 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 1,
            geometry: {
                type: 'Point',
                coordinates: [146055.0, 196908.0],
            },
        },
    ],
};

const featuresLayer2 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 2,
            geometry: {
                type: 'Point',
                coordinates: [149055.0, 199908.0],
            },
        },
        {
            type: 'Feature',
            id: 3,
            geometry: {
                type: 'Point',
                coordinates: [152055.0, 202908.0],
            },
        },
    ],
};

const layers = ['layer-1', 'layer-2'];

export const component = (active: boolean, defaultActive: boolean) => html`
    <vl-map lambert2008>
        <vl-map-baselayer-grb-gray></vl-map-baselayer-grb-gray>
        <vl-map-features-layer .features=${featuresLayer1} name="layer-1" projection-code="EPSG:31370">
            <vl-map-layer-circle-style border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer .features=${featuresLayer2} name="layer-2" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(255, 230, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-select-actions .active=${active} .layers=${layers} ?default-active=${defaultActive}>
        </vl-map-select-actions>
    </vl-map>
`;
```

## Configuratie

> API: vl-map-select-actions

## Varianten

### Custom Style

> Story: [vl-map-select-actions - custom style](/?path=/story/map-action-layer-action-select-action-select-actions--map-select-actions-custom-style)

**Toon code**

```ts
import { html } from 'lit';

const featuresLayer1 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 1,
            geometry: {
                type: 'Point',
                coordinates: [146055.0, 196908.0],
            },
        },
    ],
};

const featuresLayer2 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 2,
            geometry: {
                type: 'Point',
                coordinates: [149055.0, 199908.0],
            },
        },
        {
            type: 'Feature',
            id: 3,
            geometry: {
                type: 'Point',
                coordinates: [152055.0, 202908.0],
            },
        },
    ],
};

const layers = ['layer-1', 'layer-2'];

export const component = (active: boolean, defaultActive: boolean) => html`
    <vl-map lambert2008>
        <vl-map-baselayer-grb-gray></vl-map-baselayer-grb-gray>
        <vl-map-features-layer .features=${featuresLayer1} name="layer-1" projection-code="EPSG:31370">
            <vl-map-layer-circle-style border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer .features=${featuresLayer2} name="layer-2" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(255, 230, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-select-actions .active=${active} .layers=${layers} ?default-active=${defaultActive}>
            <vl-map-layer-circle-style color="#ff0000" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-select-actions>
    </vl-map>
`;
```

### Clustering

Bij clustering kan best een [map-layer-circle-style](/?path=/docs/map-layer-style-layer-circle-style--map-layer-circle-style-default) component gebruikt worden binnen de `vl-map-select-actions` tag.

Dit zorgt ervoor dat de grootte van de select-actie zich aanpast aan het aantal geclusterde features, en dat de stijl-tekst getoond wordt.

> Story: [vl-map-select-actions - clustering](/?path=/story/map-action-layer-action-select-action-select-actions--map-select-actions-clustering)

**Toon code**

```ts
import { html } from 'lit';

const featuresLayer1 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 1,
            geometry: {
                type: 'Point',
                coordinates: [146055.0, 196908.0],
            },
        },
    ],
};

const featuresLayer2 = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            id: 2,
            geometry: {
                type: 'Point',
                coordinates: [149055.0, 199908.0],
            },
        },
        {
            type: 'Feature',
            id: 3,
            geometry: {
                type: 'Point',
                coordinates: [152055.0, 202908.0],
            },
        },
    ],
};

const layers = ['layer-1', 'layer-2'];

export const component = (active: boolean, defaultActive: boolean) => html`
    <vl-map lambert2008>
        <vl-map-baselayer-grb-gray></vl-map-baselayer-grb-gray>
        <vl-map-features-layer .features=${featuresLayer1} name="layer-1" projection-code="EPSG:31370">
            <vl-map-layer-circle-style border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer
            .features=${featuresLayer2}
            name="layer-2"
            cluster
            cluster-distance="100"
            projection-code="EPSG:31370"
        >
            <vl-map-layer-circle-style
                color="rgba(255, 230, 21, 1)"
                border-color="#000000"
                text-color="#000000"
            ></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-select-actions .active=${active} .layers=${layers} ?default-active=${defaultActive} cluster>
            <vl-map-layer-circle-style
                color="#0099ff"
                text-color="#ffffff"
                border-color="#ffffff"
            ></vl-map-layer-circle-style>
        </vl-map-select-actions>
    </vl-map>
`;
```
