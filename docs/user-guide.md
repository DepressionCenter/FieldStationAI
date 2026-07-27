<!--
This file is part of Field Station AI.
user-guide.md: Guide for users of Field Station AI, in Markdown format.
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

# Field Station AI™: User Guide

## What Stays Local

Field Station AI™ runs in your browser. Chat text, attached files, extracted text, transcripts, and generated outputs are intended to stay in browser storage unless you intentionally use a feature that reaches outside the page.

Network activity may still occur when the app downloads model files, loads external JavaScript libraries or fonts, loads an external knowledge-base index, uses local Ollama, opens external links, or uses browser speech recognition.

Do not treat the app as a compliance certification. If your data may contain PHI or regulated information, follow your study, IRB, institutional privacy, and Information Assurance requirements.

## Start a Chat

1. Open the app through the live demo ( [[live demo](https://code.depressioncenter.org/FieldStationAI/)](https://code.depressioncenter.org/FieldStationAI/) ), local HTTP (run-* scripts), or a deployed project URL.
2. Wait for the selected model to download and compile if needed.
3. Type a prompt.
4. Press **Enter** to send or **Shift+Enter** for a new line.
5. Use **Stop** to interrupt a response when available.

Use **New chat** for a separate conversation. Each chat should keep its own messages and attachments.

## Choose a Model

The model dropdown applies to generation. Larger models may require larger downloads, more memory, and WebGPU support. If WebGPU is unavailable or a selected model fails, use a smaller model path where available.

Do not interpret model choice as a privacy setting. Privacy depends on where the prompt and files are processed.

## Protect Saved Work

Saved chats and attachments live in browser storage for the active browser profile and origin. Use the app's PIN or locking features where available, but treat short PINs as a local deterrent, not a replacement for institutional controls, device encryption, or access management.

Recommended practice:

- Use a non-shared browser profile.
- Set a PIN before attaching sensitive files where the feature is available.
- Download important outputs promptly.
- Keep source data outside the app.
- Avoid participant identifiers in filenames.

## Attach Files

Use the paperclip button, paste, or drag/drop where supported.

Common behavior:

- Images can be stored as attachments and used for image questions where a vision model is available.
- PDFs, text files, and spreadsheets can provide extracted text or column profiles for grounded answers.
- Audio can be used by transcription workflows where supported.
- Unsupported files may be stored for download only or rejected, depending on the current code path.

Attachments belong to the active chat. Field Kit files belong to the active Field Kit tool unless the user explicitly sends a result to chat.

## Ask About Attachments

Ask normally, for example:

```text
What did this participant say about sleep?
```

For text-bearing attachments, the app may search extracted attachment text before using other context. For images, the app may rerun a vision model rather than relying on a stored caption.

## Use the Knowledge Base

The knowledge-base badge shows the current retrieval state:

- **Off**: no knowledge-base retrieval.
- **Bundled**: bundled index, if shipped with the app.
- **External**: prebuilt index loaded with `?kb=`.

Example:

```text
index.html?kb=index.json
```

Knowledge-base retrieval uses the loaded index. It should not be described as live browsing of the source site.

## Export Data

Available exports depend on context:

- Chat transcript as text where available.
- Field Kit result CSVs.
- Transcripts and summaries as text.
- CSV Combiner notebook where available.

Review exports before sharing. Exported files may contain study data unless the tool explicitly states otherwise.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan