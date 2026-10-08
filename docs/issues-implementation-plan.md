<!--
This file is part of Field Station AI.
docs/issues-implementation-plan.md: Ordered plan and status tracker for the open GitHub issues, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-09-22
Last Modified: 2026-10-08
Summary: The completed plan for the GitHub issues open in September 2026: the order they were worked, the branch and scope for each, and the rules every phase followed.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->

# Field Station AI

## Issues Implementation Plan

[Back to project README](../README.md)

This plan is complete. It was the working plan for the open [GitHub issues](https://github.com/DepressionCenter/FieldStationAI/issues) in September 2026. It says which issue came next, what branch it lives on, what is in and out of scope, and how we know it is done. Everything on this page is planned work, not a description of what the app does today. The other pages in this folder describe current behavior, and they get updated as each phase lands.

### How to use this page

Each phase is one issue. Work them in the order listed. Before coding a phase, write a short detailed plan for that issue and add it under the phase's heading, then update the status as the work moves. When a phase merges, mark it done, close the issue, and move on.

Status values are **Not started**, **Planning**, **In progress**, **In review**, and **Done**.

### Rules for every phase

1. Start each phase on its own branch, created from an up-to-date `main` and nothing else. Never base a phase branch on another phase branch.
2. Read [AGENTS.md](../AGENTS.md), the [project preferences](../skills/project-preferences/SKILL.md), and the [developer guide](developer-guide.md) before editing.
3. Keep `index.html` a single file with no build step and no new runtime dependency unless the phase plan states a reason and the vetting described in AGENTS.md section 7.
4. Treat every prompt, file, model output, and compendium passage as untrusted input. Nothing user-controlled reaches `innerHTML` without encoding.
5. Every new control needs a keyboard path, a visible focus state, and a label. Status changes must not rely on color alone.
6. Update the documentation pages named in the phase in the same branch. Stale documentation is a defect.
7. Run `node --test "tests/*.test.mjs"` before opening a pull request, and the model-backed test when the phase touches the crisis check (see the [developer guide](developer-guide.md)). The suite covers the documentation and the crisis check, not the app's behavior in a browser, so also test in a real browser before calling the phase done, and record the browser, the models, and the exact steps in the pull request. Say plainly what was not tested.
8. Commit only when the work is tested, then open a pull request against `main`. Commit messages and pull request text are plain English, describe what changed and why, and carry no co-author trailer, robot signature, or tool or model name.
9. Close the GitHub issue when the pull request merges, and update this page.

### Phase order

| Phase | Issue | Title | Branch | Status |
| --- | --- | --- | --- | --- |
| 1 | [#1](https://github.com/DepressionCenter/FieldStationAI/issues/1) | Crisis notice for prompts that may signal a mental health emergency | `feature/crisis-notice` | Done |
| 2 | [#6](https://github.com/DepressionCenter/FieldStationAI/issues/6) | "Paste text" input for the four text classifier skills | `feature/skill-paste-text` | Done |
| 3 | [#7](https://github.com/DepressionCenter/FieldStationAI/issues/7) | Direct chat-to-skill flow for text-only skills | `feature/chat-to-skill` | Done |
| 4 | [#4](https://github.com/DepressionCenter/FieldStationAI/issues/4) | Storage management dialog in the menu | `feature/storage-manager` | Done |
| 5 | [#2](https://github.com/DepressionCenter/FieldStationAI/issues/2) | Full Markdown support in chats | `feature/chat-markdown` | Not started (do much later) |

Issues [#3](https://github.com/DepressionCenter/FieldStationAI/issues/3), [#5](https://github.com/DepressionCenter/FieldStationAI/issues/5), and [#21](https://github.com/DepressionCenter/FieldStationAI/issues/21) stay open but are not scheduled. Issue [#12](https://github.com/DepressionCenter/FieldStationAI/issues/12) was done outside the phases. See [Issues not scheduled](#issues-not-scheduled).

### Phase 1: Crisis notice (issue #1)

**Status:** Done. Merged on 2026-09-23, and the issue is closed.

**Branch:** `feature/crisis-notice`, from `main`.

#### Why this comes first

Field Station AI carries Depression Center branding. A study participant in distress could open it and type something that signals a crisis. The app must recognize that as well as it can and point the person to help. This is a safety feature, so it outranks every other issue.

#### What the person sees

When a prompt appears to describe the writer's own current mental health crisis, the app shows a fixed notice instead of a reply. The notice is hard-coded text. It is never written or reworded by a model, so a small model cannot garble it, soften it, or add advice.

The notice text, adapted from the policy used for the Depression Center Resources agent in Microsoft Copilot, with a Spanish line and a line on how to continue:

> It sounds like you may be struggling. Call or text 988 to reach the 988 Lifeline, or use the [988 Lifeline chat](https://chat.988lifeline.org/). 988 is confidential, available 24/7, and connects people experiencing a mental health, substance use, or suicidal crisis with trained crisis counselors.
>
> Si hablas español, llama al 988 y oprime 2, o envía la palabra AYUDA al 988.
>
> To continue chatting, send your message again.

The policy the notice follows: if a prompt appears to describe a current crisis, the app does not engage clinically, assess risk, ask safety questions, or continue routine guidance. Academic, research, or general informational discussion of suicide or self-harm does not by itself indicate a current crisis.

#### Decisions

- The notice replaces the model's reply for that turn. No generation runs.
- Prompts only. Model responses are not scanned; that is a possible follow-up issue.
- The first notice in a chat invites the person to send the message again, and the message stays in the box. That re-send is answered, so a false positive costs one resend. Screening continues on every later prompt: a second flagged prompt after the notice is a strong signal, so the notice returns without the invitation, and every later flagged prompt gets it. Unflagged prompts are always answered and the chat is never locked. The method is written up for researchers in `docs/security-privacy-accessibility.md`.
- The notice is stored as a `crisis-notice` message, the same way the PHI warning is: it re-renders on reload, appears in the text export, and is never sent to the model.
- One check for every model, with no model-side instruction. A system-prompt rule can only produce a model-written reply or a sentinel token, needs the reply stream buffered and scanned, and primes safety-tuned models to lecture on legitimate research questions. The check is model-independent, covers Ollama, and is tuned against a written prompt list.
- The check runs before generation, not beside it. Every model call goes through the shared engine lock, so a parallel check would queue behind the reply, and a small model streams its first tokens faster than the check finishes. The cost is one prompt embedding when the router is off, and nothing extra when it is on, because the two share one vector.
- The phrase patterns and example sentences cover English and Spanish. The embedding and tiebreak models are English-only, so Spanish relies on the phrase patterns.

#### How it fits the code

The chat router (`routeIntent()` in `index.html`) runs a regex tier, then scores each prompt with the shared `bge-small` embedding against short exemplar lists, with an NLI tiebreak. The crisis check reuses those pieces without loading another model, as a separate check rather than one more intent:

- `promptSignalsCrisis()` runs in `handleSend()` after the user's message is saved and before any reply is generated, whether or not the router is on. Tier 0 is `crisisTier0()`, a set of first-person phrase patterns silenced by research-context words. Tier 1 embeds the prompt once through `embedRoutingText()`, which the router reuses on the same turn, and scores it against `CRISIS_EXEMPLARS` and `CRISIS_CONTRAST_EXEMPLARS` through `crisisVerdictFromScores()`. Tier 2 asks the router's NLI model only when the scores fall between the two margins.
- All detection data sits in one marked block in `index.html` that the tests evaluate on their own. The notice text constants sit next to the system prompts.
- A hit appends the notice bubble, saves the `crisis-notice` message, sets `chat.crisisNoticed`, and ends the turn. The bubble is built with `createElement` and `textContent`, links the words "988 Lifeline chat", marks the Spanish line with `lang="es"`, and is announced through a screen-reader-only live region.

#### Tests

`tests/crisis-check.test.mjs` runs the phrase tier against `tests/fixtures/crisis-prompts.json` with no model. `tests/crisis-models.test.mjs` scores the same fixture with the real embedding and tiebreak models on the CPU, so every crisis prompt must end as a crisis and every research prompt must not. Both run in the GitHub Actions workflow added in this phase, together with the documentation lint and the static checks on `index.html`.

#### Acceptance criteria

- The fixed notice appears for clearly worded crisis prompts on the smallest model in the dropdown and on a 1B model, with the router on and off.
- Academic and research prompts about suicide or self-harm do not trigger it in a written test list of at least ten such prompts.
- The notice text is a constant near the other prompt constants, never model output.
- No prompt text is logged.
- The notice is keyboard reachable, has sufficient contrast, and is announced when it appears.

#### Verification record

Automated, on 2026-09-23: `node --test tests/` passed (121 tests, the model test skipped), and `node --test tests/crisis-models.test.mjs` passed all 33 fixture prompts with the real models on the CPU.

Browser, on 2026-09-23, headless Microsoft Edge 151 with WebGPU, served from `python -m http.server 8010`, driven over the DevTools protocol: every fixture prompt was sent in a fresh chat with SmolLM2-360M + Router and the bundled compendium (17 crisis prompts showed the notice and no reply, 16 research prompts got a normal reply). A twelve-prompt subset was repeated with Llama 3.2-1B (router off) with the compendium on and off, and with SmolLM2-360M + Router with the compendium off, with the same result every time. A phrase-tier hit shows the notice about 110 ms after Send; an embedding-tier hit took 2.2 s the first time (the tiebreak model loading) and 110 to 220 ms after that. A second crisis prompt in the same chat got a normal reply. The notice re-rendered after reload, appeared in brackets in the text export, was never sent to the model, and no console errors were logged. The 988 chat link took keyboard focus with a visible outline and opens in a new tab; the Spanish line carries `lang="es"`; the notice text is Michigan Blue and dark ink on white, above 5:1 contrast. Not tested: Ollama, Stop or New Chat during the check itself, and a real screen reader.

Correction, on 2026-09-29, branch `fix/crisis-check-false-positive`: the check showed the notice for about one in four everyday prompts, such as "what is the capital of France" and "tell me a joke". The embedding tier now reads a prompt only when it uses a subject word, and the crisis score must also beat a list of everyday examples. The decision is in `design-change-record.md`, and the measured results are in `security-privacy-accessibility.md`. `node --test tests/` passed 609 tests, with the crisis fixture scored on both sets of embedding weights. In headless Microsoft Edge 151 with WebGPU and SmolLM2-360M + Router, 22 everyday and research prompts got a normal reply and 10 crisis prompts got the notice, each in a fresh chat, with no console errors. With Qwen3-0.6B, which has no router, 10 everyday prompts got a normal reply and 6 crisis prompts got the notice.

Escalation, same setup with SmolLM2-360M + Router: the first flagged prompt showed the notice with the continue line and left the message in the box; the re-send was answered; a later flagged prompt showed the notice without the continue line and no reply; an ordinary prompt after that was answered; another flagged prompt got the notice again. After reload the chat showed three notices with the continue line only on the first. No console errors.

#### Documentation updated

`docs/user-guide.md`, `docs/security-privacy-accessibility.md`, `docs/design-change-record.md`, `docs/developer-guide.md`, `docs/architecture.md`, `docs/models-and-runtime.md`, and the project preferences skill.

### Phase 2: Paste text input for classifier skills (issue #6)

**Status:** Done. Merged on 2026-09-28, and the issue is closed.

**Branch:** `feature/skill-paste-text`, from `main`.

#### Scope

Add a "Paste text" option to Emotions and Sentiment, Sort text into categories, Find names and places, and Estimate pain level. People often have text in another app or in a file type the skill cannot read, and pasting is easier than converting to PDF or TXT first.

#### How it fits the code

Three of the four skills build their input area with one shared helper, `mountClassifierInputTabs()`: Emotions and sentiment, Estimate pain level, and Find names and places. Score against any labels uses the same helper, so it gets the tab too. Sort text into categories builds its own tabs inside `mountTaxonomySkill()`, because its spreadsheet tab reads files with extra rows above the header.

The change adds three pieces to `index.html` and uses them in both places:

- `mountPasteTextPane()` builds the pane: a labeled box, a word count line, and a **Clear text** button.
- `wireSkillTabs()` connects a tab strip to its panes. It replaces three copies of the same click handler, one of them in Find similar or duplicates.
- A marked block, `Skill paste input: pure helpers`, holds the item name, the size limit, and the functions that clean the text and build the count line. The tests evaluate it on its own.

#### Decisions

- The whole box is one item, named "Pasted text". The name is fixed and never taken from the text.
- Pasted text lives in the box only. It is not written to browser storage or to chat state.
- The box holds up to 1,000,000 characters. The limit is set on the box and checked again when the text is read.
- Spell checking is off for the box. Some browsers send spell-checked text to an online service, and pasted research text may hold PHI.
- The state probe looks at every tab, so pasted text counts as unsaved input even when another tab is open. The run button looks at the open tab only.
- A run remembers the tab it started from. Opening another tab while the run works no longer changes how the results are shown.
- The tab strips are ARIA tab lists with arrow-key movement, so a screen reader announces which tab is open.
- The questions the app asks before it discards skill input now name text as well as files.

#### Tests

`tests/skill-paste.test.mjs` runs the marked block with no browser: normal text, blank text, values that are not text, the size limit, line endings, and text that holds markup. `tests/index-html.test.mjs` checks that each text skill offers the tab, that each state probe counts pasted text, and that the pane does not use `innerHTML`, browser storage, chat, or the network.

#### Acceptance criteria

- Each of the four skills shows a "Paste text" tab. Pasted text runs through the same pipeline as a single uploaded document.
- The state probe treats non-empty pasted text as unsaved input.
- The tab, textarea, and buttons work by keyboard and have labels.
- Pasted text stays in skill state and never touches chat state.

#### Verification record

Automated, on 2026-09-28: `node --test tests/` passed (194 tests, the two model tests included).

Browser, on 2026-09-28, headless Microsoft Edge 151 with WebGPU, served from `python -m http.server 8010`, driven over the DevTools protocol, with SmolLM2-360M + Router as the chat model. All sample text was synthetic.

- In each of the five skills, the tab strip had three tabs and the right roles. The arrow, Home, and End keys moved between tabs, Tab moved from the open tab into the box and on to **Clear text**, and each focused control showed a 2-pixel outline. The box had a label and a word count line. **Clear text** was 86 by 32 CSS pixels.
- A run with an empty box showed "Paste or type some text above." and started nothing.
- Each skill ran its model on pasted text and finished: Emotions and sentiment, Estimate pain level, Find names and places, Score against any labels, and Sort text into categories. The results named the item "Pasted text" and offered the single-document download.
- The pasted text held an `<img>` tag with an error handler and a `<script>` tag. Neither ran, and no such element reached the page.
- Done and Start over asked before discarding pasted text, also with another tab open. Done asked nothing when the skill held no input. Back kept the text, the open tab, and the results.
- A marker string in the pasted text never appeared in `localStorage`, `sessionStorage`, the chat prompt box, or the chat store, before or after a run. Send to Chat put the results in the prompt box without the pasted text.
- The files tab and the spreadsheet tab still worked in Emotions and sentiment, with one text file and a two-row CSV.
- At 320 and at 640 CSS pixels wide, nothing scrolled sideways. At 320 the three tabs wrap onto three lines.
- An axe-core 4.10.2 scan of the input section in two skills, with WCAG 2.0, 2.1, and 2.2 A and AA rules, found no violations. It asked for a manual contrast check of the box. The box's text is dark ink (`#17263B`) on white, about 15:1.
- No console errors were logged.

Not tested: a real screen reader, a real clipboard paste (the text was entered through the browser's text input path), a phone or touch screen, Firefox or Safari, and a run on a browser without WebGPU.

#### Documentation updated

`docs/field-kit.md`, `docs/developer-guide.md`, `docs/design-change-record.md`, `docs/security-privacy-accessibility.md`, `docs/data-files-and-compendiums.md`, and the project preferences skill.

### Phase 3: Chat-to-skill flow for text-only skills (issue #7)

**Status:** Done. Merged on 2026-09-29. Issue #7 stays open for the two parts that were not built: running a skill inside the chat, and a skills button near the prompt box.

**Branch:** `feature/chat-to-skill`, from `main`.

#### Scope

Let a person send text from the chat prompt straight into one of the text-only skills. The issue describes two flows. Flow 1: the person pastes text and asks for sentiment, emotions, names, or pain level; the router recognizes the request and offers the skill. Flow 2: a small skills button near the prompt lets the person pick a skill first, then paste or upload.

This phase builds the first step of flow 1, which the issue calls the proof of concept: a button in the chat that sends the text to the skill's own screen. It depends on phase 2, because the skill needs a paste pane to receive the text.

Two parts of the issue are left for a later phase. The first is running the skill without opening its screen and showing the results in the chat. The second is flow 2. Until a skill can run inside the chat, a skills button near the prompt would do what the Field Kit button already does.

#### What the person sees

1. The person sends a message such as "Analyze this text for sentiment:" followed by the text.
2. Under the message, the chat shows "Field Kit has a tool for this." and a button, such as **Open in Emotions and sentiment**. The assistant still answers.
3. The button opens the skill on its **Paste text** tab, with the text in the box and the cursor in the box. The words of the request are left out.
4. The person checks the text and starts the run.

Four skills can be opened this way: Emotions and sentiment, Find names and places, Estimate pain level, and Sort text into categories.

#### How it fits the code

The router already had hint-only pseudo-intents (`HINT_INTENTS`, `SKILL_HINT_TABLE`) that tell the model it may mention a skill. The first plan for this phase was to add three more. The phase took another route, for the reasons under Decisions, and left the router's lists as they were.

The change adds these pieces to `index.html`:

- A marked block, `Skill offer: data and pure helpers`, holds the table of requests and skills, the example requests, a contrast list, two thresholds, and two pure functions. `skillRequestCandidates()` reads a prompt as a request plus the text it is about. `pickSkillOffer()` turns one scored request into a skill or into no offer.
- `skillOfferForPrompt()` runs in `handleSend()` after the crisis check and the router, with the router on. It encodes the readings of the prompt in one call to the shared embedding model and scores them against the router's example lists and the block's own.
- `appendSkillOffer()` shows the line and the button. `openSkillWithText()` opens the skill, and the skill takes the text through the `skillTextReceiver` it registered when it was mounted.
- The router's intent data got a pair of markers, `Router intents: data`, so that the tests can read its example lists. The data itself did not change.

#### Decisions

- The offer is a separate check, like the crisis check. Adding requests to the router would have changed how nearby prompts are routed and answered, with no fixture to show the damage. It would also have told the model to mention the skill, which the button makes unnecessary.
- The reply is still generated, and the offer is shown before the reply starts. A wrong guess costs one line on the screen.
- Only the request is scored, never the pasted text. The request may come first, last, or around quoted text.
- An offer needs a high score and a clear lead over every other list, including a contrast list of prompts that look like requests and are not.
- Offers are kept in memory and are gone after a reload. They are never part of a chat message, because chat messages are sent to the model as stored.
- The skill does not run by itself. The person sees the text first and can correct it.
- The app asks before it replaces text in the box or discards another skill's work.
- Offers appear with the router on only, which is the default model.

#### Tests

`tests/skill-offer.test.mjs` runs the marked block with no model and no browser: every shape of prompt, blank and invalid input, the length limits, text that holds markup, list ids that must never open a skill, both thresholds, and the soundness of the lists and the fixture. `tests/skill-offer-models.test.mjs` scores `tests/fixtures/skill-offer-prompts.json` with the real embedding model on the CPU: 75 requests that must get an offer for the right skill, and 96 prompts that must get none. `tests/index-html.test.mjs` checks that the offer is built without `innerHTML`, shows none of the prompt, writes nothing to chat history or storage, reads the prompt only, and runs with the router on. The model-backed test runs in the GitHub Actions workflow with the other two.

#### Acceptance criteria

- For a prompt like "analyze this text for sentiment: ...", the chat offers the matching skill, and choosing it opens the skill with the text already in the paste pane.
- The hint never fires from file presence alone, and never for a skill that is not ready.
- Nothing is written to chat history unless the person chooses Send to Chat.
- Flow 2, if included, works by keyboard and has a labeled button. Flow 2 is not included.

#### Verification record

Automated, on 2026-09-28: `node --test tests/` passed, the three model tests included. The lists and thresholds were set against the fixture. To see how they do on prompts they were not set against, two batches were written afterwards and scored once: 55 of 58 prompts came out right. Two requests got no offer, and one request to make a bulleted list was offered Find names and places. That last prompt was then added to the contrast list. The two misses are kept in the fixture under `knownMisses`.

Browser, on 2026-09-28, headless Microsoft Edge 151 with WebGPU, served from `python -m http.server 8010`, driven over the DevTools protocol, with SmolLM2-360M + Router as the chat model. All sample text was synthetic.

- A request for each of the four skills got its offer, under the prompt and ahead of the reply. The offer showed the fixed line and the skill's name, and nothing from the prompt. The button was 32 CSS pixels tall.
- The button took keyboard focus with a 2-pixel outline, and Enter opened the skill on its **Paste text** tab with the text in the box, the request left out, and focus in the box. The offer was written to a polite live region.
- Pressed while the reply was still being written, the button opened the skill, and the reply was finished and saved.
- The text held an `<img>` tag with an error handler and a `<script>` tag. Neither ran, and no such element reached the page.
- Opening a skill added no message to the chat and changed nothing in the chat store. Chat messages carried their usual fields only. Emotions and sentiment, Find names and places, and Estimate pain level then ran their models on the text. Sort text into categories was opened with its text and not run.
- After a switch to Field Kit and back, the offer was still under its prompt. A second request in the same chat got its own offer.
- With other text in the box, the app asked before replacing it, and No kept the old text. With another skill holding results, the app asked before leaving it, and No stayed in the chat. A skill left with the back arrow came back as it was.
- Five prompts that are not requests got no offer. A question about an attached file got no offer.
- With Qwen3-0.6B, which has no router, a request got a reply and no offer.
- After a reload the chat was intact and the offers were gone. Sending a request again brought the offer back.
- At 320 and at 640 CSS pixels wide the offers fit inside the chat box, and at 320 the button wraps under the line. At 320 the chat box did scroll sideways by 13 pixels. The cause was a long link in the Sources row of a reply, which does the same with no offer on the page. This was fixed afterwards on the branch `fix/sources-row-overflow`: an item in the Sources row now breaks onto the next line, and the row grows taller.
- An axe-core 4.10.2 scan of the chat box with an offer in it, and of the skill after the offer opened it, with WCAG 2.0, 2.1, and 2.2 A and AA rules, found no violations. It asked for a manual contrast check of the offer's line, which is `#5C6B7F` on white, 5.4 to 1.
- The check took about 30 ms for a prompt with one reading and about 170 ms for a prompt with three, after about 580 ms the first time in a session.
- No console errors were logged. The chats the checks created were deleted afterwards.

Not tested: a real screen reader, a phone or touch screen, Firefox or Safari, a browser without WebGPU, Ollama, and Stop pressed during the check itself.

Found while testing and not changed in this phase: with the app's 4-bit embedding weights, the prompt "what is the capital of France" gets the crisis notice. The crisis model test does not catch it, because it scores with full-precision weights. This was fixed afterwards on the branch `fix/crisis-check-false-positive`. See the correction under phase 1.

#### Documentation updated

`docs/user-guide.md`, `docs/field-kit.md`, `docs/developer-guide.md`, `docs/design-change-record.md`, `docs/security-privacy-accessibility.md`, `docs/architecture.md`, `docs/models-and-runtime.md`, and the project preferences skill.

### Phase 4: Storage management dialog (issue #4)

**Status:** Done. Merged on 2026-09-29, and the issue is closed.

**Branch:** `feature/storage-manager`, from `main`.

#### Scope

Add a storage management dialog to the menu. It lists attachments, cached models, and chats, with creation or modification time, size on disk, and a delete option for each.

Saved compendiums were added as a fourth group when the phase started, because they take up space too.

#### How it fits the code

The pieces exist in separate places. Attachments live in IndexedDB (`ATTACHMENT_DB_NAME`) with an index and vectors alongside, and `deleteAttachment()` already removes the related records. Chats are stored in browser storage through the existing chat store, and `deleteChat()` exists. Model weights sit in Cache Storage, and `purgeModelFromCache()` removes one model. The compendium has its own cache (`COMPENDIUM_CACHE_NAME`). `navigator.storage.estimate()` is already called for the overall usage figure. The dialog ties these together in one place and must reuse the existing delete paths, so nothing is left behind.

#### What was built

- **Manage storage** in the menu opens the dialog. The top line shows the space in use and the space the browser allows.
- Four groups: Chats, Attachments, Models, and Compendiums. Each row shows a name, a time, a size, and a **Delete** button. Each group's heading shows the group's total size.
- A chat's row has a pencil button that renames the chat in place, and a pin button. A pinned chat cannot be deleted until it is unpinned.
- Chat tabs and saved prompt chips in the main screen each carry one ⋯ button that opens a menu with **Rename**, **Pin** or **Unpin**, and **Delete**. Rename works in place, the same way. The double-click, the browser's box, and the separate pin and delete buttons are gone.
- The pure helpers live in a marked block, `Storage dialog: pure helpers`. The list functions, the rows, and the dialog's open and close code follow it.
- `deleteAttachmentEverywhere()` deletes an attachment of any chat. `deleteAttachmentChip()`, which the chat uses, now calls it.
- `AttachmentStore` gained `blobBytes()` and `vectorBytes()`, which read the size of a stored record without decrypting it.
- `markCached()` now stores the time of the load.

#### Decisions

- The lists are read from the browser each time, not kept by the app.
- Delete uses the browser's confirmation box, as the rest of the app does.
- With the store locked, chats and attachments are not listed.
- The runtime files that the model libraries share are not listed.

The reasons are in the [Design Change Record](design-change-record.md#storage-dialog).

#### Defect found and fixed in this phase

The startup cleanup deleted the weights of every chat model on each page load, so the model downloaded again each time. It knew chat models by the app's names, and their files are cached under repository names. Two helper models were missing from its list too. The cleanup now knows every model by the name its files are cached under. See the [Design Change Record](design-change-record.md#startup-cleanup-deleted-models-in-use).

#### Tests

`tests/index-html.test.mjs` also checks that a group's heading shows the size alone, that a pinned chat's **Delete** is refused before anything is deleted, that names are edited in a text box with a size limit and no browser dialog, and that renaming a chat does not open it or wait for a reply.

`tests/storage-dialog.test.mjs` runs the marked block with no browser: sizes, the usage sentence, stored times, model names, hosts that only look like the model host, and the grouping of cached files, with empty and invalid input. `tests/index-html.test.mjs` checks that rows are built without `innerHTML`, that the dialog is a labeled modal, that each group deletes through the app's own path and asks first, that a compendium's address is shown without its query, and that the startup cleanup keeps every model the app uses.

#### Acceptance criteria

- The dialog shows the groups with timestamps and sizes, and the overall usage and quota.
- Deleting an item removes every related record, and the list refreshes.
- Delete asks for confirmation, and the confirmation is keyboard operable.
- Names of attachments are shown as text, never as HTML.
- The dialog follows the existing modal pattern, with a label, focus trap, and close behavior.

#### Verification record

Automated, on 2026-09-29: `node --test tests/` passed, the three model tests included.

Browser, on 2026-09-29, headless Microsoft Edge 151 with WebGPU, served from `python -m http.server 8010`, driven over the DevTools protocol, with SmolLM2-360M + Router as the chat model. All names and text were synthetic.

- The dialog opened from the menu with focus on the dialog. It showed the space in use, and all four groups with a time and a size on every row. The test profile held 123 chats, and the dialog scrolled.
- A chat name and a file name that held an `<img>` tag with an error handler were shown as text. No element from a name reached the page, and no handler ran.
- Tab went from the last button to the first, and Shift+Tab from the first to the last. A **Delete** button showed a 2-pixel focus ring and was 32 CSS pixels tall. Escape and the **Close** button closed the dialog, and focus went back to the menu button.
- Delete asked first. Answering No deleted nothing.
- Deleting an attachment of a chat that was not on screen removed the stored file, its line in the index, and its entry in the chat. The chat kept a note of the deletion. Focus moved to the next row.
- Deleting a chat with two attachments removed the chat, both stored files, and both lines in the index.
- Deleting a Field Kit model removed its cached files and both of its flags. Deleting the chat model removed its weights, its compiled library, and its flag. After a reload the chat model downloaded again and was listed with a new time.
- Deleting the saved compendium emptied its cache, the group said **No saved compendiums.**, and focus moved to the group's heading. After a reload the compendium was saved again.
- After the next reload, the chat model's files were still in the cache.
- While a reply was being written, **Delete** showed no confirmation, the dialog said to wait, and nothing was deleted.
- With a PIN set and not entered, the dialog listed no chats, no attachments, and no file name, and it listed the models. With the PIN entered, the chats and the attachment were listed. The PIN was then removed.
- At 320, 640, and 1280 CSS pixels wide, nothing in the dialog reached past its edge, and the page did not scroll sideways. The result line stayed at the bottom edge of the dialog. In 40 presses of Tab at 320 pixels, no focused button was under it.
- An axe-core 4.10.2 scan of the open dialog, with WCAG 2.0, 2.1, and 2.2 A and AA rules, found no violations. It asked for a manual contrast check of the **Close** button, the title, the intro, and the usage line. Measured contrast on white was 15.3 to 1 for names, the title, and the usage line, 9.3 to 1 for the **Delete** button's text and border, and 5.4 to 1 for the intro and the details line. The **Close** button has the same colors as the one in Advanced settings. Every **Delete** button is described by the details of its own row.
- No console errors were logged. The chats the checks created were deleted afterwards.

Browser, second round on 2026-09-29, same setup, after the rename and pin changes:

- A tab had three buttons, each 24 by 24 CSS pixels, and the tab was 28 pixels tall. A double-click on a tab or a chip did nothing.
- The pencil on a tab opened a text box with the whole name selected. No browser box opened, and the chat on screen did not change. Enter stored the name, cut to 40 characters, and focus went back to the pencil. Escape and an empty name kept the old name. Leaving the box stored the name and left focus where it was moved.
- A name that held an `<img>` tag with an error handler was shown as text in the tab, and the handler did not run.
- A chat was renamed while another chat's reply was being written. The reply was written in full. When it ended, the text box was still open with its text, and focus had not moved.
- The pencil on a saved prompt chip worked the same way. The text box held the name without the bookmark sign.
- In the Storage dialog, each group's heading showed the size alone. A double-click on a chat's name and the pencil both opened the text box. Escape in the box kept the dialog open. After Enter, the row, its **Delete** label, and the tab in the main screen showed the new name.
- The pin button was 32 by 32 pixels and sat to the left of **Delete**. Not pinned, it was gray with a dashed border and **Delete** worked. Pinned, it was in color with a solid border, **Delete** was gray with a dashed border, and pressing it asked nothing, deleted nothing, and said to unpin first. The tab showed the pin too. A sixth pin was refused with the reason. After unpinning, the chat was deleted after a confirmation.
- At 320 CSS pixels wide, with a text box open, nothing scrolled sideways in the dialog or in the page.
- axe-core 4.10.2 scans of the dialog with a pinned row and an open text box, of the tab bar, and of the chip row found no violations. They asked for manual contrast checks of the pencil and close buttons.
- No console errors were logged. The chats and the saved prompt the checks created were deleted afterwards, and the pins were left as they were.

Browser, third round on 2026-09-29, same setup, after the three buttons on a tab became one menu button:

- A tab had one labeled 24 by 24 pixel button that says it opens a menu. Enter opened the menu with focus on **Rename**, without switching chats. The menu had **Rename**, **Pin**, and **Delete**. The arrow keys, Home, and End moved through the entries and wrapped. Escape closed the menu and put focus back on the button.
- **Rename** opened the text box with the name selected, and focus returned to the button afterwards. **Pin** pinned the chat, a small labeled pin mark 15 pixels wide appeared before the name, and focus was on the button's replacement. The menu then offered **Unpin**, which removed the pin and the mark.
- A click opened the menu and a second click closed it. A right-click on the tab opened the menu without switching chats. A click elsewhere and a scroll of the tab bar closed it.
- With the menu open while a reply was being written, the reply ended with the menu still open and focus still inside it.
- A saved prompt chip had one labeled button with **Rename** and **Delete**. Rename stored the name. Delete asked first; No kept the prompt, and Yes removed it, with focus not lost.
- **Delete** on a chat's menu deleted the chat after a confirmation, with focus not lost.
- At 320 CSS pixels wide the open menu stayed inside the window, and the page did not scroll sideways.
- axe-core 4.10.2 scans of the tab bar, the chip row, and the open menu found no violations. The earlier checks of the Storage dialog and of renaming were run again and passed.

Not tested: a real screen reader, a phone or touch screen, Firefox or Safari, 200% browser zoom, renaming with a PIN set, an external compendium loaded with `?compendium-url=`, an attachment with search vectors, a file with no chat, a model delete while another model loads, and a browser that does not report a storage estimate.

Found while testing and not changed in this phase: the test browser profile held 121 chats left by checks in earlier phases. They are in the test profile only.

#### Documentation updated

`docs/user-guide.md`, `docs/data-files-and-compendiums.md`, `docs/security-privacy-accessibility.md`, `docs/developer-guide.md`, `docs/design-change-record.md`, and the project preferences skill.

### Phase 5: Markdown in chats (issue #2)

**Status:** Not started. Scheduled much later than the other phases.

**Branch:** `feature/chat-markdown`, from `main`.

#### Scope

Render Markdown in chat replies and let the person download a chat as Markdown, not only as plain text. Leave a rendering function that future skills can reuse.

#### Notes for the phase plan

Model output is untrusted, so rendered Markdown must be encoded before it reaches the page. Raw HTML inside the Markdown must be escaped, never rendered. Links need `rel="noopener"` and a safe scheme check. The single-file rule and the pinned-CDN policy both apply, so the phase plan must choose between a small renderer written in `index.html` and a pinned, vetted library, and state the reason.

#### Documentation to update

`docs/user-guide.md` and `docs/security-privacy-accessibility.md`.

### Issues not scheduled

- [#3](https://github.com/DepressionCenter/FieldStationAI/issues/3), zip and progressive XML ingestion, is groundwork for a wearable-data skill that does not exist yet. It stays open until that skill is planned.
- [#5](https://github.com/DepressionCenter/FieldStationAI/issues/5), service worker and cache bucket, changes the deployment story and adds a network allowlist. It needs an explicit design decision first, recorded in `docs/design-change-record.md`.
- [#12](https://github.com/DepressionCenter/FieldStationAI/issues/12), pinning the WebLLM import, was done on its own branch, `fix/pin-webllm-version`, with a release-note and advisory check. See [WebLLM Pinned to an Exact Version](design-change-record.md#webllm-pinned-to-an-exact-version).
- [#21](https://github.com/DepressionCenter/FieldStationAI/issues/21), extracting pain location, qualities, and timeframe from text, follows the rework of Estimate pain level on `feature/pain-intensity-interference`. It needs a decision on whether it is a new skill or a mode of the existing one, and on which model extracts the wording. See [Estimate Pain Level](field-kit.md#estimate-pain-level) for what exists today.

### Conclusion

This plan is complete. Phases 1 through 4 are done and their issues are closed, except for the parts of issue #7 described under phase 3. Phase 5 stays deferred, and issue #2 stays open until it is scheduled.

### Additional resources

- [Open issues on GitHub](https://github.com/DepressionCenter/FieldStationAI/issues)
- [Project instructions](../AGENTS.md)
- [Project preferences](../skills/project-preferences/SKILL.md)
- [Developer Guide](developer-guide.md)
- [Architecture Overview](architecture.md)
- [Design Change Record](design-change-record.md)
- [Field Kit Guide](field-kit.md)
- [Security, Privacy, PHI, and Accessibility](security-privacy-accessibility.md)
- [988 Suicide and Crisis Lifeline chat](https://chat.988lifeline.org/)

[Back to project README](../README.md)

----

Copyright © 2026 The Regents of the University of Michigan
