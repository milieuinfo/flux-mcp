# Margin

## Doel

Met deze style-classes kan de margin beïnvloed worden. De implementatie en gebruik van margin en padding zijn
gelijklopend. Op [web.dev](https://web.dev) vind je meer informatie
[over margin](https://web.dev/learn/css/spacing#margin).

![margin en padding](/libs/styles/src/layout/margin/stories/margin-en-padding.png)

## Gebruik

De mogelijkheden zijn bewust beperkt gehouden. Afnemers moeten er naar streven zich te beperken tot de
hieronder besproken (voorziene) style-classes. Echter, zoals steeds: het is niet verboden om eigen styling
(en dus een afwijking) te voorzien als dat de layout en bladspiegel ten goede komt.

In onderstaande voorbeelden wordt bij het 'default voorbeeld' de margin expliciet op 15px gezet, de overige voorbeelden
tonen de impact op het 'default voorbeeld'.

### vl-margin - default

De default marge wordt beïnvloed door de container, typisch wat er voor die resolutie bepaald is door
[vl-section](/?path=/docs/styles-layout-section--documentatie).

> Story: [vl-margin - default](/?path=/story/styles-layout-margin--margin-default)

### vl-margin--small

De margin onderaan en bovenaan wordt op de variabele `--vl-spacing--small` (1.5rem) gezet, links en rechts is er geen
margin (0), voor kleine schermen (&lt;767px) wordt de `--vl-spacing--normal` (2rem) gebruikt (boven- en onderaan).

> Story: [vl-margin - small](/?path=/story/styles-layout-margin--margin-small)

### vl-margin--medium

De margin onderaan en bovenaan wordt op de variabele `--vl-spacing--medium` (3rem) gezet, links en rechts is er geen
margin (0), voor kleine schermen (&lt;767px) wordt de `--vl-spacing--normal` (2rem) gebruikt (boven- en onderaan).

> Story: [vl-margin - medium](/?path=/story/styles-layout-margin--margin-medium)

### vl-margin--no

Nergens margin: alle margin rondom staat op 0.

> Story: [vl-margin - no](/?path=/story/styles-layout-margin--margin-no)

### vl-margin--no-bottom

Onderaan geen margin: deze wordt op 0 gezet.

> Story: [vl-margin - no bottom](/?path=/story/styles-layout-margin--margin-no-bottom)

### vl-margin--no-top

Bovenaan geen margin: deze wordt op 0 gezet.

> Story: [vl-margin - no top](/?path=/story/styles-layout-margin--margin-no-top)
