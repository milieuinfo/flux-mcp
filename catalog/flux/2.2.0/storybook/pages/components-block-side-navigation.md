# Side Navigation

> [!NOTE]
> **Opgelet**
> De v2 versie van deze component gebruik je via custom-tags, de interne implementatie is gelijk gebleven aan
> de v1 versie. In v3 zal deze component grondig herwerkt worden.

Gebruik de `side-navigation` component om een compact navigatie-element aan een pagina toe te voegen. Het vat de
inhoud van lange pagina's samen, leidt de gebruiker door de pagina inhoud en kan ook naar externe pagina's verwijzen.

De `vl-side-navigation` wordt opgebouwd uit volgende sub-componenten:

- VlSideNavigation `[vl-side-navigation]`
- VlSideNavigationTitle

    `[vl-side-navigation-h1 / vl-side-navigation-h2 / vl-side-navigation-h3 /`
    `vl-side-navigation-h4 / vl-side-navigation-h5 / vl-side-navigation-h6]`
- VlSideNavigationContent `[vl-side-navigation-content]`
- VlSideNavigationGroup `[vl-side-navigation-group]`
- VlSideNavigationItem `[vl-side-navigation-item]`
- VlSideNavigationToggle `[vl-side-navigation-toggle]`
- VlSideNavigationReference `[vl-side-navigation-reference]`

```js
import { VlSideNavigation } from '@domg-wc/components/block';
```

```html
<vl-side-navigation></vl-side-navigation>
```

> Story: [vl-side-navigation - default](/?path=/story/components-block-side-navigation--side-navigation-default)

## Code Voorbeeld

**Side-navigation code voorbeeld**

```html
<section class="vl-section">
    <div class="vl-content-block">
        <div class="vl-grid vl-stacked-medium">
            <div
                class="vl-column vl-column--8 vl-column--m-8 vl-column--s-12 vl-column--xs-12"
            >
                <vl-side-navigation-reference>
                    <section id="content-1" class="vl-section">
                        <vl-title type="h2">Content 1</vl-title>
                    </section>
                    <section id="content-1-1" class="vl-section">
                        <vl-title type="h3">Content 1 - 1</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-1-2" class="vl-section">
                        <vl-title type="h3">Content 1 - 2</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-1-3" class="vl-section">
                        <vl-title type="h3">Content 1 - 3</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-1-4" class="vl-section">
                        <vl-title type="h3">Content 1 - 4</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-2" class="vl-section">
                        <vl-title type="h2">Content 2</vl-title>
                    </section>
                    <section id="content-2-1" class="vl-section">
                        <vl-title type="h3">Content 2 - 1</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-2-2" class="vl-section">
                        <vl-title type="h3">Content 2 - 2</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-2-3" class="vl-section">
                        <vl-title type="h3">Content 2 - 3</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-2-4" class="vl-section">
                        <vl-title type="h3">Content 2 - 4</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                    <section id="content-3" class="vl-section">
                        <vl-title type="h2">Content 3</vl-title>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa
                            qui officia deserunt mollit anim id est laborum.
                        </p>
                    </section>
                </vl-side-navigation-reference>
            </div>
            <div class="vl-column vl-column--4 vl-column--m-4 vl-column--s-12 vl-column--xs-12">
                <vl-side-navigation aria-label="inhoudsopgave">
                    <vl-side-navigation-h5>Op deze pagina</vl-side-navigation-h5>
                    <vl-side-navigation-content>
                        <vl-side-navigation-group>
                            <vl-side-navigation-item parent="content-1">
                                <vl-side-navigation-toggle href="#content-1" child="content-1">
                                    content 1
                                </vl-side-navigation-toggle>
                                <ul>
                                    <vl-side-navigation-item>
                                        <a href="#content-1-1" parent="content-1">content 1 - 1</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-1-2" parent="content-1">content 1 - 2</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-1-3" parent="content-1">content 1 - 3</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-1-4" parent="content-1">content 1 - 4</a>
                                    </vl-side-navigation-item>
                                </ul>
                            </vl-side-navigation-item>
                            <vl-side-navigation-item parent="content-2">
                                <vl-side-navigation-toggle href="#content-2" child="content-2">
                                    content 2
                                </vl-side-navigation-toggle>
                                <ul>
                                    <vl-side-navigation-item>
                                        <a href="#content-2-1" parent="content-2">content 2 - 1</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-2-2" parent="content-2">content 2 - 2</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-2-3" parent="content-2">content 2 - 3</a>
                                    </vl-side-navigation-item>
                                    <vl-side-navigation-item>
                                        <a href="#content-2-4" parent="content-2">content 2 - 4</a>
                                    </vl-side-navigation-item>
                                </ul>
                            </vl-side-navigation-item>
                            <vl-side-navigation-item>
                                <a href="#content-3">
                                    content 3
                                </a>
                            </vl-side-navigation-item>
                        </vl-side-navigation-group>
                    </vl-side-navigation-content>
                </vl-side-navigation>
            </div>
        </div>
    </div>
</section>
```

## Responsive variant

Op mobiel zal de `vl-side-navigation` een knop bovenaan tonen die de gebruiker de mogelijkheid geeft het
navigatie-menu te openen. Als de gebruiker scrollt, zal deze knop verdwijnen en komt er na een korte delay een sticky
knop met dezelfde functionaliteit rechtsonder de pagina. Deze knop blijft zichtbaar zolang de gebruiker scrollt in een
gebied gerelateerd tot de `vl-side-navigation-reference`.

## Parent en child links

Het is mogelijk om parent en child links te gebruiken (zie content 1 en content 2). Dit gebeurt op de volgende
manier (we gebruiken content 1 als voorbeeld):

1. Plaats op het parent `VlSideNavigationItem` component het attribuut `parent="content-1"`
2. Plaats op het `VlSideNavigationToggle` component het attribuut `child="content-1"`
3. Plaats op de child links het attribuut `parent="content-1"`

Plaats naast het `VlSideNavigationToggle` component een lijst element (`<ul>`) met daaronder `VlSideNavigationItem` componenten als items.

Gebruik geen `VlSideNavigationToggle` component indien er geen subnavigatie is. Een gewone link (`<a href="#">`) onder het `VlSideNavigationItem` component volstaat dan.

## Gekende beperkingen

### Proza messages

Door de complexiteit van de side-navigation kan het zijn dat er problemen optreden met het renderen van Proza messages.
Proza messages renderen regelmatig niet tot er een resize van de window optreedt. Om dit op te lossen kan je gebruik
maken van het `side-navigation-id` attribuut, aan dit attribuut geef je een unieke string mee. Deze manier van
werken is een tijdelijke quick-fix, in de nieuwe versie van de side-navigation gaat dit probleem niet voorkomen.

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Side Navigation](https://overheid.vlaanderen.be/webuniversum/v3/documentation/components/vl-ui-side-navigation)

### Legacy Documentatie

[Legacy Storybook - Side Navigation](https://webcomponenten.omgeving.vlaanderen.be/storybook/?path=/docs/native-elements-vl-side-navigation--default)

[Legacy Documentatie - Side Navigation](https://webcomponenten.omgeving.vlaanderen.be/doc/VlSideNavigation.html)

[Legacy Demo - Side Navigation](https://webcomponenten.omgeving.vlaanderen.be/demo/vl-side-navigation.html)
