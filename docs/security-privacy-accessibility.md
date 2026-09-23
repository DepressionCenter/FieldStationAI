<!--
This file is part of Field Station AI.
security-privacy-accessibility.md: Security and accessibility guide for developers working on Field Station AI, in Markdown format.
Author(s): Gabriel Mongefranco.
Created: 2026-07-26
Last Modified: 2026-09-23
Summary: Field Station AI is a private, in-browser AI workspace for health and behavioral researchers.
Notes: See README file for documentation and full license information.

Copyright © 2026 The Regents of the University of Michigan

Licensed under the GNU Free Documentation License v1.3 or later.
See <https://www.gnu.org/licenses/fdl-1.3.html>. See README for full license information.

-->
![Eisenberg Family Depression Center](https://code.depressioncenter.org/images/EFDCLogo_375w.png "depressioncenter.org")

# Field Station AI™: Security, Privacy, PHI, and Accessibility

## Privacy Model

Field Station AI™ is designed so research data is processed in the browser by default. The provided app code should not be described as sending chat text or attached file contents to a cloud AI API by default.

Network activity can still occur for:

- Downloading JavaScript libraries and fonts.
- Downloading model files.
- Fetching the bundled compendium file or an external one.
- Loading or using local Ollama if configured.
- Browser speech recognition, which may be browser/vendor serviced depending on browser.
- Opening external links.

## PHI Posture

Assume uploaded files and prompts may contain PHI or other sensitive research data.

Do not write UI copy, documentation, tests, screenshots, logs, or examples that imply:

- “PHI cleared.”
- “HIPAA compliant.”
- “De-identified.”

Use those claims only after formal review and approval outside this codebase.

## Research Data Rules

Required practices:

- Preserve source files.
- Transform copies, not originals.
- Do not put identifiers in filenames, logs, URLs, screenshots, or issue reports.
- Use synthetic examples in documentation and tests.
- Validate joins and merges to avoid accidental row multiplication.
- Route decisions involving PHI, IRB, institutional policy, or Information Assurance to the appropriate review process.

## Secrets

Do not commit:

- API keys.
- Access tokens.
- Connection strings.
- Participant data.
- Generated research outputs.
- Local cache folders.
- Model or embedding cache artifacts.
- Generated compendiums containing sensitive content.

Use environment variables, local config files excluded by `.gitignore`, or institution-approved secret storage for sensitive values.

## PIN and Browser Storage Risks

PIN protection, where available, is a local deterrent. It is not equivalent to device encryption, institutional endpoint controls, or formal access management.

Browser storage is local to the browser profile and origin. It can be cleared or evicted by the browser, enterprise policy, user action, or storage pressure.

Recommended researcher practice:

- Use a non-shared browser profile.
- Set a PIN before attaching sensitive files when supported.
- Download important outputs promptly.
- Keep source data outside the app.
- Avoid identifiers in filenames.

## Destination-Aware Redaction

Redaction should depend on where text goes.

Design rule:

- In-browser model paths may use real local sampled values when needed for accuracy.
- Network-addressable or separate-process model paths require redaction before sending cell values where the feature promises redaction.
- Exported reproducibility artifacts should not carry PHI.

This is defense-in-depth, not formal de-identification.

## Crisis Notice

When a chat prompt appears to describe the writer's own current mental health crisis, the app shows a fixed notice with the 988 Lifeline number and chat link instead of a reply. The check follows the policy of the Depression Center Resources agent in Microsoft Copilot: the app does not engage clinically, assess risk, or ask safety questions, and it does not continue routine guidance on that turn.

What the code does:

- The check runs on the prompt only, in the browser, before any reply is generated, on every chat model including Ollama, with the router on or off.
- It has three tiers: first-person phrase patterns in English and Spanish, a comparison of the prompt with crisis and research example sentences using the same embedding model the compendium uses, and a small tiebreak model for scores that fall between the two.
- The notice text is a constant in the code. No model writes or rewords it.
- The notice is saved in the chat the way the PHI warning is, so it re-appears on reload and in the text export, and it is never sent to the model as part of the conversation.
- The notice shows once per chat. After that, the check is skipped for that chat.
- No prompt text is logged.

What the check cannot do:

- It is a heuristic. It can miss a crisis, and it can show the notice for an academic or research prompt about suicide or self-harm. The prompts in `tests/fixtures/crisis-prompts.json` record the cases it is tested against.
- The embedding and tiebreak models are English-only. Spanish is covered by the phrase patterns, so Spanish detection is narrower.
- It is not a clinical assessment, and it does not replace a study's safety protocol.

## Logging and Exports

Console errors may include technical details. Avoid capturing logs or screenshots with real participant data.

Review downloaded files, transcripts, CSVs, summaries, notebooks, and generated indexes before sharing. Column names, filenames, and aggregate summaries can still reveal study context.

## Accessibility Target

Target WCAG 2.1 AA or WCAG 2.2 AA.

Minimum checks:

- All controls reachable by keyboard.
- No keyboard traps.
- Visible focus indicators.
- Labels or accessible names for controls.
- Dynamic status changes announced when needed.
- Color is not the only indicator of state.
- Text contrast meets AA expectations.
- Reduced-motion preference respected for animations.

No formal accessibility audit result is included in the provided documentation set.

## Manual Accessibility Verification

Before release, test:

1. Navigate all chat controls with keyboard only.
2. Open and close menu, compendium picker, PIN dialog, Advanced settings dialog, and Field Kit by keyboard.
3. In Advanced settings, change each number with the minus and plus buttons and by typing, and confirm a screen reader announces the new value.
4. Confirm focus is visible and logical.
5. Confirm dialogs do not trap focus permanently.
6. Test screen-reader announcement of status and progress messages.
7. Confirm color is not the only state cue.
8. Test reduced-motion mode.
9. Send a crisis test prompt from `tests/fixtures/crisis-prompts.json`, confirm a screen reader announces the notice, and reach its 988 chat link with Tab.

Automated check:

- Run a browser accessibility scanner such as axe DevTools.
- Fix critical and serious findings before release.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan