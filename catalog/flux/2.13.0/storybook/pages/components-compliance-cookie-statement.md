# Cookie Statement

## Doel

Cookieverklaring pagina.

## Voorbeeld

```js
import { VlCookieStatement } from '@domg-wc/components/compliance';
```

```html
<vl-cookie-statement></vl-cookie-statement>
```

> Story: [vl-cookie-statement - default](/?path=/story/components-compliance-cookie-statement--cookie-statement-default)

## Configuratie

> API: vl-authentication-cookie, vl-cookie, vl-cookie-statement, vl-header-authentication-cookie, vl-header-cookie, vl-jsessionid-cookie, vl-sticky-session-cookie

## Header Slot

Standaard wordt deze template gebruikt om de `functional-header` te bepalen in dit component.

```ts
import { html } from 'lit';
import { VlFunctionalHeaderComponent } from '../../../block/functional-header';

export const cookieStatementHeaderElements = () => [VlFunctionalHeaderComponent];

export const header = () => html`
    <vl-functional-header
        title="Departement Omgeving"
        sub-title="Cookieverklaring"
        link="https://omgeving.vlaanderen.be"
        skip-to-content-id="main-content"
    ></vl-functional-header>
`;
```

Als je wijzigingen wil aanbrengen in de functional header, kan je de standaard `vl-functional-header` vervangen door een
ander, eventueel aangepaste header element.

Je kan dit bijvoorbeeld vervangen door:
- een [vl-content-header](/?path=/docs/components-block-content-header--content-header-default)
- of een [vl-functional-header](/?path=/docs/components-block-functional-header--functional-header-default) met andere opties dan de standaard `functional-header` van dit component.

In het voorbeeld hieronder kan je zien hoe je voor de `vl-functional-header` bij de teruglink (`back`) "Start"
als label kan geven in plaats van "Terug".

> Story: [vl-cookie-statement - header slot](/?path=/story/components-compliance-cookie-statement--cookie-statement-header-slot)

## Referenties

### Legacy Documentatie

[Legacy Storybook - Cookie Statement](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/legacy-vl-cookie-statement--default)

[Legacy Documentatie - Cookie Statement](https://webcomponenten.omgeving.vlaanderen.be/doc/VlCookieStatement.html)

[Legacy Demo - Cookie Statement](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-cookie-statement.html)
