import { execSync } from "child_process";

const result = execSync("docker run -d aarch-musl");

const id = result.toString();

execSync("docker cp " + id.trim() + ":/app/ffmpeg.tar.gz ffmpegmusl.tar.gz");

execSync("docker stop " + result);
