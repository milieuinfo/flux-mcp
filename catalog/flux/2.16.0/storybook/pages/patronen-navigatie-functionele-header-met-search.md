# Functionele Header - met Search

In dit voorbeeld tonen we hoe een zoekformulier kan toegevoegd worden aan de
[vl-functional-header](/?path=/docs/components-block-functional-header--documentatie).

We bouwen het zoekformulier met de [Input Group](/?path=/docs/components-form-input-group--documentatie)
(een [vl-input-field](/?path=/docs/components-form-input-field--documentatie) en een
[vl-button](/?path=/docs/components-atom-button--documentatie) in een `<form role="search">`), gecombineerd met de
[vl-group](/?path=/docs/styles-layout-group--documentatie) stijl om het zoekveld rechts uit te lijnen naast een
breadcrumb of andere variant. Zie ook het [zoek-patroon](/?path=/docs/patronen-zoeken-loading-state--documentatie)
voor een uitwerking met loading state.

In dit geval wordt custom CSS meegegeven om deze layout mogelijk te maken.

## Componenten

- [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie)
- [vl-input-field](/?path=/docs/components-form-input-field--documentatie)
- [vl-button](/?path=/docs/components-atom-button--documentatie)

## Stijlen

- [vl-group](/?path=/docs/styles-layout-group--documentatie)

## Demo

> Story: [functionele header - met search](/?path=/story/patronen-navigatie-functionele-header-met-search--functionele-header-met-search)

**Code**

```ts
<vl-functional-header
    title="School- en studietoelagen"
    hide-back-link
    custom-css=".vl-functional-header__sub-actions, .vl-functional-header__sub__action { width: 100% } ::slotted(.vl-group) { width: 100% } "
>
    <div class="vl-group vl-group--space-between" slot="sub-title">
        <vl-breadcrumb slot="sub-title">
            <vl-breadcrumb-item href="#1">Vlaanderen Intern</vl-breadcrumb-item>
            <vl-breadcrumb-item href="#2">Regelgeving</vl-breadcrumb-item>
            <vl-breadcrumb-item href="#3">Webuniversum</vl-breadcrumb-item>
            <vl-breadcrumb-item>Componenten</vl-breadcrumb-item>
        </vl-breadcrumb>
        <form role="search" aria-label="Zoeken op deze site">
        <div class="vl-group vl-group--input-group">
            <vl-input-field input-group block type="search" name="zoekterm" label="Zoekterm"></vl-input-field>
            <vl-button input-group icon="search" type="submit" label="Zoeken" tertiary></vl-button>
        </div>
    </form>
    </div>
</vl-functional-header>
```
