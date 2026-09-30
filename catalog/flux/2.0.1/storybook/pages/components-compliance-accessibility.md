# Accessibility

Toegankelijkheidsverklaring pagina.

## Voorbeeld

```js
import { VlAccessibility } from '@domg-wc/components/compliance';
```

```html
<vl-accessibility></vl-accessibility>
```

> Story: [vl-accessibility - default](/?path=/story/components-compliance-accessibility--accessibility-default)

## Configuratie

> API: vl-accessibility

## Header Slot

Standaard wordt deze template gebruikt om de `functional-header` te bepalen in deze component.

```ts
import { html } from 'lit';
import type { AccessibilityProperties } from '../vl-accessibility.model';
import { VlFunctionalHeaderComponent } from '../../../block/functional-header';

export type HeaderProps = Pick<AccessibilityProperties, 'disableBackLink' | 'hideBackLink'>;

export const headerElements = () => [VlFunctionalHeaderComponent];

export const header = ({ disableBackLink, hideBackLink }: HeaderProps) => html`
    <vl-functional-header
        title="Departement Omgeving"
        sub-title="Toegankelijkheid en gebruiksvoorwaarden"
        link="https://omgeving.vlaanderen.be"
        ?disable-back-link=${disableBackLink}
        ?hide-back-link=${hideBackLink}
    ></vl-functional-header>
`;
```

Als je wijzigingen wil aanbrengen in de functional header, kan je de standaard `vl-functional-header` vervangen door een
ander, eventueel aangepaste header element.

Je kan dit bijvoorbeeld vervangen door:
- een [vl-content-header](/?path=/docs/components-block-content-header--content-header-default)
- of een [vl-functional-header](/?path=/docs/components-block-functional-header--functional-header-default) met andere opties dan de
  standaard `functional-header` van dit component.

In het voorbeeld hieronder kan je zien hoe je voor de `vl-functional-header` bij de teruglink (`back`) "Start"
als label kan geven in plaats van "Terug".

> Story: [vl-accessibility - header slot](/?path=/story/components-compliance-accessibility--accessibility-header-slot)

## Referenties

### Legacy Documentatie

[Legacy Storybook - Accessibility](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-accessibility--default)

[Legacy Documentatie - Accessibility](https://webcomponenten.omgeving.vlaanderen.be/doc/VlAccessibility.html)

[Legacy Demo - Accessibility](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-accessibility.html)
