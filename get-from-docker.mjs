import { execSync } from "child_process";

execSync(
  "docker cp 4bdea9a825932b4cc1a915c4e50d0716c4963db7d494f84e0b04ac573e09fd15:/app/ffmpeg.tar.gz ffmpegmusl.tar.gz"
);
