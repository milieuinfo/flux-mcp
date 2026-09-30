# Proza Message

## Doel

Gebruik de `proza-message` component om een Proza bericht af te beelden dat achterliggend beheerd kan worden door de
business.

Voor het ophalen van alle Proza berichten voor een domein zie de
[proza-message-preloader](/?path=/docs/components-block-proza-message-preloader--proza-message-preloader-default) component.

## Voorbeeld

```js
import { VlProzaMessage } from '@domg-wc/components/block';
```

```html
<vl-proza-message></vl-proza-message>
```

> Story: [vl-proza-message - default](/?path=/story/components-block-proza-message-proza-message--proza-message-default)

## Configuratie

> API: vl-proza-message

## Base Url

Je kan optioneel een `baseUrl` meegeven aan de `proza-message` component waarvan het Proza bericht opgehaald wordt.

Het Proza bericht zal opgehaald worden vanaf `{baseUrl}proza/domein/{domain}/{code}`.

Indien er geen `baseUrl` meegegeven wordt, wordt het Proza bericht opgehaald relatief tov de huidige url op het pad
`proza/domein/{domain}/{code}`.

Dit attribuut is niet reactief, zorg ervoor dat als je dit attribuut gebruikt het meteen correct ingevuld staat.

## Varianten

### Editeerbaar

Bij het ophalen van een Proza bericht voor een domein worden voor dat domein de toegelaten operaties opgehaald op basis
van de rechten van de huidige gebruiker. Indien er voor de huidige gebruiker ingesteld staat dat de Proza berichten voor
dit domein editeerbaar zijn, wordt er naast de Proza berichten een edit-knop en refresh-knop afgebeeld.

De edit-knop brengt de gebruiker naar het Proza portaal waar het bericht in kwestie aangepast kan worden.

De refresh-knop kan gebruikt worden om na de aanpassing het Proza bericht opnieuw op te halen.

> Story: [vl-proza-message - editable](/?path=/story/components-block-proza-message-proza-message--proza-message-editable)
