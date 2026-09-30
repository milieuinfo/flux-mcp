# Functional Header

Gebruik de `functional-header` component om bovenaan de pagina generieke informatie te tonen zoals bijvoorbeeld
een titel en acties.

## Voorbeeld

```js
import { VlFunctionalHeaderComponent } from '@domg-wc/components/block';
```

```html
<vl-functional-header></vl-functional-header>
```

> Story: [vl-functional-header - default](/?path=/story/components-block-functional-header--functional-header-default)

## Consistent gebruik van de "Terug"-link

De volgende richtlijnen gelden voor het instellen van de "Terug"-link:

- Vermijd het gebruik van `history.back()`. De gebruiker kan op verschillende manieren op je pagina belandt zijn.
- Je moet expliciet een URL instellen.
    - De ingestelde URL verwijst naar een vast en logisch startpunt,
      relatief tov de pagina waarop de gebruiker zich bevindt.
    - Kies als URL het startpunt van de toepassing, tenzij deze meerdere luiken bevat. Kies in dat geval het startpunt
      van het huidige luik.
    - Je kan de URL van de "Terug"-link vervangen met het `back-link`-attribuut.
- "Terug" moet vermeden worden als naam, want het zegt niet naar waar je terugkeert.
  Je kan de tekst van de "Terug"-link vervangen met het `back`-slot.
- Indien de functional header "breadcrumbs" bevat ipv een "Terug"-link,
  zoals in de [breadcrumbs variant](#met-breadcrumb), dan wijst de eerste link altijd naar het "startpunt" van de
  toepassing. Vermijd termen als "Home" of "Start", maar gebruik de naam van de toepassing of de naam van het luik
  waar je naar terugkeert.
- Vergeet de "Terug"-link ook niet in te stellen op de statische pagina's:
  [privacy](/?path=/docs/components-compliance-privacy--documentatie),
  [toegankelijkheid](/?path=/docs/components-compliance-accessibility--documentatie) en
  [cookieverklaring](/?path=/docs/components-compliance-cookie-statement--documentatie).
  Je kan de standaard functional header in deze componenten vervangen
  met het `header`-slot.
- Je kan de "Terug"-link in zijn geheel vervangen met het `back-link`-slot.

## Configuratie

> API: vl-functional-header

## Varianten

### Met acties

> Story: [vl-functional-header - actions](/?path=/story/components-block-functional-header--functional-header-actions)

### Met slots

> Story: [vl-functional-header - slots](/?path=/story/components-block-functional-header--functional-header-slots)

### Met tabs

Gebruik de [vl-tabs](/?path=/docs/components-block-tabs--tabs-default) component in het `sub-header` slot om tabs af te beelden binnen de `functional-header`.

> Story: [vl-functional-header - tabs](/?path=/story/components-block-functional-header--functional-header-tabs)

### Met breadcrumb

Gebruik de [vl-breadcrumb](/?path=/docs/components-block-breadcrumb--breadcrumb-default) component in het `sub-title` slot om een breadcrumb af te beelden binnen de
`functional-header`.
Plaats het `hide-back-link` attribuut om de terug-link te verbergen.

> Story: [vl-functional-header - breadcrumb](/?path=/story/components-block-functional-header--functional-header-breadcrumb)

### Andere patronen

Zie [Ontwerp/Functional Header](/?path=/docs/ontwerp-functional-header-voorbeeld-met-button--documentatie) voor voorbeelden van functional headers met een extra button of search component, of met de combinatie van "Terug"-link en tabs.

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Functional Header](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-functional-header)

### Legacy Documentatie

[Legacy Storybook - Functional Header](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/custom-elements-vl-functional-header--default)

[Legacy Documentatie - Functional Header](https://webcomponenten.omgeving.vlaanderen.be/doc/VlFunctionalHeader.html)

[Legacy Demo  - Functional Header](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-functional-header.html)
