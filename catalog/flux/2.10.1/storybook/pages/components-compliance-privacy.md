# Privacy

## Doel

Privacy pagina.

## Voorbeeld

```js
import { VlPrivacy } from '@domg-wc/components/compliance';
```

```html
<vl-privacy></vl-privacy>
```

> Story: [vl-privacy - default](/?path=/story/components-compliance-privacy--privacy-default)

## Configuratie

> API: vl-privacy

## Header Slot

Standaard wordt deze template gebruikt om de `functional-header` te bepalen in dit component.

```ts
import { html } from 'lit';
import { VlFunctionalHeaderComponent } from '../../../block/functional-header';

export const privacyHeaderElements = () => [VlFunctionalHeaderComponent];

export const header = ({ disableBackLink, hideBackLink }: { disableBackLink: boolean; hideBackLink: boolean }) => html`
    <vl-functional-header
        title="Departement Omgeving"
        sub-title="Privacy"
        link="https://omgeving.vlaanderen.be"
        ?disable-back-link=${disableBackLink}
        ?hide-back-link=${hideBackLink}
        skip-to-content-id="#main-content"
    ></vl-functional-header>
`;
```

Als je wijzigingen wil aanbrengen in de functional header, kan je de standaard `vl-functional-header` vervangen door
een ander, eventueel aangepaste header element.

Je kan dit bijvoorbeeld vervangen door:
- een [vl-content-header](/?path=/docs/components-block-content-header--content-header-default)
- of een [vl-functional-header](/?path=/docs/components-block-functional-header--functional-header-default) met andere opties dan de standaard `functional-header` van dit component.

In het voorbeeld hieronder kan je zien hoe je voor de `vl-functional-header` bij de teruglink (`back`) "Start"
als label kan geven in plaats van "Terug".

> Story: [vl-privacy - header slot](/?path=/story/components-compliance-privacy--privacy-header-slot)

## Referenties

### Legacy Documentatie

[Legacy Storybook - Privacy](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-privacy--default)

[Legacy Documentatie - Privacy](https://webcomponenten.omgeving.vlaanderen.be/doc/VlPrivacy.html)

[Legacy Demo - Privacy](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-privacy.html)
