#!/bin/bash

# Kopieert de Code Connect templates van een Flux Web Components release naar de catalogus.
#
#   pnpm run figma:web-components:copy-figma                            # haalt de laatste release
#   pnpm run figma:web-components:copy-figma 2.20.0                     # haalt tag v2.20.0
#   pnpm run figma:web-components:copy-figma 2.20.0 --ref develop-v2    # haalt een andere git ref
#
# De catalogus houdt per Figma-library één set templates bij: een nieuwe kopie vervangt de vorige. Wat er
# veranderde, zie je in de git-diff; welke release erin zit, in manifest.json. De library volgt de major van
# de versie (2.21.0 → v2); met FIGMA_MAJOR_VERSION=3 kies je een andere.
#
# De catalogus is plat, met één map per soort: atom, block, compliance, form, map en styles. De helpers die
# de templates relatief importeren, komen in util/; de imports worden daarop herschreven.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/../common.sh"

VERSION=""
REF=""

while [ $# -gt 0 ]; do
    case "$1" in
        --ref)
            REF="$2"
            shift 2
            ;;
        *)
            VERSION="$1"
            shift
            ;;
    esac
done

# Zonder versie: de laatste release uit de bronrepo. Staat FIGMA_MAJOR_VERSION gezet, dan de laatste binnen die major.
if [ -z "${VERSION}" ]; then
    echo "Geen versie opgegeven, de laatste release opzoeken in ${FLUX_REPO}"
    VERSION="$(latest_version "${FIGMA_MAJOR_VERSION#v}")"
    if [ -z "${VERSION}" ]; then
        echo "Geen release tag gevonden. Geef er een op: $0 <versie> [--ref <git-ref>]"
        exit 1
    fi
    echo "Laatste release: ${VERSION}"
fi

VERSION="$(normalize_version "${VERSION}")"
REF="${REF:-v${VERSION}}"
LIBRARY="$(detect_library_for "${VERSION}")"
TARGET="${CATALOG_DIR}/${LIBRARY}"

rm -rf "${TARGET}"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT
SOURCE="${WORKDIR}/flux-web-components"

echo "Ophalen van ${FLUX_REPO} (${REF})"
git clone --quiet --depth 1 --branch "${REF}" "${FLUX_REPO}" "${SOURCE}"
SOURCE_COMMIT="$(git -C "${SOURCE}" rev-parse HEAD)"

mkdir -p "${TARGET}"

# De soort bepaalt de map in de catalogus.
kind_of() {
    case "$1" in
        libs/components/src/*) echo "$1" | cut -d/ -f4 ;;
        libs/map/*) echo "map" ;;
        libs/styles/*) echo "styles" ;;
        *)
            echo "Onbekende soort voor $1" >&2
            exit 1
            ;;
    esac
}

TEMPLATES=()
while IFS= read -r file; do
    kind="$(kind_of "${file}")"
    target="${TARGET}/${kind}/$(basename "${file}")"
    if [ -e "${target}" ]; then
        echo "Dubbele bestandsnaam in ${kind}: $(basename "${file}")"
        exit 1
    fi
    mkdir -p "${TARGET}/${kind}"
    cp "${SOURCE}/${file}" "${target}"
    TEMPLATES+=("${file}")
done < <(cd "${SOURCE}" && find libs -type f \( -name '*.figma.ts' -o -name '*.figma.batch.ts' -o -name '*.figma.batch.json' \) | sort)

if [ ${#TEMPLATES[@]} -eq 0 ]; then
    echo "Geen templates gevonden in ${REF}."
    exit 1
fi

# De helpers die de templates relatief importeren, zoals resources/code-connect/escape-html.ts. Ze komen in
# util/, en elke relatieve import wordt herschreven naar '../util/<naam>'.
HELPERS=()
for template in "${TEMPLATES[@]}"; do
    [[ "${template}" == *.ts ]] || continue
    copied="${TARGET}/$(kind_of "${template}")/$(basename "${template}")"
    while IFS= read -r spec; do
        [ -n "${spec}" ] || continue
        # Los het relatieve pad op vanaf de map van het template in de bronrepo.
        helper="$(cd "${SOURCE}/$(dirname "${template}")/$(dirname "${spec}")" && pwd)/$(basename "${spec}").ts"
        name="$(basename "${spec}")"
        if [ ! -e "${TARGET}/util/${name}.ts" ]; then
            mkdir -p "${TARGET}/util"
            cp "${helper}" "${TARGET}/util/${name}.ts"
            HELPERS+=("${helper#${SOURCE}/}")
        fi
        sed -i.bak "s|from '${spec}'|from '../util/${name}'|" "${copied}"
        rm "${copied}.bak"
    done < <(grep -o "from '\.\.[^']*'" "${SOURCE}/${template}" | sed "s/from '//; s/'$//" | sort -u)
done

# De config van de bronrepo, met de include-patronen aangepast aan de platte structuur.
sed 's|"libs/\*\*/|"**/|g' "${SOURCE}/figma.config.json" > "${TARGET}/figma.config.json"

cat > "${TARGET}/manifest.json" <<EOF
{
    "library": "${LIBRARY}",
    "version": "${VERSION}",
    "sourceRepository": "${FLUX_REPO_URL}",
    "sourceRef": "${REF}",
    "sourceCommit": "${SOURCE_COMMIT}",
    "syncedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "templateCount": ${#TEMPLATES[@]},
    "codeConnectCli": "@figma/code-connect@$(node -p "require('${REPO_ROOT}/package.json').devDependencies['@figma/code-connect']")"
}
EOF

echo "Gekopieerd naar catalog/figma/code-connect/${LIBRARY}: ${#TEMPLATES[@]} templates, ${#HELPERS[@]} helpers."
echo "Controleer met: FIGMA_MAJOR_VERSION=${LIBRARY#v} pnpm run figma:code-connect:publish --dry-run"
