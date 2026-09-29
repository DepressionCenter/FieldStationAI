<!--
This file is part of Field Station AI.
design-change-record.md: Summary of recent major design changes in Field Station AI, in Markdown format.
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

Not built: downloading an attachment's file from the dialog, and deleting several items at once.

### Startup Cleanup Deleted Models in Use

Work on the dialog found a defect in the startup cleanup, which removes cached files of models the app no longer offers. The cleanup knew chat models by the app's names for them, such as `webllm:SmolLM2-360M-Instruct-q4f16_1-MLC`. Their files are cached under repository names, such as `mlc-ai/SmolLM2-360M-Instruct-q4f16_1-MLC`. No name matched, so the cleanup deleted every chat model's weights on each page load, and the model downloaded again. The excerpt ranking model and the small model for browsers without WebGPU were missing from the list as well, with the same result.

The cleanup now knows every model by the name its files are cached under. A static test checks the list. In the test browser, the chat model's cache held no files after a page load before the change, and 10 files after it.

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
