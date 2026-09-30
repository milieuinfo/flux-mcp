# Functional Header - Voorbeeld Met Action Buttons

In dit voorbeeld tonen we hoe je acties kan definiëren als buttons in plaats van de standaard action links.

## Componenten

- [vl-functional-header](/?path=/docs/components-block-functional-header--documentatie)
- [vl-button](/?path=/docs/components-atom-button--documentatie)

## Demo

> Story: [vl-functional-header - met action buttons](/?path=/story/ontwerp-functional-header-voorbeeld-met-action-buttons--functional-header-with-action-buttons)

**Code**

```ts
<vl-functional-header
       title="School- en studietoelagen"
   >
       <div class="vl-group vl-margin--small vl-margin--no-bottom" slot="top-right">
           <vl-button
               tertiary
               icon="add"
               label="Aanmaken"
               onclick="javascript:console.log('actie: Aanmaken')"
               >Aanmaken</vl-button
           >
           <vl-button
               tertiary
               icon="edit"
               label="edit"
               onclick="javascript:console.log('actie: edit')"
           ></vl-button>
           <vl-button
               tertiary
               error
               icon="bin"
               label="delete"
               onclick="javascript:console.log('actie: delete')"
           ></vl-button>
       </div>
   </vl-functional-header>
```
