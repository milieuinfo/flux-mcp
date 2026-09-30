# Gedeelde instellingen voor de scripts die een Flux Web Components release naar catalog/flux/ kopiëren en
# daar opkuisen. Wordt gesourced, niet uitgevoerd.
#
# Anders dan bij de Code Connect templates houdt de catalogus hier de versies naast elkaar bij: de MCP-server
# biedt ze per versie aan. Elk script vult zijn eigen map onder catalog/flux/<versie>/ en laat de rest van de
# versiemap staan.

# FLUX_REPO, REPO_ROOT en parse_version komen uit resources/common.sh.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

CATALOG_DIR="${REPO_ROOT}/catalog/flux"

# Zet VERSION en REF (de tag) uit het enige argument van het script. De versie is verplicht.
#   require_version flux:web-types:copy "$@"
require_version() {
    local script="$1"
    shift
    if [ $# -ne 1 ]; then
        echo "Geef een versie op: pnpm run ${script} <versie>" >&2
        exit 1
    fi
    parse_version "$1"
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
