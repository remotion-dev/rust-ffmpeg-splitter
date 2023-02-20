import {
  existsSync,
  lstat,
  lstatSync,
  rmdirSync,
  rmSync,
  unlinkSync,
} from "fs";
import path from "path";

const paths = [
  path.join(process.cwd(), "remotion"),
  path.join(process.cwd(), "ffmpeg"),
  path.join(process.cwd(), "target"),
  path.join(process.cwd(), "x264"),
  path.join(process.cwd(), "x265"),
  path.join(process.cwd(), "bindings.rs"),
  path.join(process.cwd(), "ffmpeg.tar.gz"),
];

for (const path of paths) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}
