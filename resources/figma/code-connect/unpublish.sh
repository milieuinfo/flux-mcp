#!/bin/bash

# Haalt de Code Connect snippets uit de catalogus weg uit Figma.
#
#   pnpm run figma:code-connect:unpublish
#   pnpm run figma:code-connect:unpublish --library v3    # kiest de library, als er meerdere zijn
#
# Let op: dit verwijdert de snippets van de nodes die in de catalogus zitten. Het zet niets terug naar een
# vorige stand — daarvoor publiceer je die opnieuw.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/../common.sh"

# --library eruit filteren; de rest gaat door naar de Code Connect CLI.
FIGMA_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --library)
            LIBRARY_OVERRIDE="$2"
            shift 2
            ;;
        *)
            FIGMA_ARGS+=("$1")
            shift
            ;;
    esac
done

TARGET="$(require_library_dir)"
require_token

echo "Verwijderen van ${TARGET#"${REPO_ROOT}/"} uit Figma"
figma connect unpublish \
    --dir "${TARGET}" \
    --token "${FIGMA_TOKEN}" \
    ${FIGMA_ARGS[@]+"${FIGMA_ARGS[@]}"}
