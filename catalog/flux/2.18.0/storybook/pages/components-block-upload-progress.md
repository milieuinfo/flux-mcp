# Upload progress

## Doel

Gebruik `vl-upload-progress` om procentuele voortgang van een bestandsupload te tonen.

Dit component laat toe om de upload te annuleren of te herstarten en heeft de mogelijkheid om een foutboodschap
weer te geven.

## Voorbeeld

```js
import { VlUploadProgressComponent } from '@domg-wc/components/block';
```

```html
<vl-upload-progress></vl-upload-progress>
```

> Story: [vl-upload-progress - default](/?path=/story/components-block-upload-progress--upload-progress-default)

## Configuratie

> API: vl-upload-progress

## Varianten

### Onbepaalde voortgang

Indien de voortgang niet bepaald kan worden, kan je het attribuut `indeterminate` gebruiken.

> Story: [vl-upload-progress - indeterminate](/?path=/story/components-block-upload-progress--upload-progress-indeterminate)

### Error

Indien de voortgang faalde, kan je het attribuut `error` gebruiken.

> Story: [vl-upload-progress - error](/?path=/story/components-block-upload-progress--upload-progress-error)

### Success

Indien de voortgang succesvol was, kan je het attribuut `success` gebruiken.

> Story: [vl-upload-progress - success](/?path=/story/components-block-upload-progress--upload-progress-success)

## Witruimte

Deze component heeft geen eigen witruimte om zo flexibel mogelijk ingezet te kunnen worden. Extra padding of margin
kan eenvoudig toegevoegd worden met de [vl-padding](/?path=/docs/styles-layout-afnemers-padding--documentatie) of
[vl-margin](/?path=/docs/styles-layout-afnemers-margin--documentatie) styles:

```html
<vl-upload-progress filename="document.pdf" filesize="123 MB" class="vl-padding vl-padding--small" progress="50"></vl-upload-progress>
```
