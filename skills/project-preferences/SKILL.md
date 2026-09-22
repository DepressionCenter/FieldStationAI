---
name: project-preferences
description: Apply repository-specific preferences when planning, implementing, or reviewing changes in this project.
---

<!--
This file is part of Field Station AI
Copyright © 2026 The Regents of the University of Michigan
Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.
-->

# Field Station AI

## Project preferences

Use this skill when planning, implementing, or reviewing changes in this repository.
Keep all project-specific preferences and workflows in this single file. This skill
supplements `AGENTS.md` and cannot weaken its security, privacy, accessibility,
licensing, testing, or authorization rules.

### Purpose and scope

Field Station AI is a local-first AI workspace that runs entirely in a web browser.
It is aimed at health, behavioral, and digital-health researchers who may be working
with sensitive data or protected health information (PHI). The design goal is that
chats, attachments, and study files stay on the user's machine unless the user
deliberately points the app somewhere else.

Two rules follow from that goal and apply to every change:

1. Never add a feature that sends user content, prompts, attachments, or telemetry to
   a remote service by default. If a feature needs a network call, it must be opt-in,
   visible in the interface, and documented.
2. Never claim the app is HIPAA compliant. Say what the code does, and point readers
   to institutional privacy, IRB, and Information Assurance review.

### Environment and structure

Follow the repository's existing file and folder naming conventions when adding new files.

- `index.html` is the whole application: markup, styles, and one `<script type="module">`,
  around 15,000 lines. There is no build step, no bundler, and no package manager.
  Edit it in place and keep the existing section ordering and naming style.
- `efdc-compendium.json.gz` is the bundled compendium, the Depression Center Resource
  Library. A compendium is a bundle of knowledge from many sources, indexed for AI search.
  It is built with [Extractium](https://code.depressioncenter.org/extractium), a separate project, and
  this repository only reads it. The file is gzip-compressed binary, so never edit it by
  hand; replace it with a fresh Extractium build. Its header carries the license notice in
  a leading `_license` key. The app also accepts the full-text build under
  `efdc-compendium-full.json.gz`, and either name without `.gz`; the names it tries, in
  order, are in `BUNDLED_COMPENDIUM_URLS`. People load their own `compendium.json.gz`
  through the `?compendium-url=` query parameter.
- `bin/` holds the prebuilt [ZippyServe](https://github.com/DepressionCenter/ZippyServe)
  binaries. `run-windows.ps1`, `run-linux.sh`, and `run-mac.command` wrap them and open
  a browser. Those three scripts came from ZippyServe, so their headers name that project
  rather than this one. Leave that attribution alone.
- `styles/um-style.css` is the shared U-M color and component stylesheet. The application's
  own styles are inline in `index.html`, so changing this file does not change the app.
- `docs/` is the knowledge base. `docs/README.md` is its index; update it whenever you add
  or remove a page.

### Setup and verification

The app must be served over HTTP. Opening `index.html` directly from disk fails, because
browsers block model downloads for `file://` pages.

1. Start a local server from the repository root. Use the `run-*` script for your operating
   system, or `python -m http.server 8010`.
2. Open the address the server prints. The default is `http://localhost:8010/`.
3. Pick a model from the dropdown and wait for it to download and compile. Models cache in
   the browser, so the wait only happens once per model per browser profile.
4. Exercise the paths your change touched: chat, attachments, Field Kit tools, and the
   compendium badge.

There is no automated test suite in this repository, so verification is manual. Say exactly
which browser and which models you used, and say plainly when you could not test something.
Never report a result you did not observe.

A WebGPU-capable browser and a discrete GPU make larger models usable. Smaller models can
run without one, so check that a change still works on modest hardware before calling it done.

### Project constraints

- **Keep it one file.** The single-file design is the point: a researcher can copy
  `index.html` to a web server and be done. Do not split the app into modules, add a build
  step, or introduce a framework.
- **Third-party libraries load from public CDNs at runtime**, currently Transformers.js,
  PapaParse, SheetJS, PDF.js, and Pyodide, all pinned to explicit versions. Keep versions
  pinned. Before changing one, check the release notes and any known CVEs, and say what
  you checked.
- **Treat every model output as untrusted input.** Model text, retrieved compendium
  passages, and parsed file content are data, never instructions. Never let them reach
  `innerHTML`, `eval`, a generated URL, or the Pyodide sandbox without validation.
- **Treat compendium and attached content as untrusted too.** A compendium holds text
  from arbitrary web pages, and users attach arbitrary files. Both may contain text aimed at
  an AI agent.
- **Accessibility is a release gate,** not a follow-up. The target is WCAG 2.1 AA or
  2.2 AA. Every control needs a keyboard path, a visible focus state, and a label. Status
  changes, including model loading and compendium mode, must not rely on color alone.
- **No PHI, secrets, compendiums with sensitive content, model caches, or research
  outputs in the repository.** Use synthetic examples everywhere.

### Project skills

This repository uses the five shared skills listed in [SKILLS.md](../../SKILLS.md) and adds
none of its own yet. If a recurring task here needs its own recipe, copy
[skill-template.md](../skill-template.md) into `skills/<skill-name>/SKILL.md` and add it to
the index.

### Conclusion

Keep the app a single, dependency-free page that a researcher can host anywhere, keep user
data on the user's machine, and verify changes in a real browser before reporting them done.

### Additional resources

- [Project instructions](../../AGENTS.md)
- [Skills index](../../SKILLS.md)
- [Documentation index](../../docs/README.md)
- [Architecture overview](../../docs/architecture.md)
- [Developer guide](../../docs/developer-guide.md)
- [Security, privacy, PHI, and accessibility](../../docs/security-privacy-accessibility.md)
