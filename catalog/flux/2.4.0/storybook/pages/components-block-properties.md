# Properties

Gebruik de `properties` component om properties te tonen op een pagina. Je kan de properties specifiëren als
inner-html of als json-structuur meegeven aan het `props` attribuut.

## Voorbeeld

```js
import { VlPropertiesComponent } from '@domg-wc/components/block';
```

```html
<vl-properties></vl-properties>
```

> Story: [vl-properties - default](/?path=/story/components-block-properties--properties-default)

## Configuratie

> API: vl-properties

### Props

De props zijn als volgt gespecifiëerd:
```ts
export type Props = Column[];

export interface Column {
    class?: string; // column / column--full-width / collapsed
    items: Item[];
}

export interface Item {
    labels: string[] | Node[][];
    data: string[] | Node[][];
}
```

Bijvoorbeeld:
```ts
[
    {
        class: 'column',
        items: [
            {
                labels: ['Straat'],
                data: ['Appelstraat', 'Perenstraat'],
            },
        ],
    },
]
```

## Varianten

### Met props

Door bovenstaande `props` te zetten krijg je een mix van de attribuut-data en de via inner-html gespecifieerde data.

> Story: [vl-properties - with props](/?path=/story/components-block-properties--properties-with-props)

### Met html verrijking

Naast gewone tekst kan zowel in 'label' als in 'data' html-code gestoken worden die dan 1 op 1 wordt overgenomen.

> Story: [vl-properties - html enriched](/?path=/story/components-block-properties--properties-html-enriched)

### Collapsed

In mobiele-mode (< 767px) worden labels en data onder i.p.v. naast elkaar getoond. Deze layout kan ook expliciet
afgedwongen worden via de `collapsed` class.

> Story: [vl-properties - collapsed](/?path=/story/components-block-properties--properties-collapsed)

### Columns

M.b.v. de `column` (en `column--full-width`) class kunnen er 2 kolommen gespecifiëerd worden.

> Story: [vl-properties - columns](/?path=/story/components-block-properties--properties-columns)

## Gekende beperkingen

Er is ondersteuning om meerdere labels en data op te geven in de lijst. 1 label met meerdere data waardes en
meerdere labels met 1 data waarde zien er logisch uit. De combinatie van meerdere labels en meerdere data waardes
neemt meer wit ruimte in dan nodig. Dit fundamenteel oplossen kan met de
[Masonry layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Masonry_layout), deze wordt echter
nog niet ondersteund door alle browsers, vandaar is dat momenteel niet voorzien. Een manier om er rond te werken
(enkel als je het nodig hebt) is 1 label en 1 data te gebruiken en de verschillende waardes te wrappen in een `<div>`.

## Referenties

Technisch zal de component zich in zijn shadow-dom renderen als een
[description list](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl).

De look & feel van de component is conform de
[Properties](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-properties)
component van Digitaal Vlaanderen.
