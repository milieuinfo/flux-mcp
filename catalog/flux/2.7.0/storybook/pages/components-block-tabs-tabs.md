# Tabs

Gebruik de `tabs` component om gerelateerde informatie op te splitsen in kleinere stukken content.
Op mobiel wordt de tab navigatie omgevormd tot een uitklapbaar menu.

> [!NOTE]
> **Opgelet**
> De v2 versie van deze component gebruik je via de custom-tag, de interne implementatie is voor de rest
> gelijk gebleven aan de v1 versie. In de toekomst zal deze component grondig herwerkt worden.

## Voorbeeld

```js
import { VlTabsComponent } from '@domg-wc/components/block';
```

```html
<vl-tabs></vl-tabs>
```

> Story: [vl-tabs - default](/?path=/story/components-block-tabs-tabs--tabs-default)

## Configuratie

> API: vl-tab, vl-tab-section, vl-tabs

## Varianten

### Dynamisch

Zie de code onder de story voor het volledige voorbeeld.

> Story: [vl-tabs - dynamic](/?path=/story/components-block-tabs-tabs--tabs-dynamic)

**TypeScript code**

```ts
let index = 0;

export const addPane = () => {
    const div = document.createElement('div');
    div.innerHTML =
        '<vl-tabs-pane id="fiets-' + index + '" title="Fiets ' + index + '">TEST ' + index + '</vl-tabs-pane>';

    if (div.firstElementChild) {
        document.querySelector('vl-tabs#tabs')?.appendChild(div.firstElementChild);
        index++;
    }
};
```

### In functional header

Wanneer de tabs in een functional header gerenderd worden, moet het attribuut `within-functional-header` toegevoegd worden.

Hier vind je een [voorbeeld van een functional header met tabs](/?path=/story/components-block-functional-header--functional-header-tabs).

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Tabs](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-tabs)

### Legacy Documentatie

[Legacy Storybook - Tabs](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/legacy-vl-tabs--uig-2115)

[Legacy Documentatie - Tabs](https://webcomponenten.omgeving.vlaanderen.be/doc/VlTabs.html)

[Legacy Demo - Tabs](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-tabs.html)
