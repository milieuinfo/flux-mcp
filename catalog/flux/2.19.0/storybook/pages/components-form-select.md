# Select

## Doel

Gebruik de `select` component om een select veld toe te voegen aan een pagina.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlSelectComponent } from '@domg-wc/components/form';
```

```html
<vl-select></vl-select>
```

> Story: [vl-select - default](/?path=/story/components-form-select--select-default)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt' },
        { label: 'Turnhout', value: 'turnhout' },
        { label: 'Knokke-Heist', value: 'knokke-heist' },
        { label: 'Waregem', value: 'waregem' },
        { label: 'Lier', value: 'lier' },
        { label: 'Rio Piedras', value: 'rio piedras' }
]
```

## Configuratie

> API: vl-select

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

## Styles

De styles van DV zijn lokaal gezet en aangepast omdat deze niet CSP compliant waren.

Er werd gebruik gemaakt van een `data:` attribuut om een SVG op te halen van w3.org.
Hierdoor breekt de CSP compliance tenzij je alle `data:` attributen whitelist, wat niet de bedoeling is.

## Events

### Change event

Bij het selecteren of verwijderen van een optie (zowel programmatorisch als door een gebruiker), wordt het `vl-change` event afgevuurd. Het detail object van dit event bevat de value van de geselecteerde opties.

### Input event

Als de gebruiker een optie selecteert of verwijdert, wordt het `vl-input` event afgevuurd. Het detail object van dit event bevat de value van de geselecteerde opties.

## Select opties

Er zijn twee manieren om opties toe te voegen aan de select component:

1. **Programmatorisch** via de `options` property
2. **Declaratief** via HTML `<option>` en `<optgroup>` elementen

### Programmatorische opties via `options` property

De `options` property bevat een array van objecten die de opties van de select component bevatten.

```code
<vl-select
    .options=${[
               { label: 'Hasselt', value: 'hasselt' },
               { label: 'Turnhout', value: 'turnhout' }
           ]}
></vl-select>
```

Als de referentie van deze array verandert, wordt de Lit lifecycle getriggerd en wordt de select opnieuw opgebouwd op basis van de nieuwe opties.

Hierdoor is het noodzakelijk om de opties door te geven aan de select component met behulp van een variabele, en de opties niet direct in de template te zetten.

Indien je de opties direct in de template zet, zal bij elke render de select opnieuw opgebouwd worden en de gekozen opties verwijderd worden.

Dit betekent ook dat als je programmatorisch een optie wil veranderen, toevoegen of verwijderen, je de referentie van de array moet aanpassen.

Dit kan je doen door de opties de spreaden in een nieuwe array (`[...options]`).

### Declaratieve opties via HTML elementen

Als alternatief voor de `options` property kan je ook gebruik maken van standaard HTML `<option>` en `<optgroup>`
elementen binnen de `<vl-select>` component. Deze aanpak biedt meer flexibiliteit en
volgt de native HTML select implementatie.

> Story: [vl-select - declarative options](/?path=/story/components-form-select--select-declarative-states)

**Ondersteunde option attributen:**
- `value`: De waarde van de optie
- `selected`: Markeert de optie als geselecteerd
- `disabled`: Schakelt de optie uit

### `initial-options` property

De `initial-options` property is een array van objecten die de opties van de select component bevatten.

Deze zijn de standaard opties die worden getoond bij het laden van de pagina.

Als de form reset, worden deze opties getoond in de select component.

Indien je declaratieve opties gebruikt bij het laden van de `vl-select`, worden deze intern ingesteld als de `initial-options` property.

### `value` attribuut

Je kan ook de geselecteerde optie(s) van de select component instellen door het `value` attribuut te gebruiken.

## Accessibility

Dit component is volledig accessible, we raden aan waar mogelijk gebruik te maken van dit component in plaats van de [vl-select-rich](/?path=/docs/components-form-select-rich--documentatie).

Indien er minder dan 7 opties zijn raden we aan checkboxes of radio buttons te gebruiken.

## Varianten

### Niet Verwijderbaar

> Story: [vl-select - not-deletable](/?path=/story/components-form-select--select-not-deletable)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt' },
        { label: 'Turnhout', value: 'turnhout' },
        { label: 'Knokke-Heist', value: 'knokke-heist' },
        { label: 'Waregem', value: 'waregem' },
        { label: 'Lier', value: 'lier' },
        { label: 'Rio Piedras', value: 'rio piedras' }
]
```

### Groepen

> Story: [vl-select - groups](/?path=/story/components-form-select--select-groups)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt', group: 'België' },
        { label: 'Turnhout', value: 'turnhout', group: 'België' },
        { label: 'Knokke-Heist', value: 'knokke-heist', group: 'België' },
        { label: 'Waregem', value: 'waregem', group: 'België' },
        { label: 'Lier', value: 'lier', group: 'België' },
        { label: 'Rio Piedras', value: 'rio piedras', group: 'Puerto Rico' }
]
```

### Geselecteerde optie

Als je een optie programmatorisch wil selecteren moet je voor deze optie de 'selected' boolean op true zetten.

> Story: [vl-select - selected option](/?path=/story/components-form-select--select-selected-option)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt', selected: true },
        { label: 'Turnhout', value: 'turnhout' },
        { label: 'Knokke-Heist', value: 'knokke-heist' },
        { label: 'Waregem', value: 'waregem' },
        { label: 'Lier', value: 'lier' },
        { label: 'Rio Piedras', value: 'rio piedras' }
]
```

### Disabled optie

Als je een optie programmatorisch wil uitzetten moet je voor deze optie de 'disabled' boolean op true zetten.

> Story: [vl-select - disabled option](/?path=/story/components-form-select--select-disabled-option)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt', disabled: true },
        { label: 'Turnhout', value: 'turnhout' },
        { label: 'Knokke-Heist', value: 'knokke-heist' },
        { label: 'Waregem', value: 'waregem' },
        { label: 'Lier', value: 'lier' },
        { label: 'Rio Piedras', value: 'rio piedras' }
]
```

### Read only

Als je wil dat de select read only is, moet je voor alle opties de 'disabled' boolean op true zetten.

Indien de 'required' boolean op true staat, moet je een value programmatorisch selecteren of je form wordt unsubmittable.

> Story: [vl-select - read only](/?path=/story/components-form-select--select-read-only)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt', selected: true, disabled: true },
        { label: 'Turnhout', value: 'turnhout', disabled: true },
        { label: 'Knokke-Heist', value: 'knokke-heist', disabled: true },
        { label: 'Waregem', value: 'waregem', disabled: true },
        { label: 'Lier', value: 'lier', disabled: true },
        { label: 'Rio Piedras', value: 'rio piedras', disabled: true }
]
```

### Declaratieve opties

In plaats van de `options` property te gebruiken, kan je ook gebruik maken van standaard HTML `<option>` elementen
binnen de `<vl-select>` component.

> Story: [vl-select - declarative options](/?path=/story/components-form-select--select-declarative-states)

**Ondersteunde option attributen:**
- `value`: De waarde van de optie
- `selected`: Markeert de optie als geselecteerd
- `disabled`: Schakelt de optie uit

## Validatie

Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Select](https://www.vlaanderen.be/vlaanderen-design-system/componenten/select)
