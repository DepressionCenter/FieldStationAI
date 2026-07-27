<!--
This file is part of Field Station AI.
field-kit.md: Guide for using Field Kit within Field Station AI, in Markdown format.
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

# Field Station AI™: Field Kit Guide

## Purpose

Field Kit is the task-focused side of Field Station AI™. It uses local-browser model and file infrastructure where supported, but produces structured outputs such as transcripts, tables, merged files, summaries, entity lists, and classifications.

## General Behavior

- Field Kit runs in its own tab-like surface.
- Field Kit tools use skill-local state.
- Chat and Field Kit should coordinate model calls through the shared engine lock.
- Closing or resetting Field Kit can discard unsaved skill output.
- Skills do not automatically add their input files to chat.
- A skill-produced result becomes chat context only when the user explicitly sends it to chat.

## Tools

Documented Field Kit tool areas:

| Tool area | Input | Output |
| --- | --- | --- |
| Sort text into categories | Text/PDF files or spreadsheet rows; user-defined categories | Per-item or per-row category results |
| Combine spreadsheets | CSV/TSV/XLS/XLSX files or folders | Merged CSV, summary, reproducibility artifact where available |
| Transcribe audio | Audio file | Transcript with download or send-to-chat behavior where available |
| Summarize or find themes | Pasted text or text/PDF file | Summary or theme list |
| Emotions and sentiment | Text/PDF files or spreadsheet rows | Emotion or sentiment scores where implemented |
| Estimate pain level | Text/PDF files or spreadsheet rows | Estimated score output where implemented |
| Score against custom labels | Text/PDF files or spreadsheet rows; user labels | Independent label scores |
| Find names and places | Text/PDF files or spreadsheet rows | Entity list and counts where implemented |
| Find similar or duplicates | Spreadsheet column or pasted list | Similar pairs or duplicate clusters |

Some tools may be complete, gated by model availability, or still under active development depending on the branch.

## Combine Spreadsheets

The spreadsheet combiner is the most complex Field Kit workflow.

Expected workflow:

1. Load one or more CSV, TSV, XLS, or XLSX files.
2. Detect the real header row and data-start row.
3. Review the detected structure.
4. Correct header rows or column roles if needed.
5. Continue to transform or merge.
6. Download the merged output.
7. Download the reproducibility artifact where available.

The design uses deterministic heuristics first and model help only where needed. If AI-generated transform logic fails, the app should surface a clear error or use a marked fallback where implemented.

Research safety checks:

- Validate row counts before and after merge.
- Validate participant or record counts.
- Check column names, units, and timestamp formats.
- Review missing-value handling.
- Do not assume a generated merge is analysis-ready without review.

## Transcribe Audio

Use transcription only when local model behavior, device performance, and study policy are acceptable for the data involved.

After transcription, supported flows may include:

- Download transcript as text.
- Send transcript to chat.
- Summarize transcript in chat.
- Extract themes in chat.

If you close or reset the Field Kit tab before downloading or sending, working state may be lost.

## Classification Tools

Classification tools commonly support:

- Document mode: each file is an item.
- Spreadsheet mode: one selected text column is classified row by row.

Very long text may be shortened or chunked depending on the model and tool constraints. Check outputs before analysis, publication, or clinical interpretation.

## Safe-Use Notes

- Use synthetic examples for demonstrations.
- Do not place PHI in screenshots.
- Review downloaded files before sharing.
- Treat AI classifications as analytic aids, not clinical determinations.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan