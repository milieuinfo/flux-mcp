# Textarea

## Doel

Gebruik de `textarea` component om een textarea veld toe te voegen aan een pagina.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

Deze component bevat geen rich-text modus: gebruik daarvoor
[vl-textarea-rich](/?path=/docs/components-form--text-area-rich--documentatie).

## Voorbeeld

```js
import { VlTextareaComponent } from '@domg-wc/components/form';
```

```html
<vl-textarea></vl-textarea>
```

> Story: [vl-textarea - default](/?path=/story/components-form-textarea--textarea-default)

## Configuratie

> API: vl-textarea

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Validatie

Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Textarea](https://www.vlaanderen.be/vlaanderen-design-system/componenten/text-area)
