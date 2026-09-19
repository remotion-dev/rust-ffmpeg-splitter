#!/usr/bin/env python3
"""End-to-end test for the Remotion POSIX shared-memory FFmpeg input."""

import json
import os
import queue
import subprocess
import sys
import tempfile
import threading
import time
from multiprocessing import resource_tracker, shared_memory
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_BINARY = HERE / "remotion" / "bin" / "ffmpeg"
LOCAL_BINARY = HERE / "ffmpeg" / "ffmpeg"
FFMPEG = Path(os.environ.get(
    "REMOTION_FFMPEG_BIN",
    DEFAULT_BINARY if DEFAULT_BINARY.exists() else LOCAL_BINARY,
))
FFPROBE = Path(os.environ.get("REMOTION_FFPROBE_BIN", FFMPEG.with_name("ffprobe")))


def ffmpeg_environment():
    environment = dict(os.environ)
    library_path = str(HERE / "remotion" / "lib")
    if sys.platform == "darwin":
        environment["DYLD_LIBRARY_PATH"] = library_path
    elif os.name != "nt":
        environment["LD_LIBRARY_PATH"] = library_path
    return environment


def close_pool(pool):
    pool.close()
    try:
        pool.unlink()
    except FileNotFoundError:
        resource_tracker.unregister(pool._name, "shared_memory")


def assert_device_registration(environment):
    devices = subprocess.check_output(
        [str(FFMPEG), "-hide_banner", "-devices"],
        env=environment,
        text=True,
    )
    if os.name == "nt":
        assert "remotionshm" not in devices
        print("remotionshm is intentionally disabled on Windows")
        return False
    assert "remotionshm" in devices
    return True


