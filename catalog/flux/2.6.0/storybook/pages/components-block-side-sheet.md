# Side sheet

De `side-sheet`-component heeft containers die aan de linker- of rechterrand van het scherm zijn verankerd. Deze kunnen
geopend of gesloten worden aan de hand van een knop.

## Voorbeeld

```js
import { VlSideSheet } from '@domg-wc/components/block';
```

```html
<vl-side-sheet>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla interdum urna ante.</p>
    <p>Sed vehicula tortor quis dignissim tincidunt.</p>
</vl-side-sheet>
```

## Default

> Story: [vl-side-sheet - default](/?path=/story/components-block-side-sheet--side-sheet-default)

## Configuratie

> API: vl-side-sheet

## Varianten

### Custom icon

Standaard is er een pijltje dat aanduidt of de `side-sheet` open of gesloten is. Je kan dit vervangen door een custom
icon in te stellen. [Hier](https://overheid.vlaanderen.be/webuniversum/v3/documentation/atoms/vl-ui-icon/) vind je een
overzicht van alle beschikbare icons.

Deze blijft dan dezelfde in de 2 richtingen.

### Breedte zelf instellen.

Het is ook mogelijk de breedte zelf in te stellen.

Dan kan je voor mobile en/of desktop de width instellen door de respectievelijke css variabelen in te stellen. Dit
stelt de `width` in voor het component.
- breekpunt voor desktop naar mobile is vanaf `767px`
- voor desktop gebruik je `--vl-side-sheet-width`
- voor mobile gebruik je `--vl-side-sheet-width-mobile`
- hier kan je ook gelijk welke andere waardes meegeven die geldig zijn voor `width`

```css
:root {
    --vl-side-sheet-width: 480px; /* voor desktop */
    --vl-side-sheet-width-mobile: 100%; /* voor mobile */
}
```

### Openen en sluiten zonder knop

Je kan de `side-sheet` openen zonder de toggle knop;
- stel `hide-toggle-button` in op `true`
- roep `toggle()` aan op de `side-sheet`-instantie te wisselen tussen open en gesloten status
- alternatief kan je ook uitdrukkelijk `open()` en `close()` aanroepen

Hieronder volgt een voorbeeld met broncode:

### Voorbeeld van buitenaf openen & sluiten

> Story: [vl-side-sheet - toggle](/?path=/story/components-block-side-sheet--side-sheet-toggle)

**voorbeeld code om side-sheet te openen en te sluiten van buitenaf**

```ts
import { VlSideSheet } from '../vl-side-sheet.component';

export const sideSheetToggleImplementation = () => {
    let sideSheet: VlSideSheet;
    let listenerButton: HTMLElement;
    customElements.whenDefined('vl-side-sheet').then(() => {
        sideSheet = document.querySelector('#side-sheet-toggle') as unknown as VlSideSheet;
        listenerButton = document.querySelector(
            '#vl-side-sheet-open-button-with-close-listener'
        ) as unknown as HTMLElement;
    });
    const toggleSideSheet = () => sideSheet?.toggle();

    const openSideSheet = () => sideSheet?.open();
    const closeSideSheet = () => sideSheet?.close();

    return { toggleSideSheet, openSideSheet, closeSideSheet };
};

export default sideSheetToggleImplementation;
```

## Custom CSS Properties

|  |  |  |
| --- | --- | --- |
| Naam | Beschrijving | Default |
| `--vl-side-sheet-width` | breedte van het element | 33% |
| `--vl-side-sheet-width-mobile` | breedte van het element bij scherm kleiner dan 767px | calc(100vw - 56px) |

## Referenties

### Digitaal Vlaanderen

Er is geen `side-sheet`-component bij Digitaal Vlaanderen.

In de Vue Component library van Digitaal Vlaanderen is er echter wel een component die er dicht tegen aanleunt:
`vl-side-bar`-component (link [side-bar-component](https://overheid.vlaanderen.be/webuniversum/v3/vue-documentation/?path=/story/components-vl-sidebar--sidebar-collapsible)).

### Legacy Documentatie

[Legacy Storybook - Side Sheet](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-side-sheet--default)

[Legacy Documentatie - Side Sheet](https://webcomponenten.omgeving.vlaanderen.be/doc/VlSideSheet.html)

[Legacy Demo - Side Sheet](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-side-sheet.html)
