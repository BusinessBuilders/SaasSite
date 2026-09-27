#!/usr/bin/env bash
# scripts/stripe-offers.sh — make (or refresh) the Stripe products, prices and
# Payment Links for every offer in src/utils/offers.json, then write the link
# URLs and Stripe ids back into that file.
#
#   bash scripts/stripe-offers.sh          # provision + write back + verify links
#   bash scripts/stripe-offers.sh --check  # only verify the links in offers.json load
#
# The live key for the Business Builder Stripe account exists only on the BB
# VPS, so the Python worker (scripts/stripe-offers.py) is shipped there over
# ONE SSH session and run in place. The key never leaves the server and is
# never printed. The script refuses to run against any other Stripe account.
#
# After it finishes, commit src/utils/offers.json: the website reads the links
# from it at build time and the unit test fails if any link is missing.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=linuxuser@66.42.116.215
ENVFILE=/home/linuxuser/NewUpdate/.env.production.local
OFFERS=src/utils/offers.json

# The SSH key is unlocked in the desktop keyring; non-login shells do not
# export the agent socket (see the prod-deploy memory note).
export SSH_AUTH_SOCK=${SSH_AUTH_SOCK:-/run/user/1000/keyring/ssh}

verify_links() {
  # Every Payment Link must answer 200 from Stripe. A dead link is a Buy button
  # that goes nowhere, so this is a hard failure.
  local failures=0
  while IFS=$'\t' read -r slug url; do
    if [ -z "$url" ]; then
      echo "MISSING  $slug has no paymentLink" >&2
      failures=$((failures + 1))
      continue
    fi
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -A 'Mozilla/5.0 (BB link check)' "$url")
    if [ "$code" = "200" ]; then
      echo "OK  $code  $slug  $url"
    else
      echo "DEAD  $code  $slug  $url" >&2
      failures=$((failures + 1))
    fi
  done < <(python3 -c '
import json
for o in json.load(open("'"$OFFERS"'"))["offers"]:
    print(o["slug"] + "\t" + o["paymentLink"])')
  if [ "$failures" -ne 0 ]; then
    echo "RESULT: FAIL ($failures link problem(s))" >&2
    exit 1
  fi
  echo "RESULT: PASS (every Payment Link loads)"
}

if [ "${1:-}" = "--check" ]; then
  verify_links
  exit 0
fi

payload=$(python3 -c 'import json; d=json.load(open("'"$OFFERS"'")); print(json.dumps({"groups": d["groups"], "offers": d["offers"]}))')
remote_cmd="ENVFILE=$(printf %q "$ENVFILE") OFFERS_JSON=$(printf %q "$payload") python3 -"

result=""
for attempt in 1 2 3; do
  if result=$(ssh -o ConnectTimeout=25 "$HOST" "$remote_cmd" < scripts/stripe-offers.py); then
    break
  fi
  if [ "$attempt" = 3 ]; then
    echo "stripe-offers: the VPS run failed three times; nothing was written to $OFFERS" >&2
    exit 1
  fi
  echo "ssh attempt $attempt failed (the VPS throttles rapid reconnects), retrying in 25s..." >&2
  sleep 25
done

# Write the ids and links back, keeping every other field untouched.
RESULT_JSON="$result" python3 - "$OFFERS" <<'PY'
import json, os, sys
path = sys.argv[1]
result = json.loads(os.environ["RESULT_JSON"])
doc = json.load(open(path))
for offer in doc["offers"]:
    r = result.get(offer["slug"])
    if not r:
        sys.exit(f"stripe-offers: no result for {offer['slug']}; file not written")
    offer["paymentLink"] = r["paymentLink"]
    offer["stripe"] = {k: v for k, v in {
        "product": r["product"],
        "setupPrice": r["setupPrice"],
        "monthlyPrice": r["monthlyPrice"],
        "paymentLinkId": r["paymentLinkId"],
    }.items() if v}
with open(path, "w") as fh:
    json.dump(doc, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print(f"wrote {len(result)} offers to {path}")
PY

verify_links
