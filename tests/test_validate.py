from pathlib import Path

from clawdbot.validate import validate

EXAMPLE = Path(__file__).parent.parent / "examples" / "neon-requiem" / "blueprint.md"


def test_example_blueprint_passes():
    report = validate(EXAMPLE.read_text(encoding="utf-8"))
    assert report.ok, report.errors
    assert report.shots == 5
    assert len(report.prompts) == 5


def test_forbidden_term_flagged():
    text = EXAMPLE.read_text(encoding="utf-8").replace("fine film grain", "photorealistic, 8k", 1)
    report = validate(text)
    assert any("photorealistic" in e for e in report.errors)
    assert any("'8k'" in e for e in report.errors)


def test_missing_prompt_block_and_bad_numbering():
    text = EXAMPLE.read_text(encoding="utf-8").replace("### 🎬 Shot 3:", "### 🎬 Shot 7:")
    text = text.replace("```text", "```", 1)
    report = validate(text)
    assert any("expected 3, got 7" in e for e in report.errors)
    assert any("Shot 1: expected 1 ```text" in e for e in report.errors)


def test_seed_log_prompt_consistency():
    """Every character prompt must reuse the locked costume seed verbatim."""
    coat = "heavily weathered, rain-slicked charcoal grey trench coat with a turned-up high collar"
    prompts = validate(EXAMPLE.read_text(encoding="utf-8")).prompts
    with_mara = [p for p in prompts if "woman detective" in p]
    assert with_mara and all(coat in p for p in with_mara)
