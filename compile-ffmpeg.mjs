import path from "path";
import fs from "fs";
import { execSync } from "child_process";

execSync("git config --global advice.detachedHead false");
const isWindows = process.argv[2] === "windows";

const out = "remotion";

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

execSync("rm -rf remotion", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync("git checkout n5.1.1", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync(
  [
    path.join(process.cwd(), "ffmpeg", "configure"),
    `--prefix=${out}`,
    isWindows ? "--arch=x86" : null,
    isWindows ? "--target-os=mingw32" : null,
    isWindows ? "--cross-prefix=i686-w64-mingw32-" : null,
    "--enable-small",
    "--disable-static",
    "--enable-shared",
    "--disable-ffplay",
    "--disable-filters",
    "--enable-filter=aformat",
    "--enable-filter=atrim",
    "--enable-filter=adelay",
    "--enable-filter=anullsrc",
    "--enable-filter=atempo",
    "--enable-filter=apad",
    "--enable-filter=amerge",
    "--enable-filter=concat",
    "--enable-filter=tinterlace",
    "--enable-filter=fieldorder",
    "--enable-filter=pan",
    "--enable-filter=volume",
    //"--disable-indevs",
    "--disable-doc",
    "--enable-gpl",
    "--enable-nonfree",
    "--disable-encoders",
    "--enable-encoder=opus",
    "--enable-encoder=aac",
    "--enable-encoder=pcm_s16le",
    //"--disable-muxers",
    "--enable-muxer=webm",
    "--enable-muxer=opus",
    "--enable-muxer=mp4",
    "--enable-muxer=mp3",
    "--enable-muxer=mov",
    "--enable-muxer=mkvtimestamp_v2",
    "--enable-muxer=matroska",
    "--enable-muxer=hevc",
    "--enable-muxer=h264",
    "--enable-muxer=gif",
  ]
    .filter(Boolean)
    .join(" "),
  {
    cwd: "ffmpeg",
    stdio: "inherit",
  }
);
execSync("make", {
  cwd: "ffmpeg",
  stdio: "inherit",
});
execSync("make install", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync("rm -rf remotion/share", {
  cwd: "ffmpeg",
  stdio: "inherit",
});