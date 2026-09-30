# Modal

## Doel

Gebruik de `modal` component om een modal te tonen.

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

Het triggeren van de modal moet altijd gebeuren via een knop of link. Voor screen readers is het belangrijk dat deze knop of link de juiste aria-attributen bevat. Het gebruik van `aria-haspopup="dialog"` is in dit geval verplicht. Optioneel kan je `aria-controls` toevoegen met als value de ID van de modal (dit is echter overbodig wanneer de knop binnen een shadow DOM zit (bv vl-button), omdat de koppeling met de ID niet werkt doorheen de shadow DOM). **Deze aria-attributen moet de afnemer zelf implementeren!**.

De vl-modal zal standaard de focus leggen op het eerste focusbare element binnenin de modal wanneer deze geopend wordt.
Dit kan aangepast worden door het `focus-on-modal` attribuut toe te voegen aan de modal,
in dat geval zal de focus op de modal zelf gelegd worden bij het openen. Gebruik dit enkel indien
het automatisch focussen op het eerste focusbare element problemen veroorzaakt, bijvoorbeeld wanneer dit meteen een popover triggert.

Het is essentieel dat de modal goed gelabeld is voor gebruikers van schermlezers.
Dit kan op twee manieren bereikt worden:
- Door het `title` attribuut te gebruiken. Onderliggend wordt dit gekoppeld adhv `aria-labelledby`.
- Indien het design geen titel toelaat, moet het `label` attribuut gebruikt worden zodat een beschrijvende `aria-label`
  kan toegevoegd worden aan de modal.
