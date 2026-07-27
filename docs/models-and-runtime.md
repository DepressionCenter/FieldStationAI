<!--
This file is part of Field Station AI.
models-and-runtime.md: Documentation for models and runtime behavior in Field Station AI, in Markdown format.
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

# Field Station AI™: Models and Runtime

## Runtime Sources

Field Station AI™ uses browser model runtimes and helper libraries. Runtime downloads may occur on first use. The exact pinned URLs and versions should be checked in `index.html` before release.

Known runtime/library areas documented in the current repository context:

- Transformers.js.
- WebLLM where configured for main chat models.
- Pyodide for browser-based Python workflows.
- PapaParse for CSV parsing.
- SheetJS for Excel files.
- PDF.js for PDF behavior.
- Optional Ollama for local backend generation.

## Main Chat Models

Main chat model behavior depends on the selected model and browser capabilities.

Notes:

- Larger models require larger downloads and more memory.
- WebGPU can enable faster or larger model paths where supported.
- WASM/CPU fallback paths may be slower and may not support every model.
- User-facing errors should use friendly model names where possible.

Do not silently fail when a selected model requires unavailable browser capabilities. Show a clear message.

## Helper Models

Helper model areas may include:

- Embeddings for knowledge-base and attachment retrieval.
- Router or intent classification.
- Zero-shot classification.
- Audio transcription.
- Named entity recognition.
- Vision or image-question handling.
- Deduplication or semantic comparison.

Before documenting a specific model ID as active, verify it in `index.html`.

## Embedding Conventions

Knowledge-base and attachment retrieval depend on consistent embedding conventions. Do not change query prefixes, passage prefixes, dimensions, or thresholds without rebuilding indexes and retuning retrieval behavior.

Generated indexes must match the app's expected embedding model and vector dimensions.

## Model Caching

Browsers may store downloaded model files in Cache Storage or runtime-managed caches. These caches can be evicted by browser settings, storage pressure, private-browsing rules, or enterprise policy.

Do not promise permanent offline availability. Say that cached models can often be reused when the browser preserves the cache.

## Loading Behavior

User-facing loading should distinguish:

- Downloading model files.
- Compiling or loading model runtime.
- Running generation.
- Waiting for another surface to finish a model call.

Avoid showing success before success is verified.

## Ollama

Optional Ollama support sends prompts to the configured Ollama endpoint. Treat Ollama as a separate process or network-addressable destination.

Use only Ollama endpoints approved for the data involved. Do not use remote or shared Ollama endpoints with sensitive data unless formally approved.

## Stop Behavior

Stop behavior varies by runtime and task type:

- Some generation paths can interrupt mid-generation.
- Some classifier or ASR calls may only stop between batch items.
- Queued work should be cancelable before it starts.

Document runtime-specific Stop behavior only after verifying the current code path.

## Browser Notes

- WebGPU improves speed and may enable the main model lineup.
- WASM fallback paths matter for browser diversity where supported.
- Browser speech recognition is separate from local AI models and may use browser/vendor services.
- Large models, Pyodide, audio, and vision workflows can use significant memory.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan