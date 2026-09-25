# Gedeelde instellingen voor de scripts die een Flux Web Components release naar catalog/flux/ kopiëren en
# daar opkuisen. Wordt gesourced, niet uitgevoerd.
#
# Anders dan bij de Code Connect templates houdt de catalogus hier de versies naast elkaar bij: de MCP-server
# biedt ze per versie aan. Elk script vult zijn eigen map onder catalog/flux/<versie>/ en laat de rest van de
# versiemap staan.

# Zie 'Bronrepo' in de README: met FLUX_REPO gebruik je een lokale clone.
FLUX_REPO_URL="https://github.com/milieuinfo/flux-web-components.git"
FLUX_REPO="${FLUX_REPO:-${FLUX_REPO_URL}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CATALOG_DIR="${REPO_ROOT}/catalog/flux"

# Zet VERSION en REF (de tag) uit het enige argument van het script. De versie is verplicht.
#   require_version flux:web-components:web-types-copy "$@"
require_version() {
    local script="$1"
    shift
    if [ $# -ne 1 ]; then
        echo "Geef een versie op: pnpm run ${script} <versie>"
        exit 1
    fi
    # Laat zowel "2.20.0" als "v2.20.0" toe.
    VERSION="${1#v}"
    if ! [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
        echo "Ongeldige versie: $1"
        exit 1
    fi
    REF="v${VERSION}"
}

# Kloont REF naar SOURCE, in een tijdelijke WORKDIR die bij het einde van het script opgeruimd wordt. Zonder
# checkout en zonder blobs: git haalt enkel de bestanden op die het script leest met 'git show'.
fetch_source() {
    WORKDIR="$(mktemp -d)"
    trap 'rm -rf "${WORKDIR}"' EXIT
    SOURCE="${WORKDIR}/flux-web-components"
    echo "Ophalen van ${FLUX_REPO} (${REF})"
    git clone --quiet --depth 1 --filter=blob:none --no-checkout --branch "${REF}" "${FLUX_REPO}" "${SOURCE}"
}

# Vervangt de map in de catalogus door wat klaarstaat. Roep dit pas op als alles opgehaald is: een mislukte run
# laat de catalogus ongemoeid.
#   replace_target <staging> <target>
replace_target() {
    rm -rf "$2"
    mkdir -p "$(dirname "$2")"
    mv "$1" "$2"
}
