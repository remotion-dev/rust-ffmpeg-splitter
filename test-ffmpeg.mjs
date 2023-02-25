import { execSync, spawnSync } from "child_process";
import path from "path";
import assert from "assert";

const lib = path.join(process.cwd(), "remotion", "lib");

const env =
  process.platform === "darwin"
    ? {
        ...process.env,
        DYLD_LIBRARY_PATH: lib,
      }
    : process.platform === "win32"
    ? {
        ...process.env,
        PATH: `${process.env.PATH};${lib}`,
      }
    : {
        ...process.env,
        LD_LIBRARY_PATH: lib,
      };

const ffmpegBinary = path.join(process.cwd(), "remotion", "bin", "ffmpeg");

const exit = spawnSync(ffmpegBinary, ["-buildconf"], {
  env,
});
assert(exit.status === 0);

const exit = spawnSync(
  ffmpegBinary,
  ["-i", "sample-5s.webm", "-t", "1", "out-test.mp4", "-y"],
  {
    env,
  }
);
assert(exit.status === 0);

const exit = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample.mp4",
    "-t",
    "1",
    "-c:v",
    "libvpx",
    "-c:a",
    "libopus",
    "out-test.webm",
    "-y",
  ],
  {
    env,
    stdio: "inherit",
  }
);
assert(exit.status === 0);

const exit = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample.mp4",
    "-f",
    "image2",
    "-frames:v",
    "1",
    "-vcodec",
    "png",
    "out-test.png",
    "-y",
  ],
  {
    env,
  }
);
assert(exit.status === 0);

const exit = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample.mp4",
    "-f",
    "image2",
    "-frames:v",
    "1",
    "-vcodec",
    "mjpeg",
    "out-test.png",
    "-y",
  ],
  {
    env,
  }
);
assert(exit.status === 0);
