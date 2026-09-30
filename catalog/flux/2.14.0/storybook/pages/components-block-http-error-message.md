# HTTP Error Message

## Doel

Gebruik de `http-error-message` component om een error boodschap aan de gebruiker te tonen.

## Voorbeeld

```js
import { VlHttpErrorMessage } from '@domg-wc/components/block';
```

```html
<vl-http-error-message></vl-http-error-message>
```

> Story: [vl-http-error-message - default](/?path=/story/components-block-http-error-message--http-error-message-default)

## Configuratie

> API: vl-http-error-message

## Varianten

Het gebruik van `vl-http-400-message` en andere specifieke http error messages is deprecated.
Deze kunnen met de `http-error-message` gecreëerd worden d.m.v. het `error-code` attribuut.

### 400 error

> Story: [vl-http-error-message - 400](/?path=/story/components-block-http-error-message--http-error-message-400)
