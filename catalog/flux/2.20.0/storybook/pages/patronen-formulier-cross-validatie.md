# Formulier - Cross-Validatie

> Bouwt verder op [Formulier - Validatie](/?path=/docs/patronen-formulier-validatie--documentatie) en
> [Formulier - Aangepaste Validatie](/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie). Hoe je een custom
> validator schrijft en een `vl-form-message` koppelt staat daar beschreven; hier komt enkel de afhankelijkheid van een
> **ander veld** aan bod.

Soms hangt de geldigheid van een veld af van de waarde van een ander veld in hetzelfde formulier: een code die enkel
bij een bepaalde procedure geldt, een bevestigingsveld dat moet overeenkomen, een veld dat enkel verplicht is bij een
bepaalde keuze.

Vormen de velden samen één waarde, zoals een coördinaat of een getal met eenheid? Dan is
[Formulier - Samengesteld veld](/?path=/docs/patronen-formulier-samengesteld-veld--documentatie) het patroon dat je
zoekt: daar heeft de groep één geldigheid en één melding.

`CrossValidationMixin` is een mixin **uit de bibliotheek** (`@domg-wc/components/form`): hij luistert naar wijzigingen
op de velden waarvan je validator afhangt, en hervalideert je veld zodra een daarvan verandert.

## Gebruik

```ts
import { CrossValidationMixin, type ValidatorWithDeps } from '@domg-wc/components/form';
```

Je schrijft een validator met `dependencySelectors`, en wrapt de form control waarop je hem toepast in de mixin. Het
`instance` argument in de validator is het host element van die control: via `instance.form` bereik je het native
`HTMLFormElement`, en dus elk ander veld via `querySelector`.

Als voorbeeld een code-veld dat exact `ABC-123` moet zijn, maar enkel wanneer de procedure **Strikt** is.

### 1. De validator

```ts
const crossFieldValidator: ValidatorWithDeps = {
    key: 'customError',
    message: `Bij de strikte procedure moet de code 'ABC-123' zijn.`,
    dependencySelectors: ['#procedure'],
    isValid(instance: HTMLElement, value: string): boolean {
        if (!value) return true;

        const form = (instance as HTMLElement & { form: HTMLFormElement | null }).form;
        if (!form) return true;

        const procedure = form.querySelector<HTMLElement & { value: string }>('#procedure')?.value;
        return procedure !== 'strikt' || value === 'ABC-123';
    },
};
```

`ValidatorWithDeps` is de gewone `Validator` van `@open-wc/form-control`, uitgebreid met `dependencySelectors`. Typeer
er zowel je validator als de `formControlValidators` array mee. Laat je de annotatie weg, dan leidt TypeScript het
letterlijke object-type af in plaats van `Validator`, en faalt de override van de statische array met
`TS2417: Class static side incorrectly extends base class static side`.

### 2. Het component

Net als bij [aangepaste validatie](/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie) maak je per validator
een nieuw component. Wrap de form control daarbij in de `CrossValidationMixin`.

```ts
import { webComponent } from '@domg-wc/common';
import { CrossValidationMixin, VlInputFieldComponent, type ValidatorWithDeps } from '@domg-wc/components/form';

@webComponent('vl-input-field-with-cross-validator')
export class VlInputFieldWithCrossValidatorComponent extends CrossValidationMixin(VlInputFieldComponent) {
    static override formControlValidators: ValidatorWithDeps[] = [
        ...VlInputFieldComponent.formControlValidators,
        crossFieldValidator,
    ];
}
```

### 3. De foutmelding

Gebruik het nieuwe component in plaats van `vl-input-field`, met de foutmelding in een `vl-form-message` met
`state="customError"`.

```html
<vl-select id="procedure" name="procedure" ...></vl-select>

<vl-input-field-with-cross-validator id="code" name="code" block required></vl-input-field-with-cross-validator>
<vl-form-message for="code" state="customError">
    Bij de strikte procedure moet de code 'ABC-123' zijn.
</vl-form-message>
```

## Aandachtspunten

- **Combineer met een gewone custom validatie in één `isValid`.** Er is maar één `customError` per form control
  beschikbaar, dus twee losse validators op hetzelfde veld gaan niet. Zie
  [Formulier - Aangepaste Validatie](/?path=/docs/patronen-formulier-aangepaste-validatie--documentatie) voor de reden.
- **Submit-validatie.** De foutmelding verschijnt bij het verzenden en verdwijnt zodra het veld terug geldig wordt, ook
  wanneer dat door een wijziging in een afhankelijk veld komt. Er wordt bewust geen valid-boodschap getoond. Wil je
  validatie al tijdens het invullen tonen, combineer dit dan met het `blur-validation` attribuut, zie
  [Formulier - Blur-validatie](/?path=/docs/patronen-formulier-blur-validatie--documentatie).

## Voorbeelden

De componenten hieronder zijn geen bibliotheekcode: het zijn patronen die je overneemt in je eigen project.

