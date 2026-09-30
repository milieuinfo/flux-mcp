# Var

## Inhoudstafel

- [Doel](#doel)
- [Gebruik](#gebruik)
- [Voorbeeld](#voorbeeld)
- [Variabelen](#variabelen)

## Doel

Voor consistentie in de styling en soms om waardes een naam te geven worden standaard CSS variabelen gebruikt.
De variabelen worden steeds globaal gespecifieerd en kunnen in een concrete component (in die scope) een afwijkende
waarde krijgen. Dit moet niet gezien worden als theming, er is maar 1 stijl: die van Vlaanderen.

## Gebruik

Het zijn standaard [CSS variabelen](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties):
ze beginnen dus met `--` en zijn te gebruiken met `var()`.

```
.my-details {
  background-color: var(--vl-color--background-alt);
}
```

## Voorbeeld

> Story: [vl-var - color](/?path=/story/styles-base-var--var-color)

## Variabelen

Hieronder volgt een overzicht van alle variabelen, dit is een representatie van de code, ze zijn dus steeds up-to-date.

### Color

**Color Variables**

```css
/*! Indien je een kleur aanpast, kijk dan even na of er andere kleuren op gebaseerd zijn die een alpha waarde toevoegen.*/
/* TODO: kleuren gelijktrekken in hele codebase, volgens kleurenpalet uit Figma: 
  https://www.figma.com/design/fjoJzse5CZSggMaZDe80CO/-VL--Foundations--team-D-?node-id=61-724
*/

:root {
    --vl-color--white: #ffffff;
    --vl-color--white-lilac: #f7f9fc;
    --vl-color--mischka-grey: #CFD5DD;

    --vl-color--accent: #ffe615;
    --vl-color--background: var(--vl-color--white);
    --vl-color--background-alt: var(--vl-color--white-lilac);

    --vl-color--map-background: #ffffff;
    --vl-color--doormat-background: #33333233;

    --vl-color--text: #333332;
    --vl-color--text-alt: #687483;
    --vl-color--text-light: #8695a8;

    --vl-color--border: #cbd2da;
    --vl-color--border-alt: #8695a8;
    --vl-color--border-alt--background: #f3f5f6;

    --vl-color--action: #0055cc;
    --vl-color--action-hover: #003bb0;
    --vl-color--action-hover-background: #e6eefa;
    --vl-color--action-active: #004099; /* --vl-color--action 10% darker */
    --vl-color--action-visited: #660599;
    --vl-color--action-disabled: #687483;
    --vl-color--action-disabled-background: #cbd2d9;

    --vl-color--action-tertiary: var(--vl-color--action);
    --vl-color--action-tertiary-hover: var(--vl-color--action);
    --vl-color--action-tertiary-border: #c6cdd3;
    --vl-color--action-tertiary-border-hover: #5990de;

    
    --vl-color--error: #d2373c;
    --vl-color--error-hover: #aa2729;
    --vl-color--error-background: #fbebec;
    --vl-color--error-bg: var(--vl-color--error-background);
    --vl-color--error-text: var(--vl-color--error-hover);
    --vl-color--error-border: #f1aeae;

    --vl-color--success: #009e47;
    --vl-color--success-bg: #e6f5ed;
    --vl-color--success-text: #007a37;
    --vl-color--success-border: #99d8b5;

    --vl-color--warning: #ffa10a;
    --vl-color--warning-bg: #fff6e7;
    --vl-color--warning-text: #9f5804;
    --vl-color--warning-border: #ffd99d;

    --vl-color--focus: #0055cca6; /* --vl-color--action 65% opacity */

    --vl-color--label: #687483;
}
```

### General

**General Variables**

```css
:root {
    --vl-page--min-width: 768px;
    --vl-page--max-width: 1024px;
    --vl-page--max-width-wide: 1280px;
    --vl-page--padding: 30px;

    /* breakpoints */
    --vl-bp--xsmall: 500px;
    --vl-bp--small: 767px;
    --vl-bp--medium: 1023px;
    --vl-bp--large: 1600px;

    --vl-box--max-width: 1600px;

    --vl-border--radius: 0.3rem;
}
```

### Media Screen

De resolutie in een media query specifiëren via een css variabele wordt niet door browsers ondersteund. Om toch de
'breakpoints' eenduidig te specifiëren worden ze als standaard TypeScript variabelen gedefinieerd.

**Media Screen Variables**

```ts
export const vlMediaScreenExtraSmall = 500;
export const vlMediaScreenSmall = 767;
export const vlMediaScreenMedium = 1023;
export const vlMediaScreenLarge = 1600;

export const vlPageMaxWidthWide = 1280;
```

### Spacing

**Spacing Variables**

```css
:root {
    --vl-spacing--xxsmall: 0.5rem;
    --vl-spacing--xsmall: 1rem;
    --vl-spacing--small: 1.5rem;
    --vl-spacing--normal: 2rem;
    --vl-spacing--medium: 3rem;
    --vl-spacing--large: 6rem;
}
```

### Typography

**Typography Variables**

```css
:root {
    --vl-font: 'Flanders Art Sans', sans-serif;
    --vl-icon-font: 'vlaanderen-icon';

    --vl-font-size--xxlarge: 2.8rem;
    --vl-font-size--xlarge: 2.2rem;
    --vl-font-size--large: 2rem;
    --vl-font-size: 1.8rem;
    --vl-font-size--mobile: 1.6rem;
    --vl-font-size--small: 1.6rem;
    --vl-font-size--xsmall: 1.4rem;
    --vl-font-size--xxsmall: 1.2rem;

    --vl-line-height: 1.5;
    --vl-line-height--mobile: 1.33;
}
```
