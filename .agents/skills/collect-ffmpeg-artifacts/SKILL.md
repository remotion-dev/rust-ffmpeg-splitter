---
name: collect-ffmpeg-artifacts
description: Download and verify the seven platform FFmpeg archives produced for one rust-ffmpeg-splitter commit by GitHub Actions and CircleCI. Use when handing completed splitter CI binaries to rust-ffmpeg-sys without mixing commits or incomplete CI runs.
---

# Collect FFmpeg Artifacts

Run this workflow from the `rust-ffmpeg-splitter` repository root.

## Select one source commit

Use a full commit SHA supplied by the user. Otherwise use `git rev-parse HEAD`. Never combine artifacts from different source commits, even if their trees appear identical.

Confirm that the selected commit is the intended FFmpeg build. CI artifacts are immutable build inputs for all downstream repositories.

## Download and verify

Run:

```sh
SOURCE_SHA="$(git rev-parse HEAD)"
node .agents/skills/collect-ffmpeg-artifacts/scripts/download-artifacts.mjs --sha "$SOURCE_SHA"
```

The script must find an exact-SHA successful `Install and Test` GitHub Actions run and an exact-SHA successful CircleCI `build_ffmpeg` workflow. It downloads:

- GitHub Actions: `aarch64-apple-darwin.gz`, `x86_64-apple-darwin.gz`
- CircleCI: `aarch64-unknown-linux-gnu.gz`, `aarch64-unknown-linux-musl.gz`, `x86_64-unknown-linux-gnu.gz`, `x86_64-unknown-linux-musl.gz`, `x86_64-pc-windows-gnu.gz`

Do not fall back to a different SHA when either provider is running, failed, canceled, missing, or expired. Report the relevant run or workflow statuses and stop.

Use the absolute output directory printed by the script. Keep `MANIFEST.json` and `SHA256SUMS` with the seven archives. Do not commit downloaded artifacts to this repository.

## Hand off to rust-ffmpeg-sys

Report:

- the full splitter source SHA;
- the absolute artifact directory;
- the GitHub Actions run URL;
- the CircleCI pipeline and workflow IDs;
- confirmation that all seven checksums and archive contents passed.

Then instruct the next agent:

```text
Open /Users/jonathanburger/Documents/GitHub/rust-ffmpeg-sys and use
$publish-ffmpeg-sys-binaries with:
- artifact directory: <absolute directory>
- splitter source SHA: <full SHA>
```

Stop after the handoff. Do not edit `rust-ffmpeg-sys` as part of this skill.
