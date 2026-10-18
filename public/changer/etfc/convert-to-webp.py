import subprocess
import os
from pathlib import Path

def convert_to_webp(
    input_path: str,
    output_path: str = None,
    fps: int = 15,
    width: int = 720,
    quality: int = 75,
    compression_level: int = 6,
    loop: int = 0
):
    """
    Converts a video to an optimized animated WebP using FFmpeg.
    """
    src = Path(input_path)
    if not src.exists():
        raise FileNotFoundError(f"Source file not found: {input_path}")

    dest = Path(output_path) if output_path else src.with_suffix(".webp")

    cmd = [
        "ffmpeg",
        "-y",                       # Overwrite output without asking
        "-i", str(src),
        "-vcodec", "libwebp",
        "-vf", f"fps={fps},scale={width}:-1:flags=lanczos",
        "-lossless", "0",
        "-compression_level", str(compression_level),
        "-q:v", str(quality),
        "-loop", str(loop),
        "-an",                      # Strip audio
        str(dest)
    ]

    print(f"Converting '{src.name}' -> '{dest.name}'...")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        print("FFmpeg Error:\n", result.stderr)
        return False

    print(f"Done! Created: {dest} ({round(dest.stat().st_size / 1024, 1)} KB)")
    return True


def batch_convert_directory(folder_path: str, extensions=("*.mp4", "*.mov", "*.mkv")):
    """Batch convert all videos in a directory to animated WebP."""
    folder = Path(folder_path)
    for ext in extensions:
        for file in folder.glob(ext):
            convert_to_webp(str(file))


if __name__ == "__main__":
    # Single file
    convert_to_webp("ETFC OFFICIAL RECAP .mp4", "output.webp", fps=24, width=1280, quality=80)

    # Or batch convert an entire folder:
    # batch_convert_directory("./videos")