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
               #sub-title{
                   vertical-align: text-top;
               }
               :host .vl-functional-header__sub-row {
                   margin-bottom: 0;
               }
               
           "
   >
       <vl-tabs
           slot="sub-title"
           disable-links
           within-functional-header
           active-tab="trein"
           custom-css="
               :host(.vl-tabs--within-functional-header) .vl-tab__link {
                   padding-top: 0;
               }
           "
       >
           <vl-tabs-pane id="trein" title="Trein"></vl-tabs-pane>
           <vl-tabs-pane id="metro" title="Metro, tram en bus"></vl-tabs-pane>
           <vl-tabs-pane id="fiets" title="Fiets"></vl-tabs-pane>
       </vl-tabs>
   </vl-functional-header>
```
