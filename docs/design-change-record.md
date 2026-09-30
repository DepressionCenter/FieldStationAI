<!--
This file is part of Field Station AI.
design-change-record.md: Summary of recent major design changes in Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-30
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

## Crisis Check

Issue #1 asked for a way to recognize a prompt that may signal a mental health emergency and point the person to help.

Decision:

- One check for every model, run before any reply is generated. It reuses the router's pieces: phrase patterns, the shared embedding model against example sentences, and the NLI tiebreak model.
- The notice is fixed text and replaces the reply for that turn. It is stored like the other system notices, never sent to the model.
- The first notice in a chat invites the person to send the message again, and the message stays in the box. That re-send is answered. A second flagged prompt after the notice is treated as a strong signal, so the notice returns without the invitation and every later flagged prompt gets it. Unflagged prompts are always answered and the chat is never locked. The smallest models do not refuse crisis content on their own, which is why screening continues after the first notice. The full method is in `security-privacy-accessibility.md`.
- No model-side instruction. A prompt rule can only produce a model-written reply or a sentinel token, and a crisis instruction primes safety-tuned models to lecture on legitimate research questions about suicide.
- The check runs before generation rather than beside it. Every model call goes through the shared engine lock, so a parallel check would queue behind the reply, and a small model streams its first tokens faster than the check finishes.

### Everyday Prompts and the Crisis Check

The first version of the check showed the notice for ordinary prompts such as "what is the capital of France", "tell me a joke", and "I am planning a trip this week". On a set of 240 everyday and research prompts, about one in four got the notice.

Three causes, found by scoring prompts with the real models:

- The embedding model scores two sentences of the same shape as alike, whatever they are about. Any two English sentences score 0.5 to 0.8, so the floor of 0.60 stops very little.
- The contrast list held research prompts only. An everyday prompt had nothing to lose to.
- The tiebreak model chooses between two hypotheses, and both are about mental health. For an everyday prompt its choice is close to a coin toss.

The model test did not catch it. It scored with full-precision weights while the app runs 4-bit weights, and its fixture held almost no everyday prompts.

Decision:

- A list of subject words gates the embedding tier. A prompt with none of them gets no notice. The list is broad, because the scores still decide.
- A third example list holds everyday prompts. The crisis score must beat it by a margin. The tiebreak model is not asked about it.
- The crisis list gained eleven less direct statements, so that the new checks cost as little recall as possible. The phrase patterns gained a few Spanish and English forms that the embedding tier read poorly.
- The model test scores the fixture with both sets of weights, and the fixture gained everyday prompts.

Considered and set aside:

- A higher floor. Crisis statements and everyday prompts score in the same range, so no floor separates them.
- The tiebreak model as the judge of every prompt. On 21 crisis statements it preferred the crisis hypothesis for 5 to 10, depending on wording.
- An everyday list without the subject words. It cleared the common cases, and left sentences that copy the shape of a crisis example.

Cost: a crisis statement that uses no subject word is no longer flagged. The measured results are in `security-privacy-accessibility.md`.

The detection data lives in a marked block in `index.html` that the tests evaluate on their own. Change thresholds and phrase lists there, and keep the prompt fixture under `tests/` in step.

## Automated Checks

The repository carries a small test suite under `tests/` and a GitHub Actions workflow. The fast suite needs nothing installed and checks the documentation, the single-file rule, and the crisis check's phrase tier. A second job installs one dependency and scores the crisis prompt fixture with the real models. Browser testing of the app itself remains manual.

## Excerpt Reranking

An updated compendium with several sources for one article showed that the reranker was not ranking. Three changes, all in `index.html`:

- The reranker is loaded as a sequence-classification model and its raw score is used. Through the text-classification pipeline, a one-label cross-encoder gets a softmax over its single score, so every passage scored 1 and the order never changed.
- The search hands the reranker ten sections, and the four with the best scores go to the model. Reranking only the four the search picked could reorder them but never replace one. Search scores a passage with its heading in front, so a short section under a heading that repeats the question, such as an author bio, ranked first and stayed there.
- One hit per section. A hit is the section's full text, so a second window of the same section put the same excerpt in the prompt twice.

The reranker multiplies each section's score by the weight the compendium gives it, so a section its builder marked as boilerplate stays demoted after reranking. The excerpt block carries each section's text without its heading: a small model copies the first line of the first excerpt, and with the heading there it answered with the article title. Three smaller changes came with these. The Sources row labels a link with the page title rather than one section's heading. Two citation tags written back to back, `[S1][S2]`, both resolve; before, the reader saw `1][2`. The check that removes a leaked excerpt-block header from a reply now tolerates changed punctuation, an inserted article, or a copy of the header's first sentence alone, and it runs while the reply streams: a header being typed back is held out of the bubble and removed when complete, where before it showed for several seconds and then vanished. A model-backed test checks the reranker's scoring, and the fast suite checks the text helpers.

