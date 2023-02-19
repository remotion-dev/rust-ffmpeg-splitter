import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { PREFIX } from "./const.mjs";

const isWindows = process.argv[2] === "windows";

execSync(
  `cargo build --release ${isWindows ? "--target=x86_64-pc-windows-gnu" : ""}`,
  {
    env: {
      ...process.env,
      FFMPEG_DIR: path.join(process.cwd(), PREFIX),
      CPATH:
        process.platform === "darwin"
          ? "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include"
          : undefined,
    },
    stdio: "inherit",
  }
);

const bindings = isWindows
  ? path.join(
      process.cwd(),
      "target",
      "x86_64-pc-windows-gnu",
      "release",
      "build"
    )
  : path.join(process.cwd(), "target", "release", "build");
const folders = fs.readdirSync(bindings);
const sysFolders = folders.filter((folder) => {
  return folder.startsWith("ffmpeg-sys-");
});

for (const folder of sysFolders) {
  const abs = path.join(bindings, folder);
  const files = fs.readdirSync(abs);
  if (files.includes("out")) {
    const outDir = path.join(abs, "out", "bindings.rs");
    fs.copyFileSync(outDir, path.join(process.cwd(), "bindings.rs"));
    console.log(outDir);
  }
}
