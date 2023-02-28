import path from "path";
import fs, { existsSync } from "fs";
import { execSync } from "child_process";
import { fixLinks } from "./fix-macos-links.mjs";
import { PREFIX } from "./const.mjs";
import { enableX264 } from "./compile-x264.mjs";
import { enableX265 } from "./compile-x265.mjs";
import { enableLibMp3Lame } from "./compile-libmp3lame.mjs";
import { enableVpx } from "./compile-vpx.mjs";
import { enableOpus } from "./compile-opus.mjs";

const decoders = [
  "aac",
  "av1",
  "flac",
  "h264",
  "hevc",
  "libvpx_vp8",
  "libvpx_vp9",
  "vp8",
  "vp9",
  "mp3",
  "mpeg4",
  "opus",
  "pcm_f16le",
  "pcm_f24le",
  "pcm_f32le",
  "pcm_f32be",
  "pcm_f64le",
  "pcm_f64be",
  "pcm_s16be",
  "pcm_s16le",
  "pcm_s24be",
  "pcm_s24le",
  "pcm_s32be",
  "pcm_s32le",
  "pcm_s64be",
  "pcm_s64le",
  "pcm_u16be",
  "pcm_u16le",
  "pcm_u24le",
  "pcm_u24be",
  "pcm_u32be",
  "pcm_u32le",
  "prores",
  "theora",
  "vorbis",
  "vp9",
];

const demuxers = [
  "aac",
  "av1",
  "avi",
  "caf",
  "concat",
  "flac",
  "flv",
  "h264",
  "hevc",
  "image2",
  "matroska",
  "mov",
  "mp3",
  "ogg",
  "pcm_f32le",
  "pcm_f32be",
  "pcm_f64le",
  "pcm_f64be",
  "pcm_s16be",
  "pcm_s16le",
  "pcm_s24be",
  "pcm_s24le",
  "pcm_s32be",
  "pcm_s32le",
  "pcm_u16be",
  "pcm_u16le",
  "pcm_u24le",
  "pcm_u24be",
  "pcm_u32be",
  "pcm_u32le",
  "wav",
];

if (!existsSync(PREFIX)) {
  fs.mkdirSync(PREFIX);
}

execSync("git config --global advice.detachedHead false");
const isWindows = process.argv[2] === "windows";
const isMusl = process.argv[2] === "musl";

enableVpx(isWindows);
enableX264(isMusl, isWindows);
enableX265(isMusl, isWindows);
enableLibMp3Lame(isWindows);
enableOpus(isWindows);

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
  stdio: "inherit",
});

const extraCFlags = [
  // TODO: should it always be static libgcc?
  isMusl ? "-static-libgcc" : null,
  "-I" + PREFIX + "/include",
  "-I" + PREFIX + "/include/opus",
  "-I" + PREFIX + "/include/lame",
  "-I" + PREFIX + "/include/vpx",
].filter(Boolean);

const extraLdFlags = ["-L" + PREFIX + "/lib"].filter(Boolean);

execSync("cp -r remotion ffmpeg", { stdio: "inherit" });

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
    "--disable-postproc",
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
    "--enable-encoder=libx265",
    "--enable-libvpx",
    "--enable-encoder=libvpx_vp8",
    "--enable-encoder=libvpx_vp9",
    "--enable-encoder=gif",
    "--enable-encoder=libmp3lame",
    "--enable-encoder=libopus",
    "--enable-encoder=prores_ks",
    "--disable-muxers",
    "--enable-muxer=webm",
    "--enable-muxer=opus",
    "--enable-muxer=mp4",
    "--enable-muxer=mp3",
    "--enable-muxer=mov",
    "--enable-muxer=matroska",
    "--enable-muxer=hevc",
    "--enable-muxer=h264",
    "--enable-muxer=gif",
    "--enable-muxer=image2",
    "--enable-muxer=image2pipe",
    "--enable-libx264",
    "--enable-libx265",
    "--enable-libmp3lame",
    "--enable-zlib",
    "--enable-libopus",
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
