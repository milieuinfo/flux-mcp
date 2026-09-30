# Popover

Een `popover` is een nieuw, meestal kleiner venster / popup dat boven de andere inhoud op het scherm verschijnt.
Gebruik een popover om aanvullende informatie aan de gebruiker te geven of om gebruikersinteractie te vragen.

## Voorbeeld

```js
import { VlPopoverComponent } from '@domg-wc/components/block';
```

```html
<vl-popover></vl-popover>
```

> Story: [vl-popover - default](/?path=/story/components-block-popover--popover-default)

## Configuratie

> API: vl-popover, vl-popover-action, vl-popover-action-list

## Gebruik

### Oriëntatie

Je kan de oriëntatie bepalen van de popover als daarvoor plaats is met `placement`. Anders zal `floating-ui`
achterliggend zoeken naar de volgende geschikt oriëntatie; standaard zal dit dan de tegenovergestelde oriëntatie
zijn van de initieel ingestelde.
Meer info kan je [hier](https://floating-ui.com/docs/tutorial#placements) vinden.

Je kan een `-start` of `-end` suffix toevoegen zodat de oriëntatie start of eindigt aan respectievelijk het begin of
einde van het referentie-element.

### Standaard pijl & afstand

Standaard wordt:
- de pijl getoond
- wordt de `distance` ingesteld op `10px`

Dit is er zodat de stijl van DV gevolgd wordt.

Je kan de pijl verbergen door `hide-arrow` in te stellen.
De afstand tot het referentie-element kan je volledig zelf bepalen.

### Strategy
> [strategy documentatie bij floating-ui](https://floating-ui.com/docs/computePosition#strategy)

Default is positioneringsstrategie ingesteld op `absolute`. De popover zal gepositioneerd worden ten opzichte van het
dichtstbijzijnde gepositioneerde parent-element (bv. een element met `position: relative`).

Om te vermijden dat de popover gepositioneerd wordt tegenover het verkeerde element, kan je best de eerste parent van
de popover instellen op `position: relative` zodat de popover steeds gepositioneerd wordt zoals verwacht.

## Varianten

### Hover

Je kan de standaard `click` waarde voor `trigger` ook instellen op bv. de combinatie van `hover` & `focus` interacties.

> Story: [vl-popover - hover](/?path=/story/components-block-popover--popover-hover)

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

De popover-component gebruikt achterliggend [floating-ui](https://floating-ui.com/)

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Popover](https://overheid.vlaanderen.be/webuniversum/v3/documentation/js-components/vl-ui-popover)
