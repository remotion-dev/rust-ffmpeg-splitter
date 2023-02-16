import fs from "fs";
import { execSync } from "child_process";

execSync("git config --global advice.detachedHead false");

if (fs.existsSync("ffmpeg")) {
  execSync("git checkout master", {
    cwd: "ffmpeg",
    stdio: "inherit",
  });
  execSync("git pull", {
    cwd: "ffmpeg",
    stdio: "inherit",
  });
} else {
  execSync("git clone https://github.com/ffmpeg/ffmpeg.git", {
    stdio: "inherit",
  });
}

execSync("git checkout n5.1.1", {
  cwd: "ffmpeg",
});

execSync(
  [
    "./configure",
    "--prefix=remotion",
    "--enable-small",
    "--disable-static",
    "--enable-shared",
    "--disable-ffplay",
  ].join(" "),
  {
    cwd: "ffmpeg",
  }
);
