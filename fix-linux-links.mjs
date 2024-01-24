import { execSync } from "child_process";

export const fixLinuxLinks = () => {
  execSync('patchelf --force-rpath --set-rpath "$ORIGIN" ffmpeg', {
    cwd: "remotion/bin",
    stdio: "inherit",
  });
  execSync('patchelf --force-rpath --set-rpath "$ORIGIN" ffprobe', {
    cwd: "remotion/bin",
    stdio: "inherit",
  });
};
