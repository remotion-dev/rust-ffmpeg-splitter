set -e
node compile-ffmpeg.mjs windows
node generate-bindings.mjs
node zip.mjs
