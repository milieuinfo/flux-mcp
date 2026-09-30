# Text

## Doel

Gebruik de `text` component om een tekst af te beelden op andere wijze.

`vl-text` is puur stilistisch en heeft geen koppeling met form-controls of validatie. Wil je een boodschap tonen die
hoort bij een form-control (bv. een fout-, success- of toelichtingsboodschap), gebruik dan
[`vl-form-message`](/?path=/docs/components-form-form-message--documentatie): die werkt samen met de validatie-lifecycle en
zorgt voor de juiste `aria`-koppeling.

## Voorbeeld

```js
import { VlTextComponent } from '@domg-wc/components/atom';
```

```html
<vl-text></vl-text>
```

> Story: [vl-text - default](/?path=/story/components-atom-text--text-default)

## Configuratie

> API: vl-text

## Varianten

### Bold

> Story: [vl-text - bold](/?path=/story/components-atom-text--text-bold)

### Italic

> Story: [vl-text - italic](/?path=/story/components-atom-text--text-italic)

### Underline

> Story: [vl-text - underline](/?path=/story/components-atom-text--text-underline)

### Success

> Story: [vl-text - success](/?path=/story/components-atom-text--text-success)

> Hoort de boodschap bij een form-control? Gebruik dan
> [`vl-form-message`](/?path=/docs/components-form-form-message--documentatie) met `variant="success"` (of `state="valid"` voor
> een automatische success-boodschap). `vl-text` is enkel voor stijl, niet voor forms.

### Warning

> Story: [vl-text - warning](/?path=/story/components-atom-text--text-warning)

### Error

> Story: [vl-text - error](/?path=/story/components-atom-text--text-error)

> Hoort de boodschap bij een form-control? Gebruik dan
> [`vl-form-message`](/?path=/docs/components-form-form-message--documentatie) (default `variant="error"`). `vl-text` is enkel
> voor stijl, niet voor forms.

### Annotation

> Story: [vl-text - annotation](/?path=/story/components-atom-text--text-annotation)

> Hoort de boodschap bij een form-control? Gebruik dan
> [`vl-form-message`](/?path=/docs/components-form-form-message--documentatie) met `variant="annotation"`. `vl-text` is enkel
> voor stijl, niet voor forms.

### Small

> Story: [vl-text - small](/?path=/story/components-atom-text--text-small)
