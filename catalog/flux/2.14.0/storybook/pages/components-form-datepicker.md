# Datepicker

## Doel

Gebruik de `datepicker` component om de gebruiker op een gebruiksvriendelijke manier een datum of tijd te laten selecteren.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlDatepickerComponent } from '@domg-wc/components/form';
```

```html
<vl-datepicker></vl-datepicker>
```

> Story: [vl-datepicker - default](/?path=/story/components-form-datepicker--datepicker-default)

## Configuratie

> API: vl-datepicker

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Positionering

De datepicker kalender positioneert zichzelf automatisch. Indien de automatische positionering niet het gewenste
resultaat oplevert, kan dit op twee manieren aangepast worden:

-   Het `position` attribuut: mogelijke waarden zijn: "auto" (default), "above", "below", "auto left", "auto center",
    "auto right", "above left", "above center", "above right", "below left", "below center", "below right".
-   Het `static` attribuut: indien aanwezig wordt andere positionering genegeerd en wordt de kalender
    op een vaste plaats onder het datum invulveld getoond.

## Formaat

Je kan het `format` attribuut gebruiken om de datumnotatie te wijzigen. Het default formaat is `d.m.Y`.

In het onderstaande voorbeeld wordt de datumnotatie expliciet ingesteld op `d/m/Y`.

> `format="d/m/Y"` zal de gekozen datum weergeven als `31/12/2023`
```html
<vl-datepicker format="d/m/Y"></vl-datepicker>
```

## Waarde

Je kan de datum instellen met het `value` attribuut. De waarde moet conform het [ISO-formaat](https://en.wikipedia.org/wiki/ISO_8601) zijn.

De uitgelezen waarde volgt eveneens het [ISO-formaat](https://en.wikipedia.org/wiki/ISO_8601). Per type datepicker wordt de waarde standaard als volgt weergegeven:
- `date`: `2023-12-31`
- `time`: `23:59`
- `date-time`: `2023-12-31T23:59`
- `range`: `2023-12-31/2023-12-31`

> `value="2023-12-31"` zal de ingestelde datum weergeven als `31.12.2023`
```html
<vl-datepicker value="2023-12-31"></vl-datepicker>
```

## Varianten

### Static

> Story: [vl-datepicker - static](/?path=/story/components-form-datepicker--datepicker-static)

### Range

> Story: [vl-datepicker - range](/?path=/story/components-form-datepicker--datepicker-range)

### Time

> Story: [vl-datepicker - time](/?path=/story/components-form-datepicker--datepicker-time)

### Min-date en Max-date

Je kan de selecteerbare datumrange beperken via de `min-date` en `max-date` attributen.
De waarde moet conform het ingestelde `format` zijn (standaard `d.m.Y`), of de speciale waarde `'today'` voor de huidige datum.

> Met `format="d.m.Y"` (standaard): `min-date="01.01.2019"` en `max-date="31.12.2019"`
```html
<vl-datepicker min-date="01.01.2019" max-date="31.12.2019"></vl-datepicker>
```

> Gebruik `'today'` om de huidige datum als grens in te stellen:
```html
<vl-datepicker min-date="today"></vl-datepicker>
```

> Story: [vl-datepicker - min-date en max-date](/?path=/story/components-form-datepicker--datepicker-min-date-and-max-date)

- Dagen buiten de opgegeven range worden uitgeschakeld in de kalender.
- Ingetypte datums buiten de range worden gevalideerd via respectievelijk de `rangeUnderflow` en `rangeOverflow` ValidityState keys.

### Date-time

> Story: [vl-datepicker - date-time](/?path=/story/components-form-datepicker--datepicker-date-time)

## Validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

### Mask Validatie

- Er wordt standaard mask validatie toegevoegd aan de datepicker met type `date` (standaard) of type `time`.
- De mask wordt opgebouwd op basis van het `format` attribuut.
- Je kan standaard mask validatie uitschakelen met het `disable-mask-validation` attribuut.
- De `patternMismatch` ValidityState key wordt gebruikt voor de mask validatie error.

### Pattern Validatie

- Als de mask validatie is uitgeschakeld, kan je met het `pattern` attribuut een regex patroon instellen. Je kan ook de `regex` property gebruiken voor complexere validatie.
- De `patternMismatch` ValidityState key wordt gebruikt voor de pattern validatie error.

## Gekende Beperkingen

- De datepicker is gedeeltelijk toegankelijk voor gebruikers die enkel met het toetsenbord navigeren. Ze kunnen wel manueel een datum invullen.
- Voor datepicker met type `date-time` & `range` is er geen standaard mask validatie voorzien gezien `cleave.js` hiervoor geen ondersteuning biedt.

## Referenties

### Flatpickr

[Documentatie Flatpickr](https://flatpickr.js.org/)

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Datepicker](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-datepicker/)
