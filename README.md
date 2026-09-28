# clawdbot-filmmaking-engine
An automated script-to-prompt engine for creating cinematic AI storyboards and assets using Adobe Firefly.

**ClawdBot: Filmmaking AI Core** acts as your Executive Producer, Visual Director, and Firefly Prompt Architect. You give it a script and pre-production notes, and it returns a three-phase production blueprint:

1. **Visual Genome (Style Profile):** aspect ratio, camera DNA, color grade, and lighting blueprint, locked once for the whole sequence.
2. **Shot Sequence:** one `### 🎬 Shot N` block per camera setup. Each block has a narrative beat, the framing, a copy-ready Firefly Image 3 prompt in a ```` ```text ```` block, and a **Structure Reference** guide (what sketch to upload and at what strength).
3. **Continuity Inventory (Seed Log):** verbatim trigger strings for characters, costumes, props, and locations, so nothing drifts between shots.

## Layout

| Path | Purpose |
|---|---|
| `clawdbot/system_prompt.md` | The ClawdBot persona and output contract. Paste it into any Claude chat, or let the CLI use it. |
| `clawdbot/cli.py` | Streams a blueprint from Claude for a script file, then validates it. |
| `clawdbot/validate.py` | Lints a blueprint: required fields, sequential shot numbers, one `text` block per shot, and no forbidden buzzwords (`photorealistic`, `hyper-detailed`, `8k`, ...). |
| `examples/neon-requiem/` | A worked neo-noir cold open: `script.md` as input and `blueprint.md` as the reference output. |

## Usage

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...          # or run `ant auth login`

python -m clawdbot.cli path/to/script.md --notes path/to/notes.md -o blueprint.md
python -m clawdbot.validate blueprint.md
```

Options: `--model` (default `claude-opus-5`) and `--effort low|medium|high|xhigh|max` (default `high`). The generated text streams to stderr as it is written. Requests opt into server-side refusal fallbacks (`fallbacks: "default"`).

**No API key?** Paste `clawdbot/system_prompt.md` in as a system prompt or first message in Claude, then send your script.

## Firefly workflow tips

- Generate Shot 1 first. Once it's approved, load it as the **Style Reference** for every later shot.
- Paste the Seed Log strings verbatim. Rewording them is the #1 cause of character drift.
- Structure Reference strength: about 50–60 for organic scenes (steam, crowds) and 80+ for readable props (clock hands, signage).

## Tests

```bash
pip install pytest && python -m pytest -q
```
