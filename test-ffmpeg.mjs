import { execSync, spawnSync } from "child_process";
import path from "path";
import { test } from "node:test";
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

test("Should be able to run FFmpeg", () => {
  const exit = spawnSync(ffmpegBinary, ["-buildconf"], {
    env,
  });
  assert(exit.status === 0);
});

test("Should be able to convert webm to mp4", () => {
  const exit = spawnSync(
    ffmpegBinary,
    ["-i", "sample-5s.webm", "-t", "1", "out-test.mp4", "-y"],
    {
      env,
    }
  );
  assert(exit.status === 0);
});

test("Should be able to convert mp4 to webm", () => {
  const exit = spawnSync(
    ffmpegBinary,
    [
      "-i",
      "sample.mp4",
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
});

test("Should be able to extract PNG from video", () => {
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
});

test("Should be able to extract JPEG from video", () => {
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
});
