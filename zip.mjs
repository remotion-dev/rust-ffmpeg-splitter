import { execSync } from "child_process";
import { PREFIX } from "./const.mjs";

execSync(`tar cvzf ffmpeg.tar.gz ${PREFIX} bindings.rs`, {
  stdio: "inherit",
});
