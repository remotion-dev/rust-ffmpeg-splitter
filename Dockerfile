FROM node:17.3.0-alpine3.13

RUN mkdir -p app
COPY Cargo.toml app/Cargo.toml
COPY Cargo.lock Cargo.lock
COPY *.mjs app/
COPY *.rs app/

RUN apk add yasm nasm clang curl git cargo make clang-dev pkgconfig bash cmake make
RUN cargo --version
RUN cd app && CFLAGS="$CFLAGS -static-libgcc" CXXFLAGS="$CXXFLAGS -static-libgcc -static-libstdc++" LDFLAGS="$LDFLAGS -static-libgcc -static-libstdc++" node compile-ffmpeg.mjs musl
RUN cd app && node generate-bindings.mjs
RUN cd app && node zip.mjs


