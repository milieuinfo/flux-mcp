# Steps

## Doel

Gebruik de `steps` component om een verticale lijst van stappen af te beelden om de gebruiker door een procedure te
begeleiden.

Deze component is de nieuwe versie van de [vl-steps](/?path=/docs/components-block-steps--documentatie) component, we raden aan deze versie te gebruiken.

## Voorbeeld

```js
import { VlStepsComponent } from '@domg-wc/components/block';
```

```html
<vl-steps></vl-steps>
```

> Story: [vl-steps - default](/?path=/story/components-block-steps-steps--steps-default)

## Configuratie

> API: vl-duration-step, vl-steps

## Varianten

### Iconen

> Story: [vl-steps - icons](/?path=/story/components-block-steps-steps--steps-icons)

### Toestanden

Voeg altijd een tekst toe als een stap disabled is zodat de disabled toestand niet enkel met de grijze kleur
overgebracht wordt, bv. "geannuleerd".

Zie de 'states' story onder [vl-step](/?path=/docs/components-block-steps-step--documentatie) voor een voorbeeld.

### Accordions

Zie de 'toggleable' story onder [vl-step](/?path=/docs/components-block-steps-step--documentatie) voor een voorbeeld.

### Lijn

> Story: [vl-steps - line](/?path=/story/components-block-steps-steps--steps-line)

### Tijdlijn

> Story: [vl-steps - timeline](/?path=/story/components-block-steps-steps--steps-timeline)

### Simpele tijdlijn

Gebruik het `icon slot` of `sub-icon slot` niet in combinatie met de simpele tijdlijn.

> Story: [vl-steps - simple timeline](/?path=/story/components-block-steps-steps--steps-simple-timeline)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Steps](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-steps)

### Legacy Documentatie

[Legacy Storybook - Steps](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/legacy-vl-steps--default)

[Legacy Documentatie - Steps](https://webcomponenten.omgeving.vlaanderen.be/doc/VlSteps.html)

[Legacy Demo - Steps](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-steps.html)
