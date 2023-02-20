FROM node:19-alpine3.17

RUN mkdir -p app
COPY Cargo.toml app/Cargo.toml
# COPY Cargo.lock Cargo.lock
COPY compile-ffmpeg.mjs app/compile-ffmpeg.mjs
COPY generate-bindings.mjs app/generate-bindings.mjs
COPY fix-macos-links.mjs app/fix-macos-links.mjs
COPY zip.mjs app/zip.mjs
COPY main.rs app/main.rs
COPY build.rs app/build.rs

RUN apk add yasm clang curl git cargo make clang-dev
RUN cargo --version
RUN cd app && CFLAGS="$CFLAGS -static-libgcc" CXXFLAGS="$CXXFLAGS -static-libgcc -static-libstdc++" node compile-ffmpeg.mjs musl
RUN cd app && node generate-bindings.mjs
RUN cd app && node zip.mjs


