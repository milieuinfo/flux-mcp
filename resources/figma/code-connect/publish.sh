#!/bin/bash

# Publiceert de Code Connect templates uit de catalogus naar Figma.
#
#   pnpm run figma:code-connect:publish --dry-run       # valideert de templates, publiceert niets
#   pnpm run figma:code-connect:publish                 # publiceert
#   pnpm run figma:code-connect:publish --library v3    # kiest de library, als er meerdere zijn
#
# Figma bewaart per node en per label één snippet. Publiceren vervangt dus wat er voor die nodes al stond.

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

echo "Publiceren van ${TARGET#"${REPO_ROOT}/"}"
figma connect publish \
    --dir "${TARGET}" \
    --token "${FIGMA_TOKEN}" \
    --exit-on-unreadable-files \
    ${FIGMA_ARGS[@]+"${FIGMA_ARGS[@]}"}
