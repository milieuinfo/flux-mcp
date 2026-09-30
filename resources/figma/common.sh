# Gedeelde instellingen voor de Code Connect scripts. Wordt gesourced, niet uitgevoerd.
#
# De versie van de Code Connect CLI staat gepind in package.json (devDependencies): een template dat met die
# versie gevalideerd is, publiceren we ook met die versie. Via 'pnpm run' staat de binary 'figma' op het PATH.

# FLUX_REPO, REPO_ROOT en parse_version: wat de scripts van beide sporen delen. FLUX_REPO is de bron van de
# templates. Zonder die variabele wordt de repo per run gekloond; ze is open source, dus dat vraagt geen
# credentials en in CI hoeft er niets ingesteld te worden. Wijs ze naar een lokale clone om zonder netwerk te
# werken:
#   FLUX_REPO=~/repos/flux-web-components pnpm run figma:code-connect:copy 2.20.0
# In de catalogus staat altijd FLUX_REPO_URL als bron, ook als er van een lokale clone gekloond werd.
source "$(dirname "${BASH_SOURCE[0]}")/../common.sh"

CATALOG_DIR="${REPO_ROOT}/catalog/figma/code-connect"

# De catalogus houdt geen Flux-versies bij: git versioneert de templates. De map is de Figma-library waarvoor
# de templates bedoeld zijn. Een nieuwe Flux-major komt altijd samen met een nieuwe library-file, met hetzelfde
# nummer: 2.21.0 hoort bij v2, 3.0.0 bij v3. Wie een versie meekrijgt, leidt de library daaruit af. Publish en
# unpublish krijgen er geen, en nemen de library uit de catalogus; staan er meerdere, dan kiest --library.
LIBRARY_OVERRIDE=""

# De library waar een Flux-versie bij hoort: de major, bv. v2 voor 2.21.0.
library_for_version() {
    local version="${1#v}"
    printf 'v%s' "${version%%.*}"
}

# De library van wat er in de catalogus staat, voor publish en unpublish. Staat er meer dan één, dan kies je
# met --library. Zowel "3" als "v3" mag.
detect_library() {
    if [ -n "${LIBRARY_OVERRIDE}" ]; then
        printf 'v%s' "${LIBRARY_OVERRIDE#v}"
        return
    fi
    local found
    found=$(ls "${CATALOG_DIR}" 2>/dev/null)
    case "$(printf '%s' "${found}" | grep -c .)" in
        0)
            echo "Er staan geen templates in de catalogus." >&2
            echo "Haal ze eerst op: pnpm run figma:code-connect:copy <versie>" >&2
            exit 1
            ;;
        1)
            printf '%s' "${found}"
            ;;
        *)
            echo "Meerdere libraries in de catalogus: $(printf '%s' "${found}" | tr '\n' ' ')" >&2
            echo "Kies er een met --library, bijvoorbeeld: pnpm run figma:code-connect:publish --library v2" >&2
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
        echo "Haal ze eerst op: pnpm run figma:code-connect:copy <versie>" >&2
        exit 1
    fi
    printf '%s' "${dir}"
}

require_token() {
    if [ -z "${FIGMA_TOKEN:-}" ]; then
        echo "FIGMA_TOKEN ontbreekt. Zet een Figma token met 'File content: read' en 'Code Connect: write'." >&2
        exit 1
    fi
}
