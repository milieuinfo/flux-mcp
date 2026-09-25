#!/bin/bash

# Kopieert de web-types van een Flux Web Components release naar de catalogus.
#
#   pnpm run flux:web-components:web-types-copy 2.20.0    # haalt tag v2.20.0 naar catalog/flux/2.20.0/web-types
#
# De versie is verplicht; zie common.sh. Een nieuwe kopie van dezelfde versie vervangt de vorige web-types; de
# rest van de versiemap blijft staan.
#
# De map web-types is plat: de *.web-types.json bestanden van de tag, zonder de mappen van de bronrepo. Daar
# staat DOMG-WC-VERSION waar de versie hoort, onder meer in elke doc-url; het script vult de versie in, zodat
# die links naar de Storybook van de release wijzen.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

PLACEHOLDER="DOMG-WC-VERSION"

require_version flux:web-components:web-types-copy "$@"
TARGET="${CATALOG_DIR}/${VERSION}/web-types"

fetch_source
STAGING="${WORKDIR}/web-types"

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

replace_target "${STAGING}" "${TARGET}"

echo "Gekopieerd naar catalog/flux/${VERSION}/web-types: ${#FILES[@]} web-types."
