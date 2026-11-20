#!/usr/bin/env bash
# Pack-and-consume check for the JS package (LM-475). Consumers' svelte-check
# (ui-service) compiles the shipped wrapper .ts with the settings below, using
# only what npm installs for them: production dependencies, never our
# devDependencies. This installs the package tarball into a throwaway project
# that way and runs tsc --noEmit over the installed wrapper .ts.
#
# Usage: js-pack-consume.sh [tarball]   (default: npm pack ledger-models-javascript)
# Needs ledger-models-javascript/node_modules (npm ci) for tsc.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
js="$root/ledger-models-javascript"
tsc="$js/node_modules/.bin/tsc"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if [ $# -gt 0 ]; then
  tarball="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
else
  tarball="$tmp/$(cd "$js" && npm pack --silent --pack-destination "$tmp")"
fi

consumer="$tmp/consumer"
mkdir "$consumer"
echo '{ "name": "ledger-models-consumer", "private": true }' >"$consumer/package.json"
(cd "$consumer" && npm install --omit=dev --ignore-scripts --no-audit --no-fund --no-package-lock --silent "$tarball")

# ui-service's settings. TypeScript 5.5+ removes preserveValueImports and
# importsNotUsedAsValues: switch to verbatimModuleSyntax then.
cat >"$consumer/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "noEmit": true,
    "target": "es2020",
    "lib": ["es2020", "dom"],
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "isolatedModules": true,
    "preserveValueImports": true,
    "importsNotUsedAsValues": "error",
    "ignoreDeprecations": "5.0",
    "skipLibCheck": true
  },
  "include": ["node_modules/@fintekkers/ledger-models/node/wrappers/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
JSON

"$tsc" -p "$consumer"

# Passing must mean the wrappers were compiled with luxon's types, not that
# nothing was compiled.
files="$("$tsc" -p "$consumer" --listFilesOnly)"
for f in node_modules/@fintekkers/ledger-models/node/wrappers/models/utils/datetime.ts \
  node_modules/@types/luxon/index.d.ts; do
  if ! grep -q "$f" <<<"$files"; then
    echo "pack-and-consume check did not compile $f" >&2
    exit 1
  fi
done
echo "pack-and-consume: installed package's wrapper .ts compile with consumer settings"
