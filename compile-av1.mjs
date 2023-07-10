import { execSync } from "child_process";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync, rmSync, cpSync, writeFileSync } from "node:fs";

const pkgConfig = `
prefix=${process.cwd()}/av1/build
includedir=$\{prefix\}/include
libdir=$\{prefix\}/lib
srcdir=${process.cwd()}/av1

Name: libdav1d
Description: AV1 decoding library
Version: 1.2.1
Libs: -L$\{prefix\}/src -ldav1d
Cflags: -I$\{prefix\}/src -I$\{srcdir\}/src -I$\{prefix\} -I$\{srcdir\} -I$\{prefix\}/include/dav1d -I$\{srcdir\}/include/dav1d -I$\{prefix\}/include -I$\{srcdir\}/include
`.trim();

export const enableAv1 = (isWindows) => {
  if (!existsSync("av1")) {
    execSync("git clone https://code.videolan.org/videolan/dav1d av1", {
      stdio: "inherit",
    });
  }

  execSync("git checkout 1.2.1", {
    cwd: "av1",
  });

  rmSync("av1/build", {
    force: true,
    recursive: true,
  });

  mkdirSync("av1/build", {
    recursive: true,
  });

  execSync(
    "meson setup .. --default-library=static " +
      (isWindows
        ? "--cross-file=../package/crossfiles/x86_64-w64-mingw32.meson"
        : ""),
    {
      cwd: "av1/build",
      stdio: "inherit",
    }
  );

  execSync("ninja", {
    cwd: "av1/build",
    stdio: "inherit",
  });

  const outPath = join(process.cwd(), "remotion/lib/pkgconfig/dav1d.pc");

  if (!existsSync(dirname(outPath))) {
    mkdirSync(dirname(outPath), {
      recursive: true,
    });
  }

  writeFileSync(outPath, pkgConfig);
};
