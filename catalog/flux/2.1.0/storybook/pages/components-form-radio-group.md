# Radio Group

Gebruik de `radio-group` component om de gebruiker de mogelijkheid te geven om 1 keuze te selecteren in een lijst.

Wanneer mogelijk, selecteer geen `radio` van vooraf zodat de gebruiker een bewuste keuze kan maken.

De `radio` component is een onderdeel van de `radio-group` component.

Zie het [form demo](/?path=/docs/ontwerp-form-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlRadioComponent, VlRadioGroupComponent } from '@domg-wc/components/form';
```

```html
<vl-radio-group>
    <vl-radio></vl-radio>
    <vl-radio></vl-radio>
    <vl-radio></vl-radio>
</vl-radio-group>
```

> Story: [vl-radio-group - default](/?path=/story/components-form-radio-group--radio-group-default)

## Configuratie

> API: vl-radio, vl-radio-group

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/ontwerp-form-validation--documentatie)

### Required

De `radio-group` component kan ingesteld worden als `required`. Dit betekent dat er minstens 1 `vl-radio` geselecteerd moet worden.

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen](https://overheid.vlaanderen.be/webuniversum/v3/documentation/forms/vl-ui-radio/)
