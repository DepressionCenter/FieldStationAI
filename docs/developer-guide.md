<!--
This file is part of Field Station AI.
developer-guide.md: Guide for developers working on Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-07-27
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.

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
When using an AI coding assistant to help you write code, tell it to read [AGENTS.md](./AGENTS.md) first. Use the assistant to generate code, but review and edit the output carefully. Do not blindly accept generated code. Always test before submitting a pull request. Avoid sharing PHI, secrets, or participant identifiers with any code assistant.

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
- Documentation in `docs/data-files-and-knowledge-bases.md`.

Deletion must remove metadata, blob storage, vector storage, and index records where those records exist.

## Add a Knowledge-Base Source or Change Retrieval

Preserve these rules:

- Validate index shape before use.
- Do not send user prompts to the KB source URL.
- Keep query and passage embedding conventions consistent.
- Rebuild indexes after embedding convention changes.
- Retune thresholds after embedding convention changes.

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
- `docs/data-files-and-knowledge-bases.md` for file or retrieval behavior.
- `docs/models-and-runtime.md` for model/runtime changes.
- `docs/security-privacy-accessibility.md` for privacy or accessibility changes.

Use synthetic examples only.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan