# VideoPlayer

## Doel

Gebruik de `video-player` component om een video-player af te beelden.

Deze component is de nieuwe versie van het [vl-video-player](/?path=/docs/elements-video-player--documentatie) element, we raden aan om op termijn deze versie
te gebruiken.

## Voorbeeld

```js
import { VlVideoPlayerComponent } from '@domg-wc/components/block';
```

```html
<vl-video-player></vl-video-player>
```

> Story: [vl-video-player - default](/?path=/story/components-block-video-player--video-player-default)

## Mediatype instellen

Standaard leidt de speler het mediatype af uit de bestandsextensie in de `source`-URL (bv. `.mp4`).
Wanneer de bron-URL geen extensie bevat - bijvoorbeeld een download- of API-link zoals
`https://.../stukken/123/download` - kan het type niet afgeleid worden. Zet het `type`-attribuut in dat geval
expliciet:

```html
<vl-video-player source="https://.../stukken/123/download" type="video/mp4"></vl-video-player>
```

Ondersteunde waarden zijn de video-mimetypes van de speler, o.a. `video/mp4`, `video/webm`, `video/ogg`.

## Configuratie

> API: vl-video-player

## Referenties

### Digitaal Vlaanderen

[Documentatie Digitaal Vlaanderen - VideoPlayer](https://www.vlaanderen.be/vlaanderen-design-system/componenten/video-player)
