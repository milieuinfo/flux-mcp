---
name: changelog-review
description: Controleert de analyse van een Flux-release tegen de feiten en verbetert wat niet klopt, in catalog/flux/<versie>/changelog-analysis/.
arguments:
  - name: version
    description: De Flux-release, bijvoorbeeld 2.20.0.
    required: true
  - name: repo
    description: De map van een clone van flux-web-components met de tag v{{version}}.
    required: true
---

# Review van de analyse van Flux {{version}}

Een andere agent schreef de analyse van Flux {{version}}, met `prompts/changelog-analyse.md`. Niemand leest ze daarna
nog na: jij bent de review. Een afnemer vertrouwt op die analyse wanneer hij van de vorige versie naar {{version}}
upgradet. Wees kritisch en onafhankelijk: vertrek van de feiten, niet van wat de analyse beweert.

## Wat je hebt

- **De analyse:** `catalog/flux/{{version}}/changelog-analysis/`, met `release.json` en `tickets/`.
- **De feiten:** `catalog/flux/{{version}}/changelog/` (`release.json`, `tickets/`, `web-types-diff.json`,
  `dependencies-diff.json`), en `catalog/flux/{{version}}/web-types/` en `packages/`.
- **De bronrepo** in `{{repo}}`, uitgecheckt op v{{version}}:
  - de code van deze versie lees en doorzoek je met Read, Grep en Glob, in `{{repo}}`;
  - een commit en haar diff: `git -C {{repo}} show <sha>`;
  - een bestand van een andere versie: `git -C {{repo}} show v<versie>:<pad>`;
  - de geschiedenis en de bestanden van een andere versie: `git -C {{repo}} log …` en
    `git -C {{repo}} ls-tree -r --name-only v<versie>`.
- **De regels** waaraan de analyse moet voldoen: `prompts/changelog-analyse.md`. Lees die eerst.

Lees en zoek met Read, Grep en Glob. Bash mag enkel voor de git-commando's hierboven (`show`, `log` en
`ls-tree`) en voor `pnpm run flux:changelog:build {{version}}`, zonder pipes, `cd` of andere
commando's: al de rest wordt geweigerd, ook `git grep`.

## Wat je controleert

Per entry, in elk bestand in `changelog-analysis/tickets/`:

1. **Impact.** Ze past bij de feiten en bij de tabel in de regels. Met `source.published: false` is ze `none`, een
   breaking change is `action`. Wijkt ze af van `derivedImpact`, dan verantwoordt de uitleg dat. Een wijziging die
   bestaande code, tests of teksten van een afnemer anders laat werken, is `action`, geen `automatic`.
2. **Feiten.** Elke bewering in `explanation`, `action` en `example` staat in de commit (de body of de diff), in de
   Storybook-documentatie in `source.storybook`, of in de web-types. Lees de diff als je twijfelt.
3. **Namen.** Elke component, attribuut, property, event, methode, slot, CSS-variabele of class die genoemd wordt,
   bestaat in de web-types of de code van {{version}}, met exact die schrijfwijze. Controleer elke naam, ook in het
   voorbeeld. Staat een naam wel in de code maar niet in de web-types, dan moet de uitleg dat zeggen.
4. **Actie.** Bij impact `action` zegt `action` concreet wie het raakt en wat hij moet doen.
5. **Voorbeeld.** Geldige markup of code, met enkel namen die bestaan, en waar kan overgenomen uit Storybook.
6. **Taal.** Nederlands, gericht aan een afnemer, zonder interne details zoals testen, CI of guards.

Voor de versie:

7. Elke entry heeft een analyse, en de `summary` in `changelog-analysis/release.json` bestaat.
8. Elke wijziging aan het contract in `web-types-diff.json` (`added`, `removed`, `changed`) met
   `inChangelog: false` staat vermeld bij een entry of in de `summary`, tenzij ze een afnemer niet raakt.
9. De `summary` noemt wat actie vraagt, en ook gewijzigde dependencies (`dependencies-diff.json`) en commits buiten
   de changelog (`unlistedCommits` in `changelog/release.json`) die een afnemer raken. Ze spreekt de entries niet
   tegen.

## Wat je doet

- Klopt iets niet, verbeter het dan zelf in `catalog/flux/{{version}}/changelog-analysis/`. Schrijf nergens anders.
- Verander niets dat klopt. Herschrijf geen zin enkel omdat je hem anders zou schrijven.
- Draai daarna `pnpm run flux:changelog:build {{version}}`. Die moet slagen, en de lijst "nog niet
  geanalyseerd" moet leeg zijn.
- Kan je iets niet oplossen, omdat de feiten ontbreken of elkaar tegenspreken, zet het dan in `unresolved`.

## Wat je teruggeeft

Het resultaat in het gevraagde JSON-formaat, met de teksten in het Nederlands:

- `status`: `ok` als er niets te verbeteren viel, `fixed` als je iets verbeterde en nu alles klopt, `unresolved`
  als er iets overblijft;
- `corrections`: per verbetering het bestand, de entry (haar id, of `summary`), wat je veranderde en waarom, met
  de bron;
- `unresolved`: wat je niet kon oplossen, en waarom.
