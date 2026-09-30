# Map Select Action

## Doel

Gebruik het `map-select-action` component om een feature op een [map-features-layer](/?path=/docs/map-layer-vector-layer-features-layer--map-features-layer-default) te selecteren.

Dit component erft over van de `VlMapLayerAction` klasse, die op zijn beurt overerft van de `VlMapAction` klasse.

## Voorbeeld

```js
import { VlMapSelectAction } from '@domg-wc/map';
```

```html
<vl-map-select-action></vl-map-select-action>
```

> Story: [vl-map-select-action - default](/?path=/story/map-action-layer-action-select-action--map-select-action-default)

## Configuratie

> API: vl-map-select-action

## Varianten

### Custom Style

> Story: [vl-map-select-action - custom style](/?path=/story/map-action-layer-action-select-action--map-select-action-custom-style)

### Clustering

Bij clustering kan best een [map-layer-circle-style](/?path=/docs/map-layer-style-layer-circle-style--map-layer-circle-style-default)
component gebruikt worden binnen de `vl-map-select-action` tag.

Dit zorgt ervoor dat de grootte van de select-actie zich aanpast aan het aantal geclusterde features, en dat de stijl-tekst getoond wordt.

> Story: [vl-map-select-action - clustering](/?path=/story/map-action-layer-action-select-action--map-select-action-clustering)

## Referenties

### Legacy Documentatie

**Legacy Storybook:** https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-map-vl-map-select-action--default

**Legacy Documentatie:** https://webcomponenten.omgeving.vlaanderen.be/doc/VlMapSelectAction.html

**Legacy Demo:** https://webcomponenten.omgeving.vlaanderen.be/demo/vl-map-select-action.html
