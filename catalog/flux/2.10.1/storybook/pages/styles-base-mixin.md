# Mixin

## Doel

Om in CSS duplicatie tegen te gaan voorzien we mixins. Het concept is gelijk aan SCSS mixins: geparametriseerde
methodes die styling encapsuleren. Al onze code wordt in TypeScript geschreven, daardoor zijn de mixins geschreven als
'css-in-ts'.

## Voorbeelden

### vlWaveAnimationMixin

De `vlWaveAnimationMixin` wordt hier ge-wrapped in een custom style-class. Dit is de animatie die gebruikt wordt in
`<vl-button>`.

> Story: [vl-mixin - vlWaveAnimationMixin](/?path=/story/styles-base-mixin--wave-animation-mixin-default)

### vlFocusOutlineMixin

De `vlFocusOutlineMixin` wordt hier ge-wrapped in een custom style-class. Dit zorgt voor de specifieke stijl van een
item dat de focus krijgt. Wordt gebruikt in `<vl-link>`, `<vl-button>` en `vl-link-button.`

> Story: [vl-mixin - vlFocusOutlineMixin](/?path=/story/styles-base-mixin--focus-outline-mixin-default)
