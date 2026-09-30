#!/bin/bash

# Brengt de catalogus voor een Flux Web Components release in één keer up-to-date: haalt alle bronnen van die
# release op, laat Claude Code de analyse schrijven en controleren, en bouwt de gegevens van alle versies opnieuw.
#
#   pnpm run flux:catalog:update 2.20.0
#   FLUX_REPO=~/pad/naar/flux-web-components pnpm run flux:catalog:update 2.20.0   # sneller
#   pnpm run flux:catalog:update --skip-analysis 2.20.0                            # zonder LLM
#
# De versie is verplicht; zie common.sh. Het script draait na elkaar:
#   1. web-types:copy, packages:copy, changelog:copy, changelog:cleanup en changelog:commits voor deze versie;
#   2. changelog:build --all: ook de volgende versie in de catalogus krijgt haar diffs tegen deze versie;
#   3. changelog:analyse voor deze versie, en voor de volgende versie als die er is: die kreeg misschien nieuwe
#      diffs, en haar bestaande analyse wordt aangevuld;
#   4. changelog:build --all en --check.
# Stap 3 heeft Claude Code nodig; zie changelog/analyse.mjs. Faalt een stap, dan stopt het script en zegt het met
# welk script je verder gaat; wat de stappen ervoor deden, blijft staan.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/../common.sh"

ANALYSIS=true
ARGS=()
for arg in "$@"; do
    if [ "${arg}" = "--skip-analysis" ]; then ANALYSIS=false; else ARGS+=("${arg}"); fi
done
require_version flux:catalog:update "${ARGS[@]+"${ARGS[@]}"}"

cd "${REPO_ROOT}"

# Draait één script; faalt het, dan zegt het met welk commando je verder gaat.
run() {
    echo "== $*"
    if ! pnpm run --silent "flux:$1" "${@:2}"; then
        echo "[FOUT] $* faalde. Los het op en ga verder met:" >&2
        echo "       pnpm run flux:$*" >&2
        exit 1
    fi
}

for step in web-types:copy packages:copy changelog:copy changelog:cleanup changelog:commits; do
    run "${step}" "${VERSION}"
done
run changelog:build --all

if [ "${ANALYSIS}" = false ]; then
    echo
    echo "Zonder analyse. Later: pnpm run flux:changelog:analyse ${VERSION}"
    exit 0
fi

# De versie waarvan deze versie de vorige is, als ze in de catalogus staat.
NEXT="$(node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const [dir, version] = process.argv.slice(1);
    for (const name of fs.readdirSync(dir)) {
        const file = path.join(dir, name, "changelog", "release.json");
        if (fs.existsSync(file) && JSON.parse(fs.readFileSync(file, "utf-8")).previous === version) console.log(name);
    }
' "${CATALOG_DIR}" "${VERSION}")"

run changelog:analyse "${VERSION}"
for next in ${NEXT}; do
    run changelog:analyse "${next}"
done
run changelog:build --all
run changelog:build --check

echo
echo "Klaar: ${VERSION}${NEXT:+ en ${NEXT}} staan in de catalogus, geanalyseerd en gecontroleerd."
