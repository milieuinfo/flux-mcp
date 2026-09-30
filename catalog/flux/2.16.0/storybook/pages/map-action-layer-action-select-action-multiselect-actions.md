# Map Multiselect Actions

## Doel

Gebruik de `map-multiselect-actions` component om meerdere overlappende features samen te selecteren.

Deze component erft over van de
[map-select-actions](/?path=/docs/map-action-layer-action-select-action--map-select-actions-default) component.

## Voorbeeld

```js
import { VlMapMultiselectActions } from '@domg-wc/map';
```

```html
<vl-map-multiselect-actions></vl-map-multiselect-actions>
```

> Story: [vl-map-multiselect-actions - default](/?path=/story/map-action-layer-action-select-action-multiselect-actions--map-multiselect-actions-default)

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
                coordinates: [175000, 184000],
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
                coordinates: [175000, 185000],
            },
        },
    ],
};

const featuresLayer3 = {
    type: 'Feature',
    id: 3,
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [144000, 171000],
                [200000, 171000],
                [200000, 205000],
                [144000, 205000],
                [144000, 171000],
            ],
        ],
    },
};

const layers = ['layer-1', 'layer-2', 'layer-3'];

export const component = (active: boolean, defaultActive: boolean) => html`
    <vl-map lambert2008>
        <vl-map-baselayer-grb-gray></vl-map-baselayer-grb-gray>
        <vl-map-features-layer name="layer-3" .features=${featuresLayer3} projection-code="EPSG:31370">
            <vl-map-layer-style border-size="2"></vl-map-layer-style>
            <vl-map-layer-circle-style></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer .features=${featuresLayer1} name="layer-1" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(0, 255, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer .features=${featuresLayer2} name="layer-2" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(255, 230, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-multiselect-actions .active=${active} .layers=${layers} ?default-active=${defaultActive}>
        </vl-map-multiselect-actions>
    </vl-map>
`;
```

## Zichtbaarheid bij meerdere kaartlagen

Een `map-multiselect-actions` die aan meerdere kaartlagen gekoppeld is, blijft bruikbaar zolang minstens één
gekoppelde kaartlaag zichtbaar is. De actie deactiveert pas wanneer álle gekoppelde kaartlagen verborgen zijn.

Gebruik de layer-switcher in de side-sheet om `layer-1` en `layer-2` te tonen of te verbergen en het gedrag te testen:

- Verberg één kaartlaag → de selectie-actie blijft actief (selecteren in de zichtbare laag werkt nog).
- Verberg beide kaartlagen → de selectie-actie deactiveert.
- Maak opnieuw één kaartlaag zichtbaar → de selectie-actie wordt terug actief.

> Story: [vl-map-multiselect-actions - multilayer visibility](/?path=/story/map-action-layer-action-select-action-multiselect-actions--map-multiselect-actions-multilayer-visibility)

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
    ],
};

// De select-action is aan beide layers gekoppeld.
const layers = ['layer-1', 'layer-2'];

export const component = (active: boolean, defaultActive: boolean) => html`
    <vl-map lambert2008>
        <vl-map-side-sheet>
            <vl-map-layer-switcher title="Kaartlagen" .layers=${layers}></vl-map-layer-switcher>
        </vl-map-side-sheet>
        <vl-map-baselayer-grb-gray></vl-map-baselayer-grb-gray>
        <vl-map-features-layer .features=${featuresLayer1} name="layer-1" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(0, 255, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-features-layer .features=${featuresLayer2} name="layer-2" projection-code="EPSG:31370">
            <vl-map-layer-circle-style color="rgba(255, 230, 21, 1)" border-color="#000000"></vl-map-layer-circle-style>
        </vl-map-features-layer>
        <vl-map-multiselect-actions .active=${active} .layers=${layers} ?default-active=${defaultActive}>
        </vl-map-multiselect-actions>
    </vl-map>
`;
```

## Configuratie

> API: vl-map-multiselect-actions
