<!--
This file is part of Field Station AI.
user-guide.md: Guide for users of Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-17
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: User Guide

## What Stays Local

Field Station AI™ runs in your browser. Chat text, attached files, extracted text, transcripts, and generated outputs are intended to stay in browser storage unless you intentionally use a feature that reaches outside the page.

Network activity may still occur when the app downloads model files, loads external JavaScript libraries or fonts, loads an external compendium, uses local Ollama, opens external links, or uses browser speech recognition.

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

## Use a Compendium

A compendium is a bundle of knowledge from many sources, built with [Extractium™](https://code.depressioncenter.org/extractium) and indexed so the assistant can search it. The compendium badge shows the current retrieval state:

- **Off**: no compendium retrieval.
- **Bundled**: the Depression Center Resource Library, if shipped with the app.
- **External**: your own compendium loaded with `?compendium-url=`.

Example:

```text
index.html?compendium-url=compendium.json.gz
```

Compendium retrieval uses the loaded file. It should not be described as live browsing of the source sites.

See [Data, Files, Attachments, and Compendiums](data-files-and-compendiums.md) for the other address options and the file requirements.

## Export Data

Available exports depend on context:

- Chat transcript as text where available.
- Field Kit result CSVs.
- Transcripts and summaries as text.
- CSV Combiner notebook where available.

Review exports before sharing. Exported files may contain study data unless the tool explicitly states otherwise.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan