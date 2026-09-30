# Font

## Inhoudstafel

- [Doel](#doel)
- [Implementatie](#implementatie)
- [Voorbeelden](#voorbeelden)

## Doel

Vanuit Digitaal Vlaanderen worden er 2 fonts voorzien: `Flanders Art Sans` en `vlaanderen-icon`.

Het `Flanders Art Sans` font is het default font, wat zowel voor de normale als de italic styling dient.
Beide styles zijn beschikbaar in de gewichten: 300, 400, 500 en 700.

[Alle iconen](/?path=/docs/components-atom-icon--documentatie#overzicht) komen uit het font `vlaanderen-icon`.

## Implementatie

**Font Code**

```ts
import { css, CSSResult, unsafeCSS } from 'lit';

const sansFontFamily = 'Flanders Art Sans';
const iconFontFamily = 'vlaanderen-icon';
const fontLocation = 'https://cdn.omgeving.vlaanderen.be/domg/govflanders-font/22.0.2';
export const iconFontLocation = `${fontLocation}/iconfont/vlaanderen-icon`;

const fontFace = (
    fontFamily: string,
    fontLocation: string,
    fontWeight: number | string,
    fontStyle: string
): CSSResult => css`
    @font-face {
        font-family: ${unsafeCSS(fontFamily)};
        src: url(${unsafeCSS(`${fontLocation}.woff2`)}) format('woff2'),
            url(${unsafeCSS(`${fontLocation}.woff`)}) format('woff');
        font-weight: ${unsafeCSS(fontWeight)};
        font-style: ${unsafeCSS(fontStyle)};
    }
`;

export const vlFontStyles: CSSResult = css`
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/sans/FlandersArtSans-Light`, 300, 'normal')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/sans/FlandersArtSans-Regular`, 400, 'normal')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/sans/FlandersArtSans-Medium`, 500, 'normal')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/sans/FlandersArtSans-Bold`, 700, 'normal')}

    ${fontFace(sansFontFamily, `${fontLocation}/flanders/italic/FlandersArtSans-Light`, 300, 'italic')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/italic/FlandersArtSans-Regular`, 400, 'italic')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/italic/FlandersArtSans-Medium`, 500, 'italic')}
    ${fontFace(sansFontFamily, `${fontLocation}/flanders/italic/FlandersArtSans-Bold`, 700, 'italic')}

    ${fontFace(iconFontFamily, `${iconFontLocation}`, 'normal', 'normal')}
`;
```

## Voorbeelden

In deze voorbeelden zie je de verschillende fonts in gebruikt, er worden telkens specifieke wrappers voorzien via een
custom style-class.

### Flanders Art Sans - normal

> Story: [vl-font - Flanders Art Sans - normal](/?path=/story/styles-base-font--font-flanders-art-sans-normal)

### Flanders Art Sans - italic

> Story: [vl-font - Flanders Art Sans - italic](/?path=/story/styles-base-font--font-flanders-art-sans-italic)
