import { execSync } from "child_process";
import path from "path";
import { PREFIX } from "./const.mjs";

execSync(
  `tar cvzf ffmpeg.tar.gz ${path.join(process.cwd(), PREFIX)} bindings.rs`,
  {
    stdio: "inherit",
  }
);
