from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "generate_tailwind_config.py"


class GenerateTailwindConfigTests(unittest.TestCase):
    def run_script(
        self, *arguments: str, cwd: Path | None = None
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            cwd=cwd,
            text=True,
            encoding="utf-8",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

    def test_existing_target_can_be_previewed_without_writing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            target = Path(temporary_directory) / "tailwind.config.ts"
            target.write_text("preserve me\n", encoding="utf-8")

            result = self.run_script("--output", str(target), "--colors", "brand:#2563eb")

            self.assertEqual(result.returncode, 0)
            self.assertIn("DRY RUN: would replace", result.stdout)
            self.assertIn('"brand": "#2563eb"', result.stdout)
            self.assertEqual(target.read_text(encoding="utf-8"), "preserve me\n")

    def test_write_refuses_existing_target_and_force_replaces_it(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            target = Path(temporary_directory) / "tailwind.config.ts"
            target.write_text("preserve me\n", encoding="utf-8")

            refused = self.run_script("--output", str(target), "--write")
            self.assertEqual(refused.returncode, 2)
            self.assertEqual(target.read_text(encoding="utf-8"), "preserve me\n")

            replaced = self.run_script("--output", str(target), "--force")
            self.assertEqual(replaced.returncode, 0)
            self.assertIn(
                'import type { Config } from "tailwindcss"',
                target.read_text(encoding="utf-8"),
            )

    def test_formats_use_matching_default_extension_and_export_syntax(self) -> None:
        cases = (
            (
                "typescript",
                "ts",
                ('import type { Config } from "tailwindcss"', "export default", "satisfies Config"),
                ("module.exports",),
            ),
            ("esm", "js", ("export default",), ("module.exports", "satisfies Config")),
            ("commonjs", "cjs", ("module.exports",), ("export default", "satisfies Config")),
        )

        with tempfile.TemporaryDirectory() as temporary_directory:
            working_directory = Path(temporary_directory)
            for output_format, extension, expected_markers, unexpected_markers in cases:
                with self.subTest(output_format=output_format):
                    result = self.run_script("--format", output_format, cwd=working_directory)

                    self.assertEqual(result.returncode, 0)
                    target = (working_directory / f"tailwind.config.{extension}").resolve()
                    self.assertIn(f"DRY RUN: would create {target}", result.stdout)
                    for marker in expected_markers:
                        self.assertIn(marker, result.stdout)
                    for marker in unexpected_markers:
                        self.assertNotIn(marker, result.stdout)
                    self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
