# Cascader

## Doel

Gebruik de `cascader` component om hiërarchische data weer te geven als een drilldown van lijsten.

## Voorbeeld

```js
import { VlCascaderComponent } from '@domg-wc/components/block';
```

```html
<vl-cascader>
    <vl-cascader-item label="Provincie: West-Vlaanderen">
        <vl-cascader-item label="Gemeente: Damme">
            <vl-cascader-item label="Deelgemeente - Moerkerke">
                <vl-cascader-item label="Dorp - Moerkerke"></vl-cascader-item>
                <vl-cascader-item label="Dorp - Sint-Rita"></vl-cascader-item>
            </vl-cascader-item>
            <vl-cascader-item label="Deelgemeente - Sint-Kruis"></vl-cascader-item>
        </vl-cascader-item>
        <vl-cascader-item label="Gemeente: Brugge"></vl-cascader-item>
    </vl-cascader-item>
    <vl-cascader-item label="Provincie: Oost-Vlaanderen">
        <vl-cascader-item label="Gemeente: Gent"></vl-cascader-item>
        <vl-cascader-item label="Gemeente: Lokeren"></vl-cascader-item>
    </vl-cascader-item>
</vl-cascader>
```

> Story: [vl-cascader - default](/?path=/story/components-block-cascader-cascader--cascader-default)

## Configuratie

> API: vl-cascader

## Standaard gedrag

Wanneer er kind-elementen beschikbaar zijn onder een bepaalde component, tonen we een `>`-icon om aan te geven dat er
nog verder geselecteerd kan worden.

De `vl-cascader-item` vereist een `label` attribuut, ook wanneer `label` slot wordt gebruikt. Deze label wordt gebruikt
om de breadcrumb op te bouwen.

## Standaard gebruik

Standaard kan je `cascader` component structuur opbouwen door geneste `cascader-item` componenten te definiëren. Zie
bovenstaand voorbeeld.

## Cascader met property binding

Het is ook mogelijk de data-structuur op te bouwen met een array van type `CascaderItem[]`

```html
<vl-cascader .items=${cascaderItems}>...</vl-cascader>
```

**CascaderItem-model**

```ts
export interface CascaderItem {
    label: string;
    templateType?: string;
    children?: CascaderItem[]; // niveau dat hoort onder deze component
    narrowDown?: unknown; // gebruikt voor het dynamisch ophalen van onderliggende niveau's
    data?: {
        [key: string]: unknown;
    };
}
```

**voorbeeld CascaderItem-array opzet**

```ts
import { CascaderItem } from '../vl-cascader.model';

export const nodeData: CascaderItem[] = [
    {
        label: 'Vlaanderen',
        children: [
            {
                label: 'Antwerpen',
                templateType: 'provincie',
                children: [
                    {
                        label: 'Niveau 2 - A',
                        children: [
                            {
                                label: 'Niveau 3 - A',
                                children: [
                                    {
                                        label: 'Niveau 4 - A',
                                    },
                                    {
                                        label: 'Niveau 4 - B',
                                    },
                                ],
                            },
                            {
                                label: 'Niveau 3 - B',
                            },
                        ],
                    },
                    {
                        label: 'Niveau 2 - B',
                    },
                    {
                        label: 'Berchem',
                    },
                ],
            },
            {
                label: 'Brussel',
                templateType: 'provincie',
                narrowDown: true,
                data: {
                    requestParams: 'Niveau-id',
                },
            },
            {
                label: 'Limburg',
                templateType: 'provincie',
                children: [
                    {
                        label: 'Hasselt',
                    },
                    {
                        label: 'Zonhoven',
                    },
                    {
                        label: 'Lummen',
                    },
                    {
                        label: 'Halen',
                    },
                    {
                        label: 'Tongeren',
                    },
                ],
            },
            {
                label: 'Vlaams-Brabant',
                templateType: 'provincie',
                narrowDown: true,
                data: {
                    requestParams: 'Niveau-id',
                },
            },
        ],
    },
    {
        label: 'Wallonië',
    },
];
```

> Story: [vl-cascader - property binding](/?path=/story/components-block-cascader-cascader--cascader-property-binding)

## Inhoud van de nodes aanpassen

Voor bepaalde use-cases kan het belangrijk zijn dat je zelf inhoud kan bepalen.

Dit kan op verschillende manieren:

### CascaderItem - Slots

Bij een `vl-cascader-item`, kan je de slots invullen voor `content` en/of `label`

Zie de story onder [vl-cascader-item](/?path=/docs/components-block-cascader-cascader-item--documentatie) voor een voorbeeld.

Plaats je een `vl-link` in het `label`-slot, geef die dan de class `vl-cascader-link`. Die class zorgt ervoor dat de
link de volle breedte van het item inneemt en dat het pijltje rechts uitgelijnd staat, net zoals bij de
`label`-attribuut-variant. Links in het `content`-slot krijgen die class niet en behouden hun natuurlijke breedte.

```html
<vl-cascader-item label="West-Vlaanderen">
    <vl-link slot="label" bold button-as-link icon="arrow-right-fat" icon-placement="after" class="vl-cascader-link">
        Provincie: West-Vlaanderen
    </vl-link>
</vl-cascader-item>
```