Kies **Strikt** en verzend een willekeurige code: je krijgt een foutmelding. Wissel daarna naar **Standaard** en ze
verdwijnt meteen, zonder opnieuw te verzenden. De ingediende form data wordt onderaan geprint via de
[parseFormData](/?path=/docs/patronen-formulier-form-data--documentatie) helper.

> Story: [formulier - cross-validatie](/?path=/story/patronen-formulier-cross-validatie--formulier-cross-validatie)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent } from '@domg-wc/components/atom';
import {
    parseFormData,
    VlFormMessageComponent,
    VlFormLabelComponent,
    VlInputFieldComponent,
    VlSelectComponent,
    type SelectOption,
    CrossValidationMixin,
    type ValidatorWithDeps,
} from '@domg-wc/components/form';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

@webComponent('vl-input-field-with-cross-validator')
export class VlInputFieldWithCrossValidatorComponent extends CrossValidationMixin(VlInputFieldComponent) {
    static override formControlValidators: ValidatorWithDeps[] = [
        ...VlInputFieldComponent.formControlValidators,
        {
            key: 'customError',
            message: `Bij de strikte procedure moet de code 'ABC-123' zijn.`,
            dependencySelectors: ['#procedure'],
            isValid(instance: HTMLElement, value: string): boolean {
                if (!value) return true;

                const form = (instance as HTMLElement & { form: HTMLFormElement | null }).form;
                if (!form) return true;

                const procedure = form.querySelector<HTMLElement & { value: string }>('#procedure')?.value;
                return procedure !== 'strikt' || value === 'ABC-123';
            },
        },
    ];
}

@webComponent('vl-form-cross-validation')
export class VlFormCrossValidationComponent extends LitElement {
    private formData: { [key: string]: FormDataEntryValue[] | File | string } | null = null;

    static {
        registerWebComponents([
            VlInputFieldWithCrossValidatorComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlSelectComponent,
            VlButtonComponent,
        ]);
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
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }
            `,
        ];
    }

    static override get properties(): PropertyDeclarations {
        return {
            formData: { state: true },
        };
    }

    private procedureOpties: SelectOption[] = [
        { label: 'Standaard', value: 'standaard' },
        { label: 'Strikt (vereist code "ABC-123")', value: 'strikt' },
    ];

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="procedure" label="Procedure *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-select
                            id="procedure"
                            name="procedure"
                            block
                            required
                            placeholder="Kies een procedure"
                            .options=${this.procedureOpties}
                        ></vl-select>
                        <vl-form-message for="procedure" state="valueMissing"
                            >Gelieve een procedure te kiezen.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="code" label="Code *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-input-field-with-cross-validator
                            id="code"
                            name="code"
                            block
                            required
                        ></vl-input-field-with-cross-validator>
                        <vl-form-message for="code" state="valueMissing"
                            >Gelieve een code in te vullen.</vl-form-message
                        >
                        <vl-form-message for="code" state="customError"
                            >Bij de strikte procedure moet de code 'ABC-123' zijn.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                </div>
            </form>
            ${this.formData ? html`<pre>${JSON.stringify(this.formData, null, 2)}</pre>` : ''}
        `;
    }

    private onSubmit(e: Event) {
        e.preventDefault();
        this.formData = parseFormData(e.target as HTMLFormElement);
    }

    private onReset() {
        this.formData = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-input-field-with-cross-validator': VlInputFieldWithCrossValidatorComponent;
        'vl-form-cross-validation': VlFormCrossValidationComponent;
    }
}
```

### Twee velden die moeten overeenkomen

Een bevestigingsveld dat gelijk moet zijn aan het eerste veld, via `dependencySelectors: ['#email']`.

> Story: [formulier - cross-validatie - velden matchen](/?path=/story/patronen-formulier-cross-validatie--formulier-cross-validatie-match)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent } from '@domg-wc/components/atom';
import {
    VlFormMessageComponent,
    VlFormLabelComponent,
    VlInputFieldComponent,
    CrossValidationMixin,
    type ValidatorWithDeps,
} from '@domg-wc/components/form';
import { css, CSSResult, html, LitElement } from 'lit';

@webComponent('vl-input-field-with-match-validator')
export class VlInputFieldWithMatchValidatorComponent extends CrossValidationMixin(VlInputFieldComponent) {
    static override formControlValidators: ValidatorWithDeps[] = [
        ...VlInputFieldComponent.formControlValidators,
        {
            key: 'customError',
            message: 'De e-mailadressen komen niet overeen.',
            dependencySelectors: ['#email'],
            isValid(instance: HTMLElement, value: string): boolean {
                if (!value) return true;

                const form = (instance as HTMLElement & { form: HTMLFormElement | null }).form;
                if (!form) return true;

                const email = form.querySelector<HTMLElement & { value: string }>('#email')?.value;
                return value === email;
            },
        },
    ];
}

@webComponent('vl-form-cross-validation-match')
export class VlFormCrossValidationMatchComponent extends LitElement {
    static {
        registerWebComponents([
            VlInputFieldWithMatchValidatorComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlInputFieldComponent,
            VlButtonComponent,
        ]);
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
            `,
        ];
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="email" label="E-mailadres *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-input-field id="email" name="email" block required></vl-input-field>
                        <vl-form-message for="email" state="valueMissing"
                            >Gelieve een e-mailadres in te vullen.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="bevestig-email" label="Bevestig e-mailadres *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-input-field-with-match-validator
                            id="bevestig-email"
                            name="bevestigEmail"
                            block
                            required
                        ></vl-input-field-with-match-validator>
                        <vl-form-message for="bevestig-email" state="valueMissing"
                            >Gelieve het e-mailadres te bevestigen.</vl-form-message
                        >
                        <vl-form-message for="bevestig-email" state="customError"
                            >De e-mailadressen komen niet overeen.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    private onSubmit(e: Event) {
        e.preventDefault();
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-input-field-with-match-validator': VlInputFieldWithMatchValidatorComponent;
        'vl-form-cross-validation-match': VlFormCrossValidationMatchComponent;
    }
}
```

### Conditioneel verplicht veld

**Verduidelijking** is enkel verplicht wanneer de reden **Andere** is. Het veld heeft zelf geen `required` attribuut: de
validator beslist op basis van het reden-veld en hervalideert via `dependencySelectors: ['#reden']`. Bij **Andere**
markeert het label het veld als verplicht.

> Story: [formulier - cross-validatie - conditioneel verplicht](/?path=/story/patronen-formulier-cross-validatie--formulier-cross-validatie-conditional)

**Volledige demo-component**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent } from '@domg-wc/components/atom';
import {
    VlFormMessageComponent,
    VlFormLabelComponent,
    VlInputFieldComponent,
    VlSelectComponent,
    type SelectOption,
    CrossValidationMixin,
    type ValidatorWithDeps,
} from '@domg-wc/components/form';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

@webComponent('vl-input-field-with-conditional-validator')
export class VlInputFieldWithConditionalValidatorComponent extends CrossValidationMixin(VlInputFieldComponent) {
    static override formControlValidators: ValidatorWithDeps[] = [
        ...VlInputFieldComponent.formControlValidators,
        {
            key: 'customError',
            message: 'Gelieve de reden te verduidelijken.',
            dependencySelectors: ['#reden'],
            isValid(instance: HTMLElement, value: string): boolean {
                const form = (instance as HTMLElement & { form: HTMLFormElement | null }).form;
                if (!form) return true;

                const reden = form.querySelector<HTMLElement & { value: string }>('#reden')?.value;
                if (reden !== 'andere') return true;

                return !!value;
            },
        },
    ];
}

@webComponent('vl-form-cross-validation-conditional')
export class VlFormCrossValidationConditionalComponent extends LitElement {
    private reden = '';

    static {
        registerWebComponents([
            VlInputFieldWithConditionalValidatorComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
            VlSelectComponent,
            VlButtonComponent,
        ]);
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
            `,
        ];
    }

    static override get properties(): PropertyDeclarations {
        return {
            reden: { type: String, state: true },
        };
    }

    private redenOpties: SelectOption[] = [
        { label: 'Verlenging', value: 'verlenging' },
        { label: 'Andere', value: 'andere' },
    ];

    private get verduidelijkingVerplicht(): boolean {
        return this.reden === 'andere';
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset} @vl-change=${this.onChange}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="reden" label="Reden aanvraag *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-select
                            id="reden"
                            name="reden"
                            block
                            required
                            placeholder="Kies een reden"
                            .options=${this.redenOpties}
                        ></vl-select>
                        <vl-form-message for="reden" state="valueMissing">Gelieve een reden te kiezen.</vl-form-message>
                    </div>
                    <div class="vl-column vl-column--4">
                        <vl-form-label
                            for="verduidelijking"
                            label=${this.verduidelijkingVerplicht ? 'Verduidelijking *' : 'Verduidelijking'}
                            block
                        ></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-input-field-with-conditional-validator
                            id="verduidelijking"
                            name="verduidelijking"
                            block
                        ></vl-input-field-with-conditional-validator>
                        <vl-form-message for="verduidelijking" state="customError"
                            >Gelieve de reden te verduidelijken.</vl-form-message
                        >
                    </div>
                    <div class="vl-column vl-column--8 vl-column--start-5">
                        <div class="form-buttons">
                            <vl-button type="submit">Verstuur</vl-button>
                            <vl-button type="reset" secondary>Reset</vl-button>
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    private onSubmit(e: Event) {
        e.preventDefault();
    }

    private onReset() {
        this.reden = '';
    }

    private onChange() {
        this.reden = this.shadowRoot?.querySelector<HTMLElement & { value: string }>('#reden')?.value ?? '';
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-input-field-with-conditional-validator': VlInputFieldWithConditionalValidatorComponent;
        'vl-form-cross-validation-conditional': VlFormCrossValidationConditionalComponent;
    }
}
```
