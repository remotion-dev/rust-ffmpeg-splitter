import { execSync } from "child_process";
import { readdirSync, renameSync } from "fs";
import path from "path";
import { PREFIX } from "./const.mjs";

const isWindows = process.argv[2] === "windows";

if (isWindows) {
  const remotionBinDir = path.join(process.cwd(), "remotion", "bin");
  const files = readdirSync(remotionBinDir);
  for (const file of files) {
    if (file.endsWith(".dll") || file.endsWith(".lib")) {
      const oldPath = path.join(remotionBinDir, file);
      const newPath = path.join(remotionBinDir, "..", "lib", file);

      console.log(oldPath, newPath);
      renameSync(oldPath, newPath);
    }
  }
}

execSync(`tar cvzf ffmpeg.tar.gz ${PREFIX} bindings.rs`, {
  stdio: "inherit",
});
