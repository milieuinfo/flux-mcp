#!/bin/bash

# Kopieert de web-types van een Flux Web Components release naar de catalogus.
#
#   pnpm run flux:web-components:web-types-copy 2.20.0    # haalt tag v2.20.0 naar catalog/flux/2.20.0/web-types
#
# De versie is verplicht. Anders dan bij de Code Connect templates houdt de catalogus hier de versies naast
# elkaar bij: de MCP-server biedt de web-types per versie aan. Een nieuwe kopie van dezelfde versie vervangt
# de vorige web-types; de rest van de versiemap blijft staan.
#
# De map web-types is plat: de *.web-types.json bestanden van de tag, zonder de mappen van de bronrepo. Daar
# staat DOMG-WC-VERSION waar de versie hoort, onder meer in elke doc-url; het script vult de versie in, zodat
# die links naar de Storybook van de release wijzen.

set -euo pipefail

# Zie 'Bronrepo' in de README: met FLUX_REPO gebruik je een lokale clone.
FLUX_REPO_URL="https://github.com/milieuinfo/flux-web-components.git"
FLUX_REPO="${FLUX_REPO:-${FLUX_REPO_URL}}"

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PLACEHOLDER="DOMG-WC-VERSION"

if [ $# -ne 1 ]; then
    echo "Geef een versie op: pnpm run flux:web-components:web-types-copy <versie>"
    exit 1
fi

# Laat zowel "2.20.0" als "v2.20.0" toe.
VERSION="${1#v}"
if ! [[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    echo "Ongeldige versie: $1"
    exit 1
fi
REF="v${VERSION}"
TARGET="${REPO_ROOT}/catalog/flux/${VERSION}/web-types"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT
SOURCE="${WORKDIR}/flux-web-components"
STAGING="${WORKDIR}/web-types"

# Zonder checkout en zonder blobs: git haalt enkel de bestanden op die we lezen.
echo "Ophalen van ${FLUX_REPO} (${REF})"
git clone --quiet --depth 1 --filter=blob:none --no-checkout --branch "${REF}" "${FLUX_REPO}" "${SOURCE}"

FILES=()
while IFS= read -r file; do
    FILES+=("${file}")
done < <(git -C "${SOURCE}" ls-tree -r --name-only HEAD | grep '\.web-types\.json$')

if [ ${#FILES[@]} -eq 0 ]; then
    echo "Geen web-types gevonden in ${REF}."
    exit 1
fi

mkdir -p "${STAGING}"
for file in "${FILES[@]}"; do
    target="${STAGING}/$(basename "${file}")"
    if [ -e "${target}" ]; then
        echo "Dubbele bestandsnaam: $(basename "${file}")"
        exit 1
    fi
    git -C "${SOURCE}" show "HEAD:${file}" | sed "s|${PLACEHOLDER}|${VERSION}|g" > "${target}"
done

# Pas vervangen als alles opgehaald is: een mislukte run laat de catalogus ongemoeid.
rm -rf "${TARGET}"
mkdir -p "$(dirname "${TARGET}")"
mv "${STAGING}" "${TARGET}"

echo "Gekopieerd naar catalog/flux/${VERSION}/web-types: ${#FILES[@]} web-types."
