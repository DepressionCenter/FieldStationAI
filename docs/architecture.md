<!--
This file is part of Field Station AI.
architecture.md: Documentation of the architecture of Field Station AI, in Markdown format.
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

# Field Station AI™: Architecture Overview

## Project Shape

Field Station AI™ is a single-page browser application implemented primarily in `index.html`. It has no application server in the provided code. The page loads model runtimes and helper libraries as needed, stores state in browser storage, and runs AI inference locally where supported.

Preserve the single-file distribution model unless an explicit design decision changes it.

## Main Components

High-level component map:

```text
index.html
├── HTML/CSS UI
├── Chat state and rendering
├── Model loading and generation
├── Model Gateway
├── Shared engine lock
├── Attachment storage and retrieval
├── Knowledge-base retrieval
├── Field Kit skills
├── Pyodide worker source
└── Startup and event handlers
```

## Runtime Layers

The app separates model responsibilities:

- WebLLM or another chat-oriented local runtime for main chat generation where configured.
- Transformers.js for helper models such as embeddings, classifiers, ASR, NER, or vision where used.
- Pyodide for Python-backed data workflows where used.
- Optional Ollama through a local endpoint where configured.

Do not add a cloud model path without explicit privacy and security review.

## Model Gateway

The Model Gateway design gives backend paths a common chat-shaped interface. Its purpose is to avoid duplicated generation logic and keep destination-aware redaction close to the destination decision.

Only implement the subset the app actually uses.

## Shared Engine Lock

The shared engine lock serializes calls into shared model runtimes. It should be call-scoped, not task-scoped.

Rules:

- Acquire immediately before a model call.
- Release in `finally`.
- Queue callers first-come-first-served where implemented.
- Show wait labels in chat and Field Kit.
- Let Stop abort queued waits or interrupt current model calls where supported.

This prevents chat and Field Kit from using the same runtime at the same time.

## Chat Flow

Expected chat flow:

1. User sends a message.
2. Router or intent logic may classify the request.
3. Attachment retrieval may run when relevant.
4. KB retrieval may run when active and relevant.
5. Prompt messages are built without permanently storing injected retrieval context.
6. Model generation runs through the shared gateway or runtime path.
7. Response renders and saves.

PHI warnings and system notes should not be treated as user-authored model input unless deliberately designed.

## Field Kit Flow

Expected Field Kit flow:

1. User opens Field Kit.
2. User selects a tool.
3. Tool ingests files or text into skill-local state.
4. Tool loads needed runtime or model.
5. Model calls use the shared engine lock.
6. Outputs render in the skill surface.
7. User downloads output or sends a result to chat.

Field Kit state is ephemeral unless persisted by a designed feature or sent to chat by explicit user action.

## Python Execution

Data-cleaning workflows may run Python in a browser sandbox through Pyodide.

Notebook exports should avoid raw PHI-bearing content. Prefer aggregate metadata such as row counts, column counts, column names, and exception types over raw data previews.

## Boundaries to Preserve

- Skills must not touch chat pending state.
- Chat attachments and skill input files must remain separate.
- Model calls must coordinate through the shared lock.
- Attachment deletion must delete all related stored records where applicable.
- Network-bound model prompts need destination-aware redaction where promised.
- Do not claim HIPAA compliance from architecture alone.


[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan