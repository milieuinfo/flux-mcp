---
storybook: components-atom-button
---

# vl-button

## Figma

Knop voor een actie op de pagina.

• Navigeert de knop naar een andere pagina, dan krijgt hij in code cta-link en een href: technisch een link, visueel een knop. Het design toont dat verschil niet; leid het af uit de knoptekst en de flow.
• Icoon-knop (icon-placement=only): vul de property label in. Dat wordt de toegankelijke naam (aria-label) en is in code verplicht.
• Beschrijf de actie in de knoptekst, kort en concreet: "Aanvraag indienen", niet "OK".
• Opent de knop een menu of dialoog, dan krijgt hij in code aria-haspopup, bijvoorbeeld "dialog".
