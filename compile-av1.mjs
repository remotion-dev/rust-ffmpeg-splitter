import { execSync } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";

export const enableAv1 = () => {
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

  execSync("meson setup .. --default-library=static", {
    cwd: "av1/build",
    stdio: "inherit",
  });

  execSync("ninja", {
    cwd: "av1/build",
    stdio: "inherit",
  });
};
