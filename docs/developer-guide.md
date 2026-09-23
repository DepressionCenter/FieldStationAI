<!--
This file is part of Field Station AI.
developer-guide.md: Guide for developers working on Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-23
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: Developer Guide

## Purpose
The Eisenberg Family Depression Center welcomes contributions from researchers and developers who want to help improve Field Station AI™. We invite you to submit feedback, ideas for improving the app, documentation, bug reports, and feature requests via [GitHub issues](https://github.com/DepressionCenter/FieldStationAI/issues).

For developers, this guide summarizes the current architecture, design principles, and development practices.


## Code Shape

Field Station AI™ currently lives primarily in one file:

```text
index.html
```

The script is organized by visible section comments. Preserve that structure when editing. Avoid broad reformatting; unrelated churn makes the file hard to review.

## AI Coding Assistants
When using an AI coding assistant to help you write code, tell it to read [AGENTS.md](../AGENTS.md) first. Use the assistant to generate code, but review and edit the output carefully. Do not blindly accept generated code. Always test before submitting a pull request. Avoid sharing PHI, secrets, or participant identifiers with any code assistant.

## Editing Rules

Before editing:

1. Inspect existing code around the target change.
2. Preserve established naming and UI patterns.
3. Make the smallest coherent change.
4. Keep documentation synchronized.
5. Use synthetic examples.
6. Review output for PHI and secrets.

Do not claim code was tested unless it was actually executed.

## Add a Model

Recommended checklist:

1. Add the model to the UI selection path.
2. Add context-window or size metadata where the code expects it.
3. Add cache-cleanup metadata where relevant.
4. Test first load.
5. Test cached reload.
6. Test generation.
7. Test Stop.
8. Test model switching.
9. Verify behavior without WebGPU if a fallback is expected.
10. Update `docs/models-and-runtime.md`.

Do not expose raw model IDs in user-facing errors when a friendly name is available.

## Add a Field Kit Skill

Minimum checklist:

1. Add icon metadata if needed.
2. Add a skill registry entry.
3. Write a `mount...Skill(container)` function.
4. Wire the skill into enter/reset handling.
5. Register a state probe if the tool has meaningful unsaved state.
6. Use stale-token or abort behavior to invalidate stale runs.
7. Acquire the shared engine lock around every model call and release in `finally`.
8. Keep skill input state separate from chat state.
9. Provide download and/or Send to Chat behavior where useful.
10. Update `docs/field-kit.md`.

Do not let a skill write to chat history unless the user explicitly chooses Send to Chat.

## Add Attachment Behavior

Update these areas together where they exist:

- Attachment kind detection.
- Size caps.
- MIME-to-icon display.
- Extraction or transcription logic.
- Attachment bar actions.
- Deletion cleanup.
- Retrieval behavior for text-bearing files.
- Documentation in `docs/data-files-and-compendiums.md`.

Deletion must remove metadata, blob storage, vector storage, and index records where those records exist.

## Change Compendium Loading or Retrieval

A compendium is a bundle of knowledge from many sources, built by [Extractium™](https://code.depressioncenter.org/extractium). The app reads Extractium's container format, version 4, and never builds a compendium itself. The format is defined in Extractium's `docs/container-format.md`, which ends with a checklist for readers.

Preserve these rules:

- Follow the reader checklist. Check the format name, the version, and the vector byte count before use, and load the keyword statistics into `Map` objects.
- Refuse a compendium whose `embedding.model` is not `BAAI/bge-small-en-v1.5` with 384 dimensions. The app embeds questions with the same model in its browser packaging, `Xenova/bge-small-en-v1.5`. Vectors from two models cannot be compared.
- Prefix each question with the `embedding.queryPrefix` value the file records. Never prefix a passage.
- Do not load the embedding model with 16-bit math (`q4f16` or `fp16`). Passage vectors are built at full precision, and 16-bit math on WebGPU can move a question's vector far from its true value. Check a new setting by comparing its vectors with `fp32` ones. The cosine between the two should be 0.98 or higher.
- Do not filter or branch on a section's `source_type` or `content_type`. Extractium adds values to both without a new format version.
- Treat every field in a compendium as untrusted input, and keep the size limit (`COMPENDIUM_MAX_BYTES`, applied to the container bytes whether they arrive plain or come out of gzip).
- Do not send user prompts to the compendium URL.
- Retune the fallback `compendiumCosineMin` in `SETTING_DEFS`, and the other thresholds, if the embedding model ever changes.

The bundled file is found by name. `BUNDLED_COMPENDIUM_URLS` lists the names tried, full file first and `.gz` before `.json`, and `fetchBundledCompendium()` uses the first one the server does not answer 404 for. Extractium writes a light file (`<slug>.json.gz`, page descriptions only) and a full file (`<slug>-full.json.gz`, every section's text). To ship the other one, change the file next to `index.html`, not the list. A `?compendium-url=` file is read the same way, and gzip is detected from the first two bytes, never from the name.

Of the file's `calibration` statistics, only the unrelated-question figures are used. `relevanceFloorOf()` turns `unrelatedMedian`, `unrelatedSpread`, and `unrelatedProbes` into the file's own match floor, with the same margin and range as Extractium's reference clients (`COMPENDIUM_FLOOR_*`), so the app and those clients agree on a file. A file without the figures gets the fallback from `SETTING_DEFS`. `calibration.mean` and `calibration.std` are never used. They describe how similar indexed passages are to each other, which is about 0.93 for a large file. No question-to-passage score reaches that level, so a cutoff built from them rejects every hit.

## Change the Assistant's Instructions

The standing instructions are short text constants near the top of the script in `index.html`. They are written for very small models, so keep them short. Use one rule per sentence, plain words, and no rule that pulls against another.

- `SYSTEM_PROMPT` is sent when the model answers from its own knowledge. Its strict brevity is deliberate. On a small model, a longer answer is mostly more room to make things up.
- `SYSTEM_PROMPT_COMPENDIUM` replaces it on a turn that carries compendium excerpts. A `COMPENDIUM_*_SUFFIX` rule follows it. Include mode tells the model to answer from the excerpts first. Lockdown mode tells it to answer only from them.
- Never send `SYSTEM_PROMPT` on a compendium turn. Its last sentence limits answers to the conversation, and a literal-minded model can read that as a reason to ignore the excerpts.
- The sentence that marks excerpts as reference data, not instructions, lives in the excerpt block header. Do not remove it.
- Router closing hints (`ROUTER_ENHANCEMENTS`) are the last thing a routed model reads, so they outweigh the system prompt on the smallest model. Do not put a quoted reply in one. Given the words "I am not sure" there, a 360M model answered every question with them.

Test a wording change on the smallest model in the dropdown and on a 1B model, with a compendium on and off, before keeping it.

## Change the Crisis Check

The crisis check decides whether a chat prompt gets the fixed 988 notice instead of a reply. Its data lives in `index.html` between the comments `Crisis check: data and pure helpers (start)` and `(end)`: the phrase patterns, the topic words that silence them, the crisis and contrast example sentences, the tiebreak hypotheses, the three thresholds, and two pure functions. The tests evaluate that block on its own, so keep it free of DOM access and of other constants from the file.

- Add a phrase to `CRISIS_TIER0_RE` when a clearly worded first-person statement gets past the check. Add a topic word to `CRISIS_TIER0_TOPIC_RE` when a research phrasing fires the patterns.
- Add example sentences to `CRISIS_EXEMPLARS` or `CRISIS_CONTRAST_EXEMPLARS` when the embedding tier gets a case wrong. A research prompt that scores close to the crisis list needs a contrast entry that is closer.
- Change the thresholds last. `CRISIS_COSINE_MIN` is the floor, `CRISIS_MARGIN_MIN` is how far the crisis score must beat the contrast score, and `CRISIS_CLEAR_MARGIN` is where the tiebreak stops being needed.
- Put every new case in `tests/fixtures/crisis-prompts.json` first, then run the model test (see Run the Tests) until every prompt lands on the right side.
- The embedding and tiebreak models are English-only. A Spanish case must be covered by the phrase patterns.
- Never put the notice text through a model, and never log the prompt.

Then confirm in a browser on the smallest model in the dropdown and on a 1B model, with the router on and off and the compendium on and off. The notice must appear for the crisis prompts and not for the research prompts.

## Add a User Setting

User settings live in `SETTING_DEFS`, which holds each setting's fixed recommended value and range. The Advanced settings dialog reads its limits from there and its reset text from `recommendedSetting()`, which may return something else for a setting whose recommendation depends on context. The match floor is the example: it follows the loaded compendium's own floor when the file has one.

- Pass every value from storage or from the dialog through `clampSetting()`. Both are untrusted input.
- Write a setting only through `setSetting()`. It records whether the value is the person's own or the recommendation. Only the person's own values are stored, so a recommendation that changes later still reaches everyone who never touched the setting. `applyRecommendedSettings()` brings the others up to date; call it when a recommendation may have changed.
- Add one `<section class="setting" data-setting="...">` to the `#settings-modal` markup. The script wires any section it finds.
- Keep the dialog short. Aim for one or two plain sentences per setting.
- Use the minus and plus buttons, not a slider. A drag on a phone can trigger the browser's own swipe gestures.
- Update `docs/user-guide.md`.

## Add Model Calls

All model calls must:

- Acquire the shared engine lock.
- Release the lock in `finally`.
- Respect Stop or stale-token behavior where applicable.
- Avoid logging PHI or raw input values.
- Use destination-aware redaction if crossing a process or network boundary where promised.
- Surface safe, actionable errors to users.

Pattern:

```javascript
await EngineLock.acquire(ownerLabel, waitSignal);
try {
    return await modelCall();
} finally {
    EngineLock.release();
}
```

## Python / Pyodide Changes

For browser-based Python workflows:

- Do not write raw stdout/stderr to notebook outputs if they may include PHI.
- Do not include dataframe `head()` output in notebooks unless explicitly reviewed.
- Prefer aggregate metadata: row counts, column counts, column names, exception type.
- Keep real data previews limited to UI where needed and review PHI risk.

## Run the Tests

The tests live under `tests/` and use Node's own test runner, so nothing is installed for the fast suite. You need Node 22 or newer.

```text
node --test tests/
```

That checks every documentation page (links, license comment, heading structure), the file header and single-script rule in `index.html`, and the crisis check's phrase tier against the prompt fixture. The model-backed test skips itself unless its dependency is installed.

To score the crisis prompt fixture with the real embedding and tiebreak models on your CPU:

```text
npm ci --prefix tests
node --test tests/crisis-models.test.mjs
```

The first run downloads about 200 MB of model files into `tests/.cache/`, which git ignores. Set `FSAI_SKIP_MODEL_TESTS=1` to skip that test even when the dependency is installed.

The GitHub Actions workflow in `.github/workflows/tests.yml` runs both on every pull request and on every push to `main`. Browser testing of the app is still manual: record the browser, the models, and the steps in the pull request.

## Security Checklist

Before merging:

- No secrets, tokens, PHI, or participant identifiers in code, docs, tests, screenshots, or examples.
- No stack traces exposed directly to end users.
- No unguarded `innerHTML` with user-controlled content.
- No untrusted SQL or shell execution.
- Attachment deletion deletes all related records where applicable.
- Network-bound model prompts are redacted where the feature promises redaction.

## Accessibility Checklist

Before merging UI changes:

- Keyboard-only operation works.
- Focus order is logical.
- Focus is visible.
- Dynamic status changes are announced where needed.
- Dialogs have labels and close behavior.
- Color is not the only state cue.
- Reduced-motion preference is respected for new animations.

## Documentation Checklist

Update docs in the same change when behavior changes:

- `README.md` for user-visible setup or requirements.
- `docs/quick-start.md` for startup flow.
- `docs/user-guide.md` for everyday use.
- `docs/field-kit.md` for skill behavior.
- `docs/data-files-and-compendiums.md` for file or retrieval behavior.
- `docs/models-and-runtime.md` for model/runtime changes.
- `docs/security-privacy-accessibility.md` for privacy or accessibility changes.

Use synthetic examples only.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan