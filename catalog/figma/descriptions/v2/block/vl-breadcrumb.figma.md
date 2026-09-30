---
storybook: components-block-breadcrumb
---

# vl-breadcrumb

## Figma

Breadcrumb path dat toont waar de huidige pagina zit in de hiërarchie van de toepassing.

• De eerste link wijst naar het startpunt en draagt de naam van de toepassing of het luik, niet "Home". Het laatste item is de huidige pagina.
• In code is elk item een vl-breadcrumb-item: met href voor een link, behalve bij de huidige pagina.
• Minder niveaus nodig? Verberg of verwijder de overbodige links. De laatste tekst is altijd de huidige pagina.
• De scheidingstekens en het "..." van de mobile-variant tekent de component zelf; het zijn geen items.
• De verborgen laag places-home niet gebruiken: code kent geen home-optie.
