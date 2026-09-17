<!--
This file is part of Field Station AI.
data-files-and-compendiums.md: Documentation of data handling and compendium (knowledge bundle) integration in Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-17
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: Data, Files, Attachments, and Compendiums

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

## What a Compendium Is

A compendium is a bundle of knowledge from many sources, indexed in a format that AI tools can search. One compendium can hold web pages, help articles, code repositories, video transcripts, and documents. Field Station AI searches a compendium to find passages that help answer your question, and it cites the pages it used.

Compendiums are built with [Extractium™](https://code.depressioncenter.org/extractium), a separate open-source tool from the Eisenberg Family Depression Center. Field Station AI only reads compendiums. It does not build them.

Field Station AI ships with one compendium, the **Depression Center Resource Library**, in the file `efdc-compendium.json.gz`. The file is about 33 MB. It downloads the first time the compendium is used and is kept in the browser cache afterward, so it works offline.

## Compendium States

The compendium badge sits next to the model dropdown. It supports these states:

| State | Behavior |
| --- | --- |
| Off | No compendium retrieval |
| Bundled | Loads the Depression Center Resource Library, if shipped with the app |
| External | Loads your own compendium from `?compendium-url=` |

Bundled is the default. When a `?compendium-url=` compendium loads, the app searches it instead of the bundled one. The External choice is not saved between visits; it lasts only while `?compendium-url=` is in the address. Click the badge at any time to switch states.

Compendiums are content sources. Review them before committing or sharing.

## Load Your Own Compendium

Serve the app and your `compendium.json.gz` file from a location the browser can reach. Then add the file's address to the app's address with `compendium-url`.

Example:

```text
index.html?compendium-url=compendium.json.gz
```

If the compendium loads, it appears as an External option on the badge for that page load. If it cannot be read, the status line says why and the app keeps working without it.

These address options are available:

| Option | What it does |
| --- | --- |
| `compendium-url` | Address of the compendium file to load. A full URL or a path next to `index.html`. |
| `compendium-mode` | `include` (the default) adds matching excerpts to answers. `lockdown` limits answers to the excerpts. |
| `compendium-cache` | Set to `false` to download the file again instead of using the cached copy. Cached copies expire after 7 days. |

Example with all three:

```text
index.html?compendium-url=https://example.org/kb/compendium.json.gz&compendium-mode=lockdown&compendium-cache=false
```

A file hosted on another website must allow cross-origin requests (CORS), or the browser will block the download.

Older links that use `?kb=` no longer load anything. The app shows a notice that the option was replaced. Rebuild the content as a compendium with Extractium™ and link to it with `?compendium-url=`.

## Compendium File Requirements

Field Station AI reads the Extractium™ container format, version 4. The app checks each file before using it and refuses a file that fails a check.

- The file may be gzip-compressed (`compendium.json.gz`) or not (`compendium.json`). The app looks at the file's first bytes, not its name, to decide.
- The file must be built with the embedding model `BAAI/bge-small-en-v1.5` (384 dimensions). This is Extractium's default. Field Station AI turns your question into numbers with the same model, in its browser packaging `Xenova/bge-small-en-v1.5`. Numbers from two different models cannot be compared, so a file built with another model is refused.
- The download may be up to 64 MB, and up to 256 MB after it is uncompressed.
- Index files made by the retired `build-kb-index.py` script (version 2) are not supported.

A large compendium uses a lot of memory. The bundled file grows to about 100 MB of text and numbers once loaded. On a phone or an older computer, turn the compendium off if the page becomes slow.

See the [Extractium™ container format](https://github.com/DepressionCenter/extractium/blob/main/docs/container-format.md) for the full file layout.

## Build a Compendium

Use [Extractium™](https://code.depressioncenter.org/extractium) to build your own compendium. Its documentation covers installing it, choosing sources, and running a build. Turn on gzip output so the build writes `compendium.json.gz`, which is much smaller to host and download.

Field Station AI no longer includes its own crawler. The `build-kb-index.py` script was removed.

## Source Scope

Before building, decide what should be included.

Recommended rules:

- Include only approved sources.
- Prefer narrow documentation paths over whole domains.
- Exclude login, search, print, archive, download, issue, pull request, settings, profile, and other non-content URLs.
- Keep build cache folders and generated compendiums out of commits unless reviewed.

## Review Before Sharing

A compendium contains the text of its source pages. Before committing or sharing:

1. Read the `llms-full.txt` file that Extractium™ writes next to the compendium. It holds the same text in readable form.
2. Search for PHI, secrets, internal-only URLs, and accidental private content.
3. Confirm source URLs are approved.
4. Confirm examples are synthetic or public-safe.
5. Confirm license and attribution requirements for source content.

## How Excerpts Are Chosen

The app searches a compendium two ways at once: by meaning, using the embedding model, and by keywords. It combines the two rankings. A passage is used only if it is close enough in meaning to the question, so an unrelated question gets no excerpts instead of poor ones. The app then shows the model the whole section around each matching passage.

Text from a compendium is treated as reference material, never as instructions to the assistant.

## Lockdown Mode

If lockdown mode is on (`compendium-mode=lockdown`), the assistant should answer from attachments or compendium excerpts when available and say when no matching source was found. Do not let lockdown mode become a license to guess.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan