import { execSync } from "child_process";
import fs, { readFileSync, writeFileSync } from "fs";
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

  const configPath = path.join(dirname, "configure");
  const configureScript = readFileSync(configPath, "utf-8");

  const configReplaced = configureScript.replace(
    "if ! diff --version >/dev/null; then",
    "if false; then"
  );
  writeFileSync(configPath, configReplaced);

  execSync(
    [
      path.posix.join(process.cwd().replace(/\\/g, "/"), dirname, "configure"),
      ,
      `--prefix=${path.join(process.cwd(), dirname, PREFIX)}`,
      "--enable-static",
      "--disable-shared",
      "--disable-unit-tests",
      "--disable-examples",
      "--enable-pic",
      "--as=yasm",
      isWindows ? "--target=x86_64-win64-gcc" : null,
    ].join(" "),
    {
      cwd: dirname,
      stdio: "inherit",
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

  const vpx = readFileSync(dirname + "/remotion/lib/pkgconfig/vpx.pc", "utf8");
  console.log("pkgconfig/vpx.pc is:", vpx);
  const lines = vpx.split("\n");
  const privLibs = lines.find((line) => line.startsWith("Libs.private"));
  if (!privLibs) {
    throw new Error("Could not find Libs.private in vpx.pc");
  }
  const extraLibs = privLibs.replace("Libs.private: ", "");
  const linesPkg = lines
    .map((line) => {
      if (line.startsWith("prefix=")) {
        return "prefix=remotion";
      }

      return line;
    })
    .filter((l) => l !== null)
    .join("\n");

  console.log("Replacing it with:", linesPkg);
  fs.writeFileSync(dirname + "/remotion/lib/pkgconfig/vpx.pc", linesPkg);

  execSync(`cp -r ${PREFIX} ../`, { cwd: dirname, stdio: "inherit" });
};
