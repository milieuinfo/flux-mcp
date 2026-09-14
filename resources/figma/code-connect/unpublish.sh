#!/bin/bash

# Haalt de Code Connect snippets uit de catalogus weg uit Figma.
#
#   pnpm run figma:code-connect:unpublish
#
# Let op: dit verwijdert de snippets van de nodes die in de catalogus zitten. Het zet niets terug naar een
# vorige stand — daarvoor publiceer je die opnieuw.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/common.sh"

TARGET="$(require_library_dir)"
require_token

echo "Verwijderen van ${TARGET#"${REPO_ROOT}/"} uit Figma"
figma connect unpublish \
    --dir "${TARGET}" \
    --token "${FIGMA_TOKEN}" \
    "$@"
