# Toaster

Gebruik de `toaster` component om een toaster af te beelden.

## Voorbeeld

```js
import { VlToasterComponent } from '@domg-wc/components/block';
```

```html
<vl-toaster></vl-toaster>
```

> Story: [vl-toaster - default](/?path=/story/components-block-toaster--toaster-default)

## Configuratie

> API: vl-toaster

## Meldingen tonen

### Dynamisch

Om een melding te tonen, gebruik je de `showAlert()` methode.

Deze methode roep je op de volgende manier op:

```ts
const toaster = document.querySelector('vl-toaster');
toaster.showAlert({
  type: 'error',
  title: 'Fout',
  message: 'Dit is een foutmelding'
});
```

Je kan het meegegeven object uitbreiden met de properties van de [vl-alert](/?path=/docs/components-block-alert--documentatie) component.

> Story: [vl-toaster - show alert](/?path=/story/components-block-toaster--toaster-show-alert)

### Declaratief

Daarnaast kan je de meldingen ook declaratief toevoegen in het default slot van de `vl-toaster`, typisch gebruiken we
hiervoor de [vl-alert](/?path=/docs/components-block-alert--documentatie) component.

Om een melding te tonen, gebruik je de `show()` methode:

```ts
const toaster = document.querySelector('vl-toaster');
// toont de melding gedeclareerd in het default slot van de toaster
toaster.show();
```

> Story: [vl-toaster - fade out](/?path=/story/components-block-toaster--toaster-fade-out)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Toaster](https://overheid.vlaanderen.be/webuniversum/v3/documentation/atoms/vl-ui-toasters)
