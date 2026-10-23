#!/bin/bash
set -e

TRIMMED="/tmp/hanzi_trimmed.png"
convert /home/pc/chinese-learning/static/img/hanzi_icon.png -trim +repage "$TRIMMED"

# Resize logo to 450px wide for standard icon
convert "$TRIMMED" -resize 450x450 /tmp/logo_450.png
convert -size 512x512 xc:"#027AB3" /tmp/logo_450.png -gravity center -composite /home/pc/chinese-learning/static/img/icon-512.png
convert /home/pc/chinese-learning/static/img/icon-512.png -resize 192x192 /home/pc/chinese-learning/static/img/icon-192.png

# Resize logo to 420px wide for maskable icon
convert "$TRIMMED" -resize 420x420 /tmp/logo_420.png
convert -size 512x512 xc:"#027AB3" /tmp/logo_420.png -gravity center -composite /home/pc/chinese-learning/static/img/icon-maskable-512.png
convert /home/pc/chinese-learning/static/img/icon-maskable-512.png -resize 192x192 /home/pc/chinese-learning/static/img/icon-maskable-192.png

# Apple touch icon and favicon
convert /home/pc/chinese-learning/static/img/icon-512.png -resize 180x180 /home/pc/chinese-learning/static/img/apple-touch-icon.png
convert /home/pc/chinese-learning/static/img/icon-512.png -resize 64x64 /home/pc/chinese-learning/static/img/favicon-blue.png

echo "ICONS_GENERATED_SUCCESSFULLY"
