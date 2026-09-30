# Formulier - Blur-validatie

> Voor de basis van formuliervalidatie, zie
> [Formulier - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie).

Standaard valideren de formulier componenten pas wanneer de form gesubmit wordt. Met het optionele
`blur-validation` attribuut kan je validatie al tijdens het invullen tonen, zonder dat je hier zelf
code voor moet schrijven.

## Gedrag

Wanneer `blur-validation` aanstaat:

- Het veld valideert zodra het focus kreeg en weer verlaten wordt (`focusout`), ongeacht of de gebruiker de
  waarde gewijzigd heeft.
- Na de eerste foutmelding verdwijnt die weer zodra de waarde geldig wordt, terwijl de gebruiker nog aan het
  typen is. Er hoeft niet opnieuw weggeklikt te worden.
- Submit blijft de definitieve check: bij submit wordt nog steeds alles gevalideerd en springt de focus naar het
  eerste ongeldige veld.

De foutmeldingen lopen via hetzelfde mechanisme als de standaard validatie
([`vl-form-message`](/?path=/docs/components-form-form-message--documentatie) + `ValidityState`).

## Per veld

Zet `blur-validation` op een individuele form control.

In onderstaand voorbeeld: tab in het veld en terug eruit zonder te typen om de `valueMissing` fout te zien, of typ
een ongeldige waarde (bv. een cijfer of één letter) en verlaat het veld. Corrigeer daarna en zie de fout live
verdwijnen.

> Story: [formulier - blur-validatie per veld](/?path=/story/patronen-formulier-blur-validatie--formulier-blur-validatie-per-veld)

## Op de form (cascade)

Zet `blur-validation` (of `data-blur-validation`) op het `<form>` element om het gedrag in één keer in te schakelen
voor **alle** form controls eronder. De velden zelf hebben dan geen attribuut nodig.

> Story: [formulier - blur-validatie op de form](/?path=/story/patronen-formulier-blur-validatie--formulier-blur-validatie-form)

Een veld met een eigen `blur-validation` attribuut blijft daarnaast los werken. Staat het attribuut op de form,
dan kan een veld daar niet individueel van afwijken.

## Toegankelijkheid

`blur-validation` is bewust opt-in. Validatie pas op `focusout` (en niet op elke toetsaanslag) beperkt
ruis voor screenreaders tijdens het invullen.

De foutmelding staat in een `aria-live="polite"` regio met `role="status"` (via `vl-form-message`), zodat
screenreaders ze voorlezen zodra ze verschijnt of wijzigt. `aria-atomic="true"` zorgt dat telkens de
volledige boodschap wordt voorgelezen. De control krijgt `aria-invalid="true"` zodat de ongeldige toestand
ook los van de melding kenbaar is. Eén uitzondering: bij `vl-upload` haalt dat attribuut de accessibility
tree niet, zie [Gekende Beperkingen](/?path=/docs/richtlijnen-toegankelijkheid-praktijk-gekende-beperkingen-wip--documentatie).

Blur-validatie verplaatst de focus niet: het veld toont enkel zijn melding. Alleen bij submit springt de
focus naar het eerste ongeldige veld.

## Ondersteunde componenten

Het attribuut werkt op alle form controls:

- [vl-input-field](/?path=/docs/components-form-input-field--documentatie)
- [vl-input-field-masked](/?path=/docs/components-form-input-field-masked--documentatie)
- [vl-textarea](/?path=/docs/components-form-textarea--documentatie)
- [vl-textarea-rich](/?path=/docs/components-form-textarea-rich--documentatie)
- [vl-datepicker](/?path=/docs/components-form-datepicker--documentatie)
- [vl-select-rich](/?path=/docs/components-form-select-rich--documentatie)
- [vl-select](/?path=/docs/components-form-select--documentatie)
- [vl-radio-group](/?path=/docs/components-form-radio-group--documentatie)
- [vl-upload](/?path=/docs/components-form-upload--documentatie)
- [vl-checkbox](/?path=/docs/components-form-checkbox--documentatie)
