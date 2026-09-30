# Map Legend

Gebruik de `map-legend` component om een legende af te beelden op de kaart.

## Voorbeeld

```js
import { VlMapLegend } from '@domg-wc/map';
```

```html
<vl-map-legend></vl-map-legend>
```

## Configuratie

> API: vl-map-legend

## Voorbeelden

### Features Layer Multiple Styles

Zie onder de story voor de TypeScript code.

> Story: [vl-map-legend - features-layer multiple styles](/?path=/story/map-legend--map-legend-features-layer-multiple-styles)

**TypeScript code**

```ts
export const linkStylesToFeatures = () => {
    document.addEventListener('DOMContentLoaded', async () => {
        const map: any = document.getElementById('map');
        await map?.ready;
        (document.querySelector('#style-1') as any).appliesTo = (feature) => feature.get('styleId') === 'style-1';
        (document.querySelector('#style-2') as any).appliesTo = (feature) => feature.get('styleId') === 'style-2';
        (document.querySelector('#style-3') as any).appliesTo = (feature) => feature.get('styleId') === 'style-3';
    });
};
```

### Features Layer

> Story: [vl-map-legend - features-layer](/?path=/story/map-legend--map-legend-features-layer)

### Multiple Features Layers

> Story: [vl-map-legend - multiple features-layers](/?path=/story/map-legend--map-legend-multiple-features-layers)

### WFS Layer

> Story: [vl-map-legend - wfs-layer](/?path=/story/map-legend--map-legend-wfs-layer)

### WMS Layer

> Story: [vl-map-legend - wms-layer](/?path=/story/map-legend--map-legend-wms-layer)

### WMS WFS Layer Combination

> Story: [vl-map-legend - wms - wfs -layer](/?path=/story/map-legend--map-legend-wms-wfs-layer)

### Custom legend items

> Story: [vl-map-legend - custom items](/?path=/story/map-legend--map-legend-custom-items)

### Custom legend layout vertical

> Story: [vl-map-legend - layout vertical](/?path=/story/map-legend--map-legend-layout-vertical)

## Referenties

### Legacy Documentatie

[Legacy Storybook - Map Legend Wfs Layer](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-legend-vl-map-legend-wfs-layer--default)
