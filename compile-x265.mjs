import fs, { existsSync, unlinkSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { PREFIX } from "./const.mjs";

export const enableX265 = (isMusl, isWindows) => {
  const extraCFlags = [
    // TODO: should it always be static libgcc?
    isMusl ? "-static-libgcc" : null,
  ].filter(Boolean);

  if (!fs.existsSync("x265")) {
    execSync("git clone https://github.com/videolan/x265 x265", {
      stdio: "inherit",
    });
  }

  execSync("git checkout stable", {
    cwd: "x265",
    stdio: "inherit",
  });
  execSync("git pull", {
    cwd: "x265",
    stdio: "inherit",
  });

  execSync(
    [
      "cmake",
      '-DCMAKE_INSTALL_PREFIX="remotion"',
      "-DENABLE_SHARED:BOOL=OFF",
      "-DSTATIC_LINK_CRT:BOOL=ON",
      "-DENABLE_CLI:BOOL=OFF",
      "source",
    ]
      .filter(Boolean)
      .join(" "),
    {
      cwd: "x265",
      stdio: "inherit",
      env: {
        ...process.env,
        CMAKE_CROSSCOMPILING: isWindows ? "ON" : undefined,
        CMAKE_C_COMPILER: isWindows ? "x86_64-w64-mingw32-gcc" : undefined,
        CMAKE_CXX_COMPILER: isWindows ? "x86_64-w64-mingw32-g++" : undefined,
        CFLAGS: extraCFlags.join(" "),
        CXXFLAGS: isMusl ? "-static-libgcc -static-libstdc++" : undefined,
      },
    }
  );

  execSync("make", {
    cwd: "x265",
    stdio: "inherit",
  });
  execSync("make install", {
    cwd: "x265",
    stdio: "inherit",
  });

  execSync("sed -e 's/prefix=\\/.*/prefix=remotion/g' x265.pc > xx.pc", {
    cwd: "x265/remotion/lib/pkgconfig",
    stdio: "inherit",
  });

  execSync("rm x265.pc", {
    cwd: "x265/remotion/lib/pkgconfig",
    stdio: "inherit",
  });

  execSync("mv xx.pc x265.pc", {
    cwd: "x265/remotion/lib/pkgconfig",
    stdio: "inherit",
  });

  execSync("cp -r " + PREFIX + " ../", {
    cwd: "x265",
    stdio: "inherit",
  });
};
