# Typography

## Doel

Gebruik de `typography` component om de standaard elementen binnen een container visueel te stylen. De typography
component wordt voornamelijk gebruikt om de inhoud van een wysiwyg-editor te stylen zonder extra klassen toe te
voegen voor elk element.

## Voorbeeld

```js
import { VlTypographyComponent } from '@domg-wc/components/block';
```

```html
<vl-typography></vl-typography>
```

## Default

> Story: [vl-typography - default](/?path=/story/components-block-typography--typography-default)

## Configuratie

> API: vl-typography

## Gekende beperkingen

> [!WARNING]
> **Opgelet**
> De vl-typography component kan niet goed om met interactieve elementen zoals knoppen of formulieren. Het is
> aangeraden om dit component enkel te gebruiken voor statische content.

We raden dus aan om interactieve componenten buiten `vl-typography`-tags te definiëren en de `vl-typography` enkel
te gebruiken om statische native html te stylen.

Als je dan toch een interactief element in een `vl-typography`-tag wil gebruiken en de events van dat element wil
afhandelen, kan je dit doen door een event listener toe te voegen aan de `vl-typography`-tag.

In Lit kan dit bijvoorbeeld als volgt:

```html
<vl-typography @vl-click=${this.handleButtonClick}>
   <vl-button>Indienen</vl-button>
</vl-typography>
```

## Varianten

> Story: [vl-typography - titles](/?path=/story/components-block-typography--typography-titles)

> Story: [vl-typography - lists](/?path=/story/components-block-typography--typography-lists)

> Story: [vl-typography - markup](/?path=/story/components-block-typography--typography-markup)

> Story: [vl-typography - table](/?path=/story/components-block-typography--typography-table)

> Story: [vl-typography - parameters](/?path=/story/components-block-typography--typography-parameters)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Typography](https://overheid.vlaanderen.be/webuniversum/v3/documentation/js-components/vl-ui-typography)
