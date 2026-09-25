#!/bin/bash

# Kopieert de changelog van een Flux Web Components release naar de catalogus.
#
#   pnpm run flux:web-components:changelog-copy 2.20.0    # haalt tag v2.20.0 naar catalog/flux/2.20.0/changelog
#
# De versie is verplicht; zie common.sh. Een nieuwe kopie van dezelfde versie vervangt de vorige changelog; de
# rest van de versiemap blijft staan.
#
# De changelog is die van de tag, dus met de historiek tot en met die release. changelog-cleanup houdt daar
# enkel de release zelf van over.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

CHANGELOG="resources/changelog/CHANGELOG.md"

require_version flux:web-components:changelog-copy "$@"
TARGET="${CATALOG_DIR}/${VERSION}/changelog"

fetch_source
STAGING="${WORKDIR}/changelog"

if ! git -C "${SOURCE}" cat-file -e "HEAD:${CHANGELOG}" 2>/dev/null; then
    echo "Geen changelog gevonden in ${REF}: ${CHANGELOG} ontbreekt."
    exit 1
fi

mkdir -p "${STAGING}"
git -C "${SOURCE}" show "HEAD:${CHANGELOG}" > "${STAGING}/$(basename "${CHANGELOG}")"

replace_target "${STAGING}" "${TARGET}"

echo "Gekopieerd naar catalog/flux/${VERSION}/changelog: $(basename "${CHANGELOG}")."
