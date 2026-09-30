// De url van de Storybook van een Flux-release. Flux publiceert ze onder de major: 2.20.0 staat op
// https://flux.omgeving.vlaanderen.be/release-v2/2.20.0/storybook/. Een module zonder imports, zodat elk script ze
// gebruikt zonder de rest van de server te laden.

// Met een '/' op het einde; daarachter komt '?path=/docs/<id>', '?path=/story/<id>' of 'index.json'.
export const storybookBase = (version) =>
    `https://flux.omgeving.vlaanderen.be/release-v${version.split('.')[0]}/${version}/storybook/`;
