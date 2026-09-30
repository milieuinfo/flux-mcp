#!/bin/bash

# Installeert in de Jenkins-pod de pnpm-versie uit het packageManager-veld van package.json. Lokaal niet nodig:
# daar staat pnpm al. Dit is het enige script dat niet via 'pnpm run' loopt, want het zet pnpm er net neer.
#
# Zelfde aanpak als resources/ci-jenkins/bash/lib/install-pnpm.sh in flux-web-components: via npm, want corepack
# krijgt met de Artifactory-registry geen toegang tot de pnpm-tarball. npm is hier alleen het opstapje naar pnpm.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACKAGE_MANAGER="$(node -p "require('${REPO_ROOT}/package.json').packageManager")"

if [[ ! ${PACKAGE_MANAGER} =~ ^pnpm@([0-9]+\.[0-9]+\.[0-9]+)(\+.*)?$ ]]; then
    echo "packageManager in package.json is geen pnpm-versie: '${PACKAGE_MANAGER}'" >&2
    exit 1
fi
PNPM_VERSION="${BASH_REMATCH[1]}"

if [[ "$(pnpm --version 2>/dev/null)" == "${PNPM_VERSION}" ]]; then
    echo "pnpm ${PNPM_VERSION} staat al op PATH"
    exit 0
fi

npm install -g "pnpm@${PNPM_VERSION}" --no-audit --no-fund

INSTALLED_PNPM_VERSION="$(pnpm --version 2>/dev/null || true)"
if [[ "${INSTALLED_PNPM_VERSION}" != "${PNPM_VERSION}" ]]; then
    echo "pnpm ${PNPM_VERSION} verwacht, maar 'pnpm --version' geeft '${INSTALLED_PNPM_VERSION:-niets}'" >&2
    exit 1
fi

echo "pnpm ${PNPM_VERSION} geïnstalleerd"
