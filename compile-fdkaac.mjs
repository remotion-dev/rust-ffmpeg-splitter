import fs from "fs";
import { execSync } from "child_process";
import { PREFIX } from "./const.mjs";
import path from "path";

export const enableFdkAac = async (isWindows) => {
  if (!fs.existsSync("fdk-aac")) {
    const response = execSync(
      // Free version of fdk-aac, without any license issues
      // https://src.fedoraproject.org/rpms/fdk-aac-free/tree/rawhide
      // https://en.wikipedia.org/wiki/Fraunhofer_FDK_AAC
      // > However, Fedora states that this will not affect the fdk-aac-free package, which enables only the commonly used "Low Complexity AAC" profile, which is what most people use.
      "git clone git://people.freedesktop.org/~wtay/fdk-aac"
    );
    execSync("git checkout stripped4", { cwd: "fdk-aac" });
  }

  execSync("autoreconf -vif", { cwd: "fdk-aac" });

  execSync(
    [
      "./configure",
      `--prefix=${path.resolve("fdk-aac", PREFIX)}`,
      "--enable-static",
      "--disable-shared",
      "--with-pic",
      isWindows ? "--host=x86_64-w64-mingw32" : null,
    ]
      .filter(Boolean)
      .join(" "),
    {
      cwd: "fdk-aac",
      stdio: "inherit",
    }
  );

  execSync("make", {
    cwd: "fdk-aac",
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: "fdk-aac",
    stdio: "inherit",
  });

  execSync(`cp -r ${PREFIX} ../`, { cwd: "fdk-aac", stdio: "inherit" });
};
