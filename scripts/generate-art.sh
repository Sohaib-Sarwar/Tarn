#!/usr/bin/env bash
# One time generation of Tarn's backgrounds, logo and milestone badges with Higgsfield (Z Image,
# 0.15 credits each; the logo first tries GPT Image 2.5 at 0.25). Runs sequentially because the
# free plan allows one job at a time. Raw files land in assets-raw/ (git ignored); scripts/process-art.mjs
# turns them into web assets. Never run from the app, never with user data. Needs `higgsfield auth login`.
cd "$(dirname "$0")/.."
LOG=assets-raw/art-log.txt
run () { # name model aspect prompt
  echo "[$(date +%H:%M:%S)] start $1 ($2)" >> "$LOG"
  out=$(higgsfield generate create "$2" --aspect_ratio "$3" --wait --prompt "$4" 2>&1 | tail -4)
  url=$(echo "$out" | grep -o 'https://[^ ]*\.\(png\|jpg\|jpeg\|webp\)' | head -1)
  if [ -n "$url" ]; then curl -sSL -o "assets-raw/$1.${url##*.}" "$url" && echo "[$(date +%H:%M:%S)] ok $1 $url" >> "$LOG"; return 0
  else echo "[$(date +%H:%M:%S)] FAILED $1: $(echo "$out" | tr '\n' ' ')" >> "$LOG"; return 1; fi
}

LAND="painterly minimal landscape, muted desaturated palette, low contrast, soft and restful for the eyes. No people, no text, no letters, no watermark, no frame."
run dawn-wide z_image 16:9 "Serene still mountain lake at sunrise, layered misty mountains, soft fog drifting over the water, mirror reflection of the peaks, a few pine trees on the near shore, gentle warm light, sage green, soft olive and warm grey tones, wide calm empty sky on the left third for text. $LAND"
run dawn-portrait z_image 9:16 "Serene still mountain lake at sunrise seen vertically, misty mountains in the middle, soft fog over the water, mirror reflections, pines on the shore at the bottom, gentle warm light, sage green, soft olive and warm grey tones, wide empty misty sky in the upper half. $LAND"
run calm-dusk-wide z_image 16:9 "Tranquil mountain lake at blue hour after sunset, deep muted forest green and slate tones, faint mist over still water, a soft distant glow on the horizon, subtle reflections, very dark and low contrast, restful at night, lots of empty dark space. $LAND"
run calm-dusk-portrait z_image 9:16 "Tranquil mountain lake at blue hour after sunset seen vertically, deep muted forest green and slate tones, faint mist, still water with subtle reflections in the lower half, a soft distant glow on the horizon, very dark and low contrast, wide empty dark sky above. $LAND"

LOGO="Minimal flat vector app icon emblem: a small soft gold sun rising between two rounded mountain peaks above a still lake shown as two horizontal ripple lines, centered, simple geometric shapes, muted sage green, deep forest green and soft gold on a plain flat warm off white background, crisp edges, generous padding. No text, no letters, no gradients, no watermark."
run logo gpt_image_2_5 1:1 "$LOGO" || run logo z_image 1:1 "$LOGO"

BADGE="Single round minimal badge emblem, flat illustration with gentle depth like an enamel pin, muted sage green, deep forest green and antique gold, centered with generous empty space around it, on a plain flat dark charcoal grey background. No text, no letters, no numbers, no watermark."
run badge-first-step z_image 1:1 "A single smooth stepping stone with a tiny sprout. $BADGE"
run badge-one-day z_image 1:1 "A small sun rising over a calm horizon line. $BADGE"
run badge-three-day z_image 1:1 "Three smooth river stones stacked in balance. $BADGE"
run badge-one-week z_image 1:1 "A young sapling with visible roots in soil. $BADGE"
run badge-two-weeks z_image 1:1 "Two flat stepping stones on a soft grass path. $BADGE"
run badge-thirty-days z_image 1:1 "Concentric ripples spreading on still water. $BADGE"
run badge-sixty-days z_image 1:1 "A mountain peak with a tiny pennant flag on top. $BADGE"
run badge-ninety-days z_image 1:1 "A winding stone path leading toward distant mountains. $BADGE"
run badge-half-year z_image 1:1 "A calm full rounded tree. $BADGE"
run badge-one-year z_image 1:1 "A mountain lake under a crescent moon and a few stars. $BADGE"
echo "[$(date +%H:%M:%S)] ALL DONE; balance: $(higgsfield account status 2>&1 | tail -1)" >> "$LOG"
