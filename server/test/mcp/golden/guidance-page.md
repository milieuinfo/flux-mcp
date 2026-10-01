# Formulier - Validatie

Flux 2.20.0 · [Storybook](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-validatie--documentatie)

> Een uitgebreid voorbeeld van validatie met de formulier componenten vind je op
[Formulier - Demo](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-demo--documentatie).

> Een voorbeeld om custom validatie te schrijven vind je op
[Formulier - Aangepaste Validatie](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie).

> Een voorbeeld van cross-validatie (validatie afhankelijk van de waarde van een ander veld) vind je op
[Formulier - Cross-Validatie](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-cross-validatie--documentatie).

De formulier componenten maken gebruik van open-wc's [form participation](https://github.com/open-wc/form-participation) om form validatie te bekomen met web
components die gebruik maken van native HTML form elements.

Deze library is gebaseerd op [native HTML form validatie](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation) en [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) en blijft zo dicht
mogelijk bij de native HTML form validatie.

Daarnaast voorzien we ook de [`parseFormData()` helper functie](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-form-data--documentatie#parseformdataformelement-form-multiformcontrolnames-string) om met de [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) om te gaan.

## ValidityState in Formuliervalidatie

Een essentieel onderdeel van de validatie is de [ValidityState interface](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState), onderdeel van de native Validation API.
Dit object geeft de huidige validatiestatus van een form control weer en kan worden gebruikt om een gedetailleerde
foutmelding te verkrijgen.

Die foutmeldingen worden getoond door de [`vl-form-message` component](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-form-message--documentatie) die de `ValidityState` van de form control
controleert.

## Attributen van ValidityState

Hieronder een overzicht van de gebruikte attributen van [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState#instance_properties) met hun betekenis en bijhorende
[validation attributen](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation#validation-related_attributes):

- `customError`: als je custom validatie instelt, [zie hier](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie) hoe je zelf een custom validator schrijft. Voor validatie afhankelijk van een ander veld, [zie cross-validatie](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/patronen-formulier-cross-validatie--documentatie).
- `patternMismatch`: als de waarde niet overeenkomt met het patroon dat is ingesteld door het `pattern` attribuut.
- `rangeOverflow`: als de waarde hoger is dan de waarde die is gespecifieerd door het `max` attribuut.
- `rangeUnderflow`: als de waarde lager is dan de waarde die is gespecifieerd door het `min` attribuut.
- `tooLong`: als de waarde langer is dan de maximale lengte die is gespecifieerd door het `maxlength` attribuut.
- `tooShort`: als de waarde korter is dan de minimale lengte die is gespecifieerd door het `minlength` attribuut.
- `valueMissing`: als er een waarde is vereist, maar het invoerveld leeg is. Gespecificeerd door het `required`
   attribuut.
- `valid`: als de waarde geldig is en geen van de bovenstaande fouten heeft.

## Gebruik van ValidityState in Onze Componenten

Om de validatiestatus van een form control te controleren, moet je:
- een `id` attribuut toevoegen aan de form control
- een constraint attribuut toevoegen aan de form control. Dit attribuut moet overeenkomen met de naam van de eigenschap
  van de `ValidityState` die je wil controleren, bv. `required`-attribuut voor `valueMissing` of `pattern`-attribuut
  voor `patternMismatch`.
- een `for` attribuut toevoegen aan de `vl-form-message` component. Dit attribuut moet overeenkomen met de `id` van de
  form control.
- het attribuut `state` instellen op de `vl-form-message` component. Dit attribuut moet overeenkomen met de naam van de
  eigenschap van de `ValidityState` die je wil controleren.

Vervolgens zal de `vl-form-message` component de foutmelding tonen die is ingesteld voor de `ValidityState` van de form
control wanneer gevalideerd wordt.
Standaard gebeurt dit wanneer de form gesubmit wordt door bv.:
- op de submit knop te klikken
- de enter toets in te drukken terwijl een form control focus heeft

Je kan ook de [`checkValidity` methode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/checkValidity) van de form control aanroepen om de validatiestatus van de form control te
controleren.

## Enkele voorbeelden van ValidityState:

### Ontbrekende waarde

Op het moment dat een veld verplicht is en geen waarde heeft, zal de `valueMissing` eigenschap van de `ValidityState`
van de form control `true` zijn. Een veld met een ontbrekende waarde zal een foutmelding tonen die is ingesteld met
de `vl-form-message` component waarvan de `for` eigenschap overeenkomt met de `id` van de form control. De form control
moet ook het `required` attribuut hebben.

In onderstaand voorbeeld: druk op `enter` zonder iets in te vullen om de foutmelding te zien.

**formulier - validatie verplicht** ([Storybook](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/story/patronen-formulier-validatie--formulier-validatie-verplicht))

```html
<form onsubmit="return false;">
    <vl-form-label for="voornaam" label="Voornaam *"></vl-form-label>
    <vl-input-field id="voornaam" name="voornaam" autocomplete="given-name" required></vl-input-field>
    <vl-form-message for="voornaam" state="valueMissing">Gelieve een voornaam in te vullen.</vl-form-message>
</form>
```

### Patroon komt niet overeen

Als een veld een patroon heeft (attribuut `pattern`) en de waarde van het veld komt niet overeen met het patroon,
zal de `patternMismatch` eigenschap van de `ValidityState` van de form control `true` zijn en wordt ook de foutmelding
getoond.

In onderstaand voorbeeld: vul een cijfer of speciaal teken in en druk op `enter` om de foutmelding te zien.

**formulier - validatie patroon** ([Storybook](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/story/patronen-formulier-validatie--formulier-validatie-patroon))

```html
<form onsubmit="return false;">
    <vl-form-label for="familienaam" label="Familienaam"></vl-form-label>
    <vl-input-field id="familienaam" name="familienaam" autocomplete="family-name" pattern="^[a-zA-Z]*$"></vl-input-field>
    <vl-form-message for="familienaam" state="patternMismatch">Gelieve geen nummers of speciale tekens in te vullen.</vl-form-message>
</form>
```

## Aanbevelingen voor Validatie

Vóór ingave, informeer de gebruiker over de validatiecriteria van een veld door een hint te tonen in de buurt van het
veld.

Na validatie, vermeld altijd duidelijk waarom een veld niet geldig is en geef de gebruiker een duidelijke hint over hoe
het probleem kan worden opgelost.

## Lijst componenten met onze ValidityState implementatie

- [vl-input-field](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-input-field--documentatie)
- [vl-input-field-masked](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-input-field-masked--documentatie)
- [vl-textarea](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-textarea--documentatie)
- [vl-textarea-rich](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-textarea-rich--documentatie)
- [vl-datepicker](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-datepicker--documentatie)
- [vl-select-rich](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-select-rich--documentatie)
- [vl-select](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-select--documentatie)
- [vl-radio-group](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-radio-group--documentatie)
- [vl-upload](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-upload--documentatie)
- [vl-checkbox](https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/?path=/docs/components-form-checkbox--documentatie)

Bronnen in de catalogus van flux-mcp 0.0.0-test: `2.20.0/storybook/pages/patronen-formulier-validatie.md` (storybook), `storybook-analysis/patronen-formulier-validatie/a475f7989cc5.json` (storybook-analysis).

Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.
