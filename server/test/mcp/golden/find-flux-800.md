# Wijzigingen voor "FLUX-800"

- **2.20.0** · FLUX-800 · `89c0f66` · fix · automatic · vl-breadcrumb-item — focus outline enkel bij toetsenbordnavigatie
  - Uitleg: De focus outline van een `vl-breadcrumb-item` met een link of een button verschijnt nu enkel bij toetsenbordnavigatie (`:focus-visible`), niet meer na een muisklik. Voor wie met het toetsenbord navigeert, blijft de outline zichtbaar.
- **2.20.0** · FLUX-800 · `9311ae6` · feature · opt-in · vl-breadcrumb — ellipsis attribuut voor lange breadcrumb items
  - Uitleg: `vl-breadcrumb` heeft een nieuw attribuut `ellipsis`: elk breadcrumb item blijft dan op één regel, een item dat niet naast het vorige past, begint op een nieuwe regel, en pas als het ook daar te breed is, wordt het afgekapt met een ellipsis (…). Zonder het attribuut loopt een lang item zoals voorheen over meerdere regels door; gebruik het enkel waar de ruimte echt beperkt is, zoals in een `vl-side-sheet`, want de afgekapte tekst is visueel niet meer leesbaar (een schermlezer leest ze wel volledig voor). Het attribuut staat in de code maar niet in de web-types, dus een IDE stelt het niet voor. Voor iedereen verandert wel de kleur van een breadcrumb item dat als tekst verschijnt (zonder `href` en zonder `type="button"`, zoals het laatste item met de huidige locatie): dat krijgt nu de subtiele tekstkleur `--vl-color--text-subtle` in plaats van de overgeërfde tekstkleur.
- **2.20.0** · FLUX-800 · `c04a72c` · feature · automatic · vl-cascader — breadcrumb opgebouwd met vl-breadcrumb en WCAG verbeteringen
  - Uitleg: De breadcrumb bovenaan een `vl-cascader` is nu een `vl-breadcrumb`: het home-item en de vorige niveaus zijn buttons die je met het toetsenbord bereikt en bedient, het home-icoon heeft de toegankelijke naam 'Terug naar het begin', en het huidige niveau is tekst in plaats van een klikbaar element. De cascader zet daarbij `ellipsis` aan, zodat een lange titel niet meer buiten de breadcrumb (en een `vl-side-sheet`) loopt; je hoeft daarvoor niets te doen. Randgevallen: een klik op het huidige niveau stuurt geen `vl-click-breadcrumb` event meer, de inhoud van het `home`-slot staat nu in een button (zet er dus geen link of button in), en eigen CSS via `custom-css` die op de oude breadcrumb-markup in de cascader mikte, zoals `.vl-breadcrumb__list__item__cta`, werkt niet meer.

3 van 3. De catalogus gaat van 2.0.0 tot en met 2.20.0.

Bronnen in de catalogus van flux-mcp 0.0.0-test: `2.20.0/changelog/tickets/FLUX-800-vl-breadcrumb-item-vl-breadcrumb-vl-cascader.json` (changelog), `2.20.0/changelog-analysis/tickets/FLUX-800-vl-breadcrumb-item-vl-breadcrumb-vl-cascader.json` (changelog-analysis).

Tekst uit een bron *-analysis schreef een LLM, gecontroleerd door een tweede run.
