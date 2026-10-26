#!/usr/bin/env bash
# V1.3 logo: three health green leaf options with Z Image (0.15 credits each); the chosen one is
# processed by scripts/process-art.mjs. Development only, never called by the app.
cd "$(dirname "$0")/.."
LOG=assets-raw/art-log.txt
run () { # name prompt
  out=$(higgsfield generate create z_image --aspect_ratio 1:1 --wait --prompt "$2" 2>&1 | tail -4)
  url=$(echo "$out" | grep -o 'https://[^ ]*\.png' | head -1)
  if [ -n "$url" ]; then curl -sSL -o "assets-raw/$1.png" "$url" && echo "[$(date +%H:%M:%S)] ok $1 $url" >> "$LOG"
  else echo "[$(date +%H:%M:%S)] FAILED $1: $(echo "$out" | tr '\n' ' ')" >> "$LOG"; fi
}
BASE="flat vector app icon emblem, centered with generous padding, crisp clean edges, simple geometric shapes, health and wellness, calm, on a plain flat pure white background. No text, no letters, no watermark, no shadow."
run logo-leaf-a "A single soft rounded leaf in fresh health green with a gentle curved vein, the stem forming a small calm water ripple at the base. $BASE"
run logo-leaf-b "Two overlapping rounded leaves in two shades of fresh health green forming a balanced shape like a calm sprout, minimal. $BASE"
run logo-leaf-c "A rounded leaf in fresh health green whose inner vein is a small still mountain lake with a tiny sun, minimal and elegant. $BASE"
echo "[$(date +%H:%M:%S)] LOGO DONE; balance: $(higgsfield account status 2>&1 | tail -1)" >> "$LOG"
