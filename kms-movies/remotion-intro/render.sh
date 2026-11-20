#!/bin/bash
B="--browser-executable=/opt/pw-browsers/chromium --crf=30"
OUT=/home/user/Base/kms-movies/server/public/media
npx remotion render src/index.jsx Intro $OUT/intro.mp4 $B
for f in poeta contador tropic mix; do
  npx remotion render src/index.jsx Film $OUT/film-$f.mp4 $B --props="{\"film\":\"$f\"}"
done
npx remotion render src/index.jsx Finale $OUT/finale.mp4 $B
echo ALLDONE
