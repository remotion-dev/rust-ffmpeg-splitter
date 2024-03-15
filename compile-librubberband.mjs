import { execSync } from "child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path, { join } from "path";

export const enableLibRubberband = () => {
  const pkgConfig = `
prefix=remotion
libdir=$\{prefix\}/lib
includedir=$\{prefix\}/include

Name: rubberband
Version: 1.8.1
Description: library for audio time-stretching and pitch-shifting
Libs: -L$\{libdir\} -lrubberband
Libs.private: -lstdc++
Cflags: -I$\{includedir\}
`.trim();

  if (!existsSync("rubberband")) {
    execSync("git clone https://github.com/m-ab-s/rubberband rubberband", {
      stdio: "inherit",
    });
  }

  const files = readFileSync("rubberband/Makefile", "utf8");
  const contents = files.split("\n").map((f) => {
    if (f.startsWith("DYNAMIC_LDFLAGS		:= -shared")) {
      return "DYNAMIC_LDFLAGS		:= -shared";
    }
    return f;
  });
  const file = writeFileSync("rubberband/Makefile", contents.join("\n"));
  execSync("make", {
    cwd: "rubberband",
    env: {
      ...process.env,
      PREFIX: "remotion",
    },
  });

  cpSync("rubberband/lib/librubberband.a", "remotion/lib/librubberband.a");
  cpSync("rubberband/rubberband", "remotion/include", { recursive: true });

  const pkgConfigPath = join(
    process.cwd(),
    "remotion/lib/pkgconfig/librubberband.pc"
  );

  mkdirSync(path.dirname(pkgConfigPath), {
    recursive: true,
  });
  writeFileSync(pkgConfigPath, pkgConfig);
  writeFileSync(
    pkgConfigPath.replace("librubberband.pc", "rubberband.pc"),
    pkgConfig
  );
};
