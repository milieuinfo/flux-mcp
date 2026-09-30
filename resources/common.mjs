// Wat de Node-scripts delen: de bronrepo en de versie van een Flux-release. Voor de bash-scripts staat hetzelfde in
// resources/common.sh.

// De repo van Flux Web Components; zie docs/technisch/scripts.md. Met FLUX_REPO gebruik je een lokale clone.
export const FLUX_REPO = process.env.FLUX_REPO || 'https://github.com/milieuinfo/flux-web-components.git';
// Of FLUX_REPO een remote is (https of ssh) en geen map op schijf: een clone van een remote kan filteren.
export const FLUX_REPO_REMOTE = /^[a-z+]+:\/\//.test(FLUX_REPO) || /^[^/]+@[^:]+:/.test(FLUX_REPO);

// Een Flux-versie zonder 'v' vooraan: 2.20.0, of een prerelease zoals 2.21.0-develop-v2.1.
export const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
