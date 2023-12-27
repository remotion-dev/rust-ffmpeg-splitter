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
  execSync("git stash", {
    cwd: "zimg",
    stdio: "inherit",
  });
  execSync("git submodule update --init --recursive", {
    cwd: "zimg",
    stdio: "inherit",
  });

  execSync("git checkout release-2.9.3", {
    cwd: "zimg",
  });

  execSync(`sed -i 's/size_t/std::size_t/g' src/zimg/colorspace/matrix3.cpp`, {
    cwd: "zimg",
    stdio: "inherit",
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
