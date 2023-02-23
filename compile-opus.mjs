import { execSync } from "child_process";
import { dir } from "console";
import { existsSync } from "fs";
import path from "path";
import { PREFIX } from "./const.mjs";

const dirname = "opus-1.3.1";

export const enableOpus = (isWindows) => {
  if (!existsSync(dirname)) {
    execSync("tar xvf opus.gz", {
      stdio: "inherit",
    });
  }

  execSync(
    [
      path.posix.join(process.cwd().replace(/\\/g, "/"), dirname, "configure"),
      `--prefix=${path.join(process.cwd(), dirname, PREFIX)}`,
      "--enable-static",
      "--disable-shared",
      isWindows ? "--target=x86_64-win64-gcc" : null,
    ].join(" "),
    { cwd: dirname, stdio: "inherit" }
  );

  execSync("make", {
    cwd: dirname,
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: dirname,
    stdio: "inherit",
  });

  execSync(`cp -r ${PREFIX} ../`, { cwd: dirname, stdio: "inherit" });
};
