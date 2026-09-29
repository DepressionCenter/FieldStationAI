<!--
This file is part of Field Station AI.
field-kit.md: Guide for using Field Kit within Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-28
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

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
- Skills do not automatically add their input files or pasted text to chat.
- Text pasted into a tool stays in that tool. It is not saved in browser storage.
- The chat can hand text to a tool, and only when you press an offer button under your message. See [Open a Tool From the Chat](#open-a-tool-from-the-chat).
- A skill-produced result becomes chat context only when the user explicitly sends it to chat.

## Tools

Documented Field Kit tool areas:

| Tool area | Input | Output |
| --- | --- | --- |
| Sort text into categories | Text/PDF files, spreadsheet rows, or pasted text; user-defined categories | Per-item or per-row category results |
| Combine spreadsheets | CSV/TSV/XLS/XLSX files or folders | Merged CSV, summary, reproducibility artifact where available |
| Transcribe audio | Audio file | Transcript with download or send-to-chat behavior where available |
| Summarize or find themes | Pasted text or text/PDF file | Summary or theme list |
| Emotions and sentiment | Text/PDF files, spreadsheet rows, or pasted text | Emotion or sentiment scores where implemented |
| Estimate pain level | Text/PDF files, spreadsheet rows, or pasted text | Estimated score output where implemented |
| Score against any labels | Text/PDF files, spreadsheet rows, or pasted text; user labels | Independent label scores |
| Find names and places | Text/PDF files, spreadsheet rows, or pasted text | Entity list and counts where implemented |
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

Five tools read text and score it: Sort text into categories, Emotions and sentiment, Estimate pain level, Score against any labels, and Find names and places. Each one gives you three ways to hand it text. Choose one with the tabs under **What to check**.

| Tab | What you give | What counts as one item |
| --- | --- | --- |
| One document at a time | Plain-text or PDF files | Each file |
| A spreadsheet of many rows | A CSV or Excel file, and the column that holds the text | Each row |
| Paste text | Text you paste or type into the box | The whole box |

Sort text into categories names its heading **What to sort**, and its first two tabs **One person's documents** and **A spreadsheet of many people**. They work the same way.

Very long text may be shortened or chunked depending on the model and tool constraints. Check outputs before analysis, publication, or clinical interpretation.

### Paste Text

Use **Paste text** when your text is in another app, or in a file type the tool cannot read. You do not need to save it as a PDF or text file first.

1. Open the tool and choose the **Paste text** tab.
2. Paste or type your text into the box. The line under the box shows the word count.
3. Press the tool's run button, such as **Find feelings now**.
4. Read the results. Your text is named "Pasted text" in the results table, in the CSV download, and in Send to Chat.

Things to know:

- The whole box is one item. To score many short texts one by one, put them in a spreadsheet column and use the spreadsheet tab.
- The box holds up to 1,000,000 characters. Text past that point is not kept, and the line under the box tells you when the limit is reached.
- Pasted text stays inside the tool. It is not saved in the browser and is not added to a chat.
- Send to Chat sends the results, not the text you pasted. Results from Find names and places do hold the names found in your text.
- The box does not check spelling. Some browsers send spell-checked text to an online service, so the app turns spell checking off for this box.
- **Clear text** empties the box. Done, Start over, and closing Field Kit also discard the text. The app asks you first.

### Open a Tool From the Chat

You can start in the chat. Ask for the job and give the text in one message, such as "Find the names and places in this text:" followed by the text. With a "+ Router" model chosen, the app shows a button under your message, such as **Open in Find names and places**.

1. Press the button. By keyboard, move to it with the Tab key and press Enter.
2. Field Kit opens the tool on its **Paste text** tab, with your text in the box and the cursor in the box. The words of your request are left out.
3. Check the text. For Sort text into categories, type your categories too.
4. Press the tool's run button.

Four tools can be opened this way: Emotions and sentiment, Find names and places, Estimate pain level, and Sort text into categories.

Things to know:

- The tool does not run by itself, and nothing is added to your chat.
- If the box already holds other text, the app asks before it replaces that text.
- If another tool holds files, text, or results, the app asks before it clears them. A tool you left with the back arrow comes back as you left it.
- A reply that is still being written keeps going while you work in the tool. The tool waits for the model if the chat is using it.

The [User Guide](user-guide.md#send-text-to-a-field-kit-tool) lists the requests that bring an offer.

### Use the Tabs by Keyboard

1. Press Tab until the open tab has focus.
2. Press the Right or Left arrow key to open the next or previous tab. Home opens the first tab and End opens the last.
3. Press Tab again to move into the open tab's controls.

Find similar or duplicates uses the same tab keys for its two tabs.

## Safe-Use Notes

- Use synthetic examples for demonstrations.
- Do not place PHI in screenshots.
- Review downloaded files before sharing.
- Treat AI classifications as analytic aids, not clinical determinations.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan