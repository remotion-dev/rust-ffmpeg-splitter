import fs, { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { PREFIX } from "./const.mjs";
import { compileFunction } from "vm";

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

  const staticallyLinkCLibrary = isMusl || isWindows;

  const env = {
    ...process.env,
    CMAKE_CROSSCOMPILING: isWindows ? "ON" : undefined,
    CMAKE_C_COMPILER: isWindows ? "x86_64-w64-mingw32-gcc" : undefined,
    CMAKE_CXX_COMPILER: isWindows ? "x86_64-w64-mingw32-g++" : undefined,
    CMAKE_RC_COMPILER: isWindows ? "x86_64-w64-mingw32-windres" : undefined,
    CMAKE_RANLIB: isWindows ? "x86_64-w64-mingw32-ranlib" : undefined,
    CMAKE_SYSTEM_NAME: isWindows ? "Windows" : undefined,
    CMAKE_ASM_YASM_COMPILER: isWindows ? "yasm" : undefined,
    CFLAGS: extraCFlags.join(" "),
  };

  execSync(
    [
      "cmake",
      '-DCMAKE_INSTALL_PREFIX="remotion"',
      "-DENABLE_SHARED:BOOL=OFF",
      "-DCMAKE_BUILD_TYPE=Release",
      "-DSTATIC_LINK_CRT:BOOL=" + (staticallyLinkCLibrary ? "ON" : "OFF"),
      "-DENABLE_PIC=ON",
      "-DENABLE_CLI:BOOL=ON",
      "source",
    ]
      .filter(Boolean)
      .join(" "),
    {
      cwd: "x265",
      stdio: "inherit",
      env,
    }
  );

  execSync("make", {
    cwd: "x265",
    stdio: "inherit",
    env,
  });
  execSync("make install", {
    cwd: "x265",
    stdio: "inherit",
  });

  const x265 = readFileSync("x265/remotion/lib/pkgconfig/x265.pc", "utf8");
  console.log("pkgconfig/x265.pc is:", x265);
  const lines = x265.split("\n");
  const privLibs = lines.find((line) => line.startsWith("Libs.private"));
  if (!privLibs) {
    throw new Error("Could not find Libs.private in x265.pc");
  }
  const extraLibs = privLibs.replace("Libs.private: ", "");
  const linesPkg = lines
    .map((line) => {
      if (line.startsWith("prefix=")) {
        return "prefix=remotion";
      }
      if (line.startsWith("exec_prefix=")) {
        return "exec_prefix=remotion";
      }
      const shouldAddPthread =
        !isMusl && !isWindows && process.platform !== "darwin";
      const shouldAddLibxx = isMusl;
      if (line.startsWith("Libs:")) {
        return [
          isWindows ? line.replace("-lrt", "").replace("-ldl", "") : line,
          extraLibs,
          shouldAddPthread ? "-lpthread" : null,
          shouldAddLibxx ? "-lstdc++" : null,
        ]
          .filter(Boolean)
          .join(" ");
      }
      if (line.startsWith("Libs.private")) {
        return null;
      }

      return line;
    })
    .filter((l) => l !== null)
    .join("\n");

  console.log("Replacing it with:", linesPkg);
  fs.writeFileSync("x265/remotion/lib/pkgconfig/x265.pc", linesPkg);

  execSync("cp -r " + PREFIX + " ../", {
    cwd: "x265",
    stdio: "inherit",
  });
};
