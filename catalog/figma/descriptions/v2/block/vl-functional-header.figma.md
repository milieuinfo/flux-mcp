---
storybook: components-block-functional-header
---

# vl-functional-header

## Figma

Applicatieheader met de naam van de toepassing, acties rechtsboven en een sub-header eronder.

Sub-header:
• default — terug-link met paginatitel. De terug-link staat hier altijd, zoals in code.
• breadcrumb — broodkruimelpad, zonder terug-link.
• tabs — tabbladen, standaard zonder terug-link.
• none — geen sub-header; in code hide-sub-header.

Tabs mét terug-link is een patroon, geen default: zet "< Terug?" aan in een tabs-variant. In code komen de tabs dan in de slot sub-title in plaats van sub-header, met wat custom CSS voor de uitlijning (Storybook: Patronen / Navigatie / Functionele Header / met back en tabs).

De terug-link noem je naar waar hij gaat, niet "Terug", en hij wijst naar een vast startpunt van de toepassing (in code back-link, nooit history.back()). De eerste link van een breadcrumb draagt de naam van de toepassing, niet "Home".

In code: de titel via title-label (niet title), en altijd skip-to-content-id naar de eerste heading van de content.
