# Modal

## Doel

Gebruik de `modal` component om een modal te tonen.

## Wanneer gebruik je een modal?

Twijfel je tussen een modal en een side-sheet? Een modal schermt de pagina af voor een geïsoleerde taak (en is
altijd de keuze bij verwijderen); een side-sheet laat de pagina-context bruikbaar. Zie
[Patronen/Overlays/Modal vs Side sheet](/?path=/docs/patronen-overlays-modal-vs-side-sheet--documentatie) voor het
volledige keuzekader.

## Voorbeeld

```js
import { VlModalComponent } from '@domg-wc/components/block';
```

```html
<vl-modal></vl-modal>
```

> Story: [vl-modal - default](/?path=/story/components-block-modal--modal-default)

## Configuratie

> API: vl-modal

## Reactief open-attribuut

Het `open` attribuut is reactief en weerspiegelt de werkelijke open-staat van de modal. Het attribuut toevoegen opent
de modal, het verwijderen sluit ze:

```html
<vl-modal open></vl-modal>
```

Wanneer de modal sluit via de annuleer-knop, de sluit-knop, de escape-toets of de backdrop, wordt het `open` attribuut
automatisch van de host verwijderd.

> **Let op met toegankelijkheid:** openen via het `open` attribuut (of via de `open()` methode) ontslaat de afnemer niet
> van de regel dat een modal idealiter via een knop of link getriggerd wordt. Wie de modal opent zonder zo'n trigger
> is zelf verantwoordelijk om de focus correct te beheren - in het bijzonder om de focus bij het sluiten terug te
> plaatsen op een logisch element (typisch het element dat de modal opende). Doe je dat niet, dan blijft de focus achter
> op een onvoorspelbare plaats, wat de toegankelijkheid voor toetsenbord- en schermlezer-gebruikers schaadt. Zie
> [Toegankelijkheid](#toegankelijkheid) voor de aanbevolen werkwijze.

## Events

|  |  |
| --- | --- |
| Event | Beschrijving |
| `vl-open` | Wordt afgevuurd wanneer de modal opent, ongeacht of dat via het `open` attribuut, de `open()` methode of een trigger gebeurde. |
| `vl-close` | Wordt afgevuurd wanneer de modal sluit, ongeacht of dat via het `open` attribuut, de `close()` methode, de annuleer-/sluit-knop, escape of de backdrop gebeurde. |

Beide events bubbelen en gaan door de shadow-DOM (`bubbles: true, composed: true`), zodat ze ook buiten de component
opgevangen kunnen worden:

```js
document.querySelector('vl-modal').addEventListener('vl-close', () => {
    // reageer op het sluiten van de modal
});
```

## Varianten

### Met andere actie

> Story: [vl-modal - with other action](/?path=/story/components-block-modal--modal-with-other-action)

### Medium

> Story: [vl-modal - medium](/?path=/story/components-block-modal--modal-medium)

### Large

> Story: [vl-modal - large](/?path=/story/components-block-modal--modal-large)

### Full Screen

> Story: [vl-modal - full screen](/?path=/story/components-block-modal--modal-full-screen)

### Left

> Story: [vl-modal - left](/?path=/story/components-block-modal--modal-left)

### Right

> Story: [vl-modal - right](/?path=/story/components-block-modal--modal-right)

### Focus op modal

> Story: [vl-modal - with focus on modal](/?path=/story/components-block-modal--modal-with-focus-on-modal)

## Toegankelijkheid

Het triggeren van de modal moet altijd gebeuren via een knop of link. Voor screen readers is het belangrijk dat deze
knop of link de juiste aria-attributen bevat. Het gebruik van `aria-haspopup="dialog"` is in dit geval verplicht.
Optioneel kan je `aria-controls` toevoegen met als value de ID van de modal (dit is echter overbodig wanneer de knop
binnen een shadow DOM zit (bv vl-button), omdat de koppeling met de ID niet werkt doorheen de shadow DOM). **Deze
aria-attributen moet de afnemer zelf implementeren!**.

Een belangrijke reden voor deze regel is het focusbeheer: wanneer de modal sluit, moet de focus terugkeren naar de
trigger (de knop of link die de modal opende). Door de modal via zo'n trigger te openen, gebeurt dit op een
natuurlijke en voorspelbare manier. Het [reactief openen via het `open` attribuut](#reactief-open-attribuut) of de
`open()` methode blijft mogelijk en is soms nodig (bv. om de open-staat declaratief te sturen), maar wie deze weg
kiest in plaats van een trigger, moet het terugplaatsen van de focus bij het sluiten zelf afhandelen. De
`vl-close`-event is hiervoor een geschikt aangrijpingspunt.

De vl-modal zal standaard de focus leggen op het eerste focusbare element binnenin de modal wanneer deze geopend wordt.
Dit kan aangepast worden door het `focus-on-modal` attribuut toe te voegen aan de modal,
in dat geval zal de focus op de modal zelf gelegd worden bij het openen. Gebruik dit enkel indien
het automatisch focussen op het eerste focusbare element problemen veroorzaakt, bijvoorbeeld wanneer dit meteen een
popover triggert.

Het is essentieel dat de modal goed gelabeld is voor gebruikers van schermlezers.
Dit kan op twee manieren bereikt worden:
- Door het `title` attribuut te gebruiken. Onderliggend wordt dit gekoppeld adhv `aria-labelledby`.
- Indien het design geen titel toelaat, moet het `label` attribuut gebruikt worden zodat een beschrijvende `aria-label`
  kan toegevoegd worden aan de modal.