def assert_ack_failure_unblocks(environment):
    width, height = 8, 8
    stride = width * 4
    byte_length = stride * height
    name = f"rmshm-af-{os.getpid()}"
    pool = shared_memory.SharedMemory(
        name=name,
        create=True,
        size=byte_length,
    )
    control_read, control_write = os.pipe()
    ack_read, ack_write = os.pipe()
    os.close(ack_read)
    process = None
    control = None

    try:
        pool.buf[:byte_length] = bytes(
            index % 256 for index in range(byte_length)
        )
        with tempfile.TemporaryDirectory(
            prefix="remotionshm-ack-failure-"
        ) as directory:
            output = Path(directory) / "ack-failure.mov"
            command = [
                str(FFMPEG),
                "-v", "error",
                "-nostdin",
                "-xerror",
                "-nofind_stream_info",
                "-threads:v", "1",
                "-f", "remotionshm",
                "-video_size", f"{width}x{height}",
                "-framerate", "24/1",
                "-control_fd", str(control_read),
                "-ack_fd", str(ack_write),
                "-i", "remotion",
                "-vf", "copy",
                "-fps_mode", "passthrough",
                "-c:v", "rawvideo",
                "-pix_fmt", "bgra",
                "-f", "mov",
                "-y", str(output),
            ]
            process = subprocess.Popen(
                command,
                env=environment,
                pass_fds=(control_read, ack_write),
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            os.close(control_read)
            control_read = -1
            os.close(ack_write)
            ack_write = -1
            control = os.fdopen(control_write, "w", encoding="ascii")
            control_write = -1
            control.write(f"P\t1\t/{pool.name.lstrip('/')}\t1\t{byte_length}\n")
            control.write(
                f"F\t1\t0\t1\t{width}\t{height}\t{stride}\t"
                f"{byte_length}\t0\n"
            )
            control.flush()

            started = time.monotonic()
            return_code = process.wait(timeout=10)
            elapsed = time.monotonic() - started
            stderr = process.stderr.read().decode("utf8")
            control.close()
            control = None
            assert return_code != 0, stderr
            assert elapsed < 10
            assert "failed to write frame ACK" in stderr, stderr
            print("validated terminal ACK failure wakes a blocked control read")
    finally:
        if process is not None and process.poll() is None:
            process.kill()
            process.wait()
        if control is not None:
            control.close()
        for descriptor in (
            control_read,
            control_write,
            ack_write,
        ):
            if descriptor >= 0:
                os.close(descriptor)
        close_pool(pool)


def main():
    environment = ffmpeg_environment()
    if not assert_device_registration(environment):
        return

    width, height = 32, 18
    stride = width * 4 + 32
    byte_length = stride * height
    slot_capacity = byte_length + 64
    slot_count = 2
    frame_count = 20
    pool_ids = (17, 42, 99)
    frame_id_base = 9_007_199_254_740_993
    pools = []
    control_read, control_write = os.pipe()
    ack_read, ack_write = os.pipe()

    try:
        for pool_id in pool_ids:
            name = f"rmshm-splitter-test-{os.getpid()}-{pool_id}"
            pools.append((
                pool_id,
                shared_memory.SharedMemory(
                    name=name,
                    create=True,
                    size=slot_count * slot_capacity,
                ),
            ))

        with tempfile.TemporaryDirectory(prefix="remotionshm-") as directory:
            frame_pools = pools[:2]
            output = Path(directory) / "shared-memory.mov"
            command = [
                str(FFMPEG),
                "-v", "error",
                "-nostdin",
                "-xerror",
                "-nofind_stream_info",
                "-threads:v", "1",
                "-f", "remotionshm",
                "-video_size", f"{width}x{height}",
                "-framerate", "24/1",
                "-control_fd", str(control_read),
                "-ack_fd", str(ack_write),
                "-i", "remotion",
                "-vf", "copy",
                "-fps_mode", "passthrough",
                "-c:v", "rawvideo",
                "-pix_fmt", "bgra",
                "-f", "mov",
                "-y", str(output),
            ]
            process = subprocess.Popen(
                command,
                env=environment,
                pass_fds=(control_read, ack_write),
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
            )
            os.close(control_read)
            control_read = -1
            os.close(ack_write)
            ack_write = -1

            acknowledgements = queue.Queue()

            def read_acknowledgements():
                with os.fdopen(ack_read, "r", encoding="ascii") as ack_file:
                    for line in ack_file:
                        fields = line.rstrip("\n").split("\t")
                        assert len(fields) == 3, fields
                        acknowledgements.put(tuple(int(field) for field in fields))
                acknowledgements.put(None)

            ack_thread = threading.Thread(
                target=read_acknowledgements,
                daemon=True,
            )
            ack_thread.start()
            ack_read = -1

            available = {
                pool_id: list(range(slot_count)) for pool_id in pool_ids
            }
            outstanding = {}
            released = []
            expected = bytearray()

            def accept_acknowledgement():
                acknowledgement = acknowledgements.get(timeout=15)
                assert acknowledgement is not None, "ACK channel closed early"
                pool_id, slot, frame_id = acknowledgement
                assert outstanding.pop((pool_id, slot)) == frame_id
                available[pool_id].append(slot)
                released.append(frame_id)

            with os.fdopen(control_write, "w", encoding="ascii") as control:
                control_write = -1
                for pool_id, pool in pools:
                    control.write(
                        f"P\t{pool_id}\t/{pool.name.lstrip('/')}\t"
                        f"{slot_count}\t{slot_capacity}\n"
                    )
                control.write("U\t99\n")
                control.flush()

                for frame_index in range(frame_count):
                    pool_id, pool = frame_pools[frame_index % len(frame_pools)]
                    while not available[pool_id]:
                        accept_acknowledgement()
                    slot = available[pool_id].pop(0)
                    frame_id = frame_id_base + frame_index
                    offset = slot * slot_capacity
                    pool.buf[offset:offset + slot_capacity] = (
                        b"\xa5" * slot_capacity
                    )
                    for y in range(height):
                        row = bytes(
                            channel
                            for x in range(width)
                            for channel in (
                                (x * 3 + frame_index * 5) % 256,
                                (y * 7 + frame_index * 11) % 256,
                                ((x // 4 + y // 3 + frame_index) % 2) * 255,
                                (x * 13 + y * 17 + frame_index * 19) % 256,
                            )
                        )
                        row_start = offset + y * stride
                        pool.buf[row_start:row_start + width * 4] = row
                        expected.extend(row)
                    outstanding[(pool_id, slot)] = frame_id
                    control.write(
                        f"F\t{pool_id}\t{slot}\t{frame_id}\t{width}\t"
                        f"{height}\t{stride}\t{byte_length}\t{frame_index}\n"
                    )
                    control.flush()

            while outstanding:
                accept_acknowledgement()

            return_code = process.wait(timeout=30)
            stderr = process.stderr.read().decode("utf8")
            assert return_code == 0, stderr
            ack_thread.join(timeout=5)
            assert not ack_thread.is_alive()
            assert sorted(released) == [
                frame_id_base + index for index in range(frame_count)
            ]

            packet_metadata = json.loads(
                subprocess.check_output(
                    [
                        str(FFPROBE),
                        "-v", "error",
                        "-select_streams", "v:0",
                        "-show_entries", "packet=pos,size",
                        "-of", "json",
                        str(output),
                    ],
                    env=environment,
                    text=True,
                )
            )
            decoded = bytearray()
            with output.open("rb") as output_file:
                for packet in packet_metadata["packets"]:
                    output_file.seek(int(packet["pos"]))
                    decoded.extend(output_file.read(int(packet["size"])))
            assert decoded == expected
            print(
                f"validated {frame_count} exact BGRA frames across "
                f"{len(frame_pools)} pools with final-reference ACKs"
            )
            assert_ack_failure_unblocks(environment)
    finally:
        for descriptor in (control_read, control_write, ack_read, ack_write):
            if descriptor >= 0:
                os.close(descriptor)
        for _, pool in pools:
            close_pool(pool)


if __name__ == "__main__":
    main()
