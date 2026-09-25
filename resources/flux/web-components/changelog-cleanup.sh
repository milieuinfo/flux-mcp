#!/bin/bash

# Kuist de changelog op die changelog-copy in de catalogus zette.
#
#   pnpm run flux:web-components:changelog-cleanup 2.20.0    # catalog/flux/2.20.0/changelog
#
# De changelog van een tag bevat de hele historiek. Het script houdt enkel de sectie van de versie zelf over,
# met de kop erbij, en schrijft ze naar changelog.md in plaats van CHANGELOG.md. Het werkt deterministisch op
# de tekst: een sectie begint bij een versiekop ('# [2.20.0](...)', '## [2.12.1](...)' voor een patch, of
# '# 1.0.0 (...)') en loopt tot de volgende. Een changelog.md die al opgekuist is, opnieuw opkuisen geeft
# hetzelfde resultaat.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

require_version flux:web-components:changelog-cleanup "$@"
DIR="${CATALOG_DIR}/${VERSION}/changelog"
TARGET="${DIR}/changelog.md"

# Op een hoofdletterongevoelig bestandssysteem (macOS) wijzen beide namen naar hetzelfde bestand; dat is geen
# probleem, want de sectie eruit halen geeft dan hetzelfde.
if [ -f "${DIR}/CHANGELOG.md" ]; then
    INPUT="${DIR}/CHANGELOG.md"
elif [ -f "${TARGET}" ]; then
    INPUT="${TARGET}"
else
    echo "Geen changelog in catalog/flux/${VERSION}/changelog."
    echo "Haal ze eerst op: pnpm run flux:web-components:changelog-copy ${VERSION}"
    exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT
OUTPUT="${WORKDIR}/changelog.md"

# Exit status 2: de versie staat er niet in, 3: ze staat er meer dan eens in. De lege regels na de sectie vallen
# weg.
status=0
awk -v version="${VERSION}" '
    /^##? / {
        heading = $0
        sub(/^##? \[?/, "", heading)
        sub(/[^0-9A-Za-z.-].*$/, "", heading)
        inside = (heading == version)
        if (inside) found++
    }
    inside {
        lines[++count] = $0
        if ($0 !~ /^[[:space:]]*$/) last = count
    }
    END {
        if (found == 0) exit 2
        if (found > 1) exit 3
        for (i = 1; i <= last; i++) print lines[i]
    }
' "${INPUT}" > "${OUTPUT}" || status=$?

case "${status}" in
    0) ;;
    2)
        echo "Versie ${VERSION} staat niet in de changelog."
        exit 1
        ;;
    3)
        echo "Versie ${VERSION} staat meer dan eens in de changelog."
        exit 1
        ;;
    *) exit "${status}" ;;
esac

# Eerst weg met het origineel: op macOS kan de naam CHANGELOG.md anders blijven staan.
rm -f "${DIR}/CHANGELOG.md" "${TARGET}"
mv "${OUTPUT}" "${TARGET}"

echo "Opgekuist: catalog/flux/${VERSION}/changelog/changelog.md, $(wc -l < "${TARGET}" | tr -d ' ') regels."
