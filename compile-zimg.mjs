import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { PREFIX } from "./const.mjs";

export const enableZimg = () => {
  if (!existsSync("zimg")) {
    execSync("git clone https://github.com/sekrit-twc/zimg zimg", {
      stdio: "inherit",
    });
  }
  execSync("git submodule update --init --recursive", {
    cwd: "zimg",
    stdio: "inherit",
  });

  execSync("git checkout release-2.9.3", {
    cwd: "zimg",
  });

  execSync("sh autogen.sh", {
    cwd: "zimg",
  });

  execSync(
    `./configure --enable-static  --prefix=${path.join(
      process.cwd(),
      "zimg",
      PREFIX
    )} --disable-shared`,
    {
      cwd: "zimg",
    }
  );

  execSync("make", {
    cwd: "zimg",
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: "zimg",
    stdio: "inherit",
  });
};
