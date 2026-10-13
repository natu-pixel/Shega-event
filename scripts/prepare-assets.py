"""Generate the website's 150-frame sequences directly from the original videos."""

import argparse
import hashlib
import json
import runpy
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import av
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
FRAME_COUNT = 150
MAX_EDGE = 1280
VIDEOS = {
    "etfc": ROOT / "video" / "ETFC video.mp4",
    "keberaf": ROOT / "video" / "keberaf video.mp4",
    "lij-michael": ROOT / "video" / "lijmic video.mp4",
    "yohana": ROOT / "video" / "yohana.mp4",
    "rophnan": ROOT / "video" / "rophnan.mp4",
}
GALLERY = {
    "rophnan-finale": "01-aerial-stage-and-crowd.jpg",
    "kemen-lejemer": "02-user-selected-entrance.jpg",
    "keberaf": "01-concert.jpg",
    "halo-hawassa": "01-yohana-stage-crowd.jpg",
    "wazema": "01-live-performance.jpg",
    "great-arbaminch-run": "01-race-photo.jpg",
}


def sha256(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def write_json(path, value):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def validate_sequence(directory, dimensions=None):
    expected = {f"frame-{index:03d}.png" for index in range(1, FRAME_COUNT + 1)}
    actual = {path.name for path in directory.glob("frame-*.png")}
    if actual != expected:
        raise ValueError(f"Incorrect frame inventory in {directory}: missing={expected - actual}, extra={actual - expected}")
    records = []
    for name in sorted(expected):
        path = directory / name
        with Image.open(path) as image:
            image.load()
            if image.format != "PNG" or (dimensions and image.size != tuple(dimensions)):
                raise ValueError(f"Invalid frame format or size: {path}")
            size = image.size
        records.append({"filename": name, "width": size[0], "height": size[1],
                        "bytes": path.stat().st_size, "sha256": sha256(path)})
    if len({record["sha256"] for record in records}) < 2:
        raise ValueError(f"Sequence is entirely static: {directory}")
    with Image.open(directory / "poster.jpg") as poster:
        poster.load()
        if dimensions and poster.size != tuple(dimensions):
            raise ValueError(f"Poster dimensions differ from sequence: {directory}")
    return records


def prepare_sequence(slug, source, output_directory=None):
    if not source.is_file():
        raise FileNotFoundError(source)
    source_hash = sha256(source)
    directory = output_directory if output_directory is not None else PUBLIC / "frames" / slug
    marker = directory / ".generated.json"
    directory.mkdir(parents=True, exist_ok=True)
    if marker.exists():
        previous = json.loads(marker.read_text(encoding="utf-8"))
        if previous.get("generator") != "shega-original-video-v1":
            raise ValueError(f"Unknown asset ownership: {directory}")
        if previous.get("source_sha256") != source_hash:
            raise ValueError(f"Source changed; review before replacing generated frames: {source}")
        if previous.get("complete"):
            records = validate_sequence(directory, previous["dimensions"])
            print(f"{slug}: verified existing 150 generated PNGs", flush=True)
            return {**previous, "frames": records}
    elif any(directory.iterdir()):
        raise ValueError(f"Refusing to replace unowned assets in {directory}")

    with av.open(str(source)) as container:
        stream = container.streams.video[0]
        source_dimensions = [stream.width, stream.height]
        rate = str(stream.average_rate)
        total = sum(1 for _ in container.decode(stream))
    if total < FRAME_COUNT:
        raise ValueError(f"{source.name} has only {total} frames; 150 unique source frames are required.")
    indices = [round(index * (total - 1) / (FRAME_COUNT - 1)) for index in range(FRAME_COUNT)]
    if len(set(indices)) != FRAME_COUNT:
        raise ValueError(f"Sampling did not produce 150 distinct source indices: {slug}")
    ratio = min(1.0, MAX_EDGE / max(source_dimensions))
    width, height = [max(1, round(value * ratio)) for value in source_dimensions]
    metadata = {
        "generator": "shega-original-video-v1",
        "complete": False,
        "id": slug,
        "source": str(source.relative_to(ROOT)).replace("\\", "/"),
        "source_sha256": source_hash,
        "source_frame_count": total,
        "source_dimensions": source_dimensions,
        "source_average_rate": rate,
        "dimensions": [width, height],
        "frame_count": FRAME_COUNT,
        "sampled_source_indices": indices,
        "sampling": "150 evenly distributed decoded frame indices, including the first and last source frame.",
        "frame_url_pattern": f"/frames/{slug}/frame-{{index:03d}}.png",
        "poster_url": f"/frames/{slug}/poster.jpg",
        "poster_frame": 1,
        "processing": "Aspect-ratio-preserving resize only, maximum long edge 1280; no upscaling, inpainting or watermark removal.",
    }
    write_json(marker, metadata)
    targets = {source_index: output_index for output_index, source_index in enumerate(indices, 1)}
    saved = 0
    with av.open(str(source)) as container:
        stream = container.streams.video[0]
        for index, frame in enumerate(container.decode(stream)):
            output_index = targets.get(index)
            if output_index is None:
                continue
            rgb = frame.reformat(width=width, height=height, format="rgb24")
            image = Image.frombytes("RGB", (width, height), bytes(rgb.planes[0]), "raw", "RGB", rgb.planes[0].line_size)
            target = directory / f"frame-{output_index:03d}.png"
            temporary = directory / f"frame-{output_index:03d}.png.tmp"
            image.save(temporary, format="PNG", compress_level=5)
            temporary.replace(target)
            if output_index == 1:
                image.save(directory / "poster.jpg", format="JPEG", quality=92, subsampling=0)
            saved += 1
            if saved % 30 == 0:
                print(f"{slug}: extracted {saved}/150", flush=True)
    if saved != FRAME_COUNT:
        raise ValueError(f"Only {saved} frames generated for {slug}")
    if sha256(source) != source_hash:
        raise ValueError(f"Original video changed during extraction: {source}")
    records = validate_sequence(directory, [width, height])
    metadata["complete"] = True
    metadata["total_png_bytes"] = sum(record["bytes"] for record in records)
    write_json(marker, metadata)
    print(f"{slug}: 150 PNGs verified, {width}x{height}, {metadata['total_png_bytes'] / 1024 / 1024:.1f} MiB", flush=True)
    return {**metadata, "frames": records}


def replace_sequence(slug):
    source = VIDEOS[slug]
    manifest_path = PUBLIC / "asset-manifest.json"
    original_manifest = manifest_path.read_bytes()
    manifest = json.loads(original_manifest)
    matches = [entry for entry in manifest["sequences"] if entry["id"] == slug]
    if len(matches) != 1:
        raise ValueError(f"Expected one existing manifest entry for {slug}")
    previous = matches[0]
    directory = PUBLIC / "frames" / slug
    marker = json.loads((directory / ".generated.json").read_text(encoding="utf-8"))
    if (marker.get("generator") != "shega-original-video-v1" or not marker.get("complete")
            or marker.get("id") != slug or marker.get("source_sha256") != previous["source_sha256"]):
        raise ValueError(f"Cannot replace assets with unverified ownership: {directory}")
    expected_names = {entry["filename"] for entry in previous["frames"]} | {"poster.jpg", ".generated.json"}
    actual_names = {path.name for path in directory.iterdir()}
    webp_names = {Path(entry["filename"]).with_suffix(".webp").name for entry in previous["frames"]}
    has_webp = actual_names == expected_names | webp_names
    if actual_names != expected_names and not has_webp:
        raise ValueError(f"Refusing to replace a directory containing unrelated files: {directory}")
    if validate_sequence(directory, previous["dimensions"]) != previous["frames"]:
        raise ValueError(f"Existing frames differ from the manifest; review before replacing: {slug}")
    if sha256(source) == previous["source_sha256"]:
        raise ValueError(f"Source is unchanged; use --verify-only instead: {source}")
    backup = directory.with_name(f".{slug}-previous-{previous['source_sha256']}")
    if backup.exists():
        raise ValueError(f"Previous replacement backup needs review before continuing: {backup}")

    with tempfile.TemporaryDirectory(prefix=f".{slug}-update-", dir=directory.parent) as workspace:
        staged = Path(workspace) / "generated"
        replacement = prepare_sequence(slug, source, staged)
        if has_webp:
            prepare_webp_sequence(staged, replacement["dimensions"])
        if sha256(source) != replacement["source_sha256"]:
            raise ValueError(f"Source changed during staging; replacement cancelled: {source}")
        revision = replacement["source_sha256"]
        replacement["asset_revision"] = revision
        replacement["frame_url_pattern"] += f"?v={revision}"
        replacement["poster_url"] += f"?v={revision}"
        write_json(staged / ".generated.json", {key: value for key, value in replacement.items() if key != "frames"})
        if manifest_path.read_bytes() != original_manifest:
            raise ValueError("Asset manifest changed during extraction; replacement cancelled.")
        if validate_sequence(directory, previous["dimensions"]) != previous["frames"]:
            raise ValueError(f"Existing frames changed during extraction; replacement cancelled: {slug}")
        sequences = [replacement if entry["id"] == slug else entry for entry in manifest["sequences"]]
        updated_manifest = {
            **manifest,
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "total_frame_count": sum(entry["frame_count"] for entry in sequences),
            "sequences": sequences,
        }
        directory.rename(backup)
        try:
            staged.rename(directory)
            write_json(manifest_path, updated_manifest)
        except OSError:
            if directory.exists():
                directory.rename(staged)
            backup.rename(directory)
            raise
        shutil.rmtree(backup)
    print(f"Replaced only {slug}. Set its assetRevision in lib/story.ts to {revision} and rebuild the site.", flush=True)


def prepare_webp_sequence(directory, dimensions):
    # Reuse the delivery encoder so replacement footage uses the same settings.
    convert = runpy.run_path(str(Path(__file__).with_name("optimize-frames.py")))["convert"]
    for png in sorted(directory.glob("frame-*.png")):
        convert(png)
        with Image.open(png.with_suffix(".webp")) as image:
            image.load()
            if image.format != "WEBP" or image.size != tuple(dimensions):
                raise ValueError(f"Invalid delivery frame: {png.with_suffix('.webp')}")


def prepare_gallery():
    provenance = json.loads((ROOT / "event-photos" / "sources.json").read_text(encoding="utf-8-sig"))
    records = {event["event_slug"]: event for event in provenance["events"]}
    destination = PUBLIC / "events"
    destination.mkdir(parents=True, exist_ok=True)
    gallery = []
    for slug, filename in GALLERY.items():
        event = records[slug]
        photo = next(image for image in event["images"] if image["filename"] == filename)
        source = ROOT / "event-photos" / slug / filename
        target = destination / f"{slug}.jpg"
        source_hash = sha256(source)
        if source_hash != photo["sha256"]:
            raise ValueError(f"Source photograph hash does not match provenance: {source}")
        if target.exists() and sha256(target) != source_hash:
            raise ValueError(f"Refusing to overwrite a different gallery image: {target}")
        if not target.exists():
            shutil.copyfile(source, target)
        with Image.open(target) as image:
            image.load()
            if image.size != (photo["width"], photo["height"]):
                raise ValueError(f"Gallery dimensions changed: {target}")
        gallery.append({
            "id": slug, "url": f"/events/{slug}.jpg", "source_filename": filename,
            "source_page_url": photo["source_page_url"], "source_account": photo["source_account"],
            "width": photo["width"], "height": photo["height"], "sha256": source_hash,
            "permission_status": photo["permission_status"],
            "user_selected_source": event.get("user_selected_source"),
        })
    return gallery


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--verify-only", action="store_true")
    mode.add_argument("--replace-sequence", choices=VIDEOS, help="Replace one reviewed, changed source using validated staged frames.")
    args = parser.parse_args()
    if args.replace_sequence:
        replace_sequence(args.replace_sequence)
        return
    if args.verify_only:
        manifest = json.loads((PUBLIC / "asset-manifest.json").read_text(encoding="utf-8"))
        for entry in manifest["sequences"]:
            records = validate_sequence(PUBLIC / "frames" / entry["id"], entry["dimensions"])
            if records != entry["frames"]:
                raise ValueError(f"Sequence differs from recorded hashes: {entry['id']}")
            if sha256(ROOT / entry["source"]) != entry["source_sha256"]:
                raise ValueError(f"Original source changed: {entry['source']}")
        prepare_gallery()
        print(f"Verified: {len(VIDEOS) * FRAME_COUNT} decodable PNGs, frame hashes, {len(VIDEOS)} unchanged original videos and six credited gallery images.")
        return
    sequences = [prepare_sequence(slug, path) for slug, path in VIDEOS.items()]
    manifest = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "total_frame_count": sum(entry["frame_count"] for entry in sequences),
        "sequences": sequences,
        "gallery": prepare_gallery(),
        "publication_notice": "Local user-provided videos and user-approved photographs. Confirm publication rights; original source marks are preserved.",
    }
    write_json(PUBLIC / "asset-manifest.json", manifest)
    print(f"Completed: {len(VIDEOS) * FRAME_COUNT} original-video PNGs, {len(VIDEOS)} matching posters and six credited gallery images.", flush=True)


if __name__ == "__main__":
    main()
