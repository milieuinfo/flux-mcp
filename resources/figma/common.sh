# Gedeelde instellingen voor de Code Connect scripts. Wordt gesourced, niet uitgevoerd.
#
# De versie van de Code Connect CLI staat gepind in package.json (devDependencies): een template dat met die
# versie gevalideerd is, publiceren we ook met die versie. Via 'pnpm run' staat de binary 'figma' op het PATH.

# Bron van de templates. Zonder deze variabele wordt de repo per run gekloond; ze is open source, dus dat
# vraagt geen credentials en in CI hoeft er niets ingesteld te worden. Wijs ze naar een lokale clone om
# zonder netwerk te werken:
#   FLUX_REPO=~/repos/flux-web-components pnpm run figma:web-components:copy-figma 2.20.0
# In de catalogus staat altijd FLUX_REPO_URL als bron, ook als er van een lokale clone gekloond werd.
FLUX_REPO_URL="https://github.com/milieuinfo/flux-web-components.git"
FLUX_REPO="${FLUX_REPO:-${FLUX_REPO_URL}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CATALOG_DIR="${REPO_ROOT}/catalog/figma/code-connect"

# De catalogus houdt geen Flux-versies bij: git versioneert de templates. De map is de Figma-library waarvoor
# ze bedoeld zijn, en die volgt de major van de Flux-release: 2.21.0 hoort bij v2, 3.0.0 bij v3. Zo komt een
# nieuwe library er vanzelf naast te staan. Zet FIGMA_MAJOR_VERSION=3 om dat te overrulen.

# Laat zowel "2.20.0" als "v2.20.0" toe.
normalize_version() {
    printf '%s' "${1#v}"
}

# De hoogste release tag in de bronrepo, zonder prereleases. Met een argument: de hoogste binnen die major.
latest_version() {
    local major="${1:-[0-9]+}"
    git ls-remote --tags --refs "${FLUX_REPO}" 'v*' 2>/dev/null |
        awk '{print $2}' |
        sed 's|refs/tags/v||' |
        grep -E "^${major}\.[0-9]+\.[0-9]+$" |
        sort -V |
        tail -1
}

# De library waar een Flux-versie bij hoort.
library_for_version() {
    printf 'v%s' "$(normalize_version "$1" | cut -d. -f1)"
}

# Idem, maar FIGMA_MAJOR_VERSION wint.
detect_library_for() {
    if [ -n "${FIGMA_MAJOR_VERSION:-}" ]; then
        printf 'v%s' "${FIGMA_MAJOR_VERSION#v}"
    else
        library_for_version "$1"
    fi
}

# De library van wat er in de catalogus staat, voor commando's zonder versie. Staat er meer dan één, dan kiest
# FIGMA_MAJOR_VERSION.
detect_library() {
    if [ -n "${FIGMA_MAJOR_VERSION:-}" ]; then
        # Zowel "3" als "v3" mag.
        printf 'v%s' "${FIGMA_MAJOR_VERSION#v}"
        return
    fi
    local found
    found=$(ls "${CATALOG_DIR}" 2>/dev/null)
    case "$(printf '%s' "${found}" | grep -c .)" in
        0)
            echo "Er staan geen templates in de catalogus." >&2
            echo "Haal ze eerst op: pnpm run figma:web-components:copy-figma <versie>" >&2
            exit 1
            ;;
        1)
            printf '%s' "${found}"
            ;;
        *)
            echo "Meerdere libraries in de catalogus: $(printf '%s' "${found}" | tr '\n' ' ')" >&2
            echo "Kies er een: FIGMA_MAJOR_VERSION=2 pnpm run ..." >&2
            exit 1
            ;;
    esac
}

require_library_dir() {
    local library dir
    # Apart toewijzen: bij 'local dir=$(...)' maskeert local de exit status van detect_library.
    library="$(detect_library)" || exit 1
    dir="${CATALOG_DIR}/${library}"
    if [ ! -d "${dir}" ]; then
        echo "Library $(basename "${dir}") staat niet in de catalogus." >&2
        echo "Haal ze eerst op: pnpm run figma:web-components:copy-figma <versie>" >&2
        exit 1
    fi
    printf '%s' "${dir}"
}

require_token() {
    if [ -z "${FIGMA_TOKEN:-}" ]; then
        echo "FIGMA_TOKEN ontbreekt. Zet een Figma token met 'File content: read' en 'Code Connect: write'."
        exit 1
    fi
}
