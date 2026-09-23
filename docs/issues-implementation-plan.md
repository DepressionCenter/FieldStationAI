<!--
This file is part of Field Station AI.
docs/issues-implementation-plan.md: Ordered plan and status tracker for the open GitHub issues, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-09-22
Last Modified: 2026-09-23
Summary: Lists the open GitHub issues in the order they will be worked, the branch and scope for each, and the rules every phase follows.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->

# Field Station AI

## Issues Implementation Plan

[Back to project README](../README.md)

This page is the working plan for the open [GitHub issues](https://github.com/DepressionCenter/FieldStationAI/issues). It says which issue comes next, what branch it lives on, what is in and out of scope, and how we know it is done. Everything on this page is planned work, not a description of what the app does today. The other pages in this folder describe current behavior, and they get updated as each phase lands.

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
7. Run `node --test tests/` before opening a pull request, and the model-backed test when the phase touches the crisis check (see the [developer guide](developer-guide.md)). The suite covers the documentation and the crisis check, not the app's behavior in a browser, so also test in a real browser before calling the phase done, and record the browser, the models, and the exact steps in the pull request. Say plainly what was not tested.
8. Commit only when the work is tested, then open a pull request against `main`. Commit messages and pull request text are plain English, describe what changed and why, and carry no co-author trailer, robot signature, or tool or model name.
9. Close the GitHub issue when the pull request merges, and update this page.

### Phase order

| Phase | Issue | Title | Branch | Status |
| --- | --- | --- | --- | --- |
| 1 | [#1](https://github.com/DepressionCenter/FieldStationAI/issues/1) | Crisis notice for prompts that may signal a mental health emergency | `feature/crisis-notice` | In review |
| 2 | [#6](https://github.com/DepressionCenter/FieldStationAI/issues/6) | "Paste text" input for the four text classifier skills | `feature/skill-paste-text` | Not started |
| 3 | [#7](https://github.com/DepressionCenter/FieldStationAI/issues/7) | Direct chat-to-skill flow for text-only skills | `feature/chat-to-skill` | Not started |
| 4 | [#4](https://github.com/DepressionCenter/FieldStationAI/issues/4) | Storage management dialog in the menu | `feature/storage-manager` | Not started |
| 5 | [#2](https://github.com/DepressionCenter/FieldStationAI/issues/2) | Full Markdown support in chats | `feature/chat-markdown` | Not started (do much later) |

Issues [#3](https://github.com/DepressionCenter/FieldStationAI/issues/3), [#5](https://github.com/DepressionCenter/FieldStationAI/issues/5), and [#12](https://github.com/DepressionCenter/FieldStationAI/issues/12) stay open but are not scheduled. See [Issues not scheduled](#issues-not-scheduled).

### Phase 1: Crisis notice (issue #1)

**Status:** In review

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

Escalation, same setup with SmolLM2-360M + Router: the first flagged prompt showed the notice with the continue line and left the message in the box; the re-send was answered; a later flagged prompt showed the notice without the continue line and no reply; an ordinary prompt after that was answered; another flagged prompt got the notice again. After reload the chat showed three notices with the continue line only on the first. No console errors.

#### Documentation updated

`docs/user-guide.md`, `docs/security-privacy-accessibility.md`, `docs/design-change-record.md`, `docs/developer-guide.md`, `docs/architecture.md`, `docs/models-and-runtime.md`, and the project preferences skill.

### Phase 2: Paste text input for classifier skills (issue #6)

**Status:** Not started

**Branch:** `feature/skill-paste-text`, from `main`.

#### Scope

Add a "Paste text" option to Emotions and Sentiment, Sort text into categories, Find names and places, and Estimate pain level. People often have text in another app or in a file type the skill cannot read, and pasting is easier than converting to PDF or TXT first.

#### How it fits the code

All four skills build their input area with one shared helper, `mountClassifierInputTabs()`, which today offers "One document at a time" and "A spreadsheet of many rows". Adding a third tab there covers all four skills in one change. The Combine spreadsheets skill already has a pasted-list mode that shows the pattern for a `textarea` tab, a state probe, and the "you have unsaved input" check.

#### Acceptance criteria

- Each of the four skills shows a "Paste text" tab. Pasted text runs through the same pipeline as a single uploaded document.
- The state probe treats non-empty pasted text as unsaved input.
- The tab, textarea, and buttons work by keyboard and have labels.
- Pasted text stays in skill state and never touches chat state.

#### Documentation to update

`docs/field-kit.md`.

### Phase 3: Chat-to-skill flow for text-only skills (issue #7)

**Status:** Not started

**Branch:** `feature/chat-to-skill`, from `main`.

#### Scope

Let a person send text from the chat prompt straight into one of the text-only skills. The issue describes two flows. Flow 1: the person pastes text and asks for sentiment, emotions, names, or pain level; the router recognizes the request and offers the skill. Flow 2: a small skills button near the prompt lets the person pick a skill first, then paste or upload.

This phase depends on phase 2, because the skill needs a paste pane to receive the text.

#### How it fits the code

The router already has hint-only pseudo-intents (`HINT_INTENTS`, `SKILL_HINT_TABLE`) that suggest a skill when a question fits it better than chat. Today only the taxonomy and spreadsheet skills have one. This phase adds pseudo-intents and exemplars for the four text skills, and makes the hint carry the prompt text into the skill's paste pane. The proof of concept the issue asks for is that link. Running the skill without opening its UI, and returning results into the chat, is a later step and should be planned only after the link works.

#### Acceptance criteria

- For a prompt like "analyze this text for sentiment: ...", the chat offers the matching skill, and choosing it opens the skill with the text already in the paste pane.
- The hint never fires from file presence alone, and never for a skill that is not ready.
- Nothing is written to chat history unless the person chooses Send to Chat.
- Flow 2, if included, works by keyboard and has a labeled button.

#### Documentation to update

`docs/user-guide.md` and `docs/field-kit.md`.

### Phase 4: Storage management dialog (issue #4)

**Status:** Not started

**Branch:** `feature/storage-manager`, from `main`.

#### Scope

Add a storage management dialog to the menu. It lists attachments, cached models, and chats, with creation or modification time, size on disk, and a delete option for each.

#### How it fits the code

The pieces exist in separate places. Attachments live in IndexedDB (`ATTACHMENT_DB_NAME`) with an index and vectors alongside, and `deleteAttachment()` already removes the related records. Chats are stored in browser storage through the existing chat store, and `deleteChat()` exists. Model weights sit in Cache Storage, and `purgeModelFromCache()` removes one model. The compendium has its own cache (`COMPENDIUM_CACHE_NAME`). `navigator.storage.estimate()` is already called for the overall usage figure. The dialog ties these together in one place and must reuse the existing delete paths, so nothing is left behind.

#### Acceptance criteria

- The dialog shows the three groups with timestamps and sizes, and the overall usage and quota.
- Deleting an item removes every related record, and the list refreshes.
- Delete asks for confirmation, and the confirmation is keyboard operable.
- Names of attachments are shown as text, never as HTML.
- The dialog follows the existing modal pattern, with a label, focus trap, and close behavior.

#### Documentation to update

`docs/user-guide.md`, `docs/data-files-and-compendiums.md`, and `docs/security-privacy-accessibility.md`.

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
- [#12](https://github.com/DepressionCenter/FieldStationAI/issues/12), pinning the WebLLM import, is a small dependency change that needs its own release-note and advisory check. Do it in its own branch when convenient.

### Conclusion

Phase 1 is in review. Move down the table as each pull request merges: create the next branch from `main`, write the detailed plan under the phase heading, and set the status to Planning.

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
