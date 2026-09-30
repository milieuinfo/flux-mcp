# Map Layer Switcher

Gebruik de `map-layer-switcher` component om kaartlagen zichtbaar of onzichtbaar te maken.

## Voorbeeld

```js
import { VlMapLayerSwitcher } from '@domg-wc/map';
```

```html
<vl-map-layer-switcher></vl-map-layer-switcher>
```

> Story: [vl-map-layer-switcher - default](/?path=/story/map-layer-switcher--map-layer-switcher-default)

## Configuratie

> API: vl-map-layer-switcher

## Gebruik

- het is belangrijk dat de kaartlagen zich binnen de [vl-map](/?path=/docs/map-map--map-default) bevinden
- het is belangrijk dat de `vl-map-layer-switcher` zich binnen de [vl-map](/?path=/docs/map-map--map-default) bevindt
- het `name` attribuut van de kaartlaag wordt gebruikt als label voor de checkbox
- deze component wordt typisch in de [vl-map-side-sheet](/?path=/docs/map-side-sheet--map-side-sheet-default) gebruikt

## Varianten

### Subselectie van kaartlagen

Kan gebruikt worden om een subselectie van kaartlagen te tonen.

Kaartlagen worden niet langer automatisch toegevoegd of verwijderd in de layer-switcher.

> Story: [vl-map-layer-switcher - subselection](/?path=/story/map-layer-switcher--map-layer-switcher-subselection)

### Kaartlagen met resoluties

> Story: [vl-map-layer-switcher - resolutions](/?path=/story/map-layer-switcher--map-layer-switcher-resolutions)

### Dynamische kaartlagen

Voorbeeld hoe dynamisch lagen toegevoegd en verwijderd kunnen worden.

Zie onder de story voor het volledige code voorbeeld.

> Story: [vl-map-layer-switcher - dynamic layers](/?path=/story/map-layer-switcher--map-layer-switcher-dynamic)

**volledig code voorbeeld van bovenstaande implementatie**

```ts
import { VlMap } from '../../../vl-map';
import { VlMapLayer } from '../../layer/vl-map-layer';

/**
 * voegt een nieuwe map layer to aan de `vl-map`
 * @param layerSelector - geef de huidige selector mee voor de nieuwe layer die toegevoegd moet worden
 * @param vlMapSelector - geef de selector mee om het element te kunnen bepalen waarop de layer moet toegevoegd worden
 */
const addMapLayer = (layerSelector: string, vlMapSelector: string): void => {
    const newLayer = document.querySelector(layerSelector) as unknown as VlMapLayer;
    const vlMap = document.querySelector(vlMapSelector) as unknown as VlMap;
    vlMap.appendChild(newLayer);
};

/**
 * verwijdert een bestaande map layer uit zijn `vl-map`
 * @param layerSelector - geef de selector mee om de layer te kunnen bepalen die verwijderd moet worden
 */
const removeMapLayer = (layerSelector: string, vlMapSelector: string): void => {
    const layerToRemove = document.querySelector(layerSelector) as unknown as VlMapLayer;
    const vlMap = document.querySelector(vlMapSelector) as unknown as VlMap;
    vlMap.removeChild(layerToRemove);
};

export const dynamicLayerSwitcherImplementation = () => {
    const vlMapSelector = 'vl-map#map-dynamic-layers';

    const handleAddLayerForId = (id: string, event: Event) => {
        // voeg kaartlaag dynamisch toe
        addMapLayer(`vl-map-features-layer#${id}`, vlMapSelector);

        const addButton = <HTMLButtonElement>event.target;
        // enable remove button nadat laag is toegevoegd
        (<HTMLButtonElement>addButton.nextElementSibling).disabled = false;
        // add button verwijderen
        addButton.remove();
    };

    const handleRemoveLayerForId = (id: string, event: Event) => {
        // verwijder kaartlaag uit vl-map component & uit de OpenLayers Overlay
        removeMapLayer(`vl-map-features-layer#${id}`, vlMapSelector);

        // remove button verwijderen
        const removeButton = <HTMLButtonElement>event.target;
        removeButton.remove();
    };

    // exporteren functies die gebruikt worden in template
    return { handleAddLayerForId, handleRemoveLayerForId };
};

export default dynamicLayerSwitcherImplementation;
```

## Referenties

### Legacy Documentatie

[Legacy Storybook - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-layer-switcher--default)

[Legacy Documentatie - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/doc/VlMapLayerSwitcher.html)

[Legacy Demo - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map-layer-switcher.html)
