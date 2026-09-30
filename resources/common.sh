# Wat de bash-scripts delen: de bronrepo en de versie van een Flux-release. Wordt gesourced door de common.sh van
# een spoor, niet rechtstreeks door een script.

# De repo van Flux Web Components; zie docs/technisch/scripts.md. Met FLUX_REPO gebruik je een lokale clone.
# FLUX_REPO_URL blijft de publieke repo, ook als er van een lokale clone gekloond wordt.
FLUX_REPO_URL="https://github.com/milieuinfo/flux-web-components.git"
FLUX_REPO="${FLUX_REPO:-${FLUX_REPO_URL}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Zet VERSION uit een Flux-versie. "2.20.0" en "v2.20.0" mogen allebei, net als een prerelease zoals
# "2.21.0-develop-v2.1". Een ongeldige versie stopt het script.
#   parse_version "$1"
parse_version() {
    VERSION="${1#v}"
    if ! [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
        echo "Ongeldige versie: $1" >&2
        exit 1
    fi
}
