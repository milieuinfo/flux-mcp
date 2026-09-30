# Progress Bar

## Doel

Gebruik een `vl-progress-bar` om procentuele voortgang te tonen.

## Voorbeeld

```js
import { VlProgressBarComponent } from '@domg-wc/components/block';
```

```html
<vl-progress-bar></vl-progress-bar>
```

> Story: [vl-progress-bar - default](/?path=/story/components-block-progress-bar--progress-bar-default)

## Configuratie

> API: vl-progress-bar

## Varianten

### Onbepaalde voortgang

Indien de voortgang niet bepaald kan worden, kan je het attribuut `indeterminate` gebruiken.

> Story: [vl-progress-bar - indeterminate](/?path=/story/components-block-progress-bar--progress-bar-indeterminate)

### Error

Indien de voortgang faalde, kan je het attribuut `error` gebruiken.

> Story: [vl-progress-bar - error](/?path=/story/components-block-progress-bar--progress-bar-error)

### Succes

Indien de voortgang succesvol afgerond is, kan je het attribuut `success` gebruiken.

> Story: [vl-progress-bar - success](/?path=/story/components-block-progress-bar--progress-bar-success)

## Witruimte

Deze component heeft geen eigen witruimte om zo flexibel mogelijk ingezet te kunnen worden. Extra padding of margin
kan eenvoudig toegevoegd worden met de [vl-padding](/?path=/docs/styles-layout-afnemers-padding--documentatie) of
[vl-margin](/?path=/docs/styles-layout-afnemers-margin--documentatie) styles:

```html
<vl-progress-bar class="vl-padding vl-padding--small" value="50" label="Progress bar met witruimte"></vl-progress-bar>
```

## Toegankelijkheid

De progress bar wordt opgebouwd met `role="progressbar"` en de bijhorende `aria-valuenow`. Het is noodzakelijk om een
waarde voor `label` of `labelledby` in te vullen, zodat een screenreader kan voorlezen over welke voortgang het gaat.

Indien de gebruiker "verminderde beweging" heeft ingesteld in diens besturingssyteem, worden de bewegende animaties
uitgeschakeld. In het geval van "indeterminate" blijft er enkel een fade-in/fade-out animatie zichtbaar.
