---
storybook: components-block-modal
---

# vl-modal

## Figma

Dialoog die de pagina afschermt voor een geïsoleerde taak of bevestiging. Verwijderen bevestig je altijd in een modal. Moet de pagina naast de taak bruikbaar blijven, kies dan vl-side-sheet (Storybook: Patronen / Overlays / Modal vs Side sheet).

• Geef de modal een titel. Laat het design geen titel toe, dan krijgt hij in code een label: een modal zonder naam is niet toegankelijk.
• Open hem via een knop of link. Die krijgt in code aria-haspopup="dialog", en bij het sluiten keert de focus ernaar terug.
• cancellable staat standaard aan, zoals in code; zet hem uit voor een dialoog zonder annuleeractie.
• De body is een placeholder: swap hem naar .vl-stacked en vul die.
