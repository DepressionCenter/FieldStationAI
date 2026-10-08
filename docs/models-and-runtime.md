<!--
This file is part of Field Station AI.
models-and-runtime.md: Documentation for models and runtime behavior in Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-10-07
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: Models and Runtime

## Runtime Sources

Field Station AI™ uses browser model runtimes and helper libraries. Each one downloads from a public content delivery network (CDN) the first time the app needs it. Every library is pinned to an exact version, so a new release upstream cannot change the app until someone updates `index.html` on purpose.

| Library | Version | Used for |
| --- | --- | --- |
| Transformers.js | 4.2.0 | Helper models: embeddings, reranking, the router, classification, transcription, and vision |
| WebLLM | 0.2.85 | Main chat models on WebGPU |
| Pyodide | 0.26.4 | Python data-cleaning code in the browser |
| PapaParse | 5.4.1 | CSV files |
| SheetJS | 0.18.5 | Excel files |
| PDF.js | 4.7.76 | PDF files |

Ollama is optional. When you turn it on, the app talks to an Ollama server on your own computer for larger models. It is not loaded from a CDN.

The automated tests fail if any CDN address in `index.html` lacks an exact version. To change a version, follow [Update a Pinned Library](developer-guide.md#update-a-pinned-library) in the developer guide.

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

- Embeddings for compendium and attachment retrieval.
- Reranking of compendium and attachment excerpts.
- Router or intent classification.
- The crisis check, which shares the embedding model and the router's tiebreak model.
- The skill offer check, which shares the embedding model and runs when the router is on.
- Zero-shot classification.
- Audio transcription.
- Named entity recognition.
- Vision or image-question handling.
- Deduplication or semantic comparison.

Before documenting a specific model ID as active, verify it in `index.html`.

## Embedding Conventions

Compendium and attachment retrieval depend on consistent embedding conventions. The embedding model is `Xenova/bge-small-en-v1.5`, the browser packaging of `BAAI/bge-small-en-v1.5`, which is the model [Extractium™](https://code.depressioncenter.org/extractium) builds compendiums with. Do not change the model, query prefixes, passage prefixes, dimensions, or thresholds without rebuilding compendiums and retuning retrieval behavior.

The reranker is `Xenova/ms-marco-MiniLM-L-6-v2`, a cross-encoder with one output score. The app loads it as a sequence-classification model and reads that score directly. Do not load it through the text-classification pipeline: that pipeline applies a softmax to the single score, so every passage scores 1 and nothing is reranked.

Generated indexes must match the app's expected embedding model and vector dimensions.

The embedding model runs with 4-bit weights and 32-bit math (`q4`), on WebGPU when available and otherwise on WebAssembly. It never runs with 16-bit math (`q4f16` or `fp16`). Extractium builds passage vectors at full precision, so a question's vector must land very close to its full-precision value. On an Intel integrated GPU, 16-bit math moved the vectors far enough that a 0.88 match scored 0.63, and questions the library could answer found nothing. The `q4` files are a download of about 60 MB.

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

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan