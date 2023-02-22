FROM node:17.3.0-alpine3.13

RUN mkdir -p app
COPY Cargo.toml app/Cargo.toml
COPY Cargo.lock app/Cargo.lock
COPY *.mjs app/
COPY *.rs app/
COPY libmp3lame.zip app/libmp3lame.zip
COPY libvpx-1.12.0.tar.gz app/libvpx-1.12.0.tar.gz

RUN apk add curl 
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
RUN source "$HOME/.cargo/env"
RUN apk add yasm nasm curl git make ca-certificates pkgconfig bash cmake make cmake build-base llvm-static llvm-dev clang-static clang-dev
RUN cd app && CFLAGS="$CFLAGS -static-libgcc" CXXFLAGS="$CXXFLAGS -static-libgcc -static-libstdc++" LDFLAGS="$LDFLAGS -static-libgcc -static-libstdc++" node compile-ffmpeg.mjs musl
RUN source "$HOME/.cargo/env" && cd app && node generate-bindings.mjs musl
RUN source "$HOME/.cargo/env" && cd app && node zip.mjs


