# Icon Style

## Inhoudstafel

- [Doel](#doel)
- [Voorbeelden](#voorbeelden)

## Doel

Er wordt specifieke `icon` styling voorzien. Het doel is deze implementatie te embedden in de css van concrete
componenten. Het is een bouwblok, niet bedoeld voor rechtstreeks gebruik! In een eindtoepassing een icoon toevoegen
gebeurt m.b.v. de [vl-icon](/?path=/docs/components-atom-icon--documentatie) component.

Componenten zoals de [vl-button](/?path=/docs/components-atom-button--documentatie) en
[vl-link](/?path=/docs/components-atom-link--documentatie) kunnen ook een icoon bevatten, deze gebruiken
daarvoor deze basis css. Hierdoor worden componenten-in-componenten of shadow-dom's in shadow-dom's vermeden.

Daarnaast, zie [Beheren/Icon Font](/?path=/docs/beheren-icon-font--documentatie), wordt er een css-mapping voor de iconen
uit het [icon-font](/?path=/docs/styles-base-intern-font--documentatie) naar een logische naam voorzien. De feitelijke mapping
wordt gegenereerd op basis van de `svg` variant van het font.

## Voorbeelden

> Story: [icon-style - default](/?path=/story/components-atom-icon-style--icon-style-default)
