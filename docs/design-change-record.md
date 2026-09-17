<!--
This file is part of Field Station AI.
design-change-record.md: Summary of recent major design changes in Field Station AI, in Markdown format.
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

# Field Station AI™: Design Change Record

## Purpose

This file summarizes recent major design changes. It is not the full app design document and should not replace `fieldstation-master-design.md`.

Use it when a maintainer needs to understand why recent architecture decisions exist before editing related code.

## Product Rename

The project name changed from WebbyAI to Field Station AI™. The change was made once the project focused on a local, private, in-browser AI workspace for health and behavioral researchers.

Maintenance rule:

- User-facing documentation should use Field Station AI™.
- Legacy identifiers may remain only where needed for backward compatibility.
- Rename work must avoid breaking existing installs.

## Runtime Split

The runtime design separates chat generation from other model-powered tasks.

Current direction:

- Main chat models use the chat runtime selected by the app.
- Transformers.js remains important for skills and non-chat model tasks.
- WebGPU can accelerate capable paths.
- WASM fallback matters for browser diversity where supported.

Do not silently fail when a selected model requires unavailable browser capabilities. Show a clear user-facing message.

## Model Gateway

The Model Gateway design gives local backends a common chat-shaped interface.

Purpose:

- Avoid duplicating generation logic.
- Keep redaction decisions close to destination choice.
- Support local in-browser and local backend paths without implying cloud support.

Only implement the subset the app actually uses.

## Destination-Aware Redaction

Redaction depends on where text goes.

Design rule:

- In-browser model path can use real local head rows when needed for accuracy.
- Network-addressable or separate-process model paths require redaction before sending cell values.
- Exported reproducibility artifacts should not carry PHI.

This is a privacy and accuracy decision. Do not replace it with blanket behavior without review.

## Execute-Verify Data Engine

For data-transform skills, the model may propose code, but deterministic checks decide whether the output is acceptable.

Loop:

1. Inspect structure.
2. Generate transform or merge code.
3. Run in sandbox.
4. Read actual output.
5. Validate schema and shape.
6. Retry with failure details or stop with a clear error.

Do not use the model's confidence as proof of correctness.

## Heuristic-First Structure Detection

Header and data-start detection should be deterministic first.

Expected behavior:

- Score candidate rows.
- Choose header and data-start separately.
- Use a model only for low-confidence tie-breaking.
- Reuse the shared structure-detection layer across tabular skills.

Do not reintroduce one-shot model-only header detection.

## Shared Engine Lock

The shared lock moved coordination from broad workflow state to actual model calls.

Reason:

- Chat and skills can be visible at the same time.
- Locking a whole skill run blocks too much.
- Locking each model call keeps chat and long batches more responsive.

Every acquisition must release safely.

## Surface Isolation

Field Kit state and chat state must be disjoint.

Reason:

- Skill files must not accidentally become chat context.
- Chat attachments must not be destroyed by skill reset.
- Stale outputs must not render into the wrong surface.

This is both a privacy control and a correctness control.

## Documentation Rule

When these areas change, update this file and the relevant user or developer doc:

- Runtime behavior.
- Browser requirements.
- Compendium behavior.
- Field Kit state model.
- Redaction behavior.
- Data-cleaning workflow.
- Supported inputs and outputs.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan
