# Section

## Inhoudstafel

- [Doel](#doel)
- [Gebruik](#gebruik)

## Doel

De `vl-section` verdeeld de toepassing in delen en zorgt voor consistente witruimte.

## Gebruik

### Default Secties

Er is de standaard `vl-section` en de `vl-section--alt` waarbij de laatste een lichtgrijze achtergrond
krijgt krijgt. Om minder (dan de standaard) witruimte te krijgen zijn er de optionele classes `vl-section--small`
en `vl-section--medium`. Scheidingslijnen worden verkregen door `vl-section--bordered` te gebruiken.

In onderstaand voorbeeld wordt dit alles toegepast, als ook kleur variabelen overschreven (om de kleuren prominenter
te maken).

> Story: [vl-section - light blue](/?path=/story/styles-layout-afnemers-section--section-light-blue)

### Overlappende Sectie

Voor specifieke gevallen kan er een overlappende sectie voorzien worden.

![section overlap](/libs/styles/src/layout/section/stories/section-overlap.png)

**section overlap - code**

```html
// {VlSectionStories.SectionOverlap.toString()} uit libs/styles/src/layout/section/stories/vl-section.stories.ts:
export const SectionOverlap = ({}) => html`
    <style>
        ${sectionCss} .sb-overlap {
            &.vl-section {
                --vl-section--alt-bg: lightblue;
                --vl-section--border: lightblue;
            }
        }
    </style>
    <section class="sb-overlap vl-section vl-section--overlap">
        <p class="vl-content-block">vl-content-block</p>
        <p>vl-section vl-section--overlap</p>
    </section>
    <section class="sb-overlap vl-section vl-section--bordered">
        <p>vl-section vl-section--bordered</p>
    </section>
    <section class="sb-overlap vl-section vl-section--bordered">
        <p>vl-section vl-section--bordered</p>
    </section>
    <section class="sb-overlap vl-section vl-section--bordered">
        <p>vl-section vl-section--bordered</p>
    </section>
`;
```
