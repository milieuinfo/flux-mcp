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

Gebruik de zoom controls om de verschillende kaartlagen te laten verschijnen.

> Story: [vl-map-layer-switcher - resolutions](/?path=/story/map-layer-switcher--map-layer-switcher-resolutions)

### Dynamische kaartlagen

Voorbeeld hoe dynamisch lagen toegevoegd en verwijderd kunnen worden.

Zie onder de story voor het volledige code voorbeeld.

> Story: [vl-map-layer-switcher - dynamic layers](/?path=/story/map-layer-switcher--map-layer-switcher-dynamic)

**volledig code voorbeeld van bovenstaande implementatie**

```ts
import { VlButtonComponent } from '@domg-wc/components/atom';
import { Layer } from 'ol/layer';
import { VlMap } from '../../../vl-map';
import { VlMapLayer } from '../../layer/vl-map-layer';

export const dynamicLayerSwitcherImplementation = () => {
    const vlMapSelector = 'vl-map#map-dynamic-layers';

    const handleAddLayerForId = (id: string) => {
        const newLayer = document.querySelector<VlMapLayer>(`vl-map-features-layer#${id}`);
        const vlMap = document.querySelector<VlMap>(vlMapSelector);
        vlMap.appendChild(newLayer);

        const addButton = document.querySelector<VlButtonComponent>(`#add-${id}`);
        const toggleButton = document.querySelector<VlButtonComponent>(`#toggle-${id}`);
        const removeButton = document.querySelector<VlButtonComponent>(`#remove-${id}`);

        toggleButton.hidden = false;
        removeButton.hidden = false;
        addButton.hidden = true;
    };

    const handleToggleLayerForId = (id: string) => {
        const layerToToggle = document.querySelector<VlMapLayer>(`vl-map-features-layer#${id}`);
        const layer: Layer = layerToToggle.layer;
        layer.setVisible(!layer.getVisible());
    };

    const handleRemoveLayerForId = (id: string) => {
        const layerToRemove = document.querySelector<VlMapLayer>(`vl-map-features-layer#${id}`);
        const vlMap = document.querySelector<VlMap>(vlMapSelector);
        vlMap.removeChild(layerToRemove);

        const removeButton = document.querySelector<VlButtonComponent>(`#remove-${id}`);
        removeButton.parentElement.remove();
    };

    // exporteren functies die gebruikt worden in template
    return { handleAddLayerForId, handleToggleLayerForId, handleRemoveLayerForId };
};

export default dynamicLayerSwitcherImplementation;
```

## Referenties

### Legacy Documentatie

[Legacy Storybook - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-layer-switcher--default)

[Legacy Documentatie - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/doc/VlMapLayerSwitcher.html)

[Legacy Demo - Map Layer Switcher](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map-layer-switcher.html)
