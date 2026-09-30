# Aanpak Verbeteringen 2025

## Algemeen: dichter bij de teams staan

 - UX-werk voor nieuwe onderdelen / toepassingen

 - 'pragmatische' code-reviews voordat toepassingen in productie gaan

    → aanbevelingen en best practices geven

    → aanduiden met niveau's: brons(+) / zilver(+) / goud(+)

 - introductie van een Frontend Guild met een frontend 'spoc' per team

    → WCAG / testing / CSP

## WCAG

### Nieuwe WCAG Aanpak

 - documentatie in Storybook

    → WCAG aanpak - Europees minimaal AA (ineens 2.2)

    → vereisten documenteren - minimaal brons voor interne toepassingen / zilver+ voor publieke

 - presentatie (eventueel door Gijs) voor de ontwikkelaars rond WCAG
    → niet weerhouden na met Gijs samen gezeten te hebben
    → het is beter met een beperkte groep rond concrete acties samen te zitten

 - toepassen op de Flux-componenten waarbij we WCAG gaan behandelen conform andere feature en bug tickets

 - als eerste eigen Flux actie, de 'compliance'-componenten (privacy, cookie-consent, accessibility, ...)
   verbeteren op WCAG vlak

    → tickets uit de backlog wegwerken

    → block- en atom-componenten die in de 'compliance'-componenten gebruikt worden ineens mee aanpakken

 - op basis van het voorgaande: bouwen wij (Flux) onze WCAG kennis op zodat we zelf (basis) reviews van nieuwe
   (en bestaande) toepassingen kunnen doen

    → we doen dan WCAG aanbevelingen, waaronder deels verplichte verbeteringen

    → iteratief wordt de toepassing zo verbeterd alvorens ze in productie gaat

    → een finale review voor eerste in productie stelling dient nog door Gijs te gebeuren, hij blijft de expert

### WCAG Verleden: waar staan we

 - de toepassingen voldoen aan de wettelijke vereisten

    → Gijs deed reviews en daar volgde een toegankelijkheidsverklaring uit die opgenomen werd in de toepassing

    → Gijs maakte tickets aan om verbeteringen door te voeren

 - de tickets werden minimaal opgenomen

    → geen prioriteit

    → is een kost met niet persé een zichtbare verbetering

 - bij Flux is er een hele backlog van WCAG tickets (+130)

    → we namen die in het verleden beperkt op

    → een deel van de tickets overlapt of zijn out-dated (de component bestaat niet meer)

### WCAG Referenties

#### Specificaties

[WCAG 2.2 Nederlandstalige Specificatie](https://www.w3.org/Translations/WCAG22-nl/).

[EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf)

#### Overheid

[Inter - het Vlaams Expertisecentrum Toegankelijkheid](https://www.vlaanderen.be/inter/toolbox-toegankelijke-steden-en-gemeenten/algemeen-bestuur-dienstverlening-en-communicatie/digitale-toegankelijkheid/richtlijnen-voor-toegankelijkheid-van-webcontent-wcag).

[GOV UK WCAG Understanding](https://www.gov.uk/service-manual/helping-people-to-use-your-service/understanding-wcag)

#### Algemeen

[Mozilla WCAG Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

[Mozilla WCAG Understanding](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG)

[W3 WAI](https://www.w3.org/WAI/)
