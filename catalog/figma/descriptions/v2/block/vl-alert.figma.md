---
storybook: components-block-alert
---

# vl-alert

## Figma

Melding die de gebruiker op de hoogte brengt van iets belangrijks. type bepaalt kleur en icoon: info, success, warning of error.

• Kleur en icoon volstaan niet: zet de aard ook in de tekst, bijvoorbeeld een titel als "Opgelet!" of "Gelukt!".
• Staat de melding er al bij het laden van de pagina (onderhoud, een banner), dan is ze in code alert-role="no-role". Verschijnt ze na een actie, dan blijft de default. Vraagt ze zelf een actie via een knop, dan alertdialog.
• banner loopt over de volle breedte en is altijd klein. Titel en boodschap staan in één tekstlaag als "Titel - boodschap"; in code zet de component dat streepje zelf.
• naked krijgt geen sluitknop.
