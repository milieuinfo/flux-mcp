# Side Navigation Layout

## Doel

De side navigation layout bouwt automatisch een inhoudstafel op voor een gestructureerde tekst met behulp van de
[side navigation](/?path=/docs/components-next-side-navigation-side-navigation--documentatie).

## Voorbeeld

```js
import { VlSideNavigationLayoutComponent } from '@domg-wc/components/block/next';
```

```html
<vl-side-navigation-layout>
    <div slot="content">
        <!-- Je content met headings en bijhorende id's-->
    </div>
</vl-side-navigation-layout>
```

## Gebruik

De side navigation layout component zorgt automatisch voor de juiste grid layout voor een meegegeven tekst en genereert
een [side navigation](/?path=/docs/components-next-side-navigation-side-navigation--documentatie), indien niet expliciet meegegeven.

**Slots:**

- **`content`** — Verplicht. Hier komt de hoofdinhoud (secties met headings en id's). De layout scant deze content om de inhoudsopgave op te bouwen; het root-element moet overeenkomen met het `heading-root-selector` attribuut of een kind daarvan bevatten.
- **`navigation`** — Optioneel. Voor een eigen navigatie-component (bijv. `vl-side-navigation-next` met custom TOC). Weglaten zorgt voor een automatisch gegenereerde side navigation.

## CSS variabelen

De sticky positie van de table of contents (inhoudsopgave) wordt bepaald door de CSS variabele
`--vl-side-navigation-top`. Gebruik deze variabele wanneer er een sticky element boven de side navigation staat
zodat de side-navigation niet onder dat element schuift.

- **`--vl-side-navigation-top`** (standaard: `50px`): de `top`-waarde voor de sticky positie van de TOC.
Accepteert elke geldige CSS waarde (bijv. `140px`, `10rem`, of `var(--header-height)`). Definieer de variabele op een
voorouder van de side navigation (bijv. op `main` of op de layout container).

## Eigenschappen

> API: vl-side-navigation-layout

## Voorbeelden

> [!NOTE]
> **Opgelet**
> De voorbeelden hieronder worden in een iframe weergegeven.
> De scroll-tracking van de side navigation werkt enkel wanneer
> je **binnen de iframe scrollt** (klik eerst op een navigatie-link om de content te scrollen).
>  Wanneer je door de documentatiepagina zelf scrollt, verandert de positie van de content binnen het iframe niet,
>   waardoor de actieve sectie niet wordt bijgewerkt.

In een echte applicatie en in de individuele stories, waar de content in dezelfde viewport scrollt, werkt de scroll-tracking correct.

### Default (Automatische navigatie)

De layout component genereert automatisch een side navigation op basis van de headings met id's in de content.

> Story: [vl-side-navigation-layout - default](/?path=/story/components-block-next-side-navigation-layout--side-navigation-layout-default)

### Met vl-steps

> Story: [vl-side-navigation-layout - met steps](/?path=/story/components-block-next-side-navigation-layout--side-navigation-layout-with-steps)

### Twee layouts met eigen content

Je kunt meerdere side-navigation-layout componenten onder elkaar plaatsen; elk met eigen content en automatisch gegenereerde inhoudsopgave.

> Story: [vl-side-navigation-layout - twee layouts met eigen content](/?path=/story/components-block-next-side-navigation-layout--side-navigation-layout-two-layouts)

### Met custom TOC

Je kan een custom TOC meegeven met eigen titels. Scroll tracking blijft automatisch werken zolang je in de `vl-link`
elementen refereert naar de relevante titels in de tekst.

> Story: [vl-side-navigation-layout - custom table of contents](/?path=/story/components-block-next-side-navigation-layout--side-navigation-layout-with-custom-toc)

## Referenties

- [Digitaal Vlaanderen - Side Navigation](https://www.vlaanderen.be/vlaanderen-design-system/componenten/side-navigation)

<vl-side-navigation-next compact exclude-selectors="iframe, #storybook-root" closed></vl-side-navigation-next>
