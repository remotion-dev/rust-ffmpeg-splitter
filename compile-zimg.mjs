import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { PREFIX } from "./const.mjs";

export const enableZimg = () => {
  const pkgConfig = `
prefix=${process.cwd()}/zimg/remotion
exec_prefix=$\{prefix\}
libdir=$\{exec_prefix\}/lib
includedir=$\{prefix\}/include

Name: zimg
Description: Scaling, colorspace conversion, and dithering library
Version: 2.9.3

# If building a static library against a C++ runtime other than libstdc++,
# define STL_LIBS when running configure.
Libs: -L$\{libdir\} -lzimg
Libs.private: -lstdc++
Cflags: -I$\{includedir\}  
  `.trim();

  if (!existsSync("zimg")) {
    execSync("git clone https://github.com/sekrit-twc/zimg zimg", {
      stdio: "inherit",
    });
  }
  execSync("git stash", {
    cwd: "zimg",
    stdio: "inherit",
  });
  execSync("git submodule update --init --recursive", {
    cwd: "zimg",
    stdio: "inherit",
  });

  execSync("git checkout release-2.9.3", {
    cwd: "zimg",
  });

  if (process.platform === "darwin") {
    execSync(
      `sed -i '' 's/size_t/std::size_t/g' src/zimg/colorspace/matrix3.cpp`,
      {
        cwd: "zimg",
        stdio: "inherit",
      }
    );
  } else {
    execSync(
      `sed -i 's/size_t/std::size_t/g' src/zimg/colorspace/matrix3.cpp`,
      {
        cwd: "zimg",
        stdio: "inherit",
      }
    );
  }

  execSync("sh autogen.sh", {
    cwd: "zimg",
  });

  execSync(
    `./configure --enable-static  --prefix=${path.join(
      process.cwd(),
      "zimg",
      PREFIX
    )} --disable-shared`,
    {
      cwd: "zimg",
    }
  );

  execSync("make", {
    cwd: "zimg",
    stdio: "inherit",
  });

  execSync("make install", {
    cwd: "zimg",
    stdio: "inherit",
  });

  const outPath = join(process.cwd(), "remotion/lib/pkgconfig/zimg.pc");

  if (!existsSync(dirname(outPath))) {
    mkdirSync(dirname(outPath), {
      recursive: true,
    });
  }

  writeFileSync(outPath, pkgConfig);
};
