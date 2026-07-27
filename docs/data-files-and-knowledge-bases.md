<!--
This file is part of Field Station AI.
data-files-and-knowledge-bases.md: Documentation of data handling and knowledge base integration in Field Station AI, in Markdown format.
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

# Field Station AI™: Data, Files, Attachments, and Knowledge Bases

## Attachment Ownership

Attachments belong to chats. Field Kit files belong to the active Field Kit tool unless the user explicitly sends an output to chat.

This boundary prevents a file used in one surface from silently contaminating another surface.

Required behavior:

- Chat attachments stay with the chat.
- Field Kit input files stay with the skill.
- Resetting a skill must not delete chat-owned attachments.
- Starting a new chat must not inherit Field Kit state.

## Attachment Types

Supported behavior depends on file type and current implementation.

| File type | Typical behavior |
| --- | --- |
| Images | Stored as attachments; image questions may use a vision model where available |
| PDFs and text files | Text can be extracted locally for answers or Field Kit workflows |
| Spreadsheets | Column profiles or rows can be extracted for chat or structured skills |
| Audio | Can be transcribed where transcription models are available |
| Video or other files | May be unsupported, rejected, or stored only depending on current code path |

Do not document unsupported file types as readable unless the code path actually reads them.

## Retention and Browser Storage

Browser storage is local to the browser profile and origin. It can be cleared by user action, browser settings, enterprise policy, private-browsing behavior, or storage pressure.

Use one origin consistently during testing and demonstrations. `file://`, `localhost`, and deployed URLs do not share the same browser storage.

Recommended practice:

- Download important outputs promptly.
- Keep source data outside the app.
- Avoid using shared browser profiles.
- Avoid participant identifiers in filenames.
- Treat generated outputs as sensitive until reviewed.

## Knowledge-Base States

The KB badge supports these user-visible states:

| State | Behavior |
| --- | --- |
| Off | No KB retrieval |
| Bundled | Loads the bundled index if shipped with the app |
| External | Loads a prebuilt index from `?kb=` |

External KB indexes are content sources. Review them before committing or sharing.

## Load an External Index

Serve the app and index file from a browser-accessible location.

Example:

```text
index.html?kb=index.json
```

If the external index loads successfully, it appears as an external knowledge-base option for that page load.

## Build an Index

Use `build-kb-index.py` to crawl an approved source and write a Field Station AI-compatible index.

Example:

```bash
python build-kb-index.py --url "https://example.org/docs/" --out index.json --max-pages 500 --delay 0.5
```

Arguments:

- `--url`: seed URL.
- `--out`: output index path.
- `--max-pages`: crawl ceiling.
- `--delay`: delay between requests in seconds.

## Source Scope

Before crawling, decide what should be included.

Recommended rules:

- Crawl only approved sources.
- Prefer narrow documentation paths over whole domains.
- Exclude login, search, print, archive, download, issue, pull request, settings, profile, and other non-content URLs.
- Keep generated cache folders and generated indexes out of commits unless reviewed.

## Review Before Sharing

A generated index may contain source page text. Before committing or sharing:

1. Open the JSON file.
2. Search for PHI, secrets, internal-only URLs, and accidental private content.
3. Confirm source URLs are approved.
4. Confirm examples are synthetic or public-safe.
5. Confirm license and attribution requirements for source content.

## Lockdown Mode

If a lockdown-style KB mode is enabled, the assistant should answer from attachments or KB excerpts when available and say when no matching source was found. Do not let lockdown mode become a license to guess.

[⬅ Back to README](/README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan