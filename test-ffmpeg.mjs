import { spawnSync } from "child_process";

const buildconf = spawnSync(
  "/Users/jonathanburger/rust-ffmpeg-splitter/remotion/bin/ffmpeg",
  ["-buildconf"],
  {
    env: {
      DYLD_LIBRARY_PATH:
        "/Users/jonathanburger/rust-ffmpeg-splitter/remotion/lib",
    },
  }
);
console.log(buildconf.stdout.toString());
