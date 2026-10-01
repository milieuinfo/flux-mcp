# Containeraanvraag: de toepassing voor de evaluatie van de recepten

Een kleine toepassing op niveau 7.A van de planning, voor `pnpm run flux:server:eval-recipe migreren` (ADR-004,
sectie 9). Ze gebruikt de echte Flux web-componenten `@domg-wc/*` 2.12.1 uit de registry van Flux.

- **Gepinde versie:** `@domg-wc/common` en `@domg-wc/components` exact op 2.12.1. Niet 2.12.0: dat package importeert
  `.raw.css`-bestanden die er niet in zitten; 2.12.1 voegde ze toe (FLUX-604).
- **Standalone, zonder backend:** `pnpm start` (Vite); een aanvraag gaat nergens heen, de toepassing toont meteen de
  bevestiging.
- **e2e:** Playwright, `pnpm run test:e2e`, groen op 2.12.1.

Gekende verschillen bij een migratie naar 2.20.0, uit de catalogus:

| Ticket | Versie | Wat de toepassing doet | Wat de migratie vraagt |
|---|---|---|---|
| FLUX-620 | 2.15.0 | `title` op `vl-functional-header`, en een e2e-test die de header op dat attribuut zoekt | `title-label`, en de e2e-test aanpassen; zonder migratie faalt die test op 2.20.0 |
| FLUX-589 | 2.14.0 | `min-date="today"` op `vl-datepicker` | een `vl-form-message` voor `rangeUnderflow` |
| FLUX-638 | 2.14.0 | `disable-mobile-native-input` op `vl-datepicker` | het attribuut verdwijnt: de native datumkiezer op mobiel is weg |
| FLUX-219 | 2.19.0 | een `<div>` rond de items van `vl-description-data` | de items als directe kinderen |

Een registry-token voor de Flux-registry is niet nodig: de packages zijn publiek. De evaluatie draait pnpm met een
lege gebruikersconfiguratie, zodat een verlopen token in `~/.npmrc` de installatie niet laat falen.
