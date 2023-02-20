import path from "path";
import fs, { existsSync } from "fs";
import { execSync } from "child_process";
import { fixLinks } from "./fix-macos-links.mjs";
import { PREFIX } from "./const.mjs";
import { enableX264 } from "./compile-x264.mjs";
import { enableX265 } from "./compile-x265.mjs";

if (!existsSync(PREFIX)) {
  fs.mkdirSync(PREFIX);
}

execSync("git config --global advice.detachedHead false");
const isWindows = process.argv[2] === "windows";
const isMusl = process.argv[2] === "musl";

enableX265(isMusl, isWindows);

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

execSync("rm -rf " + PREFIX, {
  stdio: "inherit",
});

enableX264(isMusl, isWindows);

execSync("git checkout n5.1.1", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

const extraCFlags = [
  // TODO: should it always be static libgcc?
  isMusl ? "-static-libgcc" : null,
  "-I" + path.join(process.cwd(), PREFIX) + "/include",
].filter(Boolean);

const extraLdFlags = ["-L" + path.join(process.cwd(), PREFIX) + "/lib"].filter(
  Boolean
);

execSync(
  [
    path.posix.join(process.cwd().replace(/\\/g, "/"), "ffmpeg", "configure"),
    `--prefix=${PREFIX}`,
    isWindows
      ? "--target-os=mingw32 --arch=x86_64 --cross-prefix=x86_64-w64-mingw32-"
      : null,
    isWindows ? "--disable-w32threads" : null,
    isWindows ? "--disable-os2threads" : null,
    '--extra-cflags="' + extraCFlags.join(" ") + '"',
    '--extra-ldflags="' + extraLdFlags.join(" ") + '"',
    isMusl ? '--extra-cxxflags="-static-libgcc -static-libstdc++"' : null,
    isMusl ? '--extra-ldexeflags="-static-libgcc -static-libstdc++"' : null,
    "--enable-small",
    "--enable-shared",
    "--disable-static",
    "--disable-ffplay",
    "--disable-filters",
    "--disable-libxcb",
    "--enable-filter=aformat",
    "--enable-filter=atrim",
    "--enable-filter=adelay",
    "--enable-filter=anullsrc",
    "--enable-filter=atempo",
    "--enable-filter=apad",
    "--enable-filter=amerge",
    "--enable-filter=aresample",
    "--enable-filter=concat",
    "--enable-filter=tinterlace",
    "--enable-filter=fieldorder",
    "--enable-filter=pan",
    "--enable-filter=volume",
    "--enable-filter=scale",
    //"--disable-indevs",
    "--disable-doc",
    "--enable-gpl",
    "--enable-nonfree",
    "--disable-encoders",
    "--enable-encoder=opus",
    "--enable-encoder=aac",
    "--enable-encoder=png",
    "--enable-encoder=mjpeg",
    "--enable-encoder=pcm_s16le",
    "--enable-encoder=libx264",
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
    "--enable-libx264",
    "--enable-libx265",
  ]
    .filter(Boolean)
    .join(" "),
  {
    env: {
      ...process.env,
      PKG_CONFIG_PATH: path.join(process.cwd(), PREFIX) + "/lib/pkgconfig",
    },
    cwd: "ffmpeg",
    stdio: "inherit",
  }
);

execSync("make clean", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync("make", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync("make install", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

execSync("rm -rf " + PREFIX + "/share", {
  cwd: "ffmpeg",
  stdio: "inherit",
});

if (process.platform === "darwin") {
  fixLinks();
}

execSync("cp -r " + PREFIX + " ../", {
  cwd: "ffmpeg",
  stdio: "inherit",
});
