# Popover - Menu Info Tile

De info tile wordt gebruikt om inhoud te organiseren in een uitklapbaar formaat.

Elke info tile kan een popover-menu bevatten dat specifieke acties aanbiedt.

## Gebruik

De info tile met popover-menu wordt gebruikt om inhoud te structureren en gebruikers de mogelijkheid te geven om specifieke acties uit te voeren.

## Ontwerp

-   Info tile: elke info tile bestaat uit een titel, subtitel en een inhoudsgebied dat optioneel kan worden uit- of ingeklapt.

-   Popover-menu: elke info tile kan een popover-menu bevatten dat specifieke acties aanbiedt.
    Het menu wordt meestal afgebeeld mbv een kebab menu icoon (drie verticale punten).

-   Interactie: gebruikers kunnen op de titel klikken om de info tile uit- of in te klappen, indien deze het attribuut `toggleable` heeft.
    Door op het popover-menu icoon te klikken wordt het menu geopend en de extra acties weergegeven.

## Voorbeeld

> Story: [Menu Info Tile](/?path=/story/ontwerp-popover-menu-info-tile--menu-info-tile)

**Code**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { VlButtonComponent } from '@domg-wc/components/atom';
import { VlInfoTile, VlPopoverComponent } from '@domg-wc/components/block';
import { vlLegacyStyles } from '@domg-wc/styles';
import { css, CSSResult, html, LitElement } from 'lit';

@webComponent('vl-popover-menu-info-tile')
export class VlPopoverMenuInfoTileComponent extends LitElement {
    static {
        registerWebComponents([VlInfoTile, VlPopoverComponent, VlButtonComponent]);
    }

    static override get styles(): (CSSResult | CSSResult[])[] {
        return [vlLegacyStyles, css``];
    }

    override render() {
        return html`
            <vl-info-tile toggleable>
                <span slot="title">Broos Deprez</span>
                <span slot="subtitle">Uw zoon (19.05.2005)</span>
                <div slot="content">De studietoelage voor Broos Deprez werd toegekend.</div>
                <span slot="menu">
                    <vl-button ghost icon="nav-show-more-vertical" id="btn-acties" label="Acties"></vl-button>
                    <vl-popover for="btn-acties" placement="bottom-end">
                        <vl-popover-action-list>
                            <vl-popover-action icon="search">Zoeken</vl-popover-action>
                            <vl-popover-action icon="edit">Aanpassen</vl-popover-action>
                            <vl-popover-action icon="bin">Verwijderen</vl-popover-action>
                        </vl-popover-action-list>
                    </vl-popover>
                </span>
            </vl-info-tile>
        `;
    }

    protected override createRenderRoot(): HTMLElement | DocumentFragment {
        return this;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-popover-menu-info-tile': VlPopoverMenuInfoTileComponent;
    }
}
```
