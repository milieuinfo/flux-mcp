---
storybook: components-block-table
---

# vl-table

## Figma

Tabel voor gestructureerde, relationele data. Voor een overzicht met filters en paginering gebruik je vl-rich-data-table.

• Property kiest de stijl (grid, matrix of zebra); met de slots-varianten vul je de rijen zelf.
• De kolomtitelrij (title row) is in code de <thead>. Geef elke kolomkop tekst: een schermlezer leest hem bij elke cel voor.
• Markeer de status van een rij of cel niet enkel met kleur: zet ook tekst in de cel, bijvoorbeeld een vl-pill.
• size (M/S) bestaat enkel in Figma.
• Een kolom met acties per rij? Zet in de title row op die plek een transparante .vl-group met evenveel icon buttons als in de rijen eronder. Zo neemt de lege kopcel dezelfde breedte in als de actiecellen en lijnen de kolommen uit. In code is dat een <th> met visueel verborgen tekst, bijvoorbeeld "Acties", zodat een schermlezer de kolom kan benoemen.
