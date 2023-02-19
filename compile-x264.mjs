import fs from "fs";
import { exec, execSync } from "child_process";
import { PREFIX } from "./const.mjs";
import path from "path";

export const enableX264 = () => {
  if (!fs.existsSync("x264")) {
    execSync("git clone https://code.videolan.org/videolan/x264.git x264", {
      stdio: "inherit",
    });
  }

  execSync("git checkout stable", {
    cwd: "x264",
    stdio: "inherit",
  });
  execSync("git pull", {
    cwd: "x264",
    stdio: "inherit",
  });

  execSync(
    `./configure --prefix=${path.join(
      PREFIX
    )} --enable-static --disable-opencl --enable-pic`,
    {
      cwd: "x264",
      stdio: "inherit",
    }
  );

  execSync("make", {
    cwd: "x264",
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: "x264",
    stdio: "inherit",
  });

  execSync("rm -rf " + PREFIX + "/bin/x264", {
    stdio: "inherit",
    cwd: "x264",
  });

  execSync(`mv ${PREFIX} ../`, { cwd: "x264", stdio: "inherit" });
};
