# Formulier - Samengesteld veld

> Bouwt verder op [Formulier - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie),
> [Formulier - Aangepaste Validatie](/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie) en
> [Formulier - Form Data](/?path=/docs/patronen-formulier-form-data--documentatie). De betekenis van de
> validiteitsstaten en het koppelen van een `vl-form-message` staan daar beschreven; hier komt enkel
> het samenstellen van meerdere velden tot één control aan bod.

Soms vormen twee of meer velden **samen** een logische waarde: een coördinaat, een bedrag met
munteenheid, een van/tot-bereik. Dan wil je dat ze **als geheel** valideren: een gezamenlijke
geldigheid en foutboodschap per staat, terwijl elk veld wel zijn eigen waarde in het formulier
indient.

Zo'n control is **form-associated** (via `ElementInternals`). Het gedrag komt uit `CompositeFormControl` in de
bibliotheek; de component zelf bouw je in je eigen project, onder je eigen tag.

Blijft elk veld een eigen gegeven, maar hangt de geldigheid van het ene af van de waarde van het andere? Dan is
[Formulier - Cross-Validatie](/?path=/docs/patronen-formulier-cross-validatie--documentatie) het patroon dat je zoekt.

De `vl-composite-input` in de voorbeelden hieronder is dus voorbeeldcode van deze pagina en geen
bibliotheekcomponent: importeren kan niet, overnemen wel.

## Gebruik

```ts
import { CompositeFormControl } from '@domg-wc/components/form';
```

`CompositeFormControl` doet het werk: kinderen lezen, luisteren naar hun wijzigingen, `disabled`/`success`
doorgeven en de validators instellen. Je eigen component beperkt zich tot de tag en de markup:

```ts
@webComponent('mijn-composite-input')
export class MijnCompositeInput extends CompositeFormControl {
    render() {
        return html`<fieldset>
            <legend class="vl-u-visually-hidden">${this.label}</legend>
            <slot @slotchange=${this.onSlotChange}></slot>
        </fieldset>`;
    }
}
```

Daarna plaats je je eigen form-controls, elk met een `name`, als kinderen. De regel die over de velden samen gaat,
schrijf je zelf in de `customValidator`.

Wil je een eigen validator toevoegen naast die van de basisklasse:

```ts
static formControlValidators = [...CompositeFormControl.formControlValidators, mijnValidator];
```

Zo'n validator krijgt de instance binnen; `instance.fieldValues` geeft je de waarden van de kinderen, gesleuteld op
hun `name`:

```ts
const mijnValidator: Validator = {
    key: 'customError',
    message: 'Beide waarden moeten even lang zijn.',
    isValid: (instance: CompositeFormControl) => {
        const { links, rechts } = instance.fieldValues;
        return links.length === rechts.length;
    },
};
```

De interne leden zijn `protected`, zodat je ze kan hergebruiken of overschrijven: `syncFields()` om de velden
opnieuw in te lezen na een wijziging in code, `propagatedAttributes` om te bepalen welke attributen naar de kinderen
gaan, en `propagateAttribute()` om er zelf een door te geven.

**vl-composite-input.component.ts**

```ts
// Voorbeeldcomponent bij de documentatiepagina "Formulier - Samengesteld veld".
// Dit is geen bibliotheekcomponent: neem hem over in je eigen project, onder je eigen tag.
// Het gedrag komt uit CompositeFormControl, die wel uit de bibliotheek komt.
import { webComponent } from '@domg-wc/common';
import { CompositeFormControl } from '@domg-wc/components/form';
import { css, CSSResult, html, TemplateResult } from 'lit';

@webComponent('vl-composite-input')
export class CompositeInputComponent extends CompositeFormControl {
    static get styles(): CSSResult[] {
        return [
            css`
                fieldset {
                    border: 0;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .vl-u-visually-hidden {
                    position: absolute !important;
                    height: 1px;
                    width: 1px;
                    overflow: hidden;
                    clip: rect(1px, 1px, 1px, 1px);
                    margin: -1px;
                    padding: 0;
                    border: 0;
                    left: 0;
                    top: 0;
                }
            `,
        ];
    }

    render(): TemplateResult {
        return html`
            <fieldset part="fieldset">
                <legend class="vl-u-visually-hidden">${this.label || 'Samengesteld invoerveld'}</legend>
                <slot @slotchange=${this.onSlotChange}></slot>
            </fieldset>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-composite-input': CompositeInputComponent;
    }
}
```

## Patroon

- **N velden**: het patroon is niet beperkt tot twee. Elk bijkomend form-control met een eigen `name` doet automatisch
  mee.
- **Doorgeven**: `disabled` en `success` geeft de composite door aan haar kinderen. `error` niet: daarmee zet je de
  composite zelf op ongeldig.
- **`required`**: op de composite betekent het dat álle velden ingevuld moeten zijn, met één melding voor het
  samengestelde veld. Wil je één veld apart verplicht maken, zet `required` dan op dat kind; dat veld toont dan zijn
  eigen melding.

In het voorbeeld hieronder vormen twee `vl-input-field` velden (longitude + latitude) één `required` control. Elk veld
draagt zijn eigen `min`/`max`, en een eigen validator controleert of het punt binnen België ligt. Probeer
`lon=4.35, lat=50.85` (Brussel, geldig), daarna `lon=7.5, lat=48` (buiten België).

> Story: [formulier - samengesteld veld](/?path=/story/patronen-formulier-samengesteld-veld--formulier-samengesteld-veld)

De kern, zonder de demo-omkadering:

```html
<!-- vl-composite-input is de voorbeeldcomponent van deze pagina, geen bibliotheekcomponent:
     in je eigen project bouw je hem met CompositeFormControl, onder je eigen tag. -->

