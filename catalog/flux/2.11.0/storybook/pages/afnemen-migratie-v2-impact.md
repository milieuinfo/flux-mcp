# Migratie v2 - Impact

## Geïmpacteerde Web Componenten

Hieronder vind je alfabetisch, per component, een tabel met daarin een overzicht van de impact bij migratie naar v2.

### Accordion List

`Accordion List [legacy]` wordt in v2 vervangen door [Group](#group).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Accordion List [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-accordion-list--documentatie) | deprecated | components | `<vl-accordion-list>` | - | - |

### Action Group

`Action Group [legacy]` wordt in v2 vervangen door [Group](#group).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Action Group [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-action-group--documentatie) | deprecated | elements | `<div is="vl-action-group">` | - | - |

### Annotation

`Annotation [legacy]` wordt in v2  aangeboden via [Text](#text), met de attributen `annotation` en `small`.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Annotation [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-annotation--documentatie) | deprecated | components | `<vl-annotation>` | - | - |

### Body

De `Body [legacy]` wordt in v2 geschrapt, in v2 wordt automatisch de native body gestyled.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Body [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-body--documentatie) | deprecated | elements | `<body is="vl-body">` | - | - |
| [Body](/?path=/docs/styles-base-body--documentatie) | native | - | `<body>` | - | `<body>` |

### Button

De `Button` vervangt de `Button [legacy]`, de `Icon Button [legacy]`, de `Toggle Button [legacy]` en de
`Link Button [legacy]` (zie de [cta-link documentatie](/?path=/docs/components-atoms-button--documentatie#cta-link) voor
meer informatie).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Button [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-button-button--documentatie) | deprecated | elements | `<button is="vl-button">` | - | - |
|  |  |  |  |  |  |
| [Icon Button [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-button-icon-button--documentatie) | deprecated | elements | `<button is="vl-icon-button">` | - | - |
|  |  |  |  |  |  |
| [Link Button [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-button-link-button--documentatie) | deprecated | elements | `<button is="vl-link-button">` | - | - |
|  |  |  |  |  |  |
| [Toggle Button [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-toggle-button--documentatie) | deprecated | components | `<vl-toggle-button>` | - | - |
| [Button](/?path=/docs/components-atom-button--documentatie) | release v1.33.0 | components | `<vl-button-next>` | components/atom | `<vl-button>` |

nieuw in v2:
- ghost variant: `<vl-button type="ghost">`
- CTA link: `<vl-button cta-link>`

### Button Pill

De Button Pill wordt geschrapt in v2. De functionaliteit verhuist naar `<vl-pill clickable>`
(zie de [vl-pill documentatie](/?path=/docs/components-block-pill-pill--documentatie) voor meer informatie).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Button Pill [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-pill-button-pill--documentatie) | deprecated | elements | `<button is="vl-button-pill">` | - | - |
| [Pill](/?path=/docs/components-block-pill-pill--documentatie) | release v1.45.0 | components | `<vl-pill data-vl-clickable>` | components/block | `<vl-pill clickable>` |

### Checkbox

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Checkbox [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-checkbox--documentatie) | deprecated | components | `<vl-checkbox>` | - | - |
| [Checkbox](/?path=/docs/components-form-checkbox--documentatie) | release v1.25.0 | form | `<vl-checkbox-next>` | components/form | `<vl-checkbox>` |

### Code Preview

De Code Preview component werd geschrapt in v2, die werd enkel in de legacy documentatie (van voor 2021) gebruikt.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Code Preview [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-code-preview--documentatie) | deprecated | components | `<vl-code-preview>` | - | - |

### Content block

`Content Block` is de nieuwe v2 opzet met style-classes die de v1 `Grid Layout [legacy]` vervangt.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Grid Layout [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-grid-grid-layout--documentatie) | deprecated | elements | `<div is="vl-layout">` | - | - |
| [Content Block](/?path=/docs/styles-layout-content-block--documentatie) | release v1.46.0 | common-utilities/css | `class="vl-content-block-next"` | styles | `class="vl-content-block"` |

### Datepicker

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Datepicker [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-datepicker--documentatie) | deprecated | components | `<vl-datepicker>` | - | - |
| [Datepicker](/?path=/docs/components-form-datepicker--documentatie) | release v1.25.0 | form | `<vl-datepicker-next>` | components/form | `<vl-datepicker>` |

nieuw in v2:
- de standaard waarde is nu in ISO-8601 formaat
- mask validatie werd toegevoegd
- de positionering werd verbeterd met de extra attributen `position` en `static`

### Data Table

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Data Table [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-data-table--documentatie) | deprecated | elements | `<table is="vl-data-table">` | - | - |
| [Table](/?path=/docs/components-block-table--documentatie) | release v1.42.0 | components | `<vl-table-next>` | components/block | `<vl-table>` |

### Doormat

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Doormat [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-doormat--documentatie) | deprecated | elements | `<a is="vl-doormat">` | - | - |
| [Doormat](/?path=/docs/components-block-doormat--documentatie) | release v1.34.0 | components | `<vl-doormat-next>` | components/block | `<vl-doormat>` |

### Form

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Form [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form--documentatie) | deprecated | elements | `<label is="vl-form">` | - | - |
| [Form](/?path=/docs/ontwerp-form-demo--documentatie) | native | - | `<form>` | - | `<form>` |

### Form Annotation

Wordt niet meer voorzien in v2, voor een foutboodschap dien je nu `<vl-form-message>` te gebruiken.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Form Annotation [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form-message-form-annotation--documentatie) | deprecated | elements | `<label is="vl-form-annotation">` | - | - |

### Form Grid

`Grid` voorziet style-classes voor `Form Grid [legacy]` en `Form Grid Column [legacy]`.

Zie [Stacked](#stacked) voor de vervanger van de vroegere `stacked` attributen.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Form Grid [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form-grid-form-grid--documentatie) | deprecated | elements | `<div is="vl-form-grid">` | - | - |
| [Grid](/?path=/docs/styles-layout-grid--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-grid-next"` | styles | `class="vl-grid"` |
| [Form Grid Column [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form-grid-form-column--documentatie) | deprecated | elements | `<div is="vl-form-column">` | - | - |
| [Grid Column](/?path=/docs/styles-layout-grid--documentatie#column-opzet) | release v1.40.0 | common-utilities/css | `class="vl-column-next"` | styles | `class="vl-column"` |

### Form Label

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Form Label [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form-message-form-label--documentatie) | deprecated | elements | `<label is="vl-form-label">` | - | - |
| [Form Label](/?path=/docs/components-form-form-label--documentatie) | release v1.28.0 | form | `<vl-form-label-next>` | components/form | `<vl-form-label>` |

### Form Validation

Dit was een utility mixin die gebruikt werd in de oude formulier componenten. De nieuwe formulier componenten
gebruiken dit niet meer.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| Form Validation [legacy] | deprecated | elements | utility mixin | - | - |

### Form Validation Message / Form Message

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Form Validation Message [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-form-message-form-validation-message--documentatie) | deprecated | elements | `<p is="vl-form-validation-message">` | - | - |
| [Form Message](/?path=/docs/components-form-form-message--documentatie) | release v1.25.0 | form | `<vl-error-message-next>` | components/form | `<vl-form-message>` |

### Grid

De `Grid` style-classes vervangen `Grid [legacy]` en `Grid Column [legacy]`.
 - zie [Section](#section) voor `Grid Region [legacy]`
 - zie [Content block](#content-block) voor `Grid Layout [legacy]`
 - zie [Stacked](#stacked) voor de vervanger van de vroegere `stacked` attributen

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Grid [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-grid-grid--documentatie) | deprecated | elements | `<div is="vl-grid">` | - | - |
| [Grid](/?path=/docs/styles-layout-grid--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-grid-next"` | styles | `class="vl-grid"` |
| [Grid Column [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-grid-grid-column--documentatie) | deprecated | elements | `<div is="vl-column">` | - | - |
| [Grid Column](/?path=/docs/styles-layout-grid--documentatie#column-opzet) | release v1.40.0 | common-utilities/css | `class="vl-column-next"` | styles | `class="vl-column"` |

### Group

`Group` voorziet style-classes om componenten te groeperen; het is een vervanging voor onder andere:
`Action Group [legacy]`, `Accordion List [legacy]`, `Link List [legacy]` en `Icon Wrapper [legacy]`.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Action Group [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-action-group--documentatie) | deprecated | elements | `<div is="vl-action-group">` | - | - |
| [Accordion List [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-accordion-list--documentatie) | deprecated | components | `<vl-accordion-list>` | - | - |
| [Link List [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-link-list--documentatie) | deprecated | elements | `<div is="vl-link-list">` | - | - |
| [Icon Wrapper [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-icon-icon-wrapper--documentatie) | deprecated | elements | `<div is="vl-icon-wrapper">` | - | - |
| [Group](/?path=/docs/styles-layout-group--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-group-next"` | styles | `class="vl-group"` |

### Http Error Message

Alle specifieke &lt;vl-http-XXX-message&gt; (XXX = 400 tem 415 / 500 tem 506 ) componenten verdwijnen in v2. In v2 gebruik
je `<vl-http-error-message error-code="XXX">`.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Http Error Message [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-http-error-message--documentatie) | impact | components | `<vl-http-error-XXX-message>` | - | - |
| [Http Error Message](/?path=/docs/components-block-http-error-message--documentatie) | impact | components | `<vl-http-error-message data-vl-error-code="XXX">` | components/block | `<vl-http-error-message error-code="XXX">` |

### Icon

De `Icon Wrapper [legacy]` wordt geschrapt in v2, hij wordt vervangen door de [Group](#group).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Icon [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-icon-icon--documentatie) | deprecated | elements | `<span is="vl-icon">` | - | - |
|  |  |  |  |  |  |
| [Icon Wrapper [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-icon-icon-wrapper--documentatie) | deprecated | elements | `<p is="vl-icon-wrapper">` | - | - |
| [Icon](/?path=/docs/components-atom-icon--documentatie) | release v1.34.0 | components | `<vl-icon-next>` | components/atom | `<vl-icon>` |

### Image

Wordt niet meer voorzien in v2, de native `<img>` krijgt de voorkeur.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Image [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-image--documentatie) | deprecated | elements | `<img is="vl-image">` | - | - |
| [Image](/?path=/docs/styles-base-image--documentatie) | native | - | `<img>` | - | `<img>` |

### Infotext

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Infotext [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-infotext--documentatie) | deprecated | elements | `<div is="vl-infotext">` | - | - |
| [Infotext](/?path=/docs/components-block-infotext--documentatie) | release v1.33.0 | components | `<vl-infotext-next>` | components/block | `<vl-infotext>` |

### Input Field

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Input Field [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-input-field--documentatie) | deprecated | elements | `<input is="vl-input-field">` | - | - |
| [Input Field](/?path=/docs/components-form-input-field--documentatie) | release v1.25.0 | form | `<vl-input-field-next>` | components/form | `<vl-input-field>` |

### Input Group

In v2 is `Input Group` geen aparte component meer.
De `Group`, `Button` en `Input Field` werden uitgebreid om de
groepeer functionaliteit te voorzien.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Input Group [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-input-group--documentatie) | deprecated | elements | `<div is="vl-input-group">` | - | - |
|  |  |  |  |  |  |
| [Button Input Addon [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-input-addon-button-input-addon--documentatie) | deprecated | elements | `<button is="vl-button-input-addon">` | - | - |
|  |  |  |  |  |  |
| [Input Addon [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-input-addon-input-addon--documentatie) | deprecated | elements | `<p is="vl-input-addon">` | - | - |
| [Input Group](/?path=/docs/styles-layout-group--documentatie#input-group) | release v1.43.0 | form | `<div class="vl-group-next--input-group">` | styles | `<div class="vl-group--input-group">` |

### Link

`Button Link [legacy]` verdwijnt in v2, gebruik de `<vl-link button-as-link>`
(zie de [button-as-link](/?path=/docs/components-atom-link--documentatie#button-als-link) documentatie).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Link [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-link-link--documentatie) | deprecated | elements | `<a is="vl-link">` | - | - |
|  |  |  |  |  |  |
| [Button Link [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-link-button-link--documentatie) | deprecated | elements | `<a is="vl-button-link">` | - | - |
| [Link](/?path=/docs/components-atom-link--documentatie) | release v1.32.0 | components | `<vl-link-next>` | components/atom | `<vl-link>` |

### Paragraph

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Introduction [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-introduction--documentatie) | deprecated | elements | `<p is="vl-introduction">` | - | - |
| [Paragraph](/?path=/docs/components-atom-paragraph--documentatie) | release v1.42.0 | components | `<vl-paragraph-next>` | components/atom | `<vl-paragraph>` |

### Link List

De `Link List [legacy]` wordt in v2 vervangen door [Group](#group).

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Link List [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-link-list--documentatie) | deprecated | elements | `<div is="vl-link-list">` | - | - |

### Margin

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Margin](/?path=/docs/styles-layout-margin--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-margin-next"` | styles | `class="vl-margin"` |

### Padding

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Padding](/?path=/docs/styles-layout-padding--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-padding-next"` | styles | `class="vl-padding"` |

### Pattern

`Pattern [legacy]` is een utility mixin die gebruikt werd in de oude formulier componenten.
De nieuwe formulier componenten gebruiken dit niet meer, er wordt wel een mask voorzien voor de input velden.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| Pattern [legacy] | deprecated | elements | utility mixin | - | - |
| [Input Field Masked](/?path=/docs/components-form-input-field-masked--documentatie) | release v1.25.0 | form | `<vl-input-field-masked-next>` | components/form | `vl-input-field-masked>` |

### Progress Bar / Progress Indicator

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Progress Bar [v1]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-progress-bar--documentatie) | release v1.0.0 | components | `<vl-progress-bar>` | - | - |
| [Progress Indicator [v2]](/?path=/docs/components-block-progress-indicator--documentatie) | release v2.0.0 | - | - | components/block | `<vl-progress-indicator>` |

### Properties

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Properties [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-properties--documentatie) | deprecated | elements | `<vl-properties>` | - | - |
| [Properties](/?path=/docs/components-block-properties--documentatie) | release v1.33.0 | components | `<vl-properties-next>` | components/block | `<vl-properties>` |

### Radio Group / Radio

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Radio Group [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-radio--documentatie) | deprecated | components | `<vl-radio-group>` | - | - |
| [Radio Group](/?path=/docs/components-form-radio-group--documentatie) | release v1.25.0 | form | `<vl-radio-group-next>` | components/form | `<vl-radio-group>` |
| [Radio [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-radio--documentatie) | deprecated | components | `<vl-radio>` | - | - |
| [Radio](/?path=/docs/components-form-radio-group--documentatie) | release v1.25.0 | form | `<vl-radio-next>` | components/form | `<vl-radio>` |

### Search Filter

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Search Filter [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-search-filter--documentatie) | deprecated | elements | `<vl-search-filter>` | - | - |
| [Search Filter](/?path=/docs/components-block-search-filter--documentatie) | release v1.42.0 | components | `<vl-search-filter-next>` | components/block | `<vl-search-filter>` |

### Search Result

De `Search Result` bestaat uit verschillende sub-componenten. Ze staan
hieronder niet expliciet opgelijst maar zijn terug te vinden op de documentatie pagina van de component.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Search Result [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-search-results-search-result--documentatie) | deprecated | elements | `<li is="vl-search-result">` | - | - |
|  |  |  |  |  |  |
| [Search Results [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-search-results-search-results--documentatie) | deprecated | elements | `<ul is="vl-search-results">` | - | - |
| [Search Result](/?path=/docs/components-block-search-result--documentatie) | release v1.43.0 | components | `<vl-search-result-next>` | components/block | `<vl-search-result>` |

### Section

`Section` is de nieuwe opzet die style-classes voorziet ter vervanging van
`Grid Region [legacy]`.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Grid Region [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-grid-grid-region--documentatie) | deprecated | elements | `<section is="vl-region">` | - | - |
| [Section](/?path=/docs/styles-layout-section--documentatie) | release v1.40.0 | common-utilities/css | `class="vl-section-next"` | styles | `class="vl-section"` |

### Select / MultiSelect / Select Rich

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Select [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-select--documentatie) | deprecated | elements | `<select is="vl-select">` | - | - |
| [Select](/?path=/docs/components-form-select--documentatie) | release v1.25.0 | form | `<vl-select-next>` | components/form | `<vl-select>` |
| [MultiSelect [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-multiselect--documentatie) | deprecated | elements | `<select is="vl-multiselect">` | - | - |
| [Select Rich](/?path=/docs/components-form-select-rich--documentatie) | release v1.32.0 | form | `<vl-select-rich-next>` | components/form | `<vl-select-rich>` |

### Select Location

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Select Location [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/map-select-location--documentatie) | deprecated | map | `<vl-select-location>` | - | - |
| [Select Location](/?path=/docs/map-select-location--documentatie) | release v1.46.0 | map | `<vl-select-location-next>` | map | `<vl-select-location>` |

### Separator

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Separator](/?path=/docs/styles-layout-separator--documentatie) | release v1.43.0 | common-utilities/css | `class="vl-separator-next"` | styles | `class="vl-separator"` |

### Spacer

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Spacer](/?path=/docs/styles-layout-spacer--documentatie) | release v1.43.0 | common-utilities/css | `class="vl-spacer-next"` | styles | `class="vl-spacer"` |

### Stacked

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
| [Stacked](/?path=/docs/styles-layout-stacked--documentatie) | release v1.43.0 | common-utilities/css | `class="vl-stacked-next"` | styles | `class="vl-stacked"` |

### Side Navigation

De `Side Navigation` bestaat uit verschillende sub-componenten. Ze staan
hieronder niet expliciet opgelijst maar zijn terug te vinden op de documentatie pagina van de component.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Side Navigation [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-side-navigation--documentatie) | deprecated | elements | `<nav is="vl-side-navigation">` | - | - |
| [Side Navigation](/?path=/docs/components-block-side-navigation--documentatie) | release v1.43.0 | components | `<vl-side-navigation-next>` | components/block | `<vl-side-navigation>` |

### Steps / Step

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Steps [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-steps--documentatie) | deprecated | components | `<vl-steps>` | - | - |
| [Steps](/?path=/docs/components-block-steps-steps--documentatie) | release v1.16.0 | components | `<vl-steps-next>` | components/block | `<vl-steps>` |
| [Step [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-steps--documentatie) | deprecated | components | `<vl-step>` | - | - |
| [Step](/?path=/docs/components-block-steps-step--documentatie) | release v1.16.0 | components | `<vl-step-next>` | components/block | `<vl-step>` |

### Tabs / Tabs Pane

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Tabs [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-tabs-tabs--documentatie) | deprecated | components | `<vl-tabs>` | - | - |
| [Tabs](/?path=/docs/components-block-tabs-tabs--documentatie) | release v1.45.0 | components | `<vl-tabs-next>` | components/block | `<vl-tabs>` |
| [Tabs Pane [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-tabs-tabs-pane--documentatie) | deprecated | components | `<vl-tabs-pane>` | - | - |
| [Tabs Pane](/?path=/docs/components-block-tabs-tabs-pane--documentatie) | release v1.45.0 | components | `<vl-tabs-pane-next>` | components/block | `<vl-tabs-pane>` |

### Text

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Text [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-text--documentatie) | deprecated | elements | `<span is="vl-text">` | - | - |
| [Text](/?path=/docs/components-atom-text--documentatie) | release v1.42.0 | components | `<vl-text-next>` | components/atom | `<vl-text>` |

### Textarea / Textarea Rich

`Textarea [legacy]` had een attribuut om hem in 'rich'-mode te zetten, in v2 is die ontdubbeld in `Textarea` en
`Textarea Rich`.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Textarea [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-textarea--documentatie) | deprecated | components | `<textarea is="vl-textarea">` | - | - |
| [Textarea](/?path=/docs/components-form-textarea--documentatie) | release v1.25.0 | form | `<vl-textarea-next>` | components/form | `<vl-textarea>` |
|  |  |  |  |  |  |
| [Textarea Rich](/?path=/docs/components-form-textarea-rich--documentatie) | release v1.28.0 | form | `<vl-textarea-rich-next>` | components/form | `<vl-textarea-rich>` |

### Title

`Title [legacy]` had een variant per grootte, in v2 zijn deze samengevoegd en is er het 'type' attribuut.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Title - h1 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h1--documentatie) | deprecated | elements | `<h1 is="vl-h1">` | - | - |
|  |  |  |  |  |  |
| [Title - h2 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h2--documentatie) | deprecated | elements | `<h2 is="vl-h2">` | - | - |
|  |  |  |  |  |  |
| [Title - h3 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h3--documentatie) | deprecated | elements | `<h3 is="vl-h3">` | - | - |
|  |  |  |  |  |  |
| [Title - h4 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h4--documentatie) | deprecated | elements | `<h4 is="vl-h4">` | - | - |
|  |  |  |  |  |  |
| [Title - h5 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h5--documentatie) | deprecated | elements | `<h5 is="vl-h5">` | - | - |
|  |  |  |  |  |  |
| [Title - h6 [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-title-h6--documentatie) | deprecated | elements | `<h6 is="vl-h6">` | - | - |
| [Title](/?path=/docs/components-atom-title--documentatie) | release v1.33.0 | components | `<vl-title-next type="hx">` | components/atom | `<vl-title type="hx">` |

### Toaster

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Toaster [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-toaster--documentatie) | deprecated | components | `<div is="vl-toaster">` | - | - |
| [Toaster](/?path=/docs/components-block-toaster--documentatie) | release v1.43.0 | components | `<vl-toaster-next>` | components/block | `<vl-toaster>` |

### Tooltip

De `Tooltip` is verwijderd in v2.0.0 en opnieuw beschikbaar vanaf v2.7.0, maar de API is gewijzigd.
In v1 werd de trigger impliciet bepaald door de context; in v2.7.0 is `for` verplicht en verwijs je expliciet naar het `id` van het trigger-element.

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Tooltip](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-tooltip--documentatie) | impact | components | `<vl-tooltip data-vl-placement="top" data-vl-static>...</vl-tooltip>` | components/block | `<vl-tooltip for="trigger-id" placement="top" open>...</vl-tooltip>` |

nieuw in v2.7.0:
- `for` attribuut is verplicht om het trigger-element te koppelen
- `data-vl-placement` en `data-vl-static` worden respectievelijk `placement` en `open`
- extra configuratie via `distance`, `hide-arrow`, `strategy` en `type`

### Upload

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Upload [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/components-upload--documentatie) | deprecated | components | `<vl-upload>` | - | - |
| [Upload](/?path=/docs/components-form-upload--documentatie) | release v1.26.0 | form | `<vl-upload-next>` | components/form | `<vl-upload>` |

nieuw in v2:
- auto-default voor de URL werd toegevoegd
- de timeout werd uitgeschakeld (stond voorheen op 30s)
- het `parallel-uploads` attribuut is toegevoegd
- dropzone event handling werd uitgebreid
- in de context van WCAG verbeteringen komen de foutboodschappen nu onder de upload in plaats van erboven

### Video Player

| Naam | Toestand | v1 - Artifact | v1 - Gebruik | v2 - Artifact | v2 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Video Player [legacy]](https://flux.omgeving.vlaanderen.be/release-v1/1.48.0/storybook/?path=/docs/elements-video-player--documentatie) | deprecated | elements | `<vl-video-player>` | - | - |
| [Video Player](/?path=/docs/components-block-video-player--documentatie) | release v1.38.0 | components | `<vl-video-player-next>` | components/block | `<vl-video-player>` |
