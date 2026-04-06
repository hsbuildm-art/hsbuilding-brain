#!/usr/bin/env bash
set -euo pipefail

cd /workspace/hsbuilding-brain

python3 scripts/sync_llmtxt_to_github.py

if ! git diff --quiet -- knowledge/pricing.md knowledge/coupons.md; then
  git add knowledge/pricing.md knowledge/coupons.md
  git commit -m "Weekly sync pricing and coupon blocks from llm.txt"
  git push origin main
else
  echo "No pricing/coupon changes detected."
fi
