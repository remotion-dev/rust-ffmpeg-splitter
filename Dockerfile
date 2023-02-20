FROM node:19-alpine3.17

RUN mkdir -p app
COPY Cargo.toml app/Cargo.toml
COPY Cargo.lock Cargo.lock
COPY *.mjs app/
COPY *.rs app/

RUN apk add yasm clang curl git cargo make clang-dev
RUN cargo --version
RUN cd app && CFLAGS="$CFLAGS -static-libgcc" CXXFLAGS="$CXXFLAGS -static-libgcc -static-libstdc++" node compile-ffmpeg.mjs musl
RUN cd app && node generate-bindings.mjs
RUN cd app && node zip.mjs


