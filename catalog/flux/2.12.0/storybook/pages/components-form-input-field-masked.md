# Input Field Masked

## Doel

Gebruik de `input-field-masked` component om een input veld met een mask toe te voegen aan een pagina.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlInputFieldMaskedComponent } from '@domg-wc/components/form';
```

```html
<vl-input-field-masked></vl-input-field-masked>
```

> Story: [vl-input-field-masked - iban](/?path=/story/components-form-input-field-masked--input-field-masked-iban)

## Configuratie

> API: vl-input-field-masked

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

### getRawValue(): string

Geeft de raw value van de input terug (zonder mask).

Bij het `price` mask wordt de prefix weggelaten.

## Validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

- Er wordt automatisch mask validatie toegevoegd aan het input veld, je kan dit uitschakelen met het `disable-mask-validation` attribuut.
- Bij de mask validatie wordt er gebruik gemaakt van een regex, deze kan je overschrijven met de `regex` property.
- Bij het testen van de regex wordt altijd de raw value van het input veld gebruikt.
- De `patternMismatch` ValidityState key wordt gebruikt voor de mask validatie error.
- Het is mogelijk om de mask validatie te combineren met andere validaties, bv. `required`, `min`, `max`.
- We voorzien momenteel enkel validatie voor de `text` input type.

## Masks

### Iban

- Enkel nummers
- Prefix: `BE`
- Formaat: `BE00 0000 0000 0000`
- Regex: `/^[A-Z]{2}[0-9]{14}$/`

> Story: [vl-input-field-masked - iban](/?path=/story/components-form-input-field-masked--input-field-masked-iban)

### Rijksregisternummer

- Enkel nummers
- Formaat: `00.00.00-000.00`
- Regex: `/^[0-9]{11}$/`

> Story: [vl-input-field-masked - rrn](/?path=/story/components-form-input-field-masked--input-field-masked-rrn)

### UUID

- Enkel hexadecimale karakters
- Formaat: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Regex: `/^[0-9a-fA-F]{32}$/`

> Story: [vl-input-field-masked - uuid](/?path=/story/components-form-input-field-masked--input-field-masked-uuid)

### Date

- Enkel nummers
- Formaat: `dd.mm.yyyy`
- Regex: `/^[0-9]{8}$/`

> Story: [vl-input-field-masked - date](/?path=/story/components-form-input-field-masked--input-field-masked-date)

### Numerical

- Enkel nummers
- 2 decimalen
- Decimaal karakter: `,`
- Duizendtal karakter: `.`
- Regex: `/^[0-9]+(.[0-9]+)?$/`

> Story: [vl-input-field-masked - numerical](/?path=/story/components-form-input-field-masked--input-field-masked-numerical)

### Price

- Enkel nummers
- 2 decimalen
- Prefix: `€`
- Decimaal karakter: `,`
- Duizendtal karakter: `.`
- Regex: `/^[0-9]+(.[0-9]+)?$/`
- De prefix wordt weggelaten bij de raw value.

> Story: [vl-input-field-masked - price](/?path=/story/components-form-input-field-masked--input-field-masked-price)

### Phone

- Enkel nummers
- Prefix: `+32`
- Formaat: `+32 00 00 00 00`
- Regex: `/^\+[0-9]{10}$/`

> Story: [vl-input-field-masked - phone](/?path=/story/components-form-input-field-masked--input-field-masked-phone)

### Phone international

- Enkel nummers
- Regex: `/^[0-9]*$/`

> Story: [vl-input-field-masked - phoneinternational](/?path=/story/components-form-input-field-masked--input-field-masked-phone-international)

### Mobile

- Enkel nummers
- Prefix: `+32`
- Formaat: `+32 000 00 00 00`
- Regex: `/^\+[0-9]{11}$/`

> Story: [vl-input-field-masked - mobile](/?path=/story/components-form-input-field-masked--input-field-masked-mobile)

### Custom

Je kan ook zelf masks toevoegen door de functie `VlInputFieldMasked.setMasks()` aan te roepen.

Hieronder volgt een code voorbeeld:

```js
export const CUSTOM_MASK = {
  blocks: [8, 4],
  delimiters: ['-'],
  numericOnly: true,
  numeralPositiveOnly: true,
  regex: /^[0-9]{12}$/
}

VlInputFieldMaskedComponent.setMasks({'custom-mask': CUSTOM_MASK})
```

Je roept deze best aan bij het entry point van je applicatie. Daarna is de mask beschikbaar voor elke
`vl-input-field-masked`.

> Story: [vl-input-field-masked - custom](/?path=/story/components-form-input-field-masked--input-field-masked-custom)

## Referenties

### Cleave.js

[Documentatie Cleave.js](https://nosir.github.io/cleave.js/)
