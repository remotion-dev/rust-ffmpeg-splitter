import { execSync } from "child_process";
import { existsSync } from "fs";
import { PREFIX } from "./const.mjs";

const NV_CODEC_HEADERS_TAG = "n12.2.72.0";

export const enableNvencHeaders = (isWindows) => {
	// Only install on native Linux builds (not macOS, not Windows cross-compile)
	// nv-codec-headers are header-only - no runtime dependency at build time
	if (process.platform !== "linux" || isWindows) return;

	if (!existsSync("nv-codec-headers")) {
		execSync(
			"git clone https://github.com/FFmpeg/nv-codec-headers.git",
			{stdio: "inherit"},
		);
	}

	execSync("git fetch --all --tags", {
		cwd: "nv-codec-headers",
		stdio: "inherit",
	});

	execSync(`git checkout ${NV_CODEC_HEADERS_TAG}`, {
		cwd: "nv-codec-headers",
		stdio: "inherit",
	});

	execSync(`make install PREFIX=${PREFIX}`, {
		cwd: "nv-codec-headers",
		stdio: "inherit",
	});
};
