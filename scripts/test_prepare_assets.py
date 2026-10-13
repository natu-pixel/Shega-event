import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

spec = importlib.util.spec_from_file_location("prepare_assets", Path(__file__).with_name("prepare-assets.py"))
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class ReplaceSequenceTests(unittest.TestCase):
    def setUp(self):
        self.workspace = tempfile.TemporaryDirectory()
        self.addCleanup(self.workspace.cleanup)
        self.root = Path(self.workspace.name)
        self.public = self.root / "public"
        self.source = self.root / "yohana.mp4"
        self.source.write_bytes(b"original source")
        self.directory = self.public / "frames" / "yohana"
        for name, value in (("ROOT", self.root), ("PUBLIC", self.public),
                            ("FRAME_COUNT", 2), ("VIDEOS", {"yohana": self.source})):
            patcher = patch.object(assets, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        original = self.make_sequence(self.directory, 25)
        self.manifest_path = self.public / "asset-manifest.json"
        assets.write_json(self.manifest_path, {
            "generated_at_utc": "before",
            "total_frame_count": 152,
            "sequences": [original, {"id": "rophnan", "frame_count": 150, "untouched": True}],
            "gallery": [{"untouched": True}],
        })
        self.before_manifest = self.manifest_path.read_bytes()
        self.before_files = {path.name: path.read_bytes() for path in self.directory.iterdir()}
        self.source.write_bytes(b"replacement source")

    def make_sequence(self, directory, color):
        directory.mkdir(parents=True)
        for index in (1, 2):
            Image.new("RGB", (8, 4), (color * index, 0, 0)).save(directory / f"frame-{index:03d}.png")
        Image.new("RGB", (8, 4), (color, 0, 0)).save(directory / "poster.jpg")
        metadata = {
            "generator": "shega-original-video-v1", "complete": True, "id": "yohana",
            "source": "yohana.mp4", "source_sha256": assets.sha256(self.source),
            "dimensions": [8, 4], "frame_count": 2,
            "frame_url_pattern": "/frames/yohana/frame-{index:03d}.png",
            "poster_url": "/frames/yohana/poster.jpg",
        }
        assets.write_json(directory / ".generated.json", metadata)
        return {**metadata, "frames": assets.validate_sequence(directory, [8, 4])}

    def generate(self, slug, source, output_directory):
        self.assertEqual(slug, "yohana")
        self.assertEqual(source, self.source)
        return self.make_sequence(output_directory, 90)

    def assert_original_preserved(self):
        self.assertEqual(self.manifest_path.read_bytes(), self.before_manifest)
        for name, content in self.before_files.items():
            self.assertEqual((self.directory / name).read_bytes(), content)

    def test_replaces_only_selected_sequence_and_versions_both_urls(self):
        with patch.object(assets, "prepare_sequence", side_effect=self.generate):
            assets.replace_sequence("yohana")
        before = json.loads(self.before_manifest)
        after = json.loads(self.manifest_path.read_bytes())
        sequence = after["sequences"][0]
        self.assertEqual(after["sequences"][1], before["sequences"][1])
        self.assertEqual(after["gallery"], before["gallery"])
        self.assertEqual(after["total_frame_count"], before["total_frame_count"])
        self.assertEqual(sequence["asset_revision"], assets.sha256(self.source))
        self.assertTrue(sequence["frame_url_pattern"].endswith(f"?v={sequence['asset_revision']}"))
        self.assertTrue(sequence["poster_url"].endswith(f"?v={sequence['asset_revision']}"))
        self.assertEqual(assets.validate_sequence(self.directory, [8, 4]), sequence["frames"])
        self.assertNotEqual((self.directory / "frame-001.png").read_bytes(), self.before_files["frame-001.png"])
        self.assertEqual(self.source.read_bytes(), b"replacement source")
        self.assertEqual([path.name for path in self.directory.parent.iterdir()], ["yohana"])

    def test_extraction_failure_leaves_existing_assets_untouched(self):
        with patch.object(assets, "prepare_sequence", side_effect=ValueError("decode failed")):
            with self.assertRaisesRegex(ValueError, "decode failed"):
                assets.replace_sequence("yohana")
        self.assert_original_preserved()

    def test_replaces_delivery_copies_with_fresh_encodes_before_publishing(self):
        assets.prepare_webp_sequence(self.directory, [8, 4])
        old_webp = (self.directory / "frame-001.webp").read_bytes()
        with patch.object(assets, "prepare_sequence", side_effect=self.generate):
            assets.replace_sequence("yohana")
        for index in (1, 2):
            with Image.open(self.directory / f"frame-{index:03d}.webp") as image:
                self.assertEqual(image.format, "WEBP")
                self.assertEqual(image.size, (8, 4))
        self.assertNotEqual((self.directory / "frame-001.webp").read_bytes(), old_webp)

    def test_delivery_encoding_failure_preserves_all_previous_assets(self):
        assets.prepare_webp_sequence(self.directory, [8, 4])
        old_webp = (self.directory / "frame-001.webp").read_bytes()
        with patch.object(assets, "prepare_sequence", side_effect=self.generate), \
                patch.object(assets, "prepare_webp_sequence", side_effect=OSError("WebP encode failed")):
            with self.assertRaisesRegex(OSError, "WebP encode failed"):
                assets.replace_sequence("yohana")
        self.assert_original_preserved()
        self.assertEqual((self.directory / "frame-001.webp").read_bytes(), old_webp)

    def test_manifest_publication_failure_restores_previous_assets(self):
        original_write = assets.write_json

        def fail_manifest(path, value):
            if path == self.manifest_path:
                raise OSError("manifest write failed")
            original_write(path, value)

        with patch.object(assets, "prepare_sequence", side_effect=self.generate), \
                patch.object(assets, "write_json", side_effect=fail_manifest):
            with self.assertRaisesRegex(OSError, "manifest write failed"):
                assets.replace_sequence("yohana")
        self.assert_original_preserved()

    def test_refuses_unchanged_source(self):
        self.source.write_bytes(b"original source")
        with self.assertRaisesRegex(ValueError, "Source is unchanged"):
            assets.replace_sequence("yohana")
        self.assert_original_preserved()

    def test_refuses_unrelated_files(self):
        extra = self.directory / "user-note.txt"
        extra.write_text("preserve me")
        with self.assertRaisesRegex(ValueError, "unrelated files"):
            assets.replace_sequence("yohana")
        self.assert_original_preserved()
        self.assertEqual(extra.read_text(), "preserve me")

    def test_default_generation_still_refuses_a_changed_source(self):
        with self.assertRaisesRegex(ValueError, "Source changed"):
            assets.prepare_sequence("yohana", self.source)
        self.assert_original_preserved()


if __name__ == "__main__":
    unittest.main()
