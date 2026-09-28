"""Generate a ClawdBot production blueprint from a script with Claude.

    python -m clawdbot.cli script.md --notes notes.md -o blueprint.md
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import anthropic

from clawdbot.validate import validate

SYSTEM_PROMPT = (Path(__file__).parent / "system_prompt.md").read_text(encoding="utf-8")
DEFAULT_MODEL = "claude-opus-5"


def build_user_message(script: str, notes: str | None) -> str:
    parts = [f"<script>\n{script.strip()}\n</script>"]
    if notes:
        parts.append(f"<pre_production_notes>\n{notes.strip()}\n</pre_production_notes>")
    parts.append("Produce the full three-phase blueprint for this material.")
    return "\n\n".join(parts)


def generate(script: str, notes: str | None, model: str, effort: str) -> str:
    client = anthropic.Anthropic()
    with client.beta.messages.stream(
        model=model,
        max_tokens=64000,
        # Cached so repeat runs against different scripts reuse the system prompt.
        system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": build_user_message(script, notes)}],
        thinking={"type": "adaptive"},
        output_config={"effort": effort},
        betas=["server-side-fallback-2026-07-01"],
        extra_body={"fallbacks": "default"},
    ) as stream:
        for text in stream.text_stream:
            sys.stderr.write(text)
            sys.stderr.flush()
        message = stream.get_final_message()

    if message.stop_reason == "refusal":
        raise SystemExit("Claude declined this request; revise the script and retry.")
    if message.stop_reason == "max_tokens":
        print("\nwarning: output hit max_tokens; blueprint may be truncated", file=sys.stderr)
    return "".join(block.text for block in message.content if block.type == "text")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="ClawdBot: script -> Adobe Firefly shot blueprint")
    parser.add_argument("script", type=Path, help="script file (Markdown, Fountain, or plain text)")
    parser.add_argument("--notes", type=Path, help="optional pre-production notes file")
    parser.add_argument("-o", "--output", type=Path, help="write blueprint here (default: stdout)")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
    args = parser.parse_args(argv)

    notes = args.notes.read_text(encoding="utf-8") if args.notes else None
    blueprint = generate(args.script.read_text(encoding="utf-8"), notes, args.model, args.effort)

    if args.output:
        args.output.write_text(blueprint, encoding="utf-8")
    else:
        print(blueprint)

    report = validate(blueprint)
    for err in report.errors:
        print(f"validate: {err}", file=sys.stderr)
    print(f"\nvalidate: {report.shots} shots, {'PASS' if report.ok else 'FAIL'}", file=sys.stderr)
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
