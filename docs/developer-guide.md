<!--
This file is part of Field Station AI.
developer-guide.md: Guide for developers working on Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-10-08
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: Developer Guide

## Purpose
The Eisenberg Family Depression Center welcomes contributions from researchers and developers who want to help improve Field Station AI™. We invite you to submit feedback, ideas for improving the app, documentation, bug reports, and feature requests via [GitHub issues](https://github.com/DepressionCenter/FieldStationAI/issues).

For developers, this guide summarizes the current architecture, design principles, and development practices.


## Code Shape

Field Station AI™ currently lives primarily in one file:

```text
index.html
```

The script is organized by visible section comments. Preserve that structure when editing. Avoid broad reformatting; unrelated churn makes the file hard to review.

## AI Coding Assistants
When using an AI coding assistant to help you write code, tell it to read [AGENTS.md](../AGENTS.md) first. Use the assistant to generate code, but review and edit the output carefully. Do not blindly accept generated code. Always test before submitting a pull request. Avoid sharing PHI, secrets, or participant identifiers with any code assistant.

## Editing Rules

Before editing:

1. Inspect existing code around the target change.
2. Preserve established naming and UI patterns.
3. Make the smallest coherent change.
4. Keep documentation synchronized.
5. Use synthetic examples.
6. Review output for PHI and secrets.

Do not claim code was tested unless it was actually executed.

## Add a Model

Recommended checklist:

1. Add the model to the UI selection path.
2. Add context-window or size metadata where the code expects it.
3. Add cache-cleanup metadata where relevant.
4. Test first load.
5. Test cached reload.
6. Test generation.
7. Test Stop.
8. Test model switching.
9. Verify behavior without WebGPU if a fallback is expected.
10. Update `docs/models-and-runtime.md`.

Do not expose raw model IDs in user-facing errors when a friendly name is available.

## Add a Field Kit Skill

Minimum checklist:

1. Add icon metadata if needed.
2. Add a skill registry entry.
3. Write a `mount...Skill(container)` function.
4. Wire the skill into enter/reset handling.
5. Register a state probe if the tool has meaningful unsaved state.
6. Use stale-token or abort behavior to invalidate stale runs.
7. Acquire the shared engine lock around every model call and release in `finally`.
8. Keep skill input state separate from chat state.
9. Provide download and/or Send to Chat behavior where useful.
10. Update `docs/field-kit.md`.

Do not let a skill write to chat history unless the user explicitly chooses Send to Chat.

## Change a Text Skill's Input Tabs

Five skills read text: Sort text into categories, Emotions and sentiment, Estimate pain level, Score against any labels, and Find names and places. Each offers three input tabs: files, a spreadsheet, and pasted text.

- `mountClassifierInputTabs()` builds all three tabs for four of the skills. Sort text into categories builds its own files and spreadsheet tabs, because its spreadsheet tab handles files with extra rows above the header.
- `mountPasteTextPane()` builds the **Paste text** pane for all five. Change the pane there, once.
- `wireSkillTabs()` connects a tab strip to its panes. It sets the tab roles a screen reader needs and handles the arrow, Home, and End keys. Use it for any new tab strip in a skill.
- The pure text helpers sit in the marked block `Skill paste input: pure helpers`: the item name, the size limit (`PASTED_TEXT_MAX_CHARS`), and the functions that clean the text and build the word count line.

Preserve these rules:

- Pasted text is untrusted input. Build the pane with `createElement` and `textContent`, never `innerHTML`.
- Keep pasted text in the pane. Do not write it to browser storage, to chat state, or to a log.
- Keep `spellcheck` off on the box. Some browsers send spell-checked text to an online service.
- The item name is the fixed `PASTED_TEXT_ITEM_NAME`. Never build a name from the pasted text.
- A skill's state probe must call `hasUnsavedInput()`, which looks at every tab. `hasInput()` looks at the open tab only and is for the run button.
- Read the open tab once when a run starts, and use that value to show the results. The person may open another tab while the run works.

## Change the Emotions Tool

Emotions and sentiment runs the text-classification pipeline with `top_k: null`, so the model returns all 28 scores for every text. The pure helpers that rank, cut, and export those scores sit in the marked block `Emotions results: pure helpers`, just above `mountEmotionsSkill`.

- The label list, the 10-feeling subset, the tone groups, the table cut (`EMOTIONS_TABLE_MIN_SCORE`), and the download column names are constants at the top of the block.
- `emotionsTableCells` decides what the table shows for one item; `emotionsExportColumns` and `emotionsExportRow` build the downloads. The downloads always rank all 28 labels and write every score. The checkbox only changes the pool the table ranks, so never pass it to an export function.
- Item names are untrusted input. `renderEmotionsResults` builds its tables with `createElement` and `textContent`; a test checks it for `innerHTML`.

## Change the Pain Estimate

Estimate pain level reads the model's raw answers instead of the zero-shot pipeline. For each statement it sends the text and the statement to `classifier.tokenizer` as a pair, runs `classifier.model`, and reads three scores: the text agrees with the statement, disagrees, or says neither. The pure helpers that turn those scores into results sit in the marked block `Pain estimate: data and pure helpers`, just above `mountPainLevelSkill`.

- The default statements, the labels, the thresholds, and the download columns are constants at the top of the block. Change wording there, and the download's `pain_scale_version` when the meaning of a column changes.
- `painSetScores` gives each intensity statement its share of the "agrees" score (the match score) and its own "agrees" probability (the support). `pickPainIntensity` and `pickPainInterference` apply the thresholds. `summarizePainItem` adds the notes.
- `painFitTextToBudget` cuts text by token count so the statement is never pushed out of the model's window. The tokenizer is passed in, so the tests can use a stand-in.
- `findStatedPainScores` is pattern matching with no model. Add a form to its list, and add the look-alikes it must reject to the tests.
- `mountPainWordingEditor` holds the editable statements. It saves through `readPainWording` and `writePainWording`, which validate on read and remove the key when the wording is the default. The key is `PAIN_WORDING_KEY`.
- The model runs with the `q4` weights on WebGPU or on the CPU. The `q4f16` variant is left out of this model's ladder in `ensureSkillZeroShot`, because on WebGPU it gave flattened, wrong scores.

Rules:

- Item names, stated score phrases, and statements are untrusted input. Build the results and the editor with `createElement` and `textContent`. A test checks both functions for `innerHTML`.
- A statement must pass `validatePainStatement`: letters first, then only letters, digits, spaces, and `, . ' - ( ) / ; :`. That keeps markup and spreadsheet formulas out of the download.
- Keep every score in the download. An analyst must be able to apply a different threshold without rerunning the tool.
- Never add a 0 to 10 number that the model inferred, and never name an instrument or a population in the interface.

To check a wording or threshold change, run the fixture with the real model:

```text
FSAI_PAIN_MODEL_TEST=1 node --test tests/pain-estimate-models.test.mjs
```

The test prints every result. Add new texts to `tests/fixtures/pain-estimate-texts.json` before you change anything, then judge the change on them. An item with `knownMiss` is reported and does not fail; remove the note when the model reaches it.

## Add Attachment Behavior

Update these areas together where they exist:

- Attachment kind detection.
- Size caps.
- MIME-to-icon display.
- Extraction or transcription logic.
- Attachment bar actions.
- Deletion cleanup.
- Retrieval behavior for text-bearing files.
- Documentation in `docs/data-files-and-compendiums.md`.

Deletion must remove metadata, blob storage, vector storage, and index records where those records exist.

## Change Compendium Loading or Retrieval

A compendium is a bundle of knowledge from many sources, built by [Extractium™](https://code.depressioncenter.org/extractium). The app reads Extractium's container format, version 4, and never builds a compendium itself. The format is defined in Extractium's `docs/container-format.md`, which ends with a checklist for readers.

Preserve these rules:

- Follow the reader checklist. Check the format name, the version, and the vector byte count before use, and load the keyword statistics into `Map` objects.
- Refuse a compendium whose `embedding.model` is not `BAAI/bge-small-en-v1.5` with 384 dimensions. The app embeds questions with the same model in its browser packaging, `Xenova/bge-small-en-v1.5`. Vectors from two models cannot be compared.
- Prefix each question with the `embedding.queryPrefix` value the file records. Never prefix a passage.
- Do not load the embedding model with 16-bit math (`q4f16` or `fp16`). Passage vectors are built at full precision, and 16-bit math on WebGPU can move a question's vector far from its true value. Check a new setting by comparing its vectors with `fp32` ones. The cosine between the two should be 0.98 or higher.
- Do not filter or branch on a section's `source_type` or `content_type`. Extractium adds values to both without a new format version.
- Treat every field in a compendium as untrusted input, and keep the size limit (`COMPENDIUM_MAX_BYTES`, applied to the container bytes whether they arrive plain or come out of gzip).
- Do not send user prompts to the compendium URL.
- Retune the fallback `compendiumCosineMin` in `SETTING_DEFS`, and the other thresholds, if the embedding model ever changes.
- Load the reranker (`COMPENDIUM_RERANK_MODEL_ID`) as a sequence-classification model and read its raw score. The text-classification pipeline turns a one-label model's score into a constant 1.
- Apply each section's `weight` in the reranker, after the sigmoid of its score. A compendium marks boilerplate with a weight below 1, and a reranker that ignored it would undo that.
- Keep `COMPENDIUM_RERANK_TOPN_INPUT` above `COMPENDIUM_TOPK`, and `COMPENDIUM_SOURCE_CAP` at 1. The reranker can only replace a poor section when it sees more sections than the prompt keeps, and a hit is a section's full text, so a second window of one section is a duplicate excerpt. The static test checks all three.

The bundled file is found by name. `BUNDLED_COMPENDIUM_URLS` lists the names tried, full file first and `.gz` before `.json`, and `fetchBundledCompendium()` uses the first one the server does not answer 404 for. Extractium writes a light file (`<slug>.json.gz`, page descriptions only) and a full file (`<slug>-full.json.gz`, every section's text). To ship the other one, change the file next to `index.html`, not the list. A `?compendium-url=` file is read the same way, and gzip is detected from the first two bytes, never from the name.

Of the file's `calibration` statistics, only the unrelated-question figures are used. `relevanceFloorOf()` turns `unrelatedMedian`, `unrelatedSpread`, and `unrelatedProbes` into the file's own match floor, with the same margin and range as Extractium's reference clients (`COMPENDIUM_FLOOR_*`), so the app and those clients agree on a file. A file without the figures gets the fallback from `SETTING_DEFS`. `calibration.mean` and `calibration.std` are never used. They describe how similar indexed passages are to each other, which is about 0.93 for a large file. No question-to-passage score reaches that level, so a cutoff built from them rejects every hit.

## Change the Assistant's Instructions

The standing instructions are short text constants near the top of the script in `index.html`. They are written for very small models, so keep them short. Use one rule per sentence, plain words, and no rule that pulls against another.

- `SYSTEM_PROMPT` is sent when the model answers from its own knowledge. Its strict brevity is deliberate. On a small model, a longer answer is mostly more room to make things up.
- `SYSTEM_PROMPT_COMPENDIUM` replaces it on a turn that carries compendium excerpts. A `COMPENDIUM_*_SUFFIX` rule follows it. Include mode tells the model to answer from the excerpts first. Lockdown mode tells it to answer only from them.
- Never send `SYSTEM_PROMPT` on a compendium turn. Its last sentence limits answers to the conversation, and a literal-minded model can read that as a reason to ignore the excerpts.
- The sentence that marks excerpts as reference data, not instructions, lives in the excerpt block header. Do not remove it. A small model sometimes types that header back before its answer; `isLeakedHeaderPrefix` holds the copy out of the bubble while it streams and `stripLeakedReferenceHeader` removes it, so keep both in step with the header's wording.
- Router closing hints (`ROUTER_ENHANCEMENTS`) are the last thing a routed model reads, so they outweigh the system prompt on the smallest model. Do not put a quoted reply in one. Given the words "I am not sure" there, a 360M model answered every question with them.
- A compendium excerpt is the section's text alone. Do not put its heading in the block. A small model copies the first line of the first excerpt, so with a heading there, SmolLM2-360M answered with the article title and nothing else, and Llama 3.2-1B opened with it. The Sources row and the citation chips carry the title.

Test a wording change on the smallest model in the dropdown and on a 1B model, with a compendium on and off, before keeping it.

## Change the Crisis Check

The crisis check decides whether a chat prompt gets the fixed 988 notice instead of a reply. Its data lives in `index.html` between the comments `Crisis check: data and pure helpers (start)` and `(end)`: the phrase patterns, the topic words that silence them, the subject words, the crisis, contrast, and everyday example sentences, the tiebreak hypotheses, the four thresholds, and the pure functions. The tests evaluate that block on its own, so keep it free of DOM access and of other constants from the file.

- Add a phrase to `CRISIS_TIER0_RE` when a clearly worded first-person statement gets past the check. Add a topic word to `CRISIS_TIER0_TOPIC_RE` when a research phrasing fires the patterns.
- `CRISIS_SUBJECT_RE` lists words that a statement about one's own death or self-harm nearly always uses, such as die, life, hurt, and myself. A prompt with none of them gets no notice, and no model runs for it. Add a word when a crisis statement gets past the check because it uses none. The list is broad on purpose, because the scores still decide. Every entry in `CRISIS_EXEMPLARS` must contain a subject word, and a test checks that.
- Add example sentences to `CRISIS_EXEMPLARS`, `CRISIS_CONTRAST_EXEMPLARS`, or `CRISIS_EVERYDAY_EXEMPLARS` when the embedding tier gets a case wrong. A research prompt that scores close to the crisis list needs a contrast entry that is closer. An ordinary prompt that gets the notice needs an everyday entry built the same way.
- The embedding model scores two sentences of the same shape as alike, whatever they are about. "I am planning a trip this week" scores about 0.8 against "I am planning to end it all this week". When you add a crisis example, add an everyday example of the same shape.
- Change the thresholds last. `CRISIS_COSINE_MIN` is the floor, `CRISIS_MARGIN_MIN` is how far the crisis score must beat the contrast score, `CRISIS_CLEAR_MARGIN` is where the tiebreak stops being needed, and `CRISIS_EVERYDAY_MARGIN_MIN` is how far the crisis score must beat the everyday score.
- Put every new case in `tests/fixtures/crisis-prompts.json` first, then run the model test (see Run the Tests) until every prompt lands on the right side. The fixture has two lists of prompts that must get a normal answer: `notCrisis` for research prompts, and `everyday` for ordinary ones.
- The model test scores the fixture twice, with the 4-bit weights the app loads first and with the full-precision weights it falls back to. The two can score the same prompt 0.04 apart. Leave at least 0.03 of room between a fixture prompt's score and a threshold.
- To measure a change, write new prompts after you make it, and score them once. A fixture that passes says little, because the lists were tuned against it.
- The embedding and tiebreak models are English-only. A Spanish case must be covered by the phrase patterns.
- `crisisTurnAction()` decides what a flagged prompt gets: the first notice with the continue line, an answer for the invited re-send, or the notice without the continue line once the chat has flagged again. `CRISIS_ANSWERED_AFTER_NOTICE` is how many flagged prompts are answered after the first notice. The chat keeps the two counters (`crisisNoticed`, `crisisFlagsAfterNotice`).
- Never put the notice text through a model, and never log the prompt.

Then confirm in a browser on the smallest model in the dropdown and on a 1B model, with the router on and off and the compendium on and off. The notice must appear for the crisis prompts and not for the research prompts.

## Change the Skill Offer

The skill offer decides whether the chat shows a button under a prompt that opens a Field Kit text skill with the prompt's text in its **Paste text** box. It is a separate check that runs beside the router. It never changes how a prompt is routed or answered.

Its data lives in `index.html` between the comments `Skill offer: data and pure helpers (start)` and `(end)`: the table of requests and skills (`SKILL_OFFER_INTENTS`), the example requests (`SKILL_OFFER_EXEMPLARS`), two thresholds, and two pure functions. The tests evaluate that block on its own, so keep it free of DOM access and of other constants from the file.

How one prompt is checked:

1. `skillRequestCandidates()` reads the prompt as a request plus the text it is about. It returns up to three readings: the request first, the request last, and the whole prompt. Only the request is scored, because a long pasted text would drown out the few words that say what to do with it.
2. `skillOfferForPrompt()` encodes the readings in one call to the shared embedding model and scores each against the router's example lists and the offer block's lists.
3. `pickSkillOffer()` offers a skill when its list scores at least `SKILL_OFFER_MIN_SCORE` and beats every other list by at least `SKILL_OFFER_MIN_MARGIN`. The first reading that earns an offer decides the skill and the text.
4. `appendSkillOffer()` shows the button, and `openSkillWithText()` opens the skill when the button is pressed. The skill takes the text through the `skillTextReceiver` it registered when it was mounted.

To change it:

- Add a line to a skill's list in `SKILL_OFFER_EXEMPLARS` when a common way of asking is missed.
- Add a line to the contrast list, `SKILL_OFFER_CONTRAST_ID`, when a prompt that is not a request gets an offer. Questions about a subject, requests for advice, and other jobs done on a text belong there.
- Change the thresholds last. Raising either one means fewer offers and fewer wrong offers.
- Put every new case in `tests/fixtures/skill-offer-prompts.json` first, then run the model test (see Run the Tests) until every prompt lands on the right side. A request the check still misses goes under `knownMisses`, which is recorded and not tested.
- To offer another skill, add it to `SKILL_OFFER_INTENTS` with an example list, and register a `skillTextReceiver` in its mount function. The skill needs a **Paste text** pane.

Preserve these rules:

- An offer comes from the words of the prompt. Never make one from an attached file alone, and never offer a skill that is not ready.
- Keep offers in memory (`skillOffersByChat`). Do not add an offer to a chat message or to browser storage. Chat messages are sent to the model as they are stored, so a new field on a message would reach the model.
- Text moves one way, from the prompt into the skill's box. Opening a skill must not write to chat history, and the skill must not run until the person starts it.
- The prompt is untrusted input. The offer shows fixed wording and the skill's name, never text from the prompt. The text reaches the page only as the value of the paste box.
- Ask before replacing text in the box or discarding another skill's work.
- Never log the prompt.

Then confirm in a browser with the router model: each kind of request gets its offer, the button opens the skill with the text and moves focus to the box, and an ordinary question gets no offer.

## Add a User Setting

User settings live in `SETTING_DEFS`, which holds each setting's fixed recommended value and range. The Advanced settings dialog reads its limits from there and its reset text from `recommendedSetting()`, which may return something else for a setting whose recommendation depends on context. The match floor is the example: it follows the loaded compendium's own floor when the file has one.

- Pass every value from storage or from the dialog through `clampSetting()`. Both are untrusted input.
- Write a setting only through `setSetting()`. It records whether the value is the person's own or the recommendation. Only the person's own values are stored, so a recommendation that changes later still reaches everyone who never touched the setting. `applyRecommendedSettings()` brings the others up to date; call it when a recommendation may have changed.
- Add one `<section class="setting" data-setting="...">` to the `#settings-modal` markup. The script wires any section it finds.
- Keep the dialog short. Aim for one or two plain sentences per setting.
- Use the minus and plus buttons, not a slider. A drag on a phone can trigger the browser's own swipe gestures.
- Update `docs/user-guide.md`.

## Add Model Calls

All model calls must:

- Acquire the shared engine lock.
- Release the lock in `finally`.
- Respect Stop or stale-token behavior where applicable.
- Avoid logging PHI or raw input values.
- Use destination-aware redaction if crossing a process or network boundary where promised.
- Surface safe, actionable errors to users.

Pattern:

```javascript
await EngineLock.acquire(ownerLabel, waitSignal);
try {
    return await modelCall();
} finally {
    EngineLock.release();
}
```

## Update a Pinned Library

Every library the app loads from a CDN is pinned to an exact version. [Models and Runtime](models-and-runtime.md#runtime-sources) lists them. A test in `tests/index-html.test.mjs` fails if any CDN address lacks an exact version, so `@latest`, `@4`, or a bare package name will not pass.

To move a library to a new version:

1. Read the release notes for every version between the current one and the new one.
2. Check the GitHub advisory database for the package, and note what you found in the pull request.
3. Change the version in `index.html`. WebLLM's address is the `WEBLLM_URL` constant, and Pyodide's is `PYODIDE_VERSION`.
4. For WebLLM, confirm that every model in `MODEL_CTX` is still in the new version's prebuilt model list. The list is in the package's `lib/index.js`, as `model_id` entries.
5. Update the table in [Models and Runtime](models-and-runtime.md#runtime-sources).
6. Run the tests, then load each changed library's paths in a browser. For WebLLM, load a cached model and a new one, and send a prompt.

## Python / Pyodide Changes

For browser-based Python workflows:

- Do not write raw stdout/stderr to notebook outputs if they may include PHI.
- Do not include dataframe `head()` output in notebooks unless explicitly reviewed.
- Prefer aggregate metadata: row counts, column counts, column names, exception type.
- Keep real data previews limited to UI where needed and review PHI risk.

## Storage Dialog

The dialog is the section `Storage dialog` in `index.html`. It has four list functions, one per group: `listStoredChats()`, `listStoredAttachments()`, `listCachedModels()`, and `listCachedCompendiums()`. Each returns rows of `{ name, details, bytes, time, deleteLabel, remove }`. `remove()` asks for confirmation, deletes, and resolves `true` when the item is gone.

Rules for changes:

- Delete through the app's existing paths: `deleteChat()`, `deleteAttachmentEverywhere()`, `purgeModelFromCache()`, and `purgeCompendiumEntry()`. Do not write a second way to delete the same thing.
- Build rows with `createElement` and `textContent`. Names are untrusted input.
- To add a group, add a `<section>` with a `data-group` value to the dialog's markup, an entry to `STORAGE_GROUPS`, and a list function to `refreshStorage()`.
- A model's files are found by the address they were downloaded from, not by the cache they are in, because the cache names belong to the model libraries and have changed between versions.
- A chat model is named `webllm:<name>` in the app, and its files are cached under the repository `mlc-ai/<name>`. `webllmRepoId()` and `modelFlagIds()` map between the two. `knownModelIds()` must name every model the app uses by the name its files are cached under. The startup cleanup deletes the files of any model that is missing from it.
- `markCached()` stores the time of the last successful load. A flag from an earlier release holds `1`, which `storageTime()` reads as no time.
- A chat's row carries `chatId` and `pinned`. That gives the row a pencil button, a pin button, and a **Delete** button that is marked `aria-disabled` while the chat is pinned.

## Rename in Place

Chat tabs, saved prompt chips, and chat rows in the Storage dialog all rename through `beginInlineRename()`. It puts a text box in place of the name. `renameChat()` and `renameTemplate()` call it with a `commit` function that stores the name and redraws.

Rules for changes:

- Give the item's name element a `data-rename-label` value and the button that starts the rename the same value in `data-rename`, such as `chat:<id>`. Focus goes back to that button when the edit ends. In the Storage dialog that button is a pencil, built with `buildRenameButton()`. On a tab or a chip it is the ⋯ menu button, built with `buildItemMenuButton()`.
- A function that redraws a container with renamable items calls `holdInlineRename()` before it clears the container and `resumeInlineRename()` after it fills it. Without the pair, a redraw in the middle of typing loses the text. `renderTabs()` and `renderChips()` show how.
- Code that moves focus to the prompt box by itself, such as at the end of a reply, calls `focusPromptWhenFree()`. It leaves focus alone while a name is being edited or a dialog is open.
- Do not use `prompt()` for a name.

## Item Menu

A chat tab and a saved prompt chip each carry one ⋯ button, built with `buildItemMenuButton()`. It opens `#item-menu`, one element at the end of the page that `openItemMenu()` fills and places next to the button each time. The entries come from a function, so they show the item's state at that moment, such as **Pin** or **Unpin**.

Rules for changes:

- Pass the entries as `{ label, action, danger?, title? }`. Keep labels to a word or two; a longer explanation goes in `title`, which the browser shows as a tooltip.
- After an entry's action, focus goes to the button's replacement if the action redrew the bar, unless the action put focus somewhere itself, as **Rename** does.
- A function that redraws a container with such buttons calls `holdItemMenu()` before it clears the container and `resumeItemMenu()` after it fills it, as `renderTabs()` and `renderChips()` do.
- `openItemMenuOnContextMenu()` makes a right-click on the tab or chip open the same menu.
- The menu closes when its row scrolls or the window changes size, because the button moves and the menu would be left floating in the old place.

## Run the Tests

The tests live under `tests/` and use Node's own test runner, so nothing is installed for the fast suite. You need Node 22 or newer.

```text
node --test "tests/*.test.mjs"
```

Keep the quotes, so that Node expands the pattern the same way in every shell. Node 22 does not accept a folder name such as `tests/` here; newer versions do.

That checks every documentation page (links, license comment, heading structure), the file header, single-script rule, exact versions on every CDN address, reranker wiring, **Paste text** tab wiring, skill offer wiring, and pain estimate wiring in `index.html`, the crisis check's phrase tier against the prompt fixture, the reply and citation text helpers, the Field Kit paste text helpers, the skill offer's helpers and lists, the pain estimate's helpers and its fixture's stated scores, the emotions tool's helpers, the CSV cell writer, and the storage dialog's helpers and wiring. The model-backed tests skip themselves unless their dependency is installed.

Pure helpers the tests need are fenced in `index.html` by a pair of comments, `### <name> (start) ###` and `### <name> (end) ###`. There are ten such blocks: the router's intent data, the skill offer's data and helpers, the crisis check's data, the citation tag helpers, the reply and citation text helpers, the Field Kit paste text helpers, the emotions tool's data and helpers, the pain estimate's data and helpers, the CSV cell writer, and the storage dialog's helpers. `tests/helpers/marked-block.mjs` evaluates a block on its own, so keep each block free of DOM access and of constants from outside it.

To score the crisis and skill offer prompt fixtures with the real embedding and tiebreak models, and the reranker with synthetic passages, on your CPU. The crisis test runs with both sets of embedding weights:

```text
npm ci --prefix tests
node --test tests/crisis-models.test.mjs tests/rerank-models.test.mjs tests/skill-offer-models.test.mjs
```

The first run downloads about 300 MB of model files into `tests/.cache/`, which git ignores. Set `FSAI_SKIP_MODEL_TESTS=1` to skip those tests even when the dependency is installed.

The pain estimate has its own model test, `tests/pain-estimate-models.test.mjs`. It is off unless `FSAI_PAIN_MODEL_TEST=1` is set, because its model is another 440 MB. See [Change the Pain Estimate](#change-the-pain-estimate).

The GitHub Actions workflow in `.github/workflows/tests.yml` runs both on every pull request and on every push to `main`. It runs only while GitHub Actions is turned on for the repository, which an organization owner controls. If a pull request shows no checks at all, Actions is off: run both commands above yourself and paste the results into the pull request. Browser testing of the app is still manual: record the browser, the models, and the steps in the pull request.

## Security Checklist

Before merging:

- No secrets, tokens, PHI, or participant identifiers in code, docs, tests, screenshots, or examples.
- No stack traces exposed directly to end users.
- No unguarded `innerHTML` with user-controlled content.
- Every CSV goes through `writeCsv` or `writeCsvStreaming`, so `quoteField` neutralizes cells a spreadsheet would run as a formula. Never write a CSV another way.
- No untrusted SQL or shell execution.
- Attachment deletion deletes all related records where applicable.
- Network-bound model prompts are redacted where the feature promises redaction.

## Accessibility Checklist

Before merging UI changes:

- Keyboard-only operation works.
- Focus order is logical.
- Focus is visible.
- Dynamic status changes are announced where needed. A skill's status line carries `aria-live="polite"`; keep it when you add one.
- Dialogs have labels and close behavior.
- Color is not the only state cue.
- Reduced-motion preference is respected for new animations.

## Documentation Checklist

Update docs in the same change when behavior changes:

- `README.md` for user-visible setup or requirements.
- `docs/quick-start.md` for startup flow.
- `docs/user-guide.md` for everyday use.
- `docs/field-kit.md` for skill behavior.
- `docs/data-files-and-compendiums.md` for file or retrieval behavior.
- `docs/models-and-runtime.md` for model/runtime changes.
- `docs/security-privacy-accessibility.md` for privacy or accessibility changes.

Use synthetic examples only.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan