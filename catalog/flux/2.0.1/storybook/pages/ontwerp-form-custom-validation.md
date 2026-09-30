# Form - Custom Validatie
> Meer info over validatie binnen onze form componenten vind je hier: [Form - Validatie](/?path=/docs/ontwerp-form-validation--documentatie)

Om gebruik te maken van custom validatie moet je een nieuwe component maken dat overerft van één van onze form controls.

Aan dit component kan je je custom validator toevoegen. Via de `customError` ValidityState key kan je een error message linken aan je custom validator.

## Extra informatie

Het is nodig om een custom component te maken voor elke custom validator die je wil toevoegen:

- De validators worden toegevoegd op de form controls d.m.v. een statische array. Dit betekent dat als je een custom validator toevoegt aan een form control, deze validator zal toegevoegd worden aan alle form controls van dit type.

- De form controls maken gebruik van de [ValidityState interface](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState) waardoor er maximum 1 custom validator toegevoegd kan worden aan een form control.

Bij het toevoegen van een 2de custom validator zal de eerste custom validator overschreven worden.

## Voorbeeld

> Story: [Custom Validation](/?path=/story/ontwerp-form-custom-validation--custom-validation)

**Code**

```ts
import { registerWebComponents, webComponent } from '@domg-wc/common';
import { vlGridStyles, vlLegacyStyles } from '@domg-wc/styles';
import { VlButtonComponent } from '@domg-wc/components/atom';
import { VlFormMessageComponent, VlFormLabelComponent, VlInputFieldComponent } from '@domg-wc/components/form';
import { Validator } from '@open-wc/form-control';
import { css, CSSResult, html, LitElement, PropertyDeclarations } from 'lit';

const fooValidator: Validator = {
    key: 'customError',
    message: `Value does not equal 'foo'`,
    isValid(_instance: HTMLElement, value: string): boolean {
        if (!value) {
            return true;
        }

        if (value !== 'foo') {
            return false;
        }

        return true;
    },
};

@webComponent('vl-input-field-with-foo-validator')
export class VlInputFieldWithFooValidatorComponent extends VlInputFieldComponent {
    static override formControlValidators = [...VlInputFieldComponent.formControlValidators, fooValidator];
}

@webComponent('vl-form-custom-validation')
export class VlFormCustomValidationComponent extends LitElement {
    private success = false;

    static {
        registerWebComponents([
            VlInputFieldWithFooValidatorComponent,
            VlFormLabelComponent,
            VlFormMessageComponent,
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
            success: { type: Boolean, state: true },
        };
    }

    override render() {
        return html`
            <form class="vl-form" @submit=${this.onSubmit} @reset=${this.onReset}>
                <div class="vl-grid">
                    <div class="vl-column vl-column--4">
                        <vl-form-label for="waarde" label="Waarde *" block></vl-form-label>
                    </div>
                    <div class="vl-column vl-column--8">
                        <vl-input-field-with-foo-validator
                            id="waarde"
                            name="waarde"
                            block
                            required
                            ?success=${this.success}
                            @invalid=${() => {
                                this.success = false;
                            }}
                        ></vl-input-field-with-foo-validator>
                        <vl-form-message for="waarde" state="valueMissing"
                            >Gelieve een waarde in te vullen.</vl-form-message
                        >
                        <vl-form-message for="waarde" state="customError"
                            >Gelieve 'foo' als waarde in te vullen.</vl-form-message
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
        this.success = true;
    }

    private onReset() {
        this.success = false;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'vl-input-field-with-foo-validator': VlInputFieldWithFooValidatorComponent;
        'vl-form-custom-validation': VlFormCustomValidationComponent;
    }
}
```
