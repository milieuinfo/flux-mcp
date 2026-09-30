---
name: figma-descriptions
description: Zet de component descriptions en documentation links van een Flux-release in een branch van de FLUX Figma-library.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0. De payload is dist/descriptions/<version>.json.
    required: true
  - name: branch_url
    description: De URL van de Figma-branch waarin geschreven wordt.
    required: true
---

# Figma-descriptions voor Flux {{version}}

Je zet de component descriptions en documentation links van Flux {{version}} in de Figma-branch
{{branch_url}}. Een developer reviewt die branch daarna, merget hem en publiceert de library.

## Voorwaarden

- Je hebt een Figma MCP-server met schrijfrechten (`use_figma`). Ontbreekt die, meld dat en stop. Probeer het
  niet op een andere manier.
- Je schrijft enkel in de branch uit {{branch_url}}. Is dat de hoofdfile van de library en geen branch, stop dan
  en vraag om een branch.
- Je hebt de payload `dist/descriptions/{{version}}.json`: een lijst met per component `name`, `nodeId`,
  `description` en `documentationLink`.

## Werkwijze

### 1. Lezen

Lees per `nodeId` uit de payload de huidige description en documentation link, read-only. Vraag geen
volledige teksten op: 84 descriptions overschrijden de limiet van de output. Vraag per node een hash op:

```js
const h = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(16); };
const out = {};
for (const id of NODE_IDS) {
  const n = await figma.getNodeByIdAsync(id);
  out[id] = n ? h(n.description || '') + '|' + (n.documentationLinks || []).map((l) => l.uri).join(',') : 'MISSING';
}
return out;
```

### 2. Vergelijken

Figma bewaart een description HTML-geëscapet. Escape de tekst uit de payload dus eerst en bereken dan pas de
hash:

```js
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
```

Een node verschilt als de hash van de description of de link afwijkt. Bestaat een node niet (`MISSING`), of is
het geen `COMPONENT` of `COMPONENT_SET`, meld dat dan. Schrijf daar niets: het Code Connect-template wijst dan
naar een verkeerde node.

### 3. Voorleggen

Toon de gebruiker enkel wat verschilt:

- per component de naam en wat er verandert (description, link of beide);
- bij een gewijzigde description de oude en de nieuwe tekst. Haal daarvoor enkel de gewijzigde descriptions
  volledig op.
- het aantal ongewijzigde componenten.

Veranderen enkel de links (het versienummer in de URL), vat dat dan samen in één regel in plaats van 84
rijen.

Schrijf niets zonder akkoord van de gebruiker. Ctrl-Z werkt niet op wijzigingen via de MCP.

### 4. Schrijven

Schrijf na akkoord enkel de nodes die verschillen, maximaal 20 per `use_figma`-call:

```js
for (const it of ITEMS) {
  const n = await figma.getNodeByIdAsync(it.nodeId);
  if (!n || (n.type !== 'COMPONENT' && n.type !== 'COMPONENT_SET')) throw new Error('geen component: ' + it.nodeId);
  n.description = it.description;
  n.documentationLinks = [{ uri: it.documentationLink }];
}
return { mutatedNodeIds: ITEMS.map((it) => it.nodeId) };
```

Neem de teksten letterlijk over uit de payload. Pas niets aan, ook geen typfout: een fout in de tekst los je op
in `catalog/figma/descriptions/v2/<soort>/<naam>.figma.md` in flux-mcp, niet in Figma.

### 5. Controleren

Lees de hashes opnieuw in een aparte call, niet in het script dat schreef, en vergelijk ze met de payload
zoals in stap 2. Alle nodes moeten nu gelijk zijn.

### 6. Melden

Meld hoeveel componenten je bijgewerkt hebt en welke niet konden, met de reden. Zeg dat de developer de branch
nu kan reviewen, mergen en de library publiceren.
