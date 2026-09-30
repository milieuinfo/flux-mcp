# Loader

## Doel

Gebruik `vl-loader` om aan te geven dat er iets aan het laden is. De component toont een animerende
laadindicator met daaronder een informatieve tekst.

## Voorbeeld

```js
import { VlLoaderComponent } from '@domg-wc/components/block';
```

```html
<vl-loader></vl-loader>
```

> Story: [vl-loader - default](/?path=/story/components-block-loader--loader-default)

## Configuratie

> API: vl-loader

## Varianten

### Light

Gebruik het attribuut `light` voor een alternatieve weergave op een donkere achtergrond.

> Story: [vl-loader - light without text](/?path=/story/components-block-loader--loader-light-without-text)

### Aangepaste inhoud

Gebruik de slot om de standaardtekst te vervangen door eigen (opgemaakte) inhoud.

> Story: [vl-loader - with custom content](/?path=/story/components-block-loader--loader-with-custom-content)

## Toegankelijkheid

De tekst van de loader staat in een `role="status"` live region. Daardoor kondigt een screenreader de
laadstatus **beleefd** (`aria-live="polite"`) aan: de melding onderbreekt andere aankondigingen niet, maar
wordt voorgelezen zodra de gebruiker even pauzeert.

Een live region wordt echter enkel voorgelezen wanneer de screenreader een **wijziging** in de inhoud
detecteert. Een `vl-loader` die je op het moment van laden in de DOM injecteert, wordt door de meeste
screenreaders niet betrouwbaar aangekondigd — de inhoud was er immers "altijd al".

Om de laadstatus wél betrouwbaar te laten voorlezen, hou je je aan dit patroon:

1. Plaats de `vl-loader` **van bij het laden van de pagina** in de DOM, maar verborgen en zonder tekst.
2. Zodra het laden begint, maak je de loader zichtbaar en vul je de tekst in (bv. `Pagina is aan het laden`).

Het is de overgang van lege tekst naar tekst die de screenreader triggert om voor te lezen.

```html
<!-- Bij paginalaad: aanwezig, verborgen en zonder tekst -->
<vl-loader hidden text=""></vl-loader>
```

```js
// Zodra het laden start: zichtbaar maken en tekst invullen
const loader = document.querySelector('vl-loader');
loader.hidden = false;
loader.setAttribute('text', 'Pagina is aan het laden');
```
