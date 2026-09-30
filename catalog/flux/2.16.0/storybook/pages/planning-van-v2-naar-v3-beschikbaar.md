# Van v2 naar v3 - beschikbaar

## Inhoudstafel

- [Aanpak](#aanpak)
- [Geïmpacteerde Web Componenten](#geïmpacteerde-web-componenten)

## Aanpak

Op deze pagina vind je een overzicht van de web componenten die geïmpacteerd zijn door de migratie van
v2 naar v3 en die reeds beschikbaar zijn.

Hieronder vind je alfabetisch, per component, een tabel met daarin een overzicht van wat er in v2 en v3
beschikbaar is (zal zijn), je kan doorklikken op de naam om naar de documentatie van die component te gaan.

- elke component is ontdubbeld, de legacy variant staat in een donkere rij, de next variant in de erop volgende
witte rij
- voor de next variant staat gespecifieerd sinds welke release hij beschikbaar is
- typisch hebben de legacy en de next variant dezelfde naam, maar niet altijd
- momenteel zijn er enkel v1 en v2 releases, wat er zal gebeuren in v3 is informatief; er is nog geen v3 beschikbaar

## Geïmpacteerde Web Componenten

### Datepicker

In v2 is het `anchor-positioning` attribuut toegevoegd. In v3 wordt deze codepath de default
en wordt de oude positionering verwijderd. Apps die `anchor-positioning` in v2 niet hebben gezet
moeten na de v3 upgrade verifiëren dat hun datepicker correct rendert.

| Naam | Toestand | v2 - Default | v3 - Default | v2 - Gebruik |
| --- | --- | --- | --- | --- |
| [Datepicker](/?path=/docs/components-form-datepicker--documentatie) | release v2.14.0 | flatpickr getBoundingClientRect positionering | Popover API + CSS Anchor Positioning | `<vl-datepicker anchor-positioning>` |

### Footer

`Footer [legacy]` wordt vervangen door `Footer [next]`.

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Footer [legacy]](/?path=/docs/components-compliance-footer--documentatie) | deprecated | components/compliance | `<vl-footer>` | - | - |
| [Footer [next]](/?path=/docs/components-compliance-next-footer--documentatie) | release v2.3.0 | components/compliance/next | `<vl-footer-next>` | components/compliance | `<vl-footer>` |

### Header

`Header [legacy]` wordt vervangen door `Header [next]`.

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Header [legacy]](/?path=/docs/components-compliance-header--documentatie) | deprecated | components/compliance | `<vl-header>` | - | - |
| [Header [next]](/?path=/docs/components-compliance-next-header--documentatie) | release v2.3.0 | components/compliance/next | `<vl-header-next>` | components/compliance | `<vl-header>` |

### Search

`Search` is deprecated in v2 en wordt verwijderd in v3. Bouw voortaan een zoekformulier
met de [`input-group`](/?path=/docs/components-form-input-group--documentatie) (`vl-input-field` + `vl-button` met
`loading`) - zie het [zoek-patroon](/?path=/docs/patronen-zoeken-loading-state--documentatie).

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Search [legacy]](/?path=/docs/components-block-search--documentatie) | deprecated | components/block | `<vl-search>` | - | `-` |

### Share Buttons

`Share Buttons` is deprecated in v2 en wordt verwijderd in v3. Er komt geen `next`-variant: gebruik een
`vl-button` met `cta-link`, `icon` en een verplicht `label` (standaard action-blauw).

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Share Buttons [legacy]](/?path=/docs/components-block-share-buttons-share-buttons--documentatie) | deprecated | components/block | `<vl-share-buttons>` | - | `-` |

### Side Navigation

`Side Navigation [legacy]` wordt vervangen door `Side Navigation [next]`.

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Side Navigation [legacy]](/?path=/docs/components-block-side-navigation--documentatie) | deprecated | components/block | `<vl-side-navigation>` | - | - |
| [Side Navigation [next]](/?path=/docs/components-next-side-navigation-side-navigation--documentatie) | release v2.9.0 | components/block/next | `<vl-side-navigation-next>` | components/block | `<vl-side-navigation>` |

### Side Navigation Layout

`Side Navigation Layout` is een nieuwe component zonder legacy equivalent. Deze component biedt een out-of-the-box
layout oplossing met automatische grid styling voor de
[Side Navigation [next]](/?path=/docs/components-next-side-navigation-side-navigation--documentatie).

Deze component is niet compatibel met de oude [Side Navigation [legacy]](/?path=/docs/components-block-side-navigation--documentatie).

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Side Navigation Layout](/?path=/docs/components-next-side-navigation-side-navigation-layout--documentatie) | release v2.9.0 | components/block/next | `<vl-side-navigation-layout-next>` | components/block | `<vl-side-navigation-layout-next>` |

### Tabs

`Tabs [legacy]` wordt vervangen door `Tabs [next]`. Deze component is herschreven om naast een standaard Tab-widget ook een standaard horizontale navigatie mogelijk te maken. Daarnaast zijn er ook verbeteringen aangebracht om de ARIA standaarden voor de Tab-widget en Listbox-widget beter te implementeren.

| Naam | Toestand | v2 - Artifact | v2 - Gebruik | v3 - Artifact | v3 - Gebruik |
| --- | --- | --- | --- | --- | --- |
| [Tabs [legacy]](/?path=/docs/components-block-tabs-tabs--documentatie) | deprecated | components/block | `<vl-tabs>` | - | - |
| [Tabs [next]](/?path=/docs/components-block-next-tabs--documentatie) | release v2.13.0 | components/block/next | `<vl-tabs-next>` | components/block | `<vl-tabs>` |
