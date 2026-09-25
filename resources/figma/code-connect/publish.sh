#!/bin/bash

# Publiceert de Code Connect templates uit de catalogus naar Figma.
#
#   pnpm run figma:code-connect:publish --dry-run    # valideert de templates, publiceert niets
#   pnpm run figma:code-connect:publish              # publiceert
#
# Figma bewaart per node en per label één snippet. Publiceren vervangt dus wat er voor die nodes al stond.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/../common.sh"

TARGET="$(require_library_dir)"
require_token

echo "Publiceren van ${TARGET#"${REPO_ROOT}/"}"
figma connect publish \
    --dir "${TARGET}" \
    --token "${FIGMA_TOKEN}" \
    --exit-on-unreadable-files \
    "$@"
