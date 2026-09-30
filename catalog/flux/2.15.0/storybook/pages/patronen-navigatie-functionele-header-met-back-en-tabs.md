# Functionele Header - met Back en Tabs

In dit voorbeeld tonen we hoe een [vl-tabs](/?path=/docs/components-block-tabs-tabs--documentatie) component kan toegevoegd worden aan de [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie) in combinatie met de back button.

In dit geval wordt custom CSS meegegeven om deze layout mogelijk te maken.

## Componenten

- [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie)
- [vl-tabs](/?path=/docs/components-block-tabs-tabs--documentatie)

## Demo

> Story: [functionele header - met back en tabs](/?path=/story/patronen-navigatie-functionele-header-met-back-en-tabs--functionele-header-met-back-en-tabs)

**Code**

```ts
<vl-functional-header
       title="School- en studietoelagen"
       custom-css="
               :host .vl-functional-header__sub-row {
                   margin-bottom: 0;
               }
               :host .vl-functional-header__sub__action + .vl-functional-header__sub__action::before {
                   margin: 1rem;
               }
               
           "
   >
       <vl-tabs-next
           slot="sub-title"
           label="Onderwerpen"
           horizontal-navigation
           no-border
       >
           <vl-tab-link-next id="tab1" href="#trein">Trein</vl-tab-link-next>
           <vl-tab-link-next id="tab2" href="#ov">Metro, tram en bus</vl-tab-link-next>
           <vl-tab-link-next id="tab3" href="#fiets">Fiets</vl-tab-link-next>
       </vl-tabs-next>
   </vl-functional-header>
```
