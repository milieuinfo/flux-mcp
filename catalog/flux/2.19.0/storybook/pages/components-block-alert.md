# Alert

## Doel

Gebruik de `alert` component om de gebruiker op de hoogte te houden van belangrijke informatie.

## Voorbeeld

```js
import { VlAlert } from '@domg-wc/components/block';
```

```html
<vl-alert></vl-alert>
```

> Story: [vl-alert - default](/?path=/story/components-block-alert--alert-default)

## Configuratie

> API: vl-alert

## Varianten

### Error

> Story: [vl-alert - error](/?path=/story/components-block-alert--alert-error)

### Info

> Story: [vl-alert - info](/?path=/story/components-block-alert--alert-info)

### Success

> Story: [vl-alert - success](/?path=/story/components-block-alert--alert-success)

### Warning

> Story: [vl-alert - warning](/?path=/story/components-block-alert--alert-warning)

### With button

> Story: [vl-alert - with button](/?path=/story/components-block-alert--alert-with-button)

### With title slot

> Story: [vl-alert - with title slot](/?path=/story/components-block-alert--alert-with-title-slot)

### With close button

> Story: [vl-alert - closeable](/?path=/story/components-block-alert--alert-closeable)

### Naked error

> Story: [vl-alert - naked error](/?path=/story/components-block-alert--alert-naked-error)

### Naked warning

> Story: [vl-alert - naked warning](/?path=/story/components-block-alert--alert-naked-warning)

### Naked success

> Story: [vl-alert - naked success](/?path=/story/components-block-alert--alert-naked-success)

### Multiline

Stelt `white-space: pre-line;` in voor de boodschap zodat nieuwe regels (newline karakters) in rekening worden gebracht.

> [!WARNING]
> **Opgelet**
> Let op: bij het gebruik van slot content moet de tekst direct na de opening-tag starten, zonder newline.
> Een newline na de opening-tag wordt door `pre-line` als witruimte weergegeven.

```html
<!-- Correct -->
<vl-alert multiline
    ><span>Eerste regel.</span>
    <span>Tweede regel.</span>
</vl-alert>

<!-- Fout: newline na opening-tag geeft extra witruimte -->
<vl-alert multiline>
    <span>Eerste regel.</span>
    <span>Tweede regel.</span>
</vl-alert>
```

> Story: [vl-alert - multiline](/?path=/story/components-block-alert--alert-multiline)

## Toegankelijkheid

### Draag de betekenis niet enkel via kleur en icoon over

Het `type` van de melding wordt visueel vertaald naar een kleur en - via het `icon` attribuut - naar een icoon. Die
signalen bereiken gebruikers van een schermlezer niet en vallen weg in hoog contrast. Zet de aard van de melding
daarom ook in de tekst, bijvoorbeeld met een titel als "Opgelet!" of "Gelukt!", zodat de boodschap zonder kleur en
icoon volledig blijft.

### Kies de rol die bij de context past

Een melding krijgt niet in elke context dezelfde ARIA rol. Stem die af met het `alert-role` attribuut, volgens de
richtlijnen voor [`alert`](https://www.w3.org/TR/wai-aria-1.2/#alert) en
[`alertdialog`](https://www.w3.org/TR/wai-aria-1.2/#alertdialog).

|  |  |  |
| --- | --- | --- |
| Waarde | Wanneer | Gedrag bij een schermlezer |
| `alert` (default) | De melding verschijnt dynamisch na een actie van de gebruiker, is beknopt en vraagt zelf geen actie. | De melding wordt voorgelezen zodra ze verschijnt, zonder dat de focus verspringt. |
| `alertdialog` | De melding verschijnt dynamisch en vereist een actie van de gebruiker, typisch via een knop in het `actions` slot. | De melding wordt aangekondigd als een dialoog met een naam en een beschrijving. De afnemer verplaatst zelf de focus naar de melding, zie hieronder. |
| `no-role` | De melding staat al op de pagina bij het laden, bijvoorbeeld een permanente info- of storingsmelding. | Geen live region: de melding wordt gewoon voorgelezen op haar plaats in de leesvolgorde. |

Hou meldingen met `alert-role="alert"` beknopt: een schermlezer leest de volledige inhoud in één keer voor en
onderbreekt daarmee waar de gebruiker mee bezig was.

```html
<!-- melding die al bij het laden van de pagina zichtbaar is -->
<vl-alert alert-role="no-role" type="info" icon="info-circle" title="Onderhoud">
    <span>Op zaterdag is dit loket beperkt beschikbaar.</span>
</vl-alert>
```

### Focus bij `alertdialog`

Een `alertdialog` hoort de focus te krijgen zodra hij verschijnt, anders mist een toetsenbord- of schermlezergebruiker
de melding en de bijhorende actie. De component doet dat bewust niet automatisch: enkel de afnemer weet op welk moment
de melding verschijnt en welk element de focus moet krijgen.

> [!WARNING]
> **Opgelet**
> Bij alert-role="alertdialog" moet de afnemer zelf de focus naar de melding of naar de actieknop erin verplaatsen.

```js
const alert = document.querySelector('vl-alert');
alert.focus(); // verplaatst de focus naar de melding zelf
```

`focus()` op de melding legt de focus op de dialoog, waardoor een schermlezer de rol, de naam en de beschrijving
aankondigt. Wil je de gebruiker meteen bij de actie zetten, focus dan de knop in het `actions` slot; de melding wordt
dan aangekondigd als context van die knop.

```js
const alert = document.querySelector('vl-alert');
alert.querySelector('vl-button')?.focus();
```

Bij deze rol koppelt de component de titel als naam (`aria-labelledby`) en de boodschap als beschrijving
(`aria-describedby`) aan de melding, maar enkel wanneer die effectief inhoud hebben: een verwijzing naar een leeg
element levert immers geen naam of beschrijving op. Voorzie daarom altijd een titel via het `title` attribuut of het
`title` slot, want zonder titel heeft de `alertdialog` geen toegankelijke naam. Een controle met axe meldt dat als
`aria-dialog-name`.

> Story: [vl-alert - alertdialog](/?path=/story/components-block-alert--alert-alert-dialog)

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - Alert](https://www.vlaanderen.be/vlaanderen-design-system/componenten/alert)
