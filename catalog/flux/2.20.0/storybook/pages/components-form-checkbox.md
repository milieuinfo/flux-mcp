# Checkbox

## Doel

Gebruik de `checkbox` component om de gebruiker de mogelijkheid te geven om 1 of meerdere dingen te selecteren in een
lijst.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlCheckboxComponent } from '@domg-wc/components/form';
```

```html
<vl-checkbox></vl-checkbox>
```

> Story: [vl-checkbox - default](/?path=/story/components-form-checkbox--checkbox-default)

## Configuratie

> API: vl-checkbox

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Varianten

### Met value

Indien er geen value meegegeven wordt aan de checkbox, wordt er tijdens het submitten van een form de value `on` teruggegeven.

Dit is zoals de HTML5 standaard het voorschrijft. Indien er wel een value meegegeven wordt, zal deze value teruggegeven worden.

> Story: [vl-checkbox - value](/?path=/story/components-form-checkbox--checkbox-value)

### Switch

#### Gebruik

Semantisch gezien moet een switch gebruikt worden om onmiddellijk een actie te ondernemen, zoals het aan- en uitzetten van een instelling.

*NIET*: een switch gebruiken om een selectie te valideren, bv. "gelezen & goedgekeurd"
*WEL*: dark mode aan- en uitzetten, adresgegevens tonen of verbergen

> Story: [vl-checkbox - switch](/?path=/story/components-form-checkbox--checkbox-switch)

## Validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

### FormData

De value van een checkbox werkt op een andere manier dan de value van een input.
- Als een checkbox gecheckt is, dan pas komt de value van de checkbox mee in de data.
- Als een checkbox niet gecheckt is, dan is er geen value voor de checkbox in de FormData, ook al is de value van de checkbox ingesteld.
- Als er geen value is ingesteld, dan krijgt de checkbox de value `on` mee in de FormData als de checkbox gecheckt is.

De werking volgt het native gedrag (en gebruikt ook een native checkbox input).

Meer info hier: [Checkbox - Value op MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value)

### Read only

Readonly zorgt ervoor dat de value van een input niet aangepast kan worden, hierdoor heeft readonly plaatsen op een checkbox geen effect aangezien het aan- en uitvinken de checked state aanpast en niet de value.

Als je een checkbox als readonly wilt gebruiken, moet je het `disabled` attribuut meegeven en gebruik maken van een hidden input zodat de value toch mee met het form gesubmit wordt.

Zie dat de value van de hidden input overeenkomt met de checked state en de value van de disabled checkbox.

> Story: [vl-checkbox - readonly](/?path=/story/components-form-checkbox--checkbox-readonly)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Checkbox](https://www.vlaanderen.be/vlaanderen-design-system/componenten/checkbox)