Dezelfde conventie geldt voor de links die je in een eigen [dynamische template](#dynamische-templates) of via
[property-binding](#cascader-met-property-binding) rendert.

### Cascader met dynamisch ophalen van kind-elementen

Het is ook mogelijk de data-structuur dynamisch op te bouwen door een `Promise<CascaderItem[]>` of functie te definiëren
die als argument de `requestParams`-property gebruikt om een nieuw niveau op te halen.

```html
<vl-cascader .itemListFn=${fetchNodes}>...</vl-cascader>
```

**voorbeeld itemListFn opzet**

```ts
import { ItemListFn, CascaderItem } from '../vl-cascader.model';

export const getItemList: ItemListFn = async (item: CascaderItem): Promise<CascaderItem[]> => {
    const { data } = item;
    const requestParams = data?.requestParams;
    // hier kan een API request gedefinieerd worden
    await new Promise((res) => setTimeout(res, 3000));
    return [
        {
            label: requestParams + ' ' + new Date().getHours(),
            children: [
                {
                    label: requestParams + ' ' + new Date().getMinutes(),
                    children: [
                        {
                            label: requestParams + ' ' + new Date().getMilliseconds(),
                            narrowDown: true,
                            data: {
                                requestParams: 'Niveau-deeper',
                            },
                        },
                        {
                            label: '[- ' + requestParams + ' -]',
                            templateType: 'provincie',
                        },
                    ],
                },
                {
                    label: requestParams + ' ' + new Date().getMinutes(),
                },
            ],
        },
        {
            label: requestParams + ' ' + new Date().getMinutes(),
            children: [
                {
                    label: requestParams + ' ' + new Date().getMilliseconds(),
                    narrowDown: true,
                    data: {
                        requestParams: 'Niveau-deeper',
                    },
                },
                {
                    label: '[- ' + requestParams + ' -]',
                    templateType: 'provincie',
                },
            ],
        },
        {
            label: requestParams + ' ' + new Date().getMinutes(),
        },
    ];
};
```

### Dynamische templates

Laat toe om alternatieve templates voor de cascader-items in te stellen.
- Dit werkt enkel wanneer op de `vl-cascader-item`, de respectievelijke `template-type` ingesteld staat.
- Wanneer je [property-binding](#cascader-met-property-binding) gebruikt om de structuur op te bouwen, dan stel je op het `CascaderItem`-object,
  het gewenste `templateType` in

Hieronder vind je een voorbeeld hoe je je eigen templates kan configureren:

**voorbeeld templates opzet**

```ts
import { TemplateFn } from '../vl-cascader.model';
import { html, nothing } from 'lit';

export const cascaderItemTemplates = new Map<string, TemplateFn>([
    [
        'provincie',
        (item, processNarrowDown) => {
            const hasChildren = item.children || item.narrowDown;
            const childrenAnnotation = html`Bekijk deelgemeentes
            ${item.children?.length
                ? html` <vl-text annotation>( ${item.children.length} )</vl-text> `
                : 'Bekijk deelgemeentes '}`;
            return html`
                <div class="vl-cascader-item">
                    <vl-title type="h3">${item.label}</vl-title>
                    <vl-link
                        bold
                        button-as-link
                        icon="${hasChildren ? 'arrow-right-fat' : nothing}"
                        icon-placement="after"
                        class="vl-cascader-link"
                        @click=${() => processNarrowDown(item)}
                    >
                        <span>
                            ${item.children ? childrenAnnotation : item.narrowDown ? 'Haal deelgemeentes op' : 'Actie'}
                        </span>
                    </vl-link>
                </div>
            `;
        },
    ],
]);
```

!!! Belangrijk als je wil dat je in de component verder kan navigeren, dat je in de callback een argument bepaalt van
type `NarrowDownFn`. Deze laat toe om de onderliggende kind-elementen te tonen.

Vervolgens kan je een `Map<string, TemplateFn>` meegeven aan de `templates`-property.

```html
<vl-cascader .templates=${templates}>...</vl-cascader>
```

Hieronder vind je een uitgewerkt voorbeeld van bovenstaande methodes waarin templates & slots worden gebruikt:

> Story: [vl-cascader - dynamic templating](/?path=/story/components-block-cascader-cascader--cascader-dynamic-templating)

## Variaties

### Cascader in een SideSheet

Hieronder een voorbeeld van de cascader binnen een `vl-side-sheet` component.

> Story: [vl-cascader - side-sheet](/?path=/story/components-block-cascader-cascader--cascader-side-sheet)

## Gekende beperkingen

De cascader zal het huidige niveau van de meegegeven boomstructuur in zijn eigen shadow DOM renderen.
Dit heeft als gevolg dat eigen CSS en klasses, die toegepast zijn op die boomstructuur, niet door de shadow DOM
zullen penetreren.

Om dit op te lossen, dien je Custom CSS toe te voegen (die dan wel zal werken op de styles binnen de shadow DOM van
de cascader). [Hier vind je meer uitleg over Custom CSS toevoegen](/?path=/docs/recepten-css-styling--documentatie#custom-css)

## Toegankelijkheid

> [!NOTE]
> **Opgelet**
> Plaats deze component binnen een `<main>`, `<section>`, `<article>` of `<aside>`, zodat
> de interne `<header>` geen impliciete banner-role krijgt. De banner-role is voorbehouden voor
> de globale `<vl-header>` en moet uniek zijn per pagina.

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - vl-sidebar-advanced](https://overheid.vlaanderen.be/webuniversum/v3/vue-documentation/?path=/story/components-vl-sidebar--sidebar-advanced)
