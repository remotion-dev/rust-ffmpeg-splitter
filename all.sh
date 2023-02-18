set -e
node compile-ffmpeg.mjs
node generate-bindings.mjs
node zip.mjs
