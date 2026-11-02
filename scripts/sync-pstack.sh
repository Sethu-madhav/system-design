#!/usr/bin/env bash
# Vendor the pstack plugin (github.com/cursor/plugins/pstack) into vendor/pstack.
# Re-run to update. Pass a git ref as the first argument (default: main).
set -euo pipefail

REF="${1:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/vendor/pstack"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 --filter=blob:none --sparse --branch "$REF" \
  https://github.com/cursor/plugins "$TMP/plugins" >/dev/null
git -C "$TMP/plugins" sparse-checkout set pstack >/dev/null

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$TMP/plugins/pstack/." "$DEST/"
rm -f "$DEST/.gitignore"

echo "pstack vendored at vendor/pstack (version $(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$DEST/plugin.json" | head -1))"
