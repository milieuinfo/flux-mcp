# Breadcrumb Item

Gebruik de `breadcrumb-item` component om een stap binnen de breadcrumbs weer te geven.

## Voorbeeld

```js
import { VlBreadcrumbItemComponent } from '@domg-wc/components/block';
```

```html
<vl-breadcrumb-item></vl-breadcrumb-item>
```

> Story: [vl-breadcrumb - default](/?path=/story/components-block-breadcrumb-breadcrumb-item--breadcrumb-default)

## Configuratie

> API: geen element in de web-types. Zie de argTypes in [Storybook](/?path=/story/components-block-breadcrumb-breadcrumb-item--breadcrumb-default).

## Varianten

### Link breadcrumb item

Dit is de default variant. Type `link` kan weggelaten worden.
Het wordt automatisch als link weergegeven wanneer er een `href` attribuut wordt meegegeven.

> Story: [vl-breadcrumb - default](/?path=/story/components-block-breadcrumb-breadcrumb-item--breadcrumb-default)

### Button breadcrumb item

Indien je onderliggend een button wenst te gebruiken, kan je het type `button` gebruiken.
Een `@click` handler is in dat geval vereist.

Vermijd het gebruik van links en buttons binnen dezelfde breadcrumb component.

> Story: [vl-breadcrumb - button](/?path=/story/components-block-breadcrumb-breadcrumb-item--breadcrumb-button)

### Text breadcrumb item

Indien je een breadcrumb item wenst weer te geven zonder link of button, kan je het type `text` gebruiken.
Dit is bijvoorbeeld handig voor het weergeven van de huidige pagina.
Indien je zowel `type` als `href` weglaat, wordt het item automatisch als text weergegeven.

> Story: [vl-breadcrumb - text](/?path=/story/components-block-breadcrumb-breadcrumb-item--breadcrumb-text)