## Paste Text Input

Issue #6 asked for a way to paste text into the text skills, so that text from another app or from an unsupported file type does not have to be saved as a PDF or text file first.

Decision:

- A third input tab, **Paste text**, in Sort text into categories, Emotions and sentiment, Estimate pain level, and Find names and places. Score against any labels has it too, because it takes its input tabs from the same helper as three of those skills.
- The whole box is one item and runs through the same steps as one uploaded document. It carries the fixed name "Pasted text", never a name taken from the text.
- One pane for all five skills (`mountPasteTextPane`) and one function that wires every skill tab strip (`wireSkillTabs`), so the behavior cannot drift between skills.
- Pasted text lives in the box and nowhere else. It is not written to browser storage or to chat state. Leaving the skill discards it, after the same question the app asks before it discards files.
- The box holds up to 1,000,000 characters and turns spell checking off. Some browsers send spell-checked text to an online service, and pasted research text may hold PHI.
- The tab strips became ARIA tab lists with arrow-key movement. Before, a screen reader could not tell which tab was open. This also applies to the two tabs of Find similar or duplicates.

The pure text helpers live in a marked block in `index.html` that the tests evaluate on their own.

## Skill Offer in Chat

Issue #7 asked for a way to send text from a chat prompt to a Field Kit skill that needs only text. It described the first step as a link in the chat that sends the text to the skill's own screen.

Decision:

- When a prompt asks for something a text skill does, the chat shows one line and one button under that prompt. The button opens the skill with the prompt's text in its **Paste text** box. Four skills can be opened this way: Emotions and sentiment, Find names and places, Estimate pain level, and Sort text into categories.
- The offer is a separate check, like the crisis check, and the router's intent lists were left as they were. Adding the three new requests to the router would have changed how nearby prompts are routed and answered, and there is no fixture that would have shown the damage. It would also have told the model to mention the skill, which a small model does poorly and which the button makes unnecessary.
- The reply is still generated. The check is a guess, and a wrong guess should cost the reader one line on the screen, not the answer. The offer is shown before the reply starts, so a person on a slow computer does not wait for the reply to see it.
- Only the request is scored. A prompt is read as a request plus the text it is about, with the request first, last, or around quoted text. A long pasted text would otherwise decide the score, and the few words that say what to do with it would not count.
- An offer needs a high score and a clear lead over every other list, including a contrast list of questions about the subject, requests for advice, and other jobs done on a text. One threshold was not enough, because scores from this embedding model are high for any two English sentences.
- An offer is kept in memory and is never part of a chat message. Chat messages are sent to the model as stored, so a new field on a message would reach the model. The cost is that an offer is gone after a reload.
- The skill does not run by itself. The person sees the text in the box, can correct it, and starts the run. Results reach a chat only through Send to Chat, as before.
- The app asks before it replaces text in the box or discards another skill's work.

Not built: running the skill inside the chat and showing its results there, and a button near the prompt box for choosing a skill first. Until a skill can run inside the chat, that button would do what the Field Kit button already does.

The lists, the thresholds, and the two pure functions live in a marked block in `index.html` that the tests evaluate on their own. A prompt fixture under `tests/` holds the requests that must get an offer and the prompts that must not, and a model-backed test scores it with the real embedding model. On two batches of prompts written after the lists and thresholds were set, 55 of 58 came out right: two requests got no offer, and one request to make a bulleted list was offered Find names and places.

## Storage Dialog

Issue #4 asked for one place to see and delete what the app saves in the browser. The menu now has **Manage storage**, which opens a dialog with four groups: chats, attachments, models, and compendiums.

Decision:

- The dialog lists what the browser holds, read fresh each time. It does not keep its own record of what was stored, which could drift from the truth.
- Compendiums are a fourth group. The first plan had three groups, but a saved compendium takes up space too, about 27 MB for the bundled one.
- Rows are a list, not a table. A list row wraps at narrow widths, and a four-column table does not fit 320 CSS pixels.
- Delete uses the browser's own confirmation box, as every other delete in the app does. It works by keyboard and is read by screen readers.
- Each group deletes through the path the rest of the app already uses. Attachment deletion was written for the chat on screen only, so it was widened into `deleteAttachmentEverywhere()`, which both the chat and the dialog call.
- A model's time is the time it last loaded. The browser keeps no download time for a cached file, so the app now stores the load time in the flag it already kept per model.
- With the store locked, chats and attachments are not listed. The app cannot tell which file belongs to which chat until the PIN is entered, and listing files as ownerless would invite deleting them by mistake.
- The runtime files that the model libraries share are not listed. They belong to no single model, and deleting them would slow the next load of every model.

