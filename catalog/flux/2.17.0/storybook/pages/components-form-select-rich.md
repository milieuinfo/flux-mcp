# Select Rich

## Inhoudstafel

 - [Doel](#doel)
 - [Voorbeeld](#voorbeeld)
 - [Configuratie](#configuratie)
 - [Publieke methodes](#publieke-methodes)
 - [Styles](#styles)
 - [Events](#events)
 - [Select opties](#select-opties)
 - [Accessibility](#accessibility)
 - [Varianten](#varianten)
 - [Zoek strategieën](#zoek-strategieën)
 - [Validatie](#validatie)
 - [Referenties](#referenties)

## Doel

Gebruik de `select-rich` component om een uitgebreid select of multiselect veld toe te voegen aan een pagina.

Zie het [form demo](/?path=/docs/patronen-formulier-demo--documentatie) voorbeeld voor het gebruik binnen een form.

## Voorbeeld

```js
import { VlSelectRichComponent } from '@domg-wc/components/form';
```

```html
<vl-select-rich></vl-select-rich>
```

> Story: [vl-select-rich - default](/?path=/story/components-form-select-rich--select-rich-default)

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

> API: vl-select-rich

## Publieke methodes

### resetFormControl()

Reset de form control.

De value van de control wordt teruggezet op de initiële value. Deze methode wordt ook aangeroepen als de form zelf
gereset wordt.

> Opgelet: het is belangrijk de initiële waarde in te stellen op de form control vóór de form control gerenderd wordt.
Anders wordt een lege value ingesteld als initiële waarde.

### getSelected(): string | string[]

Geeft de geselecteerde values terug.

Bij de single select geeft deze methode een string terug, bij de multi select een array van strings.

### selectByValue(value: string | string[]): void

Vinkt 1 of meerdere opties aan op basis van de value.

### removeSelectionByValue(value: string | string[]): void

Vinkt 1 of meerdere opties uit op basis van de value.

### removeAllSelections(): void

Vinkt alle opties uit.

## Styles

De styles van DV zijn lokaal gezet en aangepast omdat deze niet CSP compliant waren.

Er werd gebruik gemaakt van een `data:` attribuut om een SVG op te halen van w3.org.
Hierdoor breekt de CSP compliance tenzij je alle `data:` attributen whitelist, wat niet de bedoeling is.

## Events

### Change event

Bij het selecteren of verwijderen van een optie (zowel programmatorisch als door de gebruiker) wordt het `vl-change`
event afgevuurd, het detail object van dit event bevat de value van de geselecteerde opties.

Gelijkaardig aan de `getSelected()` methode, bevat de value bij de single select 1 string en bij de
multi select een array van strings.

### Input event

Wanneer de gebruiker een optie verwijdert of selecteert, wordt het `vl-input` event afgevuurd, het detail object van
dit event bevat de value van de geselecteerde opties.

Gelijkaardig aan de `getSelected()` methode, bevat de value bij de single select 1 string en bij de multi select
een array van strings.

### Search Event

Wanneer de gebruiker een zoekopdracht uitvoert, wordt het `vl-search` event afgevuurd,
het detail object van dit event bevat de zoekterm die de gebruiker heeft ingegeven.

## Select opties

De `select-rich` component kan 1 of meerdere waardes bevatten. Die waardes worden weergegeven als opties in de select
component.
Om die opties te beheren, zijn er verschillende mogelijkheden:

### met methods

De `select-rich` component heeft een aantal methodes die je kan gebruiken om de opties te beheren:

- `selectByValue(value: string | string[])`: vinkt 1 of meerdere optie(s) aan
- `removeSelectionByValue(value: string | string[])`: vinkt 1 of meerdere optie(s) uit
- `removeAllSelections()`: vinkt alle opties uit

### `options` property

De `options` property bevat een array van objecten die de opties van de select component bevatten.

```code
<vl-select-rich
    .options=${[
               { label: 'Hasselt', value: 'hasselt' },
               { label: 'Turnhout', value: 'turnhout' }
           ]}
></vl-select-rich>
```

Als de referentie van deze array verandert, wordt de Lit lifecycle getriggerd en wordt de select opnieuw
opgebouwd op basis van de nieuwe opties.

Hierdoor is het noodzakelijk om de opties door te geven aan de select component met behulp van een variabele,
en de opties niet direct in de template te zetten.

Indien je de opties direct in de template zet, zal bij elke render de select opnieuw opgebouwd worden en de
gekozen opties verwijderd worden.

Dit betekent ook dat als je programmatorisch een optie wil veranderen, toevoegen of verwijderen,
je de referentie van de array moet aanpassen.

Dit kan je doen door de opties de spreaden in een nieuwe array (`[...options]`).

### `initial-options` property

De `initial-options` property is een array van objecten die de opties van de select component bevatten.

Deze zijn de standaard opties die worden getoond bij het laden van de pagina.

Als de form reset, worden deze opties getoond in de select component.

Indien je de `opties` direct in de template zet bij het laden van de `vl-select-rich`, worden deze intern ingesteld als
de `initial-options` property.

## Accessibility

Door de complexiteit van dit component is het niet mogelijk om het WCAG-compliant aan te bieden.

We raden aan waar mogelijk gebruik te maken van de [vl-select](/?path=/docs/components-form-select--documentatie).

Indien er minder dan 7 opties zijn raden we aan checkboxes of radio buttons te gebruiken.

## Varianten

### Zoekfunctie

De zoekfunctie is standaard geactiveerd voor de multiselect.

> Story: [vl-select-rich - default](/?path=/story/components-form-select-rich--select-rich-default)

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

### Niet verwijderbaar

> Story: [vl-select-rich - not-deletable](/?path=/story/components-form-select-rich--select-rich-not-deletable)

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

> Story: [vl-select-rich - groups](/?path=/story/components-form-select-rich--select-rich-groups)

**options**

```ts
    [
         {
            label: 'België',
            value: '',
            choices: [
                { label: 'Hasselt', value: 'hasselt' },
                { label: 'Turnhout', value: 'turnhout' },
                { label: 'Knokke-Heist', value: 'knokke-heist' },
                { label: 'Waregem', value: 'waregem' },
                { label: 'Lier', value: 'lier' },
            ],
        },
        {
            label: 'Puerto Rico',
            value: '',
            choices: [{ label: 'Rio Piedras', value: 'rio piedras' }],
        }
]
```

### Multiselect

De zoekfunctie is standaard geactiveerd voor de multiselect.

> Story: [vl-select-rich - multiple](/?path=/story/components-form-select-rich--select-rich-multiple)

**options**

```ts
    [
        { label: 'Padel', value: 'padel' },
        { label: 'Dans', value: 'dans' },
        { label: 'Drummen', value: 'drummen' },
        { label: 'Zwemmen', value: 'zwemmen' },
        { label: 'Boardgames', value: 'boardgames' },
        { label: 'Fietsen', value: 'fietsen' }
]
```

### Geselecteerde optie

Als je een optie programmatorisch wil selecteren moet je voor deze optie de 'selected' boolean op true zetten.

> Story: [vl-select-rich - selected option](/?path=/story/components-form-select-rich--select-rich-selected-option)

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

> Story: [vl-select-rich - disabled option](/?path=/story/components-form-select-rich--select-rich-disabled-option)

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

> Story: [vl-select-rich - read only](/?path=/story/components-form-select-rich--select-rich-read-only)

**options**

```ts
    [
        { label: 'Hasselt', value: 'hasselt', disabled: true, selected: true },
        { label: 'Turnhout', value: 'turnhout', disabled: true },
        { label: 'Knokke-Heist', value: 'knokke-heist', disabled: true },
        { label: 'Waregem', value: 'waregem', disabled: true },
        { label: 'Lier', value: 'lier', disabled: true },
        { label: 'Rio Piedras', value: 'rio piedras', disabled: true }
]
```

## Zoek strategieën

Het `search-strategy` attribuut (reactief) bepaalt hoe de zoekfunctie werkt bij het filteren van opties.

Er zijn drie zoek strategieën beschikbaar: `default`, `exact-and` en `exact-or`.

### default

De standaard zoek strategie gebruikt de native Choices.js fuzzy matching van [Fuse.js](https://www.fusejs.io/).

Dit betekent dat de zoekterm niet exact hoeft voor te komen in de optie.

### exact-and

Bij de `exact-and` strategie moeten **alle** zoekwoorden exact voorkomen in het label of value van een optie
(substring match). Bij invoer van meerdere woorden, worden alleen de opties getoond die alle woorden bevatten
(AND-logica).

**Voorbeeld:** Als je zoekt op "standaard gent", wordt alleen "De Standaard van Gent" getoond, omdat dit de enige optie
is die zowel "standaard" als "gent" bevat.

Deze strategie is geschikt wanneer je precies wil kunnen filteren op meerdere criteria tegelijk.

### exact-or

Bij de `exact-or` strategie moet **minstens één** zoekwoord exact voorkomen in het label of value van een optie
(substring match). Wanneer je meerdere woorden invoert, worden alle opties getoond die één of meer woorden bevatten
(OR-logica).

**Voorbeeld:** Als je zoekt op "standaard gent", worden alle opties getoond die "standaard" **of** "gent" bevatten,
zoals "De Standaard van gisteren", "De Standaard van morgen", "De Standaard van Berchem", "De Standaard van Gent"
en "Brussel Antwerpen Gent".

Deze strategie is geschikt wanneer je breed wil kunnen zoeken op meerdere termen tegelijk.

## Validatie

Meer info over validatie binnen onze form componenten vind je hier:
[Form - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie)

## Referenties

### Choices.js

[Documentatie Choices.js](https://github.com/Choices-js/Choices)

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Select](https://www.vlaanderen.be/vlaanderen-design-system/componenten/select)

[Documentatie Digitaal Vlaanderen - Multiselect](https://www.vlaanderen.be/vlaanderen-design-system/componenten/multiselect)
