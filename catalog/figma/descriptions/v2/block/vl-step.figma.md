---
storybook: components-block-steps-step
---

# vl-step

## Figma

Eén stap in een vl-steps, met nummer of icoon, titel, subtitel en inhoud.

• type mengt drie dingen: de status (disabled, success, warning, error, highlighted), de tijdlijnweergaven (timeline, simple-timeline) en duration. In code zijn dat het attribuut type, losse booleans en een apart element.
• De stap met het gele icoon is de default; daar hoort geen type="highlighted" bij.
• duration toont de duurtijd zelf niet: in code is dat een vl-duration-step in de slot duration, die de developer invult.
• Bij iconen of een tijdlijn krijgt de stap in code een icon-aria-label of timeline-aria-label, bijvoorbeeld de volledige datum.
• open (in code default-open) heeft pas zin als de stap openklapbaar is (toggleable).
