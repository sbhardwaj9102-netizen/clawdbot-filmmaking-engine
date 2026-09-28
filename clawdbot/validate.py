"""Lint a ClawdBot blueprint against the output contract in system_prompt.md."""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

FORBIDDEN_TERMS = (
    "photorealistic",
    "photo-realistic",
    "hyper-detailed",
    "hyperdetailed",
    "hyperrealistic",
    "hyper-realistic",
    "ultra hd",
    "masterpiece",
    "trending on artstation",
    "best quality",
    "8k",
    "4k",
)

STYLE_FIELDS = ("Aspect Ratio", "Camera DNA", "Color Grade", "Lighting Blueprint")
SHOT_FIELDS = (
    "Narrative Beat",
    "Composition & Framing",
    "Adobe Firefly Image 3 Prompt",
    "Structure Reference Guide",
)

SHOT_HEADER = re.compile(r"^### 🎬 Shot (\d+):\s*(.+)$", re.MULTILINE)
TEXT_BLOCK = re.compile(r"```text\n(.*?)```", re.DOTALL)


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    shots: int = 0
    prompts: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def validate(blueprint: str) -> Report:
    report = Report()

    for name in STYLE_FIELDS:
        if not re.search(rf"\*?\*?{re.escape(name)}:?\*?\*?:?", blueprint):
            report.errors.append(f"Style Profile is missing '{name}'")

    if not re.search(r"seed log|continuity inventory", blueprint, re.IGNORECASE):
        report.errors.append("Missing Phase 3 Continuity Inventory (Seed Log)")

    headers = list(SHOT_HEADER.finditer(blueprint))
    report.shots = len(headers)
    if not headers:
        report.errors.append("No shot blocks found ('### 🎬 Shot N: ...')")

    for i, match in enumerate(headers):
        number = int(match.group(1))
        if number != i + 1:
            report.errors.append(f"Shot numbering out of sequence: expected {i + 1}, got {number}")

        end = headers[i + 1].start() if i + 1 < len(headers) else len(blueprint)
        # Seed Log follows the last shot; don't let it bleed into that shot's body.
        tail = re.search(r"^## ", blueprint[match.end():end], re.MULTILINE)
        if tail:
            end = match.end() + tail.start()
        body = blueprint[match.end():end]

        for name in SHOT_FIELDS:
            if f"**{name}:**" not in body:
                report.errors.append(f"Shot {number}: missing '{name}'")

        prompts = TEXT_BLOCK.findall(body)
        if len(prompts) != 1:
            report.errors.append(f"Shot {number}: expected 1 ```text prompt block, found {len(prompts)}")
        for prompt in prompts:
            report.prompts.append(prompt.strip())
            lowered = prompt.lower()
            for term in FORBIDDEN_TERMS:
                if re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", lowered):
                    report.errors.append(f"Shot {number}: forbidden term '{term}' in Firefly prompt")

    return report


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    if len(args) != 1:
        print("usage: python -m clawdbot.validate BLUEPRINT.md", file=sys.stderr)
        return 2
    report = validate(Path(args[0]).read_text(encoding="utf-8"))
    for err in report.errors:
        print(f"FAIL  {err}")
    print(f"{'PASS' if report.ok else 'FAIL'}  {report.shots} shots, {len(report.prompts)} Firefly prompts")
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
