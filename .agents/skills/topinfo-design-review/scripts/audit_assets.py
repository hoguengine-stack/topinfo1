#!/usr/bin/env python3
"""Read-only TOPINFO public image inventory.

Prints CSV to stdout with dimensions, size, format, alpha, animation, and SHA-256.
Exit code is non-zero only for unreadable image files or a missing target directory.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import sys
from pathlib import Path

try:
    from PIL import Image, UnidentifiedImageError
except ImportError as exc:  # pragma: no cover - environment guard
    raise SystemExit(
        "Pillow is required. Load the workspace Python dependencies or install Pillow first."
    ) from exc


IMAGE_SUFFIXES = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"}
LARGE_FILE_BYTES = 500_000


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def has_alpha(image: Image.Image) -> bool:
    return image.mode in {"LA", "PA", "RGBA"} or "transparency" in image.info


def inspect_image(path: Path, root: Path) -> dict[str, object]:
    size_bytes = path.stat().st_size
    with Image.open(path) as image:
        frame_count = getattr(image, "n_frames", 1)
        width, height = image.size
        image_format = image.format or path.suffix.removeprefix(".").upper()
        alpha = has_alpha(image)

    flags: list[str] = []
    if size_bytes >= LARGE_FILE_BYTES:
        flags.append("LARGE_FILE")
    if frame_count > 1:
        flags.append("ANIMATED")
    if min(width, height) < 600:
        flags.append("LOW_RES_REVIEW")

    return {
        "path": path.relative_to(root).as_posix(),
        "width": width,
        "height": height,
        "aspect_ratio": round(width / height, 4) if height else "",
        "format": image_format,
        "bytes": size_bytes,
        "alpha": alpha,
        "frames": frame_count,
        "sha256": sha256(path),
        "flags": " | ".join(flags),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "root",
        nargs="?",
        default="public/assets",
        help="Asset directory to audit (default: public/assets)",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"Asset directory does not exist: {root}", file=sys.stderr)
        return 2

    rows: list[dict[str, object]] = []
    errors: list[str] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        try:
            rows.append(inspect_image(path, root))
        except (OSError, UnidentifiedImageError) as exc:
            errors.append(f"{path}: {exc}")

    fieldnames = [
        "path",
        "width",
        "height",
        "aspect_ratio",
        "format",
        "bytes",
        "alpha",
        "frames",
        "sha256",
        "flags",
    ]
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
    sys.stdout.write(stream.getvalue())

    for error in errors:
        print(f"ERROR,{error}", file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