<!-- Elke melding wordt binnen de form opgezocht: composite, velden en meldingen moeten in dezelfde <form> staan,
     anders verschijnt er niets. De validatie loopt bij het versturen. -->
<form>
    <vl-composite-input id="coordinaten" label="Coördinaten (lon, lat)" required>
        <!-- name = sleutel in de FormData en in de validator; id = waar een vl-form-message naar verwijst -->
        <vl-input-field id="lon" name="coordinaten-lon" label="Longitude" type="number" min="-180" max="180"></vl-input-field>
        <vl-input-field id="lat" name="coordinaten-lat" label="Latitude" type="number" min="-90" max="90"></vl-input-field>
    </vl-composite-input>

    <!-- meldingen voor het samengestelde veld, op de composite; leeg gelaten = de composite vult de tekst zelf in -->
    <vl-form-message for="coordinaten" state="valueMissing"></vl-form-message>
    <vl-form-message for="coordinaten" state="customError"></vl-form-message>

    <!-- melding per veld, op het kind, met eigen tekst per staat -->
    <vl-form-message for="lon" state="rangeUnderflow">Longitude moet minstens -180 zijn.</vl-form-message>
    <vl-form-message for="lon" state="rangeOverflow">Longitude mag maximaal 180 zijn.</vl-form-message>
    <vl-form-message for="lat" state="rangeUnderflow">Latitude moet minstens -90 zijn.</vl-form-message>
    <vl-form-message for="lat" state="rangeOverflow">Latitude mag maximaal 90 zijn.</vl-form-message>

    <button type="submit">Verstuur</button>
