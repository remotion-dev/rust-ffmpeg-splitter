FROM node:19-alpine3.17

COPY src src
COPY Cargo.toml Cargo.toml
# COPY Cargo.lock Cargo.lock
COPY compile-ffmpeg.mjs compile-ffmpeg.mjs
COPY generate-bindings.mjs generate-bindings.mjs
COPY zip.mjs zip.mjs
COPY main.rs main.rs
COPY build.rs build.rs

RUN apk add yasm clang curl git cargo make clang-dev
RUN cargo --version
RUN CFLAGS="$CFLAGS -static-libgcc" CXXFLAGS="$CXXFLAGS -static-libgcc -static-libstdc++" node compile-ffmpeg.mjs musl
RUN node generate-bindings.mjs
RUN node zip.mjs


