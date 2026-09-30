# Input Group

## Doel

De `Input Group` combineert een `Input Field` met een `Button`. Deze combinatie kan eender waar
gebruikt worden, het moet niet persé in een formulier! `Input Group` is geen aparte component:
[Group](/?path=/docs/styles-layout-group--documentatie), [Button](/?path=/docs/components-atom-button--documentatie)
en [Input Field](/?path=/docs/components-form-input-field--documentatie) kunnen in de juiste toestand gebracht worden om
deze functionaliteit te ondersteunen.

## Gebruik

Om de componenten in de juiste stijl te zetten dien je het volgende te doen:

- een overkoepelende `div` voorzien met classes `vl-group` en `vl-group--input-group` (conform de BEM conventie)
- een 'button' kind `vl-button` met attribuut `input-group`
- een 'input field' kind `vl-input-field` met attribuut `input-group`

```html
<div class="vl-group vl-group--input-group">
    <vl-button input-group>Locatie kiezen</vl-button>
    <vl-input-field input-group></vl-input-field>
</div>
```

Naar keuze kan de knop links of rechts gezet worden, afhankelijk van de volgorde wordt automatisch de juiste style
toegepast. De stijl van de knop kan naar keuze aangepast worden (conform de button mogelijkheden), bvb. bij een icoon
kan er voor de `tertiary` stijl gekozen worden.

## Voorbeelden

### input-group - button left

> Story: [input-group - button left](/?path=/story/components-form-input-group--input-group-button-left)

### input-group - button right

Om de volledige breedte te benutten krijgt het input-field hier het `block` attribuut.

> Story: [input-group - button right](/?path=/story/components-form-input-group--input-group-button-right)

### input-group - icon left

Om de volledige breedte te benutten krijgt het input-field hier het `block` attribuut.

> Story: [input-group - icon left](/?path=/story/components-form-input-group--input-group-icon-left)

### input-group - icon right (tertiary style)

> Story: [input-group - icon right](/?path=/story/components-form-input-group--input-group-icon-right)
