# Popover

## Doel

Een popover is een nieuw, meestal kleiner venster / popup dat boven de andere inhoud op het scherm verschijnt.
Het doel van de popover is het bouwen van context- of submenu's. Je kan deze menu's opbouwen a.d.h.v. de
`vl-popover-action-list` en `vl-popover-action` componenten. De popover kan ook andere interactieve HTML-elementen
bevatten.

## Voorbeeld

```js
import { VlPopoverComponent } from '@domg-wc/components/block';
```

```html
<vl-button id="popover-trigger"></vl-button>
<vl-popover for="popover-trigger"></vl-popover>
```

> Story: [vl-popover - default](/?path=/story/components-block-popover--popover-default)

## Configuratie

> API: vl-popover, vl-popover-action, vl-popover-action-list

## Gebruik

### Standaard pijl & afstand

Standaard wordt:
- de pijl getoond (je kan de pijl verbergen met `hide-arrow`)
- wordt de `distance` ingesteld op `10px`

### Oriëntatie
> [Raadpleeg de placement documentatie van floating-ui](https://floating-ui.com/docs/tutorial#placements)

Je kan de oriëntatie bepalen van de popover als daarvoor plaats is met `placement`. Als er niet genoeg ruimte is zal `floating-ui` achterliggend een alternatieve oriëntatie kiezen.

Je kan een `-start` of `-end` suffix toevoegen zodat de oriëntatie start of eindigt aan respectievelijk het begin of einde van het referentie-element.

### Strategy
> [Raadpleeg de strategy documentatie van floating-ui](https://floating-ui.com/docs/computePosition#strategy)

Standaard is `strategy` ingesteld op `absolute`. De popover zal gepositioneerd worden ten opzichte van het
dichtstbijzijnde gepositioneerde parent-element (bv. een element met `position: relative`).

Om te vermijden dat de popover gepositioneerd wordt tegenover het verkeerde element, kan je best de eerste parent van de popover instellen op `position: relative` zodat de popover steeds gepositioneerd wordt zoals verwacht.

## Varianten

### Hover / Tooltip

Je kan de standaard `click` waarde voor `trigger` ook instellen op bv. de combinatie van `hover` & `focus` interacties.

Het gebruik van het vl-popover component als tooltip is echter **deprecated**. Gebruik hiervoor het [vl-tooltip](/?path=/docs/components-block-tooltip--documentatie) component.

### Popover Actions

Je kan een lijst van acties toevoegen aan de popover en die acties markeren als `active`.

> Story: [vl-popover - actions](/?path=/story/components-block-popover--popover-actions)

Hieronder vind je een voorbeeld implementatie met LitElement:

**Toon HTML template voorbeeld**

```html
<vl-popover-action-list @click=${actionListClickHandler}>
    <vl-popover-action selected=${selected} icon="search">Zoeken</vl-popover-action>
    <vl-popover-action icon="bell">Rapportenoverzicht</vl-popover-action>
    <vl-popover-action icon="pin">Vind locatie</vl-popover-action>
</vl-popover-action-list>
```

**Toon TypeScript code voorbeeld**

```ts
const actionListClickHandler = (event: CustomEvent) => {
        const actionElement = event.target as VlPopoverActionComponent;
        const allActions = Array.from(actionElement.parentElement?.querySelectorAll('vl-popover-action') || []);
        allActions.forEach((action) => {
            if (action !== actionElement) {
                action.removeAttribute('selected');
            }
        });
        actionElement.setAttribute('selected', '');
    };
```

> [!WARNING]
> **Opgelet**
> Sinds versie <strong>2.5.0</strong> wordt er automatisch een "button"- of "a"-element gerenderd in de vl-popover-action.<br/><br/>
> Indien je reeds je eigen buttons of links renderde binnenin een action moet je:
> <ul>
>     <li><strong>In het geval van een button:</strong> de "click" en andere handlers verplaatsen naar het vl-popover-action component.</li>
>     <li><strong>In het geval van een link:</strong> de "href", "target" en/of "rel" attributen verplaatsen naar het vl-popover-action component.</li>
> </ul>

### Popover Actions Divider

Een lijst van acties kan visueel opgesplitst worden adhv de horizontale regel: `<hr class="vl-separator" />`.

```
<vl-popover-action-list>
    <vl-popover-action icon="search">Zoeken</vl-popover-action>
    <vl-popover-action icon="bell">Rapportenoverzicht</vl-popover-action>
    <vl-popover-action icon="pin">Vind locatie</vl-popover-action>
    <hr class="vl-separator" />
    <vl-popover-action icon="save">Bewaren</vl-popover-action>
    <vl-popover-action icon="trash">Verwijderen</vl-popover-action>
</vl-popover-action-list>
```

> Story: [vl-popover - actions divider](/?path=/story/components-block-popover--popover-actions-divider)

## Referenties

### floating-ui

De popover-component gebruikt achterliggend [floating-ui](https://floating-ui.com/).

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Popover](https://www.vlaanderen.be/vlaanderen-design-system/componenten/popover)
