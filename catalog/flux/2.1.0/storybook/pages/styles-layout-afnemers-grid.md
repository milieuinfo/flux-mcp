# Grid

## Inhoudstafel

- [Doel](#doel)
- [Grid Opzet](#grid-opzet)
- [Column Opzet](#column-opzet)
- [Responsief Voorbeeld](#responsief-voorbeeld)

## Doel

`vl-grid` implementeert een [12-kolom grid layout](https://www.w3schools.com/css/css_rwd_grid.asp). De CSS
is een specifieke implementatie gebruikmakend van de [CSS Grid Layout](https://css-tricks.com/snippets/css/complete-guide-grid/),
die standaard door [browsers](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) voorzien wordt.

De opzet is responsief, er zijn style-classes voor 4 verschillende scherm groottes: **large** (&gt;1023px),
**medium** (&lt;1023px), **small** (&lt;767px) en **extra-small** (&lt;500px). De style-classes volgen de naamgeving
van CSS-grid, bestaande kennis of documentatie blijft dus representatief. Afwijkingen kunnen desgewenst in de afnemende
code voorzien worden door de naamgeving door te trekken: de CSS-grid naamgeving overnemen in
[kebab case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case).

## Grid Opzet

### **vl-grid - opzet**

Op container niveau - `vl-grid` - wordt m.b.v. de standaard CSS Grid Layout een 12-kolom grid opgezet waarbij de
waardes via variabelen worden gezet.

De responsieve kolom opzet zit in aparte bestanden, belangrijk hierbij is dat:

- de aanpak 'desktop first' is
- de media query breedte wordt van groot naar klein gedefinieerd: &gt;1023 (large) / &lt;1023 (medium) /
  &lt;767 (small) / &lt;500 (extra-small)
- de grotere hebben dus voorrang op de kleinere, als je enkel de default specifieert wordt dit ook toegepast voor
  de smallere
- als je daarnaast bvb. voor 'small' kolom afwijkingen opgeeft dan gelden die ook voor 'extra-small'

### **vl-grid - variabelen**

Met onderstaande variabelen kan je grid settings overrulen.

```css
:root {
    --vl-grid-row-gap: 1vmax;
    --vl-grid-col-gap: 1vmax;
}
```

### **vl-grid - code**

```ts
import gridRawCss from '!!raw-loader!./vl-grid.raw.css';
import { css, unsafeCSS } from 'lit';
import { vlMediaScreenExtraSmall, vlMediaScreenMedium, vlMediaScreenSmall } from '../../base/var/vl-media-screen.css';
import { columnLargeStyles } from './column/vl-column-l.css';
import { columnMediumStyles } from './column/vl-column-m.css';
import { columnSmallStyles } from './column/vl-column-s.css';
import { columnExtraSmallStyles } from './column/vl-column-xs.css';
import { gridLargeStyles } from './grid/vl-grid-l.css';
import { gridMediumStyles } from './grid/vl-grid-m.css';
import { gridSmallStyles } from './grid/vl-grid-s.css';
import { gridExtraSmallStyles } from './grid/vl-grid-xs.css';

export const vlGridStyles = css`
    ${unsafeCSS(gridRawCss)}
    .vl-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-row-gap: var(--vl-grid-row-gap);
        grid-column-gap: var(--vl-grid-col-gap);

        .vl-column {
            ${gridLargeStyles()};
            ${columnLargeStyles()};

            @media screen and (max-width: ${vlMediaScreenMedium}px) {
                ${gridMediumStyles()}
                ${columnMediumStyles()}
            }

            @media screen and (max-width: ${vlMediaScreenSmall}px) {
                ${gridSmallStyles()}
                ${columnSmallStyles()}
            }

            @media screen and (max-width: ${vlMediaScreenExtraSmall}px) {
                ${columnExtraSmallStyles()};
                ${gridExtraSmallStyles()};
            }
        }
    }
`;
```

### **vl-grid - justify-items / align-items**

Op grid niveau worden css-classes voorzien voor uitlijning: **horizontaal met [justify-items](https://css-tricks.com/snippets/css/complete-guide-grid/#prop-justify-items)**
en **verticaal met [align-items](https://css-tricks.com/snippets/css/complete-guide-grid/#aa-align-items)**.
Volgende classes zijn hiervoor beschikbaar:

```
vl-grid--justify-items-start
vl-grid--justify-items-end
vl-grid--justify-items-center
vl-grid--justify-items-stretch

vl-grid--align-items-start
vl-grid--align-items-end
vl-grid--align-items-center
vl-grid--align-items-stretch
```

### **vl-grid - responsive**

Op grid niveau kan je voor de uitlijning responsieve afwijkingen gebruiken: `vl-grid--X-justify-items-start`
waarbij X `[m, s, xs]` kan zijn. Als je dus `vl-grid--s-align-items-center` gebruikt zal die kolom enkel
gecentreerd zijn op smalle (s) en extra-smalle (xs) schermen.

## Column Opzet

### **vl-column - kolom**

Voor het specifiëren van kolommen is er `vl-column--1` t.e.m. `vl-column--12` met de responsieve varianten
`vl-column--X-N` waarbij X [m, s, xs] kan zijn.

Om de start van een kolom te verschuiven is er `vl-column--start-1` t.e.m. `vl-column--start-12` met de
responsieve varianten `vl-column--X-start-N` waarbij X [m, s, xs] kan zijn. Een kolom met `vl-column--start-2` zal starten in de tweede kolom en N kolommen breed zijn, zoals gedefinieerd met `vl-column--N`.

> Story: [vl-grid - column start](/?path=/story/styles-layout-afnemers-grid--grid-column-start)

### **vl-column - justify-self / align-self**

Conform het grid niveau worden er css-classes voorzien voor uitlijning in een cel: **horizontaal met
[justify-self](https://css-tricks.com/snippets/css/complete-guide-grid/#aa-justify-self)**
en **verticaal met [align-self](https://css-tricks.com/snippets/css/complete-guide-grid/#aa-align-items)**.
Volgende classes zijn hiervoor beschikbaar:

```
vl-column--justify-self-start
vl-column--justify-self-end
vl-column--justify-self-center
vl-column--justify-self-stretch

vl-column--align-self-start
vl-column--align-self-end
vl-column--align-self-center
vl-column--align-self-stretch
```

> Story: [vl-grid - justify / align](/?path=/story/styles-layout-afnemers-grid--grid-justify-align)

### **vl-column - responsive**

Ook de responsieve varianten zijn beschikbaar: bvb. `vl-grid--X-justify-self-start` en
`vl-column--X-align-self-start`.

## Responsief Voorbeeld

### Large - default (&gt;1023px)

![grid large](/libs/styles/src/layout/grid/stories/grid-large.png)

![css large](/libs/styles/src/layout/grid/stories/css-large.png)

### Medium (&lt;1023)

![grid medium](/libs/styles/src/layout/grid/stories/grid-medium.png)

![css medium](/libs/styles/src/layout/grid/stories/css-medium.png)

### Small (&lt;767)

![grid small](/libs/styles/src/layout/grid/stories/grid-small.png)

![css small](/libs/styles/src/layout/grid/stories/css-small.png)

### Extra-Small (&lt;500)

![grid extra small](/libs/styles/src/layout/grid/stories/grid-extra-small.png)

![css extra small](/libs/styles/src/layout/grid/stories/css-extra-small.png)

## Form Grid

Vorige implementaties van het grid zoals `is="vl-form-grid` of `class="vl-form-grid"` zijn deprecated en worden vervangen door `class="vl-grid"`:

```
<form>
  <div class="vl-grid">...</div>
</form>
```

> Story: [vl-grid - in form](/?path=/story/styles-layout-afnemers-grid--grid-with-form)
