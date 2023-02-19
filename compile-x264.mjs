import fs from "fs";
import { exec, execSync } from "child_process";
import { PREFIX } from "./const.mjs";
import path from "path";

export const enableX264 = (isMusl, isWindows) => {
  const extraCFlags = [
    // TODO: should it always be static libgcc?
    isMusl ? "-static-libgcc" : null,
  ].filter(Boolean);
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
    [
      path.posix.join(process.cwd().replace(/\\/g, "/"), "x264", "configure"),
      `--prefix=${path.join(PREFIX)}`,
      "--enable-static",
      "--disable-opencl",
      "--enable-pic",
      isWindows
        ? "--host=x86_64-w64-mingw32 --arch=x86_64 --cross-prefix=x86_64-w64-mingw32-"
        : null,
      isWindows ? "--disable-w32threads" : null,
      isWindows ? "--disable-os2threads" : null,
      '--extra-cflags="' + extraCFlags.join(" ") + '"',
      isMusl ? '--extra-cxxflags="-static-libgcc -static-libstdc++"' : null,
      isMusl ? '--extra-ldexeflags="-static-libgcc -static-libstdc++"' : null,
    ]
      .filter(Boolean)
      .join(" "),
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
