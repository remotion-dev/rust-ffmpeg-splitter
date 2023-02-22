import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PREFIX } from "./const.mjs";

const dirname = "libvpx-1.12.0";

export const enableVpx = (isWindows) => {
  if (!fs.existsSync(dirname)) {
    // Using newer than 3.100 because it has support for aarch64
    execSync("tar xvf vpx.gz", {
      stdio: "inherit",
    });
  }

  if (process.platform === "darwin") {
    execSync(
      `sed "s/,--version-script//g" build/make/Makefile >build/make/Makefile.patched`,
      {
        cwd: dirname,
        stdio: "inherit",
      }
    );
    execSync(
      `sed "s/-Wl,--no-undefined -Wl,-soname/-Wl,-undefined,error -Wl,-install_name/g" build/make/Makefile.patched >build/make/Makefile`,
      {
        cwd: dirname,
        stdio: "inherit",
      }
    );
  }

  execSync(
    [
      path.posix.join(process.cwd().replace(/\\/g, "/"), dirname, "configure"),
      ,
      `--prefix=${path.join(process.cwd(), dirname, PREFIX)}`,
      "--enable-static",
      "--disable-shared",
      "--disable-unit-tests",
      "--disable-examples",
      "--as=yasm",
      isWindows ? "--host=x86_64-w64-mingw32" : null,
      "--enable-vp9-highbitdepth",
    ].join(" "),
    {
      cwd: dirname,
    }
  );

  execSync("make", {
    cwd: dirname,
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: dirname,
    stdio: "inherit",
  });

  execSync(`cp -r ${PREFIX} ../`, { cwd: "libmp3lame", stdio: "inherit" });
};

enableVpx(false);
