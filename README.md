# Rust FFmpeg splitter

The goal is to use this in Remotion to achieve the following:

- Have the FFmpeg CLI
- Be able to use FFmpeg functions in Rust
- Have no duplicate code
- Precompile it for all platforms
- Be lightweight

## Instructions

```
node compile-ffmpeg.mjs
node generate-bindings.mjs
node zip.mjs
```
