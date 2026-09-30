# Button Style

## Doel

De `button` CSS voorziet specifieke styling voor buttons. Het doel is deze implementatie te embedden in de css van concrete
componenten. Het is een bouwblok, niet bedoeld voor rechtstreeks gebruik! In een eindtoepassing een button toevoegen
gebeurt m.b.v. de [vl-button](/?path=/docs/components-atom-button--documentatie) component.

Componenten zelf kunnen ook buttons bevatten en gebruiken deze CSS-klasse om geneste shadow-dom's te vermijden.

## Voorbeelden

In dit voorbeeld zie je verschillende buttons, ze worden hier specifiek ge-wrapped in een custom style-class.

> Story: [button-style - button element](/?path=/story/components-atom-button-style--button-style-default)

**Code**

```ts
import { BaseLitElement, webComponent } from '@domg-wc/common';
import { CSSResult, html, TemplateResult } from 'lit';
import { vlButtonStyles } from '../button-style/vl-button-style.css';

@webComponent('my-component-with-button')
export class MyComponentWithButton extends BaseLitElement {
    static get styles(): CSSResult[] {
        return [vlButtonStyles('button', '.my-button')];
    }

    render(): TemplateResult {
        return html`
            <button class="my-button">My styled button</button>
        `
    }
}
```
