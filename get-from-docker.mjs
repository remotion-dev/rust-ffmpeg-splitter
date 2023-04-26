import { execSync } from "child_process";

const containerName = process.argv[2];
const result = execSync(`docker run -d ${containerName}`);

const id = result.toString();

execSync("docker cp " + id.trim() + ":/app/ffmpeg.tar.gz ffmpeg.tar.gz");

execSync("docker stop " + result);
