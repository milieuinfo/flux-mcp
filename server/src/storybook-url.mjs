// De url van de Storybook van een Flux-release. Flux publiceert ze onder de major: 2.20.0 staat op
// https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/. Een module zonder imports, zodat elk script ze
// gebruikt zonder de rest van de server te laden.

// De site met de Storybooks. FLUX_STORYBOOK_URL kiest een andere, zoals FLUX_REGISTRY de registry: de tests van de
// runs wijzen ze naar een lokale server.
const SITE = (process.env.FLUX_STORYBOOK_URL || 'https://flux.omgeving.vlaanderen.be').replace(/\/$/, '');

// Met een '/' op het einde; daarachter komt '?path=/docs/<id>', '?path=/story/<id>' of 'index.json'.
export const storybookBase = (version) => `${SITE}/release-v${version.split('.')[0]}/${version}/storybook/`;
