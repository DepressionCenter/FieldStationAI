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

# Field Station AI™: Quick Start Guide

## Purpose

This guide gets Field Station AI™ running from a local copy of the repository. It merges the existing repository quick start, the prior draft, and the additional ChatGPT 5.5 startup notes into one short path.

## Start the App

1. Download or clone the repository.
2. Open a terminal in the repository folder.
3. Start a static web server:
   ```bash
   run-linux.sh
   ```
Or:
   ```bash
   python -m http.server 8010
   ```

4. Open this URL in a current browser:

   ```text
   http://localhost:8010/
   ```

5. Select a model from the model dropdown.
6. Wait for the selected model to download and compile.
7. Type a prompt, attach a file, or open **Field Kit** for a structured workflow.

## Do Not Double-Click `index.html`

Serve the folder over HTTP. Do not open the file directly from disk.

Good:

```text
http://localhost:8000/index.html
```

Avoid:

```text
file:///Users/example/FieldStationAI/index.html
```

Using `file://` can break model downloads or create storage behavior that does not match local HTTP use.

## Use One Origin Consistently

Browser storage is scoped by origin. These are separate storage locations:

- `file://.../index.html`
- `http://localhost:8000/`
- a deployed project URL

Saved chats, attachments, cached-model flags, local settings, and browser caches may not follow you between origins.

## First Model Download

The first selected model may need network access. After download, the browser can reuse cached files when available.

If a larger model fails or runs slowly:

1. Try a smaller model.
2. Confirm WebGPU availability if the selected model requires it.
3. Use a current Chrome, Edge, or Firefox release.
4. Confirm the app is served over HTTP.

## Basic Use

Use the main chat surface for assistant-style conversation.

Use **New chat** for a separate saved conversation.

Use attachments when you want the assistant to answer from local files.

Use **Field Kit** for structured research tasks, including:

- Sorting text into categories.
- Combining or cleaning CSV/Excel files.
- Transcribing audio.
- Extracting entities.
- Finding duplicate or near-duplicate text.
- Summarizing text.

## Knowledge Base

The knowledge-base badge can switch between available modes:

- **Off**: no knowledge-base retrieval.
- **Bundled**: repository-provided knowledge-base file, if present.
- **External**: custom index loaded with `?kb=`.

Example:

```text
http://localhost:8000/index.html?kb=index.json
```

## Optional Custom Knowledge Base

Build an index from an approved source:

```bash
python build-kb-index.py --url "https://example.org/docs/" --out index.json --max-pages 500 --delay 0.5
```

Then load it with `?kb=index.json`.

Review generated index files before committing or sharing them. They may contain source text from crawled pages.

## Safe Example Data

Use synthetic test data when learning or demonstrating the app.

Do not use real participant names, MRNs, dates of birth, addresses, access tokens, study secrets, or sensitive filenames in screenshots, issues, documentation, or demo files.

## Troubleshooting

If model download fails:

1. Confirm the app is served over HTTP.
2. Confirm the browser has network access.
3. Try a smaller model.
4. Try a current Chrome, Edge, or Firefox release.
5. Check whether the selected model requires browser features not available on the current device.

If a Field Kit workflow gives unexpected results:

1. Re-check selected input columns.
2. Confirm the file has a clear header row.
3. Use a small synthetic file to reproduce the issue.
4. Avoid sharing PHI in bug reports.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan