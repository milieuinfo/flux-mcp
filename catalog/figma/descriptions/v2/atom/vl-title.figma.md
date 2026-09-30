---
storybook: components-atom-title
---

# vl-title

## Figma

Titel op heading-niveau h1 t.e.m. h6, met de varianten alt, underline en no-space-bottom.

In een kolom: zet de instance op Fill. De titel breekt dan af over meerdere regels, en de lijn (alt en underline) loopt over de volle breedte — zoals in code.

In een horizontale groep (.vl-group): zet de instance én de laag Frame 1 op Hug.

Gebruik in een .vl-stacked-layout altijd een no-space-bottom-variant; de ruimte komt van de parent.

Het niveau in Figma is de visuele stijl. In code bepaalt type het heading-niveau, en dat volgt de structuur van de pagina: één h1, geen niveau overslaan. Wijkt de stijl in het design af van dat niveau, dan krijgt de titel in code appearance met de stijl uit het design, bijvoorbeeld <vl-title type="h2" appearance="h3">. Neem het niveau in code dus nooit zomaar over uit de grootte in het design.
