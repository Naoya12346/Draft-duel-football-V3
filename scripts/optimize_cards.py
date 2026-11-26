#!/usr/bin/env python3
"""Convert uploaded player PNG/JPG cards into small WebP files.

Usage:
    python3 scripts/optimize_cards.py /path/to/cards ./assets/cards-webp

The script keeps the aspect ratio, caps the longest side at 1024 px,
writes WebP at quality 82 and prints a JSON map of old -> new paths so
admin card records can be updated in one pass.
"""

import json
import sys
from pathlib import Path

from PIL import Image

MAX_SIDE = 1024
QUALITY = 82


def optimize(source_dir: Path, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    mapping = {}

    for path in sorted(source_dir.iterdir()):
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue

        with Image.open(path) as img:
            image = img.convert("RGBA")
            image.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            target = output_dir / f"{path.stem}.webp"
            image.save(target, "WEBP", quality=QUALITY, method=6)
            mapping[str(path)] = str(target)

    return mapping


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: optimize_cards.py <input_folder> <output_folder>")
        sys.exit(1)

    source = Path(sys.argv[1]).expanduser()
    output = Path(sys.argv[2]).expanduser()
    if not source.is_dir():
        print(f"Not a folder: {source}")
        sys.exit(1)

    print(json.dumps(optimize(source, output), indent=2))


if __name__ == "__main__":
    main()