- Each group's heading shows the total size of the group. A count of items next to the size was removed, because two numbers side by side were hard to read.
- A pinned chat cannot be deleted from the dialog. The pin button sits to the left of **Delete**, and unpinning makes **Delete** work again. The **Delete** button of a pinned chat is marked `aria-disabled` and keeps its place in the Tab order, so that a person using a keyboard or a screen reader can reach it and learn why it does nothing. The close button on a chat's tab still deletes a pinned chat after a confirmation.

Not built: downloading an attachment's file from the dialog, and deleting several items at once.

## Rename in Place

A chat or a saved prompt was renamed with a double-click, in a box the browser opened over the page. The double-click also acted as a click, which opened the chat, and the box covered the page.

Decision:

- **Rename** turns the name into a text box in the same place, with the whole name selected. Enter or leaving the box keeps the new name, and Escape keeps the old one.
- Double-click no longer renames a tab or a chip. In the Storage dialog a double-click on a chat's name still does, next to the pencil, because a click on that name does nothing else.
- Renaming does not open the chat, and it is allowed while a reply is being written.
- A redraw of the tab bar or the chip row keeps an edit in progress, with the text typed so far.
- The app no longer moves focus to the prompt box at the end of a reply while a name is being edited or a dialog is open. Before, the end of a reply would have closed the text box in the middle of typing, and it took focus out of an open dialog.
- In the Storage dialog the pencil is drawn at 75% strength. Fainter than that, it falls under 3 to 1 contrast against the white panel.

### One Menu Button per Tab and Chip

The first version of this change gave each chat tab three buttons, for rename, pin, and delete, and each saved prompt chip two. Each was 24 by 24 CSS pixels, the WCAG 2.2 minimum, so together they took about 76 pixels of every tab. Hiding them until the pointer passed over the tab was considered and rejected: the project's accessibility rules keep essential controls out from behind hover, touch screens have no hover, and a tab that grows on hover moves its neighbours.

Decision:

- Each tab and each chip has one ⋯ button. It opens a small menu with **Rename**, **Pin** or **Unpin**, and **Delete**, or **Rename** and **Delete** for a chip. A right-click on the tab or chip opens the same menu.
- The menu follows the menu button pattern: the button is labeled and says it opens a menu, focus moves to the first entry, the arrow keys move through the entries, Escape closes the menu and puts focus back on the button, and a click elsewhere closes it.
- A pinned chat shows a small pin before its name. It is a mark, not a button, so it takes about 15 pixels rather than 24.
- The ✕ was not kept next to the menu button. One extra click for a delete is a fair price, and it ends accidental presses on a small ✕ when reaching for a tab.
- Menu entries are one or two words. The explanation of what pinning does is a tooltip on the entry, not part of its label.
- A redraw of the tab bar or the chip row closes an open menu, and puts focus on the button's replacement when focus was in the menu. The app does not move focus to the prompt box at the end of a reply while the menu is open.

### Startup Cleanup Deleted Models in Use

Work on the dialog found a defect in the startup cleanup, which removes cached files of models the app no longer offers. The cleanup knew chat models by the app's names for them, such as `webllm:SmolLM2-360M-Instruct-q4f16_1-MLC`. Their files are cached under repository names, such as `mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC`. No name matched, so the cleanup deleted every chat model's weights on each page load, and the model downloaded again. The excerpt ranking model and the small model for browsers without WebGPU were missing from the list as well, with the same result.

The cleanup now knows every model by the name its files are cached under. A static test checks the list. In the test browser, the chat model's cache held no files after a page load before the change, and 10 files after it.

## Pain Intensity and Interference Reported Separately

Estimate pain level matched text against ten phrases and reported the best match as a score from 1 to 10 with a "Confidence" percentage. A review found measurement problems that hold whatever one thinks of pain scales. Some phrases described how strong the pain was and others described what it stopped the person from doing, so one number carried two things. The scale started at 1 for "no pain", where the published scale starts at 0. The ten scores always added up to 100%, so text that never mentioned pain still got a level. "Confidence" was the winning phrase's share of the score, not the chance that the level was right. The download held the level and the score only, so nothing could be traced.

Decision:

