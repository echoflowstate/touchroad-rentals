#!/usr/bin/env bash
# Claims audit for the Touch Road Rentals preview.
#
# Greps the shipped source for language this product is not allowed to use.
# The banned terms are assembled from fragments at runtime so this script does
# not itself put the literal strings into the repository.
#
# Exit code 0 means the audit is clean.
set -uo pipefail
cd "$(dirname "$0")/.."

SCAN=(src public index.html netlify.toml scripts README.md)
EXCLUDE_TEST='src/test/claims.test.ts'
FAIL=0

banned=(
  "insur""ance" "insur""ed" "insur""e" "cov""erage" "cov""ered"
  "protec""tion" "protec""t" "veri""fied" "veri""fy" "veri""fication"
  "backgro""und check" "guaran""tee" "guaran""teed" "vet""ted"
  "scree""ned" "cert""ified" "lice""nsed" "peace of ""mind"
)

echo "== 1. banned claim language =="
for term in "${banned[@]}"; do
  hits=$(grep -rniI --exclude-dir=node_modules --exclude-dir=dist \
    --exclude="$(basename "$0")" --exclude="$(basename "$EXCLUDE_TEST")" \
    -- "$term" "${SCAN[@]}" 2>/dev/null || true)
  count=$(printf '%s' "$hits" | grep -c . || true)
  printf '  %-22s %s\n' "$term" "$count"
  if [ "$count" != "0" ]; then FAIL=1; printf '%s\n' "$hits"; fi
done

echo "== 2. em dash and en dash =="
EM=$(printf '\xe2\x80\x94'); EN=$(printf '\xe2\x80\x93')
for pair in "em-dash:$EM" "en-dash:$EN"; do
  label="${pair%%:*}"; ch="${pair#*:}"
  hits=$(grep -rnI --exclude-dir=node_modules --exclude-dir=dist \
    --exclude="$(basename "$0")" -- "$ch" "${SCAN[@]}" 2>/dev/null || true)
  count=$(printf '%s' "$hits" | grep -c . || true)
  printf '  %-22s %s\n' "$label" "$count"
  if [ "$count" != "0" ]; then FAIL=1; printf '%s\n' "$hits"; fi
done

echo "== 3. app store links =="
for term in "apps.apple"".com" "play.google"".com" "itunes.""apple" "app-""store" "google""play"; do
  hits=$(grep -rniI --exclude-dir=node_modules --exclude-dir=dist \
    --exclude="$(basename "$0")" -- "$term" "${SCAN[@]}" 2>/dev/null || true)
  count=$(printf '%s' "$hits" | grep -c . || true)
  printf '  %-22s %s\n' "$term" "$count"
  if [ "$count" != "0" ]; then FAIL=1; printf '%s\n' "$hits"; fi
done

echo "== 4. contact details =="
hits=$(grep -rnIE --exclude-dir=node_modules --exclude-dir=dist \
  --exclude="$(basename "$0")" --exclude="$(basename "$EXCLUDE_TEST")" \
  -- '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "${SCAN[@]}" 2>/dev/null || true)
count=$(printf '%s' "$hits" | grep -c . || true)
printf '  %-22s %s\n' "email-shaped" "$count"
if [ "$count" != "0" ]; then FAIL=1; printf '%s\n' "$hits"; fi

hits=$(grep -rnIE --exclude-dir=node_modules --exclude-dir=dist \
  --exclude="$(basename "$0")" --exclude="$(basename "$EXCLUDE_TEST")" \
  -- '\(?[0-9]{3}\)?[-. ][0-9]{3}[-. ][0-9]{4}' "${SCAN[@]}" 2>/dev/null || true)
count=$(printf '%s' "$hits" | grep -c . || true)
printf '  %-22s %s\n' "phone-shaped" "$count"
if [ "$count" != "0" ]; then FAIL=1; printf '%s\n' "$hits"; fi

echo "== 5. required strings present =="
required=(
  "Sample listing"
  "Preview build - sample listings for demonstration."
  "Coming soon to the App Store and Google Play"
  "The price you see is the price you drive."
  "No booking fees on"
)
for term in "${required[@]}"; do
  count=$(grep -rlI --exclude-dir=node_modules --exclude-dir=dist \
    --exclude="$(basename "$0")" -F -- "$term" "${SCAN[@]}" 2>/dev/null | wc -l | tr -d ' ')
  printf '  %-52s %s file(s)\n' "$term" "$count"
  if [ "$count" = "0" ]; then FAIL=1; echo "  MISSING: $term"; fi
done

echo
if [ "$FAIL" = "0" ]; then echo "AUDIT CLEAN"; else echo "AUDIT FAILED"; fi
exit "$FAIL"
