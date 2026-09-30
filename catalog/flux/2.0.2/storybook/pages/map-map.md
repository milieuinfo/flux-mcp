# Map

Gebruik de `map` component om een kaart af te beelden met verschillende lagen en acties.

## Voorbeeld

```js
import { VlMap } from '@domg-wc/map';
```

```html
<vl-map></vl-map>
```

> Story: [vl-map - default](/?path=/story/map-map--map-default)

## Configuratie

> API: vl-map

## Varianten

### Volledige hoogte

De map de volledige beschikbare hoogte in laten nemen kan op de volgende manier:
    - plaats op de parent een `height` of een `min-height`
    - plaats op de parent `display: flex` en `flex-direction: column`
    - plaats op de vl-map het attribuut `full-height`
    - zorg dat de parent **geen elementen** heeft met `position: fixed` die deel uit moeten maken van de hoogte

> Story: [vl-map - full height](/?path=/story/map-map--map-full-height)

### Playground

Zie de code onder de story voor het volledige voorbeeld.

> Story: [vl-map - playground](/?path=/story/map-map--map-playground)

**TypeScript code**

```ts
export const getActionElement = (name: string): any => getLastElementByClassName(`${name}-action`);
export const getToggleButton = (name: string): any => getLastElementByClassName(`${name}-toggle-button`);
export const actionIdentifiers = ['draw-point', 'draw-line', 'draw-polygon', 'modify', 'delete'];

// Make sure the class that is given is unique and is not being used in other stories of the component.
export const getLastElementByClassName = (className: string) => {
    const items = document.getElementsByClassName(className);
    return items[items.length - 1];
};

export const handleActiveActionChange = ({ detail: { previous, current } }: CustomEvent) => {
    // Activate/deactivate external controls when an action changes its state
    actionIdentifiers.forEach((actionIdentifier) => {
        if (previous === getActionElement(actionIdentifier)) {
            getToggleButton(actionIdentifier).on = false;
        } else if (current === getActionElement(actionIdentifier)) {
            getToggleButton(actionIdentifier).on = true;
        }
    });
};

export const handleLayerVisibleChange = ({ detail: { layer, visible } }: CustomEvent) => {
    // Enable/disable external controls when an action changes its state
    const layerActions = layer.getElementsByClassName('action');

    for (const layerAction of layerActions) {
        actionIdentifiers.forEach((actionIdentifier) => {
            if (layerAction === getActionElement(actionIdentifier)) {
                getToggleButton(actionIdentifier).disabled = !visible;
            }
        });
    }
};

export const handleOpacitySliderChange = ({ detail: { value } }: CustomEvent) => {
    // Set the opacity of all feature layers based on the value of the input slider
    const featureLayers = document.querySelectorAll('vl-map-features-layer');

    featureLayers?.forEach((layer) => {
        layer.setAttribute('opacity', value / 100);
    });
};
```

## Referenties

### Digitaal Vlaanderen

De `map` component is een component van Departement Omgeving en heeft geen Digitaal Vlaanderen documentatie.

### Legacy Documentatie

[Legacy Storybook - Map](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map--default)

[Legacy Documentatie - Map](https://webcomponenten.omgeving.vlaanderen.be/doc/VlMap.html)

[Legacy Demo - Map](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map.html)
