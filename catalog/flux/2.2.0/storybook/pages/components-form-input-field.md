# Input Field

Gebruik de `input-field` component om een input veld toe te voegen aan een pagina.

Zie het [form demo](/?path=/docs/ontwerp-form-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlInputFieldComponent } from '@domg-wc/components/form';
```

```html
<vl-input-field></vl-input-field>
```

> Story: [vl-input-field - default](/?path=/story/components-form-input-field--input-field-default)

## Configuratie

> API: vl-input-field

## Varianten

### Number

> Story: [vl-input-field - number](/?path=/story/components-form-input-field--input-field-number)

### Input Group

Het `input-group` attribuut is er om het input veld een specifieke stijl te geven in combinatie met een knop. Het
attribuut doet enkel iets in die combinatie. Zie [Input Group [next]](/?path=/docs/components-form-input-group--documentatie)
voor meer informatie en voorbeelden.

## Type

Momenteel ondersteunen we volgende [input types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types):
- `text`
- `number`

Daarnaast voorzien we voor enkele andere types ook een eigen component:
- `date`: [vl-datepicker](/?path=/docs/components-form-datepicker--documentatie)
- `file`: [vl-upload](/?path=/docs/components-form-upload--documentatie)
- `checkbox`: [vl-checkbox](/?path=/docs/components-form-checkbox--documentatie)
- `radio-group`: [vl-radio-group](/?path=/docs/components-form-radio-group--documentatie)

De andere types instellen kan onverwachte gevolgen hebben op vlak van validatie.

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Pattern validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/ontwerp-form-validation--documentatie)

Pattern validatie kan op 2 manieren gebeuren:
- Via het `pattern` attribuut
- Via de `regex` property

Het `pattern` attribuut kan gebruikt worden voor eenvoudige validatie.

De `regex` property kan gebruikt worden voor complexere validatie.

### E-mail

Voor envoudige e-mailadres validatie kan je gebruik maken van het `pattern` attribuut.
```
.+@vlaanderen.be$
```
Voor complexere e-mailadres validatie kan je gebruik maken van de `regex` property.

Zie [emailregex.com](https://emailregex.com/) voor een uitgebreid voorbeeld, zie hieronder voor één van de simpelere voorbeelden.
```
/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
```

### Integer

Voor het valideren van een integer kan je gebruik maken van het `pattern` attribuut.

Je gebruikt dit best in combinatie met `type="number"`.
```
^[0-9]*$
```

### Masks

Voor mask validatie kan je gebruik maken van de [vl-input-field-masked](/?path=/docs/components-form-input-field-masked--documentatie) component.

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Input field](https://overheid.vlaanderen.be/webuniversum/v3/documentation/forms/vl-ui-input-field)
