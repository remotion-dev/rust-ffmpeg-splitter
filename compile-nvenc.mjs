import path from "path";
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

	// Install into the shared top-level PREFIX dir so FFmpeg's PKG_CONFIG_PATH
	// (which points at <cwd>/remotion/lib/pkgconfig) can find ffnvcodec.pc.
	// Using a relative PREFIX here would install into nv-codec-headers/remotion
	// and FFmpeg would silently disable h264_nvenc / hevc_nvenc.
	const installPrefix = path.join(process.cwd(), PREFIX);
	execSync(`make install PREFIX=${installPrefix}`, {
		cwd: "nv-codec-headers",
		stdio: "inherit",
	});
};
