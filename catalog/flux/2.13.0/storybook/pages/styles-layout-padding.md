# Padding

## Doel

Met deze style-classes kan de padding beïnvloed worden. De implementatie en gebruik van padding en margin zijn
gelijklopend. Op [web.dev](https://web.dev) vind je meer informatie
[over padding](https://web.dev/learn/css/spacing#padding).

![margin en padding](/libs/styles/src/layout/padding/stories/margin-en-padding.png)

## Gebruik

De mogelijkheden zijn bewust beperkt gehouden. Afnemers moeten er naar streven zich te beperken tot de
hieronder besproken (voorziene) style-classes. Echter, zoals steeds: het is niet verboden om eigen styling
(en dus een afwijking) te voorzien als dat de layout en bladspiegel ten goede komt.

In onderstaande voorbeelden wordt bij het 'default voorbeeld' de margin expliciet op 15px gezet, de overige voorbeelden
tonen de impact op het 'default voorbeeld'.

### vl-padding - default

De default padding wordt beïnvloed door de container, typisch wat er voor die resolutie bepaald is door
[vl-section](/?path=/docs/styles-layout-section--documentatie).

> Story: [vl-padding - default](/?path=/story/styles-layout-padding--padding-default)

### vl-padding--small

De padding onderaan en bovenaan wordt op de variabele `--vl-spacing--small` (1.5rem) gezet, links en rechts is er geen
padding (0), voor kleine schermen (&lt;767px) wordt de `--vl-spacing--normal` (2rem) gebruikt (boven- en onderaan).

> Story: [vl-padding - small](/?path=/story/styles-layout-padding--padding-small)

### vl-padding--medium

De padding onderaan en bovenaan wordt op de variabele `--vl-spacing--medium` (3rem) gezet, links en rechts is er geen
padding (0), voor kleine schermen (&lt;767px) wordt de `--vl-spacing--normal` (2rem) gebruikt (boven- en onderaan).

> Story: [vl-padding - medium](/?path=/story/styles-layout-padding--padding-medium)

### vl-padding--no

Nergens padding: alle padding rondom staat op 0.

> Story: [vl-padding - no](/?path=/story/styles-layout-padding--padding-no)

### vl-padding--no-bottom

Onderaan geen padding: deze wordt op 0 gezet.

> Story: [vl-padding - no bottom](/?path=/story/styles-layout-padding--padding-no-bottom)

### vl-padding--no-top

Bovenaan geen padding: deze wordt op 0 gezet.

> Story: [vl-padding - no top](/?path=/story/styles-layout-padding--padding-no-top)
