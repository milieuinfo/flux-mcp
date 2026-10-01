# vl-breadcrumb (Flux 2.20.0)

Status: **stable** · soort: block · pagina: `components-block-breadcrumb` (https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-block-breadcrumb--documentatie) · generatie: TODO.

Gebruik de `breadcrumb` component om de locatie van de huidige pagina af te beelden binnen een navigeerbare hiërarchie.

Samenvatting: Documentatie van vl-breadcrumb met vl-breadcrumb-item, de kruimelnavigatie die de plaats van de huidige pagina in een hiërarchie toont. Items zijn links (href), knoppen (type="button", bv. om een submenu in een vl-popover te openen) of tekst voor de huidige pagina; meng geen links en knoppen in één breadcrumb. Met ellipsis blijft elk item op één regel en wordt te lange tekst afgekapt, bv. in een side-sheet.

## API

De web-types geven voor vl-breadcrumb geen attributen, properties, slots, events.

### Opmerkingen uit de analyse

- not-in-web-types `ellipsis` op vl-breadcrumb: ellipsis houdt elk breadcrumb item op één regel en kapt een item dat ook op een nieuwe regel niet past af met een ellipsis (…). Het staat in de code als Boolean-attribuut en in de argTypes, en de story vl-breadcrumb - ellipsis gebruikt het, maar de web-types van 2.20.0 geven voor vl-breadcrumb geen enkel attribuut.

## Voorbeelden

### vl-breadcrumb - default

https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/story/components-block-breadcrumb--breadcrumb-default

```html
<vl-breadcrumb>
    <vl-breadcrumb-item href="#">Vlaanderen Intern</vl-breadcrumb-item>
    <vl-breadcrumb-item href="#">Regelgeving</vl-breadcrumb-item>
    <vl-breadcrumb-item href="#">Webuniversum</vl-breadcrumb-item>
    <vl-breadcrumb-item>Componenten</vl-breadcrumb-item>
</vl-breadcrumb>
```

```js
import { registerWebComponents } from '@domg-wc/common';
import { VlBreadcrumbComponent, VlBreadcrumbItemComponent } from '@domg-wc/components/block';

// vl-breadcrumb registreert vl-breadcrumb-item niet zelf.
registerWebComponents([VlBreadcrumbComponent, VlBreadcrumbItemComponent]);
```

### vl-breadcrumb - buttons

https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/story/components-block-breadcrumb--breadcrumb-buttons

```html
<vl-breadcrumb>
    <vl-breadcrumb-item type="button">Natuur</vl-breadcrumb-item>
    <div>
        <vl-breadcrumb-item id="submenu-fauna-flora" type="button">Flora</vl-breadcrumb-item>
        <vl-popover distance="6" for="submenu-fauna-flora" hide-arrow placement="bottom-start" trigger="click hover">
            <vl-popover-action-list>
                <vl-popover-action icon="nature-leaf">Flora</vl-popover-action>
                <vl-popover-action icon="programming-bug">Fauna</vl-popover-action>
            </vl-popover-action-list>
        </vl-popover>
    </div>
    <vl-breadcrumb-item>Bomen</vl-breadcrumb-item>
</vl-breadcrumb>
```

```js
import { registerWebComponents } from '@domg-wc/common';
import { VlBreadcrumbComponent, VlBreadcrumbItemComponent, VlPopoverComponent } from '@domg-wc/components/block';

// VlPopoverComponent registreert zelf vl-popover-action-list en vl-popover-action.
registerWebComponents([VlBreadcrumbComponent, VlBreadcrumbItemComponent, VlPopoverComponent]);

// vl-breadcrumb maakt van elk kind een stap: de <div> houdt het item Flora en zijn popover samen in één stap.
// De popover opent zelf bij klik en hover op het element met id submenu-fauna-flora.
document.querySelector('vl-breadcrumb-item[type="button"]').addEventListener('click', () => {
    console.log('click Natuur');
});
document.querySelector('vl-popover-action[icon="nature-leaf"]').addEventListener('click', () => {
    console.log('click flora');
});
document.querySelector('vl-popover-action[icon="programming-bug"]').addEventListener('click', () => {
    console.log('click fauna');
});
```

### vl-breadcrumb - ellipsis

https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/story/components-block-breadcrumb--breadcrumb-ellipsis

```html
<vl-breadcrumb ellipsis>
    <vl-breadcrumb-item href="#">Vlaanderen Intern</vl-breadcrumb-item>
    <vl-breadcrumb-item href="#">Regelgeving</vl-breadcrumb-item>
    <vl-breadcrumb-item>Besluit van de Vlaamse Regering tot vaststelling van een gewestelijke stedenbouwkundige verordening voor publiciteitsinrichtingen</vl-breadcrumb-item>
</vl-breadcrumb>
```

## Historiek

### 2.20.0

- FLUX-800 · `9311ae6` · feature · vl-breadcrumb — ellipsis attribuut voor lange breadcrumb items
- FLUX-800 · `c04a72c` · feature · vl-cascader — breadcrumb opgebouwd met vl-breadcrumb en WCAG verbeteringen

### 2.14.0

- FLUX-209 · `25e8c24` · fix · vl-breadcrumb — focus outline kleur correctie voor Edge

### 2.8.0

- FLUX-365 · `ff03a87` · feature · vl-breadcrumb — breadcrumb items als buttons

## Verwant

Elementen op dezelfde pagina: vl-breadcrumb-item.

Bronnen in de catalogus van flux-mcp 0.0.0-test: `2.20.0/web-types/block.web-types.json` (web-types), `2.20.0/storybook/pages/components-block-breadcrumb.md` (storybook), `storybook-analysis/components-block-breadcrumb/31b47dc46d7c.json` (storybook-analysis), `2.20.0/changelog/` (changelog), `2.20.0/changelog-analysis/` (changelog-analysis), `2.14.0/changelog/` (changelog), `2.14.0/changelog-analysis/` (changelog-analysis), `2.8.0/changelog/` (changelog), `2.8.0/changelog-analysis/` (changelog-analysis).

Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.