</form>
```

Dit levert de FormData-sleutels `coordinaten-lon` en `coordinaten-lat` op.

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent, VlTextComponent } from '@domg-wc/components/atom';
import {
    parseFormData,
    VlFormMessageComponent,
    VlFormLabelComponent,
    VlInputFieldComponent,
    type CompositeValues,
} from '@domg-wc/components/form';
import { CompositeInputComponent } from './vl-composite-input.component';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

// Validator voor het samengestelde veld: krijgt per `name` van elk kind de waarde, als tekst.
// Geef een string terug om af te keuren, die tekst wordt de foutmelding; geef null terug als alles in orde is.
// Hij loopt pas wanneer alle velden ingevuld zijn: onvolledige invoer handelt `required` af.
const inBelgium = ({ 'coordinaten-lon': lon, 'coordinaten-lat': lat }: CompositeValues): string | null => {
    const longitude = parseFloat(lon);
    const latitude = parseFloat(lat);
    if (longitude < 2.5 || longitude > 6.5 || latitude < 49.5 || latitude > 51.6) {
        return `(lon=${lon}, lat=${lat}) ligt buiten België`;
    }
    return null;
};

@webComponent('vl-form-composite-input')
export class VlFormCompositeInputComponent extends LitElement {
    private parsedFormData: Record<string, FormDataEntryValue> | null = null;

    static {
        registerWebComponents([
            CompositeInputComponent,
            VlInputFieldComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlButtonComponent,
            VlTextComponent,
        ]);
    }

    static override get properties(): PropertyDeclarations {
        return {
            parsedFormData: { type: Object, state: true },
        };
    }

    static override get styles(): (CSSResult | CSSResult[])[] {
        return [
            vlLegacyStyles,
            vlGridStyles,
            css`
                form {
                    margin-top: 1rem;
                    max-width: 800px;
                }

                .form-buttons {
                    vl-button:not(:last-child) {
                        margin-right: 1.4rem;
                    }
                }

                pre {
                    font-size: 1rem;
                }
            `,
        ];
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="coordinaten" label="Coördinaten (lon, lat) *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <!-- De composite heeft geen name: ze dient zelf geen waarde in, ze valideert de velden samen.
                             Haar id gebruik je in vl-form-label[for] en in de meldingen voor het samengestelde veld.
                             required betekent hier dat alle velden ingevuld moeten zijn. -->
                        <vl-composite-input
                            id="coordinaten"
                            label="Coördinaten (lon, lat)"
                            required
                            .customValidator=${inBelgium}
                        >
                            <!-- Een veld is een direct kind met een value en een name. Die name is de sleutel in de
                                 FormData en in de validator hierboven; het id gebruik je enkel om er een eigen
                                 vl-form-message aan te koppelen. Veldspecifieke constraints (hier min/max) zet je
                                 op het kind, niet op de composite. -->
                            <vl-input-field
                                id="lon"
                                name="coordinaten-lon"
                                label="Longitude"
                                type="number"
                                min="-180"
                                max="180"
                            ></vl-input-field>
                            <vl-input-field
                                id="lat"
                                name="coordinaten-lat"
                                label="Latitude"
                                type="number"
                                min="-90"
                                max="90"
                            ></vl-input-field>
                        </vl-composite-input>
                        <vl-text annotation small
                            >Vul de longitude en latitude in graden in (bv. Brussel: 4,35 en 50,85). Enkel punten
                            binnen België zijn geldig.</vl-text
                        >
                        <!-- De meldingen voor het samengestelde veld hangen aan de composite. Laat je ze leeg, dan
                             vult de composite ze zelf in: valueMissing met een opsomming van de nog lege velden (op
                             basis van hun label), customError met de string uit de validator. Eigen tekst wint. -->
                        <vl-form-message for="coordinaten" state="valueMissing"></vl-form-message>
                        <vl-form-message for="coordinaten" state="customError"></vl-form-message>
                        <!-- Een melding per veld verwijst naar het id van dat kind, met eigen tekst per staat. -->
                        <vl-form-message for="lon" state="rangeUnderflow"
                            >Longitude moet minstens -180 zijn.</vl-form-message
                        >
                        <vl-form-message for="lon" state="rangeOverflow"
                            >Longitude mag maximaal 180 zijn.</vl-form-message
                        >
                        <vl-form-message for="lat" state="rangeUnderflow"
                            >Latitude moet minstens -90 zijn.</vl-form-message
                        >
                        <vl-form-message for="lat" state="rangeOverflow"
                            >Latitude mag maximaal 90 zijn.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                    ${this.parsedFormData
                        ? html`
                              <div class="vl-column vl-column--4">
                                  <vl-form-label class="vl-form__label">Formulier data</vl-form-label>
                              </div>
                              <div class="vl-column vl-column--8">
                                  <pre>${JSON.stringify(this.parsedFormData, null, 4)}</pre>
                              </div>
                          `
                        : ''}
                </div>
            </form>
        `;
    }

    // Bij een gewone submit valideert de browser eerst, dus hier is de invoer zeker volledig. Lees je elders zelf
    // new FormData(form) uit, controleer dan eerst form.checkValidity(): de composite houdt onvolledige invoer tegen
    // met validatie, ze laat de waarden wel in de FormData staan.
    private onSubmit(event: Event) {
        event.preventDefault();
        this.parsedFormData = parseFormData(event.target as HTMLFormElement) as Record<string, FormDataEntryValue>;
    }

    private onReset() {
        this.parsedFormData = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-form-composite-input': VlFormCompositeInputComponent;
    }
}
```

## Andere voorbeelden

De `customValidator` krijgt de waarden als tekst, dus je zet ze zelf om naar wat je nodig hebt. Zo werkt dit met elk
veld dat een `value` heeft.

### Getal + eenheid (`vl-input-field` + `vl-select`)

> Story: [formulier - samengesteld veld - getal + eenheid (vl-select)](/?path=/story/patronen-formulier-samengesteld-veld--formulier-samengesteld-veld-eenheid)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent, VlTextComponent } from '@domg-wc/components/atom';
import {
    parseFormData,
    SelectOption,
    VlFormLabelComponent,
    VlFormMessageComponent,
    VlInputFieldComponent,
    VlSelectComponent,
    type CompositeValues,
} from '@domg-wc/components/form';
import { CompositeInputComponent } from './vl-composite-input.component';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

const EENHEDEN: SelectOption[] = [
    { value: 'cm', label: 'centimeter (cm)' },
    { value: 'dm', label: 'decimeter (dm)' },
    { value: 'm', label: 'meter (m)' },
];

const METER_PER_EENHEID: Record<string, number> = { cm: 0.01, dm: 0.1, m: 1 };

const MIN_METER = 0.01;
const MAX_METER = 100;

// Het getal alleen kan je niet nakijken: 50 is pas een lengte samen met zijn eenheid.
// Daarom rekent deze validator beide waarden om naar meter en kijkt hij dan pas of ze binnen het bereik vallen.
const binnenBereik = ({ 'lengte-waarde': waarde, 'lengte-eenheid': eenheid }: CompositeValues): string | null => {
    const factor = METER_PER_EENHEID[eenheid];
    const getal = parseFloat(waarde);

    if (!factor || Number.isNaN(getal)) {
        return null;
    }

    const meter = getal * factor;

    if (meter < MIN_METER || meter > MAX_METER) {
        return `${waarde} ${eenheid} is ${meter.toFixed(2)} m; de lengte moet tussen ${MIN_METER} m en ${MAX_METER} m liggen.`;
    }

    return null;
};

@webComponent('vl-form-composite-input-eenheid')
export class VlFormCompositeInputEenheidComponent extends LitElement {
    private parsedFormData: Record<string, FormDataEntryValue> | null = null;

    static {
        registerWebComponents([
            CompositeInputComponent,
            VlInputFieldComponent,
            VlSelectComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlButtonComponent,
            VlTextComponent,
        ]);
    }

    static override get properties(): PropertyDeclarations {
        return {
            parsedFormData: { type: Object, state: true },
        };
    }

    static override get styles(): (CSSResult | CSSResult[])[] {
        return [
            vlLegacyStyles,
            vlGridStyles,
            css`
                form {
                    margin-top: 1rem;
                    max-width: 800px;
                }

                .form-buttons {
                    vl-button:not(:last-child) {
                        margin-right: 1.4rem;
                    }
                }

                pre {
                    font-size: 1rem;
                }
            `,
        ];
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="lengte" label="Lengte *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-composite-input id="lengte" label="Lengte" required .customValidator=${binnenBereik}>
                            <vl-input-field
                                id="waarde"
                                name="lengte-waarde"
                                label="Waarde"
                                type="number"
                                min="0"
                            ></vl-input-field>
                            <vl-select
                                id="eenheid"
                                name="lengte-eenheid"
                                label="Eenheid"
                                placeholder="Kies een eenheid"
                                .options=${EENHEDEN}
                            ></vl-select>
                        </vl-composite-input>
                        <vl-text annotation small
                            >Het getal betekent niets zonder de eenheid: samen vormen ze één lengte. Enkel lengtes
                            tussen ${MIN_METER} m en ${MAX_METER} m zijn geldig, dus 5000 cm mag wel en 5000 m
                            niet.</vl-text
                        >
                        <vl-form-message for="lengte" state="valueMissing"
                            >Zowel de waarde als de eenheid zijn verplicht.</vl-form-message
                        >
                        <vl-form-message for="lengte" state="customError"></vl-form-message>
                        <vl-form-message for="waarde" state="rangeUnderflow"
                            >De waarde mag niet negatief zijn.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                    ${this.parsedFormData
                        ? html`
                              <div class="vl-column vl-column--4">
                                  <vl-form-label class="vl-form__label">Formulier data</vl-form-label>
                              </div>
                              <div class="vl-column vl-column--8">
                                  <pre>${JSON.stringify(this.parsedFormData, null, 4)}</pre>
                              </div>
                          `
                        : ''}
                </div>
            </form>
        `;
    }

    private onSubmit(event: Event) {
        event.preventDefault();
        this.parsedFormData = parseFormData(event.target as HTMLFormElement) as Record<string, FormDataEntryValue>;
    }

    private onReset() {
        this.parsedFormData = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-form-composite-input-eenheid': VlFormCompositeInputEenheidComponent;
    }
}
```

### Datumbereik (twee `vl-datepicker`)

> Story: [formulier - samengesteld veld - datumbereik (vl-datepicker)](/?path=/story/patronen-formulier-samengesteld-veld--formulier-samengesteld-veld-datumbereik)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent, VlTextComponent } from '@domg-wc/components/atom';
import {
    parseFormData,
    VlDatepickerComponent,
    VlFormLabelComponent,
    VlFormMessageComponent,
    type CompositeValues,
} from '@domg-wc/components/form';
import { CompositeInputComponent } from './vl-composite-input.component';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

// Elke datum is op zich geldig; enkel de volgorde kan fout zijn.
// De datepickers geven hun waarde als ISO-datum, dus Date.parse volstaat om ze te vergelijken.
const beginVoorEinde = ({ 'periode-begin': begin, 'periode-einde': einde }: CompositeValues): string | null => {
    const beginTijd = Date.parse(begin);
    const eindeTijd = Date.parse(einde);
    if (Number.isNaN(beginTijd) || Number.isNaN(eindeTijd)) return null;
    return beginTijd > eindeTijd ? 'De begindatum ligt na de einddatum.' : null;
};

@webComponent('vl-form-composite-input-datumbereik')
export class VlFormCompositeInputDatumbereikComponent extends LitElement {
    private parsedFormData: Record<string, FormDataEntryValue> | null = null;

    static {
        registerWebComponents([
            CompositeInputComponent,
            VlDatepickerComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlButtonComponent,
            VlTextComponent,
        ]);
    }

    static override get properties(): PropertyDeclarations {
        return {
            parsedFormData: { type: Object, state: true },
        };
    }

    static override get styles(): (CSSResult | CSSResult[])[] {
        return [
            vlLegacyStyles,
            vlGridStyles,
            css`
                form {
                    margin-top: 1rem;
                    max-width: 800px;
                }

                .form-buttons {
                    vl-button:not(:last-child) {
                        margin-right: 1.4rem;
                    }
                }

                pre {
                    font-size: 1rem;
                }
            `,
        ];
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="periode" label="Periode *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-composite-input
                            id="periode"
                            label="Periode"
                            required
                            .customValidator=${beginVoorEinde}
                        >
                            <vl-datepicker
                                id="begin"
                                name="periode-begin"
                                label="Begindatum"
                                type="date"
                                format="d-m-Y"
                                anchor-positioning
                            ></vl-datepicker>
                            <vl-datepicker
                                id="einde"
                                name="periode-einde"
                                label="Einddatum"
                                type="date"
                                format="d-m-Y"
                                anchor-positioning
                            ></vl-datepicker>
                        </vl-composite-input>
                        <vl-text annotation small
                            >Kies een begin- en einddatum (dd-mm-jjjj). De begindatum mag niet na de einddatum
                            liggen.</vl-text
                        >
                        <vl-form-message for="periode" state="valueMissing"
                            >Begin- en einddatum zijn verplicht.</vl-form-message
                        >
                        <vl-form-message for="periode" state="customError"></vl-form-message>
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                    ${this.parsedFormData
                        ? html`
                              <div class="vl-column vl-column--4">
                                  <vl-form-label class="vl-form__label">Formulier data</vl-form-label>
                              </div>
                              <div class="vl-column vl-column--8">
                                  <pre>${JSON.stringify(this.parsedFormData, null, 4)}</pre>
                              </div>
                          `
                        : ''}
                </div>
            </form>
        `;
    }

    private onSubmit(event: Event) {
        event.preventDefault();
        this.parsedFormData = parseFormData(event.target as HTMLFormElement) as Record<string, FormDataEntryValue>;
    }

    private onReset() {
        this.parsedFormData = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-form-composite-input-datumbereik': VlFormCompositeInputDatumbereikComponent;
    }
}
```

### Contactmethode (`vl-select` + `vl-input-field`)

> Story: [formulier - samengesteld veld - contactmethode](/?path=/story/patronen-formulier-samengesteld-veld--formulier-samengesteld-veld-contact)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent, VlTextComponent } from '@domg-wc/components/atom';
import {
    parseFormData,
    SelectOption,
    VlFormLabelComponent,
    VlFormMessageComponent,
    VlInputFieldComponent,
    VlSelectComponent,
    type CompositeValues,
} from '@domg-wc/components/form';
import { CompositeInputComponent } from './vl-composite-input.component';
import { css, CSSResult, html, LitElement, PropertyDeclarations, nothing } from 'lit';

const METHODS: SelectOption[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'tel', label: 'Telefoon' },
];

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^[\d\s/().+-]{6,}$/;

// Het eerste veld bepaalt welke regel op het tweede geldt: een e-mailadres of een telefoonnummer.
// Het tweede veld verschijnt pas na die keuze; een veld dat later bijkomt telt automatisch mee in de validatie.
const valideerContact = ({ 'contact-method': method, 'contact-value': value }: CompositeValues): string | null => {
    if (!method || !value) return null;
    if (method === 'email') return EMAIL.test(value) ? null : `'${value}' is geen geldig e-mailadres.`;
    if (method === 'tel') return PHONE.test(value) ? null : `'${value}' is geen geldig telefoonnummer.`;
    return null;
};

@webComponent('vl-form-composite-input-contact')
export class VlFormCompositeInputContactComponent extends LitElement {
    private method = '';
    private contact = '';
    private parsedFormData: Record<string, FormDataEntryValue> | null = null;

    static {
        registerWebComponents([
            CompositeInputComponent,
            VlSelectComponent,
            VlInputFieldComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlButtonComponent,
            VlTextComponent,
        ]);
    }

    static override get properties(): PropertyDeclarations {
        return {
            method: { type: String, state: true },
            contact: { type: String, state: true },
            parsedFormData: { type: Object, state: true },
        };
    }

    static override get styles(): (CSSResult | CSSResult[])[] {
        return [
            vlLegacyStyles,
            vlGridStyles,
            css`
                form {
                    margin-top: 1rem;
                    max-width: 800px;
                }

                .form-buttons {
                    vl-button:not(:last-child) {
                        margin-right: 1.4rem;
                    }
                }

                pre {
                    font-size: 1rem;
                }
            `,
        ];
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="contact" label="Contactgegeven *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-composite-input
                            id="contact"
                            label="Contactgegeven"
                            required
                            .customValidator=${valideerContact}
                        >
                            <vl-select
                                id="method"
                                name="contact-method"
                                label="Contactmethode"
                                placeholder="Kies een methode"
                                .value=${this.method}
                                .options=${METHODS}
                                @vl-change=${this.onMethodChange}
                            ></vl-select>
                            ${this.method === 'email'
                                ? html`<vl-input-field
                                      id="value"
                                      name="contact-value"
                                      label="E-mailadres"
                                      type="email"
                                      placeholder="naam@voorbeeld.be"
                                      .value=${this.contact}
                                      @vl-input=${this.onContactInput}
                                  ></vl-input-field>`
                                : nothing}
                            ${this.method === 'tel'
                                ? html`<vl-input-field
                                      id="value"
                                      name="contact-value"
                                      label="Telefoonnummer"
                                      type="tel"
                                      placeholder="+32 ..."
                                      .value=${this.contact}
                                      @vl-input=${this.onContactInput}
                                  ></vl-input-field>`
                                : nothing}
                        </vl-composite-input>
                        <vl-text annotation small
                            >Kies eerst een methode; vul dan een geldig e-mailadres (naam@voorbeeld.be) of
                            telefoonnummer in.</vl-text
                        >
                        <vl-form-message for="contact" state="valueMissing"
                            >Kies een methode en vul het contactgegeven in.</vl-form-message
                        >
                        <vl-form-message for="contact" state="customError"></vl-form-message>
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                    ${this.parsedFormData
                        ? html`
                              <div class="vl-column vl-column--4">
                                  <vl-form-label class="vl-form__label">Formulier data</vl-form-label>
                              </div>
                              <div class="vl-column vl-column--8">
                                  <pre>${JSON.stringify(this.parsedFormData, null, 4)}</pre>
                              </div>
                          `
                        : ''}
                </div>
            </form>
        `;
    }

    private onMethodChange(event: CustomEvent) {
        this.method = (event.target as HTMLElement & { value: string }).value;
        this.contact = '';
    }

    private onContactInput(event: CustomEvent<{ value: string }>) {
        this.contact = event.detail?.value ?? '';
    }

    private onSubmit(event: Event) {
        event.preventDefault();
        this.parsedFormData = parseFormData(event.target as HTMLFormElement) as Record<string, FormDataEntryValue>;
    }

    private onReset() {
        this.method = '';
        this.contact = '';
        this.parsedFormData = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-form-composite-input-contact': VlFormCompositeInputContactComponent;
    }
}
```

## Toegankelijkheid

- Zet een `label` op de composite én op elk kind, zodat schermlezers elk veld kunnen benoemen.
