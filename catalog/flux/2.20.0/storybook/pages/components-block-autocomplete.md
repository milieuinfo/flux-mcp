# Autocomplete

## Doel

Gebruik de `autocomplete` component om een lijst met suggesties weer te geven, gefilterd op de ingevoerde tekst. De
lijst kan een statische lijst zijn (`static-list`) of kan worden opgehaald uit een api (dataFetcher).

## Voorbeeld

```js
import { VlAutocomplete } from '@domg-wc/components/block';
```

```html
<vl-autocomplete></vl-autocomplete>
```

> Story: [vl-autocomplete - default](/?path=/story/components-block-autocomplete--autocomplete-default)

## Configuratie

> API: vl-autocomplete

## Varianten

### Suggesties groeperen per subtitle

> Story: [vl-autocomplete - group by subtitle](/?path=/story/components-block-autocomplete--autocomplete-group-by-subtitle)

### Suggesties met een eigen item-template

Moet een suggestie meer tonen dan `title`, `subtitle` en `value`, dan volstaat `caption-format` niet. Stel dan
`itemTemplate` in: die functie krijgt het item en levert de inhoud van de `<li>`. De `<li>` zelf (id, klik,
`role="option"`) blijft van de component.

Vindt de zoekopdracht niets, dan roept de component je `itemTemplate` niet aan. Ze toont dan één suggestie met de
tekst uit het `no-matches-text`-attribuut, standaard "Geen resultaat".

```ts
const itemTemplate = (item) => html`
    <div class="vl-stacked">
        <vl-text bold>${item.title}</vl-text>
        <vl-text annotation>Aangemaakt op ${item.createdOn}, eigenaar: ${item.owner}</vl-text>
    </div>
`;
```

```html
<vl-autocomplete .items="${items}" .itemTemplate="${itemTemplate}"></vl-autocomplete>
```

> Zet geen links of knoppen in de template, handel zulke acties af via het `selected-autocomplete`-event. Een
> [`option`](https://www.w3.org/TR/wai-aria-1.2/#childrenArePresentational) verbergt zijn kinderen voor
> hulptechnologie ([4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)) en het toetsenbord
> ([2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)).

> Story: [vl-autocomplete - item template](/?path=/story/components-block-autocomplete--autocomplete-with-item-template)

### Voorbeeld met location API

Om te werken met een API, luister je naar het `search`-event dat opgeworpen wordt wanneer de gebruiker begint te typen.
Dan kan je op basis daarvan de `.matches` instellen van de `autocomplete`-component om de suggesties te tonen.

Zie het onderstaande code voorbeeld.

> Story: [vl-autocomplete - input and api call](/?path=/story/components-block-autocomplete--autocomplete-input-and-api-call)

**code voorbeeld met location API**

```ts
export async function fetchDataFromApiCall(autocomplete: any, searchTerm: any) {
    const result = await fetch(
        `https://geo.api.vlaanderen.be/geolocation/suggestion?q=${searchTerm}&c=${autocomplete.maxSuggestions}`
    );
    const responseBody = await result.json();
    autocomplete.matches = responseBody.SuggestionResult.map((obj: string) => ({
        title: obj,
        value: obj,
    }));
}
```

[Documentatie voor de Geolocation API](https://geo.api.vlaanderen.be/geolocation/)

### Voorbeeld met mocked API call

Type "Drab" om een van de mocked resultaten te zien.
Je kan deze manier van werken gebruiken indien de suggesties een onveranderlijke lijst zijn.

Gelijkaardig aan bovenstaand voorbeeld, kan je `.matches` instellen om de suggesties voor een gebruiker in te stellen
op basis van de input.

Zie het onderstaande code voorbeeld.

> Story: [vl-autocomplete - input and mocked api call](/?path=/story/components-block-autocomplete--autocomplete-input-and-mocked-api-call)

**code voorbeeld voor mocked API**

```ts
export async function mockedApiCall(searchTerm: any, maxSuggestions: any) {
    const results = [
        'Drabbinkdreef, Gent',
        'Drabstraat, Gent',
        'Drabstraat, Kontich',
        'Drabstraat, Mechelen',
        'Drabstraat, Mortsel',
        'Drabstraat, Wichelen',
        'Drabstraat, Zwevezele',
    ];
    const filteredResults = results
        .filter((i) => i.toLowerCase().startsWith(searchTerm.toLowerCase()))
        .slice(0, maxSuggestions);
    return {
        SuggestionResult: filteredResults,
    };
}

export async function fetchDataFromMockedApiCall(autocomplete: any, searchTerm: any) {
    const responseBody = await mockedApiCall(searchTerm, autocomplete.maxSuggestions);
    autocomplete.matches = responseBody.SuggestionResult.map((obj) => ({
        title: obj,
        value: obj,
    }));
}
```

### Zonder suggesties voor autocomplete

Indien je `autocomplete` wil gebruiken zonder suggesties kan je de `.items`-array weglaten.
In dat geval zal echter bij de input de loading indicator blijven staan aangezien die verwacht dat er een lijst van
suggesties komt.

Je kan hiervoor ofwel:
-   altijd de loading indicator afzetten door het `disable-loading` attribuut in te stellen
-   de `.matches` property van de component gelijkstellen aan een lege array (`[]`), op dezelfde manier als waarop de
    resultaten van een API call worden ingeladen - zodoende wordt de loading indicator niet langer getoond

> Story: [vl-autocomplete - without suggestions](/?path=/story/components-block-autocomplete--autocomplete-without-suggestions)

### Voorbeeld in een side-sheet

> Story: [vl-autocomplete - in side-sheet](/?path=/story/components-block-autocomplete--autocomplete-in-side-sheet)

## Referenties

### Digitaal Vlaanderen

[Documentatie voor de Geolocation API](https://geo.api.vlaanderen.be/geolocation/)
