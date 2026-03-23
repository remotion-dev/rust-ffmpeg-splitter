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

const exit1 = spawnSync(ffmpegBinary, ["-buildconf"], {
  env,
});
if (exit1.status !== 0) {
  console.log(exit1.stderr.toString("utf8"));
  console.log(exit1.stdout.toString("utf8"));
}
assert(exit1.status === 0);

const encoders = spawnSync(ffmpegBinary, ["-hide_banner", "-encoders"], {
  env,
});
if (encoders.status !== 0) {
  console.log(encoders.stderr.toString("utf8"));
  console.log(encoders.stdout.toString("utf8"));
}
assert(encoders.status === 0);
assert(encoders.stdout.toString("utf8").includes("libaom-av1"));

const exit2 = spawnSync(
  ffmpegBinary,
  ["-i", "sample-5s.webm", "-t", "1", "out-test.mp4", "-y"],
  {
    env,
  }
);
assert(exit2.status === 0);

const exit3 = spawnSync(
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
assert(exit3.status === 0);

const exit4 = spawnSync(
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
assert(exit4.status === 0);

const exit5 = spawnSync(
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
assert(exit5.status === 0);

const exit_x265 = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample.mp4",
    "-t",
    "1",
    "-c:v",
    "libx265",
    "out-test-x265.mp4",
    "-y",
  ],
  {
    env,
    stdio: "inherit",
  }
);
if (exit_x265.status !== 0) {
  console.log("x265 encoding test failed with status", exit_x265.status, "signal", exit_x265.signal);
}
assert(exit_x265.status === 0);

const exit6 = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample-av1.webm",
    "-f",
    "image2",
    "-frames:v",
    "1",
    "-vcodec",
    "mjpeg",
    "out-test-av1.png",
    "-y",
  ],
  {
    env,
    stdio: "inherit",
  }
);
assert(exit6.status === 0);

const exit7 = spawnSync(
  ffmpegBinary,
  [
    "-i",
    "sample.mp4",
    "-frames:v",
    "1",
    "-an",
    "-c:v",
    "libaom-av1",
    "out-test-libaom-av1.mkv",
    "-y",
  ],
  {
    env,
    stdio: "inherit",
  }
);
assert(exit7.status === 0);
console.log("Hooray!");
