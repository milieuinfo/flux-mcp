# Toaster

Gebruik de `toaster` component om meldingen af te beelden.

## Voorbeeld

```js
import { VlToasterComponent } from '@domg-wc/components/block';
```

```html
<vl-toaster></vl-toaster>
```

> Story: [vl-toaster - default](/?path=/story/components-block-toaster--toaster-default)

## Configuratie

> API: vl-toaster

## Gebruik

### Declaratief

Je kan de meldingen declaratief toevoegen in het default slot van de `vl-toaster`, typisch gebruiken we
hiervoor de [vl-alert](/?path=/docs/components-block-alert--documentatie) component.
Het element verschijnt dan automatisch op de gekozen positie.

> Story: [vl-toaster - default slot](/?path=/story/components-block-toaster--toaster-default-slot)

### Dynamisch

De `showAlert()`-methode, is de eenvoudigste manier om een melding te tonen.
Achterliggend maken we een [vl-alert](/?path=/docs/components-block-alert--documentatie) component aan met de
opgegeven parameters.

```js
const toaster = document.querySelector('vl-toaster');
toaster.showAlert({
  type: 'error',
  title: 'Fout',
  message: 'Dit is een foutmelding',
  fadeOut: true // optioneel, standaard is false
});
```

Je kan het meegegeven object uitbreiden met de properties van de [vl-alert](/?path=/docs/components-block-alert--documentatie)
component.

> Story: [vl-toaster - show alert](/?path=/story/components-block-toaster--toaster-show-alert)

Als je meer controle wilt over de melding, kan je ook de `show()` methode gebruiken om een zelf samengesteld
HTML-element te tonen als melding.

```js
const toaster = document.querySelector('vl-toaster');
// toont de melding gedeclareerd in het default slot van de toaster
toaster.show(document.querySelector('#warning-123')); // deze methode toont het meegegeven HTML element als toast
```

### Layout

We volgen de stijl van Digitaal Vlaanderen, waarbij standaard de breedte op `30rem` wordt ingesteld.
Een alert heeft standaard geen breedte en neemt de volledige breedte over van zijn container (de `vl-toaster`),
namelijk `30rem`.

Als er nood is hier van af te wijken, kan je de `width` van de `vl-toaster` zelf aanpassen.
Vermijd hierbij het gebruik van inline styles.

Je kan hiervoor de `--vl-toaster-width` custom variabele aanpassen, bv.:

```css
.pagina {
       --vl-toaster-width: 50rem;
      }
```

### Fade out

We bieden de mogelijkheid aan om meldingen automatisch te laten verdwijnen na een bepaalde tijd met
de `fade-out` property.

> [!WARNING]
> **Opgelet**
> Echter raden we aan om dit te vermijden waar mogelijk gezien dit de toegankelijkheid van de
> toaster negatief kan beïnvloeden. Gebruikers kunnen de melding mogelijk niet op tijd lezen of begrijpen,
> vooral als ze gebruik maken van schermlezers of andere hulpmiddelen.

> Story: [vl-toaster - fade out](/?path=/story/components-block-toaster--toaster-fade-out)

## Toegankelijkheid

### fade-out

De `fade-out` property doet meldingen automatisch verdwijnen na 5 seconden.

Vermijd het gebruik waar mogelijk gezien dit de toegankelijkheid van de toaster negatief beïnvloedt. Gebruikers kunnen
de melding mogelijk niet op tijd lezen of begrijpen, dit is problematisch bij het gebruik van schermlezers.

## Custom CSS Properties

|  |  |  |
| --- | --- | --- |
| Naam | Beschrijving | Default |
| `--vl-toaster-width` | breedte van de toaster | 30rem |

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Toaster](https://overheid.vlaanderen.be/webuniversum/v3/documentation/atoms/vl-ui-toasters)
