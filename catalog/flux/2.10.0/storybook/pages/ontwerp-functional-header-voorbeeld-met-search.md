# Functional Header - Voorbeeld Met Search

In dit voorbeeld tonen we hoe een [vl-search](/?path=/docs/components-block-search--documentatie) component kan toegevoegd worden aan de [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie).

We gebruiken een [vl-search](/?path=/docs/components-block-search--documentatie) component gecombineerd met de [vl-group](/?path=/docs/styles-layout-group--documentatie) stijl om een zoekveld rechts uit te lijnen naast een breadcrumb of andere variant.

In dit geval wordt custom CSS meegegeven om deze layout mogelijk te maken.

## Componenten

- [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie)
- [vl-search](/?path=/docs/components-block-search--documentatie)

## Stijlen

- [vl-group](/?path=/docs/styles-layout-group--documentatie)

## Demo

> Story: [vl-functional-header - met search](/?path=/story/ontwerp-functional-header-voorbeeld-met-search--functional-header-with-search)

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
        <vl-search id="search-inline" inline></vl-search>
    </div>
</vl-functional-header>
```
