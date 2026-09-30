# Body

## Doel

Op het document wordt automatisch de specifieke styling voor de native `<html>` en `<body>` tags voorzien.

Dit zorgt er voor dat:

- het specifieke 'Vlaanderen' font gebruikt wordt
- de [62,5% font size trick](https://www.aleksandrhovhannisyan.com/blog/62-5-percent-font-size-trick/) wordt toegepast,
waardoor `1rem == 10px`
- op kleine schermen (&lt;767) het font en de lijn hoogte iets kleiner gemaakt worden

## Implementatie

**Html / Body Code**

```css
import { css, CSSResult } from 'lit';
import { vlMediaScreenSmall } from '../var/vl-media-screen.css';

export const vlBodyStyles: CSSResult = css`
    html {
        font-family: var(--vl-font);
        /* 62.5% of 16px user agent font size is 10px */
        font-size: 62.5%;
    }

    body {
        font-size: var(--vl-font-size);
        line-height: var(--vl-line-height);
        color: var(--vl-color--text);

        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: none;

        @media screen and (max-width: ${vlMediaScreenSmall}px) {
            font-size: var(--vl-font-size--mobile);
            line-height: var(--vl-line-height--mobile);
        }
    }
`;
```
