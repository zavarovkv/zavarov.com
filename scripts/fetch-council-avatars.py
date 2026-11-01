#!/usr/bin/env python3
"""Vendor approved public Council portraits from a pinned source commit for Hugo builds."""
from pathlib import Path
from urllib.request import Request, urlopen
import struct

SOURCE = "https://raw.githubusercontent.com/zavarovkv/agent-council/6d493544ed12f43dd42e34dd7f26f87b617a6e9c/assets/agents"
NAMES = ("qui-gon", "dexter", "lando", "padme")
DEST = Path(__file__).resolve().parents[1] / "static/council/avatars"

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        target = DEST / f"{name}.png"
        if target.is_file() and valid(target.read_bytes()):
            continue
        request = Request(f"{SOURCE}/{name}.png", headers={"User-Agent": "zavarov-com-council-assets"})
        with urlopen(request, timeout=20) as response:
            data = response.read(512 * 1024 + 1)
        if not valid(data):
            raise RuntimeError(f"Invalid or oversized PNG: {name}")
        target.write_bytes(data)
        print(f"Vendored {name}: {len(data)} bytes")

def valid(data):
    return (len(data) <= 512 * 1024 and len(data) >= 24
            and data[:8] == b"\x89PNG\r\n\x1a\n"
            and data[12:16] == b"IHDR"
            and struct.unpack(">II", data[16:24]) == (256, 256))

if __name__ == "__main__":
    main()
