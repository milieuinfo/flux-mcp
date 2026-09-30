# Functional Header - Voorbeeld Met Button

In dit voorbeeld tonen we hoe een [vl-button](/?path=/docs/components-atom-button--documentatie) component kan toegevoegd worden aan de [vl-functional-header](/?path=/docs/components-atom-functional-header--documentatie).

We gebruiken een [vl-button](/?path=/docs/components-atom-button--documentatie) component gecombineerd met de [vl-group](/?path=/docs/styles-layout-group--documentatie) stijl om een actie knop rechts uit te lijnen naast een breadcrumb of andere variant.

In dit geval wordt custom CSS meegegeven om deze layout mogelijk te maken.

## Componenten

- [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie)
- [vl-button](/?path=/docs/components-atom-button--documentatie)

## Stijlen

- [vl-group](/?path=/docs/styles-layout-group--documentatie)

## Demo

> Story: [vl-functional-header - met button](/?path=/story/ontwerp-functional-header-voorbeeld-met-button--functional-header-with-button)

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
        <vl-button>Actie knop</vl-button>
    </div>
</vl-functional-header>
```
