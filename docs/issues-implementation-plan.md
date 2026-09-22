<!--
This file is part of Field Station AI.
docs/issues-implementation-plan.md: Ordered plan and status tracker for the open GitHub issues, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-09-22
Last Modified: 2026-09-22
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
7. Test in a real browser before calling the phase done. There is no automated test suite, so record the browser, the models, and the exact steps in the pull request. Say plainly what was not tested.
8. Commit only when the work is tested, then open a pull request against `main`. Commit messages and pull request text are plain English, describe what changed and why, and carry no co-author trailer, robot signature, or tool or model name.
9. Close the GitHub issue when the pull request merges, and update this page.

### Phase order

| Phase | Issue | Title | Branch | Status |
| --- | --- | --- | --- | --- |
| 1 | [#1](https://github.com/DepressionCenter/FieldStationAI/issues/1) | Crisis notice for prompts that may signal a mental health emergency | `feature/crisis-notice` | Not started |
| 2 | [#6](https://github.com/DepressionCenter/FieldStationAI/issues/6) | "Paste text" input for the four text classifier skills | `feature/skill-paste-text` | Not started |
| 3 | [#7](https://github.com/DepressionCenter/FieldStationAI/issues/7) | Direct chat-to-skill flow for text-only skills | `feature/chat-to-skill` | Not started |
| 4 | [#4](https://github.com/DepressionCenter/FieldStationAI/issues/4) | Storage management dialog in the menu | `feature/storage-manager` | Not started |
| 5 | [#2](https://github.com/DepressionCenter/FieldStationAI/issues/2) | Full Markdown support in chats | `feature/chat-markdown` | Not started (do much later) |

Issues [#3](https://github.com/DepressionCenter/FieldStationAI/issues/3) and [#5](https://github.com/DepressionCenter/FieldStationAI/issues/5) stay open but are not scheduled. See [Issues not scheduled](#issues-not-scheduled).

### Phase 1: Crisis notice (issue #1)

**Status:** Not started

**Branch:** `feature/crisis-notice`, from `main`.

#### Why this comes first

Field Station AI carries Depression Center branding. A study participant in distress could open it and type something that signals a crisis. The app must recognize that as well as it can and point the person to help. This is a safety feature, so it outranks every other issue.

#### What the person sees

When a prompt appears to describe a current mental health crisis, the app shows a fixed notice instead of a routine answer. The notice is hard-coded text. It is never written or reworded by a model, so a small model cannot garble it, soften it, or add advice.

The working text, adapted from the policy used for the Depression Center Resources agent in Microsoft Copilot:

> It seems you may be having a mental health crisis. If you're in the United States, call or text 988 or use [988 Lifeline chat](https://chat.988lifeline.org/) now.

A longer alternative, to choose between during phase planning:

> It sounds like you may be struggling. Call or text 988 to reach the 988 Lifeline. 988 is confidential, available 24/7, and connects people experiencing a mental health, substance use, or suicidal crisis with trained crisis counselors.

The policy the notice follows: if a prompt appears to describe a current crisis, the app does not engage clinically, assess risk, ask safety questions, or continue routine guidance. Academic, research, or general informational discussion of suicide or self-harm does not by itself indicate a current crisis.

#### How it fits the code

The chat router (`routeIntent()` in `index.html`) already runs a regex tier and then scores each prompt with the shared `bge-small` embedding against short exemplar lists (`ROUTER_EXEMPLARS`), with an NLI tiebreak (`ROUTER_NLI_ID`). The crisis check should reuse those same pieces rather than load another model. The difference is that it is a separate, parallel check, not one more intent:

- It runs on every prompt, whether or not the router is turned on.
- It never competes with the routing intents for top score. It has its own exemplars, its own threshold, and its own regex tier for explicit phrases.
- Its result does not change the system prompt. It decides only whether the fixed notice is shown.
- It must add little memory and time. Reusing the embedding the router already computes for the prompt keeps the added cost near zero when the router is on.

#### Decisions to settle in the phase plan

- Whether the notice replaces the model's reply for that turn (the Copilot policy) or is shown above a reply that still runs. The Copilot policy is the recommended default.
- Whether to also scan model responses, as the issue suggests. Recommendation: prompts only in this phase, and open a follow-up issue for responses if wanted.
- Whether the notice is shown once per chat or on every matching turn.
- The exemplar list and the threshold, tested against both crisis phrasing and non-crisis phrasing (research questions, survey design, literature summaries, the classifier skills' category descriptions).
- How the notice is announced to screen readers, and how it is stored in the chat history, if at all. Recommendation: store it as a system notice that is excluded from model input, the same way existing system notices are.

#### Acceptance criteria

- The fixed notice appears for clearly worded crisis prompts on the smallest model in the dropdown and on a 1B model, with the router on and off.
- Academic and research prompts about suicide or self-harm do not trigger it in a written test list of at least ten such prompts.
- The notice text is a constant near the other prompt constants, never model output.
- No prompt text is logged.
- The notice is keyboard reachable, has sufficient contrast, and is announced when it appears.

#### Documentation to update

`docs/user-guide.md`, `docs/security-privacy-accessibility.md`, and `docs/design-change-record.md`.

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

### Conclusion

Start with phase 1. Create the branch from `main`, write the detailed plan under the phase heading, and set the status to Planning. Move down the table as each pull request merges.

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
