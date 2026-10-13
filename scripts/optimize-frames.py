"""Re-encode the generated PNG frame sequences as WebP for low-bandwidth delivery.

The provenance-locked PNGs are kept as the archival source of truth
(prepare-assets.py validates them); the site itself serves the WebP copies.
Run: .venv-assets/Scripts/python scripts/optimize-frames.py
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "public" / "frames"
QUALITY = 100  # Lossless WebP quality (0-100, 100 = perfect fidelity)
METHOD = 6    # Best compression method


def convert(png: Path) -> tuple[int, int]:
    webp = png.with_suffix(".webp")
    if webp.exists() and webp.stat().st_mtime >= png.stat().st_mtime:
        return png.stat().st_size, webp.stat().st_size
    temporary = png.with_suffix(".webp.tmp")
    with Image.open(png) as image:
        image.load()
        image.save(temporary, format="WEBP", quality=QUALITY, method=METHOD)
    temporary.replace(webp)
    return png.stat().st_size, webp.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-only", action="store_true", help="Fail if any frame lacks an up-to-date WebP copy.")
    parser.add_argument("--directory", type=Path, default=FRAMES, help="Frame directory to convert (defaults to all public frames).")
    args = parser.parse_args()

    pngs = sorted(args.directory.rglob("*.png"))
    if not pngs:
        raise SystemExit(f"No frame PNGs found under {args.directory}")

    if args.verify_only:
        missing = [png for png in pngs if not png.with_suffix(".webp").exists()]
        if missing:
            raise SystemExit(f"{len(missing)} frames are missing WebP copies, e.g. {missing[0]}")
        print(f"Verified: {len(pngs)} frames all have WebP copies.")
        return

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(convert, pngs))
    png_bytes = sum(source for source, _ in results)
    webp_bytes = sum(target for _, target in results)
    print(f"Converted {len(results)} frames: {png_bytes / 1024 / 1024:.1f} MiB PNG -> {webp_bytes / 1024 / 1024:.1f} MiB WebP "
          f"({100 - webp_bytes / png_bytes * 100:.0f}% smaller).")


if __name__ == "__main__":
    main()
