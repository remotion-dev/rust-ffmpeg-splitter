# Remotion shared-memory input

The macOS and Linux builds include an FFmpeg input device named
`remotionshm`. It passes Chromium-owned BGRA frames into FFmpeg without image
encoding, base64, or a pixel pipe. The device maps POSIX shared-memory pools
read-only and wraps each slot in a trusted `AV_CODEC_ID_WRAPPED_AVFRAME` packet.

```sh
ffmpeg -nostdin -xerror -nofind_stream_info -threads:v 1 \
  -f remotionshm -video_size 1920x1080 -framerate 30/1 \
  -control_fd 3 -ack_fd 4 -i remotion \
  -vf copy -fps_mode passthrough -c:v libx264 -pix_fmt yuv420p output.mp4
```

The parent creates FD 3 and FD 4 before spawning FFmpeg. FD 3 contains strict
ASCII, tab-delimited records terminated by `\n`:

```text
P\t<poolId:u32>\t<shmName>\t<slotCount:u32>\t<slotCapacity:u64>\n
U\t<poolId:u32>\n
F\t<poolId:u32>\t<slot:u32>\t<frameId:u64>\t<width:u32>\t<height:u32>\t<stride:u32>\t<byteLength:u64>\t<pts:i64>\n
```

Register every page pool with `P` before sending its first `F` record. Pool IDs
must be unique within one input. Names start with `/rmshm-`. The producer creates
the object; the consumer unlinks its name immediately after mapping it, while
both mappings remain valid. Slot `n` starts at `n * slotCapacity`. Pixels are
top-down, straight-alpha BGRA8888. Rows may be padded, and every frame must
match `video_size`. Send `U` after every slot in a retired pool has been ACKed
to release its mapping before the overall render ends. Closing FD 3 is end of
input.

FD 4 returns one ASCII record after the last FFmpeg reference to a frame is
released:

```text
<poolId>\t<slot>\t<frameId>\n
```

The producer must not reuse a slot before this ACK. Frame and pool IDs are
decimal integers; callers should parse frame IDs as 64-bit values rather than
JavaScript numbers. The ACK writer runs independently of decoder and filter
threads and has a bounded write timeout (`-ack_timeout`, 5000 milliseconds by
default).

Use `-nofind_stream_info` so probing cannot retain a bounded pool before the
normal pipeline starts. A real BGRA-to-YUV conversion releases the mapped input
after conversion. Pipelines that retain BGRA frames should put the enabled
`copy` filter first to establish owned FFmpeg pixels. Protocol errors, unknown
pools, out-of-range descriptors, and slot reuse fail the input; use `-xerror`
and verify the output frame count.

Run `python3 test-remotion-shm.py` after building. It sends padded BGRA frames
through two independent pools, recycles slots only after ACKs, and compares a
decoded rawvideo output byte-for-byte.
