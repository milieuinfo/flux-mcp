# Doormat

## Doel

Gebruik de `doormat` component om een snel en duidelijk overzicht weer te geven van de informatie op je website.

Elke doormat krijgt zijn eigen titel, tekst, optionele afbeelding en linkt naar een pagina binnen je website.

## Voorbeeld

```js
import { VlDoormatComponent } from '@domg-wc/components/block';
```

```html
<vl-doormat></vl-doormat>
```

> Story: [vl-doormat - default](/?path=/story/components-block-doormat--doormat-default)

## Configuratie

> API: vl-doormat

## Varianten

### Externe link met aria-label

> Story: [vl-doormat - external](/?path=/story/components-block-doormat--doormat-external)

### Alternatieve stijl

> Story: [vl-doormat - alt](/?path=/story/components-block-doormat--doormat-alt)

### Met afbeelding

> Story: [vl-doormat - image](/?path=/story/components-block-doormat--doormat-image)

### Met grafisch element

> Story: [vl-doormat - graphic](/?path=/story/components-block-doormat--doormat-graphic)

### Verticaal vullend

De doormat krijgt een hoogte van 100%. Dit werkt enkel wanneer de container een vaste hoogte heeft.

Dit kan je doen door bv. met een `vl-grid` layout werken, met meerdere doormat components als directe kinderen.
Vervolgens op elke doormat de CSS-classes `vl-column`, `vl-column--align-self-stretch` en de gewenste breedteclasses
plaatsen.

> Story: [vl-doormat - full height](/?path=/story/components-block-doormat--doormat-full-height)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Doormat](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-doormat)
