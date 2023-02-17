import { execSync } from "child_process";

const out = "remotion";

execSync(`tar cvzf ffmpeg.tar.gz ffmpeg/${out} bindings.rs`, {
  stdio: "inherit",
});
