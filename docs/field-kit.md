<!--
This file is part of Field Station AI.
field-kit.md: Guide for using Field Kit within Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-29
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
| Estimate pain level | Text/PDF files, spreadsheet rows, or pasted text | Pain intensity and interference estimates, scores the writer stated, and notes. See [Estimate Pain Level](#estimate-pain-level) |
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
- Send to Chat sends the results, not the text you pasted. Results from Find names and places do hold the names found in your text, and results from Estimate pain level hold any score phrase found in it, such as "7 out of 10".
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

## Estimate Pain Level

This tool reads text and estimates two things about pain. It does not ask anyone to pick a number, and it never invents a 0 to 10 score. Every value it gives is a model estimate from the words, not a score the person gave. The tool has not been checked against ratings from real people. Which measure suits a study is a decision for the study team.

### What It Reports

| Output | Values | What it means |
| --- | --- | --- |
| Intensity | 0 none, 1 mild, 2 moderate, 3 severe, or not stated | How strong the pain is, in the four categories many pain studies use |
| Interference | 0 does not limit activities, 1 limits activities, or not stated | Whether the pain stops the person from doing things |
| Stated score | The words as written, such as "7 out of 10" | A score the writer gave in the text, with its scale |
| Notes | Text shortened, Long text, Close call | Results to check by hand. See [Limits](#limits) |

**Not stated** means the text did not give the model enough to go on. Text with no mention of pain gets not stated for both outputs. Text that names pain but says nothing about how strong it is can also come out not stated. Interference is always not stated when intensity is.

**Match** is the share of the score that the chosen wording got against the other wordings in its set. It is not the chance that the result is right.

### How It Decides

The tool compares your text with short statements, such as "The person has mild pain." The model answers three ways for each statement: the text agrees with it, disagrees with it, or says neither.

1. Intensity: the four intensity statements are compared. The one with the largest share wins. If no statement gets an "agrees" score of at least 0.5, the result is not stated.
2. Interference: one statement, "Pain stops the person from doing things.", is compared. An "agrees" score of at least 0.5 gives limits activities. A "disagrees" score of at least 0.5 gives does not limit activities. Anything else is not stated.
3. Stated scores are found by pattern, with no model. The tool looks for forms such as "7 out of 10", "3/5", "6 on a scale of 0 to 10", and "pain level 4", in a sentence that also holds a pain word. Dates, fractions like 120/80, and counts like "9/10 visits" are left out.

Every score is written to the download, so an analyst can apply a different cut.

### The Wording

You can read and change the statements under **Wording the tool matches**. The line next to that heading says whether the wording is the default or edited.

| Set | Code | Default statement |
| --- | --- | --- |
| Intensity | 0 | The person has no pain. |
| Intensity | 1 | The person has mild pain. |
| Intensity | 2 | The person has moderate pain. |
| Intensity | 3 | The person has severe pain. |
| Interference | agrees or disagrees | Pain stops the person from doing things. |

The categories none, mild, moderate, and severe follow common practice in pain research (see the sources below). The wording of each statement is this project's own. No questionnaire text is copied.

To change a statement:

1. Open **Wording the tool matches**.
2. Type in a box. A statement must start with a letter and use only letters, numbers, spaces, and the marks , . ' - ( ) / ; : . An error shows under a box that needs a fix, and the tool will not run until it is fixed.
3. Valid edits are saved in your browser as you type. **Restore defaults** puts the default statements back and removes the saved copy.

The wording in use is written to every download, so a result can always be traced to the statements that produced it.

### Download Columns

Each download has one row per item. The spreadsheet download keeps your columns and adds these after them. If your spreadsheet already has a column with one of these names, the added column gets a number on the end, such as `pain_notes_2`.

| Column | Holds |
| --- | --- |
| `pain_intensity_level`, `pain_intensity_label` | 0 to 3 and its name, or empty and `not stated` |
| `pain_intensity_match_score` | The winning share, 0 to 1 |
| `pain_intensity_support` | The largest "agrees" score across the four statements |
| `pain_intensity_share_0` to `_3` | Each statement's share |
| `pain_intensity_agree_0` to `_3` | Each statement's "agrees" score |
| `pain_interference_level`, `pain_interference_label` | 0 or 1 and its name, or empty and `not stated` |
| `pain_interference_match_score` | The winning score, 0 to 1 |
| `pain_interference_agree`, `_disagree`, `_neither` | The three scores for the interference statement |
| `pain_stated_score_text`, `pain_stated_score_count` | Every stated score as written, joined by " \| ", and how many |
| `pain_stated_score_value`, `pain_stated_score_max` | The number and its scale, filled only when every stated score agrees |
| `pain_notes` | Text shortened, Long text, Close call, or why an item was not estimated |
| `pain_text_shortened`, `pain_text_tokens` | Whether the text was cut to fit the model, and how many tokens the model read |
| `pain_scale_version` | `2`. Version 1 was one blended score from 1 to 10 |
| `pain_model`, `pain_model_variant`, `pain_runtime` | The model, its device and weight variant, and the library version |
| `pain_intensity_wording`, `pain_interference_wording` | The statements in use |
| `pain_thresholds` | The cut points the tool applied |
| `pain_wording_edited` | `true` when the statements were not the defaults |
| `pain_run_at_utc` | When the run started, in UTC |

### Published 0 to 10 Cut Points

The tool never converts a category to a number, because published studies disagree on where the lines fall. If your study needs a 0 to 10 range for each category, choose one of these and cite it.

| Study | Mild | Moderate | Severe |
| --- | --- | --- | --- |
| Serlin and others, 1995 | 1 to 4 | 5 to 6 | 7 to 10 |
| Gerbershagen and others, 2011 | 0 to 2 | 3 to 4 | 5 to 10 |
| Boonstra and others, 2016 | 0 to 5 | 6 to 7 | 8 to 10 |

Hirschfeld and Zernikow (2013) found that the "best" cut points changed from sample to sample, and a review by Woo and others (2015) reports a wide range across 27 studies.

### Limits

- The model was tested on 41 synthetic texts, not on text from real people. See `tests/fixtures/pain-estimate-texts.json`. Three known misses are listed there.
- Text that names pain without saying how strong it is often comes out severe. Check any result whose match is low or that carries a Close call note.
- One sentence about pain inside a long text gets weaker scores. Past about 400 tokens the tool adds a Long text note, and past about 900 tokens it cuts the text and adds Text shortened. Stated scores are still read from the whole text.
- Emotional wording is read as strong pain, whatever the person could still do. Interference is judged from the interference statement alone.
- Pain in another person, or pain in the past, is scored the same as the writer's own pain today.
- The tool works in English. Other languages give a result, but they were not checked beyond two Spanish sentences.

### Sources

- Serlin RC, Mendoza TR, Nakamura Y, Edwards KR, Cleeland CS. When is cancer pain mild, moderate or severe? Pain. 1995;61(2):277-284. [doi:10.1016/0304-3959(94)00178-H](https://doi.org/10.1016/0304-3959(94)00178-H)
- Gerbershagen HJ, Rothaug J, Kalkman CJ, Meissner W. Determination of moderate-to-severe postoperative pain on the numeric rating scale. British Journal of Anaesthesia. 2011;107(4):619-626. [doi:10.1093/bja/aer195](https://doi.org/10.1093/bja/aer195)
- Boonstra AM and others. Cut-off points for mild, moderate, and severe pain on the numeric rating scale for pain in patients with chronic musculoskeletal pain. Frontiers in Psychology. 2016;7:1466. [doi:10.3389/fpsyg.2016.01466](https://doi.org/10.3389/fpsyg.2016.01466)
- Hirschfeld G, Zernikow B. Variability of "optimal" cut points for mild, moderate, and severe pain. Pain. 2013;154(1):154-159. [doi:10.1016/j.pain.2012.10.008](https://doi.org/10.1016/j.pain.2012.10.008)
- Woo A and others. Cut points for mild, moderate, and severe pain among cancer and non-cancer patients: a literature review. Annals of Palliative Medicine. 2015;4(4):176-183. [doi:10.3978/j.issn.2224-5820.2015.09.04](https://doi.org/10.3978/j.issn.2224-5820.2015.09.04)
- Amtmann D and others. Development of a PROMIS item bank to measure pain interference. Pain. 2010;150(1):173-182. [doi:10.1016/j.pain.2010.04.025](https://doi.org/10.1016/j.pain.2010.04.025). Reports that pain intensity and pain interference are related but distinct.
- Ferreira-Valente MA, Pais-Ribeiro JL, Jensen MP. Validity of four pain intensity rating scales. Pain. 2011;152(10):2399-2404. [doi:10.1016/j.pain.2011.07.005](https://doi.org/10.1016/j.pain.2011.07.005)
- International Association for the Study of Pain. [Pain assessment](https://www.iasp-pain.org/resources/toolkits/pain-management-center/chapter4/): the 0 to 10 scale runs from no pain to the worst pain imaginable.

## Safe-Use Notes

- Use synthetic examples for demonstrations.
- Do not place PHI in screenshots.
- Review downloaded files before sharing.
- Treat AI classifications as analytic aids, not clinical determinations.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan