# Popover - Menu

Een popover-menu wordt gebruikt om extra acties weer te geven die niet direct zichtbaar zijn.

Het wordt meestal afgebeeld mbv een kebab menu icoon (drie verticale punten).

## Gebruik

Het popover-menu wordt gebruikt wanneer er beperkte ruimte is en niet alle acties direct weergeven kunnen worden.

## Ontwerp

- Icoon: Het menu wordt meestal afgebeeld mbv een kebab menu icoon (drie verticale punten).

- Plaatsing: Het menu kan worden geplaatst in de linkerbovenhoek, rechterbovenhoek of elders op de pagina, afhankelijk
  van het ontwerp en de context.

- Interactie: Door op het icoon te klikken, wordt het menu geopend en de extra acties weergegeven.
  Het menu kan gesloten worden door opnieuw op het icoon te klikken, of ergens buiten het menu.

## Voorbeeld

> Story: [popover - menu](/?path=/story/patronen-navigatie-popover-menu--popover-menu)

**Code**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { VlButtonComponent } from '@domg-wc/components/atom';
import { VlPopoverComponent } from '@domg-wc/components/block';
import { html, LitElement } from 'lit';

@webComponent('vl-popover-menu')
export class VlPopoverMenuComponent extends LitElement {
    static {
        registerWebComponents([VlPopoverComponent, VlButtonComponent]);
    }

    override render() {
        return html`
            <div>
                <vl-button
                    ghost
                    icon="nav-show-more-vertical"
                    id="btn-acties"
                    label="Acties"
                ></vl-button>
                <vl-popover
                    for="btn-acties"
                    placement="bottom-end"
                    trigger="focus click hover"
                    hide-on-click
                >
                    <vl-popover-action-list>
                        <vl-popover-action icon="search">Zoeken</vl-popover-action>
                        <vl-popover-action icon="edit">Aanpassen</vl-popover-action>
                        <vl-popover-action icon="bin">Verwijderen</vl-popover-action>
                    </vl-popover-action-list>
                </vl-popover>
            </div>
        `;
    }

    protected override createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-popover-menu': VlPopoverMenuComponent;
    }
}
```