- The tool reports two things: intensity, in the four categories none, mild, moderate, and severe, and interference, as limits activities or does not limit activities. Either can be not stated. A model estimate of a 0 to 10 number was ruled out, because published cut points between the categories disagree with each other, and any number the tool inferred would rest on wording of its own.
- A score the writer states in words, such as "7 out of 10", is reported as written and separate from the estimates. It is found by pattern in the whole text.
- The tool reads the model's three raw answers per statement (agrees, disagrees, neither) instead of the zero-shot pipeline. The pipeline's single-label mode forces a winner even when nothing fits, and its multi-label mode drops the "neither" answer. Intensity is not stated when no statement gets an "agrees" score of at least 0.5. Interference uses two statements with the same cut.
- Five graded interference steps were tried first and dropped. On 16 synthetic texts the model gave "a little" and "somewhat" about the same share whatever the text said, and a text about no longer driving or dressing alone got "somewhat". One statement read three ways separated most of those texts, but read "makes walking difficult" in a clinical note as neither, and a second statement was needed for texts that call the pain awful and still say the person did everything. The final form is two statements: pain makes activities hard, and activities go on as usual. Agreement with the second decides first.
- "Confidence" became match, the winning wording's share of the score. Every raw score, the wording, the model variant, the library version, the thresholds, a scale version, and the run time are written to the download, so an analyst can apply a different cut and any result can be traced.
- Notes flag results to check by hand: text cut to fit the model, long text, and a close call between the top two intensity levels. Long text was a real finding: one sentence about pain inside 4,700 characters of other text lost its "severe" result.
- The statements are editable, saved in the browser under `fieldstation_pain_wording_v1`, validated against an allowlist that keeps markup and spreadsheet formulas out, and recorded in every download. The default wording is the project's own and copies no questionnaire text.
- The interface names no instrument and no population, and tags neither output as recommended. Which measure suits a study is for the study team.
- The `q4f16` weights were removed from this model's ladder. On WebGPU they gave flattened, wrong scores (a clear "severe" text scored 0.01 where the `q4` weights scored 4.34), and `webgpu/q4` matched `wasm/q4` and the CPU run exactly. This also affects Sort text into categories and Score against any labels, which share the model.
- A run started after **Stop** failed on every item in every classifier tool, because the abort signal stayed aborted. The shared runner now starts each run with a fresh one.

- The skill offer's example prompts for this tool no longer say "1 to 10" or "10 point scale". The offer's model test still passes on every fixture prompt, including the ones that ask for a number, so no threshold changed.

Three findings from the same review were fixed in every Field Kit tool, not only this one:

- Every CSV cell now goes through a check for spreadsheet formula injection. A cell that starts with `=` or `@`, a tab, or a carriage return, or with `+` or `-` before anything but a number or a space, gets a single quote in front. Numbers and plain dashes are untouched, so research values such as `-5` or a dash for a missing value are not changed.
- The saved-list menus of Sort text into categories and Score against any labels put a list name into markup without escaping it. They now build their entries as option elements.
- Every tool's status line was silent to a screen reader. It is now a polite live region.

Not built: extraction of pain location, qualities, and timeframe, which has its own issue. Interference by area of life (sleep, work, mood) was not separated.

## Emotions Table Ranks All 28 Feelings by Default

Emotions and sentiment showed the top three of 10 curated feelings unless a person checked "Show all 28 feelings". The model scores all 28 on every run, so the box changed nothing about the work, only which labels the table and the downloads could draw from. For a warm, formal message the model gave gratitude 96%, and the default view hid it and named joy at 0.9% as the top feeling, with annoyance and disapproval under 0.5% behind it. The Score column had no percent sign, so 0.9 read as more than it was. The downloads took the same filtered pool, so the spreadsheet download's top feeling for that message was joy, and the per-feeling download had no gratitude column at all.

Decision:

- The table ranks all 28 feelings by default. The box is now a filter, "Limit the table to the 10 feelings most relevant to mental-health research", and starts unchecked. The 10-feeling list is kept for the studies that want it.
- The downloads always rank all 28 and write one column per feeling, whatever the table shows. A viewing choice never loses data. Scores are written to four decimal places; two places had rounded most feelings to zero.
- Scores in the table carry a percent sign, and the hint says each score is the model's probability for that feeling on its own, so the scores do not add up to 100%. A feeling under 5% is left blank, and a row with none above 5% says so instead of naming a feeling at a fraction of a percent.
- The results table is built element by element, because item names come from a person's spreadsheet or file names. The table sits in a region that scrolls sideways on a narrow screen.
- The tone bars showed white text with a dark halo over a pale track, which fails the contrast check on the unfilled part. The fill is now a tint and the text is dark, on every tool that uses the bars.

## Documentation Rule

When these areas change, update this file and the relevant user or developer doc:

- Runtime behavior.
- Crisis check behavior.
- Skill offer behavior.
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
