<!--
This file is part of Field Station AI.
user-guide.md: Guide for users of Field Station AI, in Markdown format.
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

# Field Station AI™: User Guide

## What Stays Local

Field Station AI™ runs in your browser. Chat text, attached files, extracted text, transcripts, and generated outputs are intended to stay in browser storage unless you intentionally use a feature that reaches outside the page.

Network activity may still occur when the app downloads model files, loads external JavaScript libraries or fonts, loads an external compendium, uses local Ollama, opens external links, or uses browser speech recognition.

Do not treat the app as a compliance certification. If your data may contain PHI or regulated information, follow your study, IRB, institutional privacy, and Information Assurance requirements.

## Start a Chat

1. Open the app through the live demo ( [[live demo](https://code.depressioncenter.org/FieldStationAI/)](https://code.depressioncenter.org/FieldStationAI/) ), local HTTP (run-* scripts), or a deployed project URL.
2. Wait for the selected model to download and compile if needed.
3. Type a prompt.
4. Press **Enter** to send or **Shift+Enter** for a new line.
5. Use **Stop** to interrupt a response when available.

Use **New chat** for a separate conversation. Each chat should keep its own messages and attachments.

### Rename, Pin, or Delete a Chat

Each chat tab has one small button at its right end (⋯). It opens a menu with **Rename**, **Pin** or **Unpin**, and **Delete**. A right-click on the tab opens the same menu. With the keyboard, reach the button with Tab, press **Enter**, and move through the menu with the arrow keys. **Esc** closes it.

To rename:

1. Choose **Rename**. The name turns into a text box, with the whole name selected.
2. Type the new name. A name can be up to 40 characters long.
3. Press **Enter** to keep the new name, or **Esc** to keep the old one. Clicking somewhere else also keeps the new name.

Renaming a chat does not open it, and it does not stop a reply that is being written. You can rename chats in the Storage dialog too. See [Manage Storage](#manage-storage).

A chat that is not pinned is removed 30 days after its last change. Choose **Pin** to keep the chat. A pinned chat shows a small pin before its name. You can pin up to 5 chats.

**Delete** asks before it deletes the chat and the files attached to it.

Each saved prompt below the chat has the same button, with **Rename** and **Delete**.

## If You May Be in Crisis

Field Station AI™ is not a counseling service, but it is made by a depression center, so it watches for one thing. If a message you type sounds like you are in a mental health crisis right now, the app shows a fixed notice instead of a reply. The notice gives the 988 Suicide and Crisis Lifeline, which you can call or text at 988 in the United States, and a link to the 988 Lifeline chat. It also says how to reach 988 in Spanish.

The notice is written by people, not by the AI model, so it always says the same thing. The app checks your message on your own computer and does not send it anywhere.

The first time the notice appears in a chat, your message stays in the box. To continue chatting, send it again and the assistant will answer. If a later message in the same chat sounds like a crisis again, the notice comes back without that line, and from then on every message that sounds like a crisis gets the notice instead of a reply. Other messages are still answered, and you can start a new chat at any time.

The check is a best effort. It can miss a message, and it can show the notice for a research question about suicide or self-harm. If that happens, send the message again and the assistant will answer. If you or someone else is in danger, contact your local emergency services.

## Choose a Model

The model dropdown applies to generation. Larger models may require larger downloads, more memory, and WebGPU support. If WebGPU is unavailable or a selected model fails, use a smaller model path where available.

Do not interpret model choice as a privacy setting. Privacy depends on where the prompt and files are processed.

## Protect Saved Work

Saved chats and attachments live in browser storage for the active browser profile and origin. Use the app's PIN or locking features where available, but treat short PINs as a local deterrent, not a replacement for institutional controls, device encryption, or access management.

Recommended practice:

- Use a non-shared browser profile.
- Set a PIN before attaching sensitive files where the feature is available.
- Download important outputs promptly.
- Keep source data outside the app.
- Avoid participant identifiers in filenames.

## Attach Files

Use the paperclip button, paste, or drag/drop where supported.

Common behavior:

- Images can be stored as attachments and used for image questions where a vision model is available.
- PDFs, text files, and spreadsheets can provide extracted text or column profiles for grounded answers.
- Audio can be used by transcription workflows where supported.
- Unsupported files may be stored for download only or rejected, depending on the current code path.

Attachments belong to the active chat. Field Kit files belong to the active Field Kit tool unless the user explicitly sends a result to chat.

## Ask About Attachments

Ask normally, for example:

```text
What did this participant say about sleep?
```

For text-bearing attachments, the app may search extracted attachment text before using other context. For images, the app may rerun a vision model rather than relying on a stored caption.

## Send Text to a Field Kit Tool

Some jobs are done better by a Field Kit tool than by the chat model. When you ask the chat to do one of these jobs on a text, the chat offers the tool that does it.

| When you ask the chat to | The chat offers |
| --- | --- |
| Find the feelings or the sentiment in a text | Emotions and sentiment |
| Find the people, places, or organizations named in a text | Find names and places |
| Estimate the pain a text describes | Estimate pain level |
| Sort a text into categories | Sort text into categories |

1. Type your request and your text in one message. For example:

   ```text
   Analyze this text for sentiment: I had a wonderful day at the park and I cannot wait to go back.
   ```

2. Press **Send**. Under your message, the app shows "Field Kit has a tool for this." and a button, such as **Open in Emotions and sentiment**. The assistant still answers your message.
3. Press the button. Field Kit opens the tool with your text in its **Paste text** box. The words of your request are left out.
4. Check the text in the box, then press the tool's run button.

Things to know:

- Offers appear when the model you chose has "+ Router" in its name.
- You can put your request before the text, after it, or around text in quotation marks.
- The tool does not run until you press its run button.
- Opening a tool adds nothing to your chat. Results reach a chat only when you press **Send to Chat** in the tool.
- Only the words of your message bring an offer. Attaching a file does not.
- If the box already holds other text, or another tool holds files or results, the app asks before it replaces them.
- The offer stays under your message until you reload the page. To get it back, send the message again.
- The check is a best effort. It can miss a request, and it can offer a tool you do not need. You can ignore an offer, and you can always open a tool yourself with the Field Kit button at the top of the page.

See the [Field Kit Guide](field-kit.md) for what each tool does with your text. Estimate pain level reports how strong the pain is and whether it limits what the person can do, as model estimates, and repeats any score the writer gave. It does not give a 0 to 10 number. See [Estimate Pain Level](field-kit.md#estimate-pain-level).

## Use a Compendium

A compendium is a bundle of knowledge from many sources, built with [Extractium™](https://code.depressioncenter.org/extractium) and indexed so the assistant can search it. The compendium badge shows the current retrieval state:

- **Off**: no compendium retrieval.
- **Bundled**: the Depression Center Resource Library, if shipped with the app.
- **External**: your own compendium loaded with `?compendium-url=`.

Example:

```text
index.html?compendium-url=compendium.json.gz
```

Compendium retrieval uses the loaded file. It should not be described as live browsing of the source sites.

See [Data, Files, Attachments, and Compendiums](data-files-and-compendiums.md) for the other address options and the file requirements.

## Advanced Settings

Most people never need these. To open them, choose the menu button at the top right (three lines), then **Advanced settings**.

Each setting shows a number with a minus button on its left and a plus button on its right. Each press changes the number by 0.01. You can also type a number. **Reset** puts the recommended value back. Changes save in this browser and apply to your next message.

| Setting | What it does | Lower | Higher | Recommended |
| --- | --- | --- | --- | --- |
| Creativity (temperature) | How much the AI varies its wording | Steady, careful answers | More varied answers, but the AI makes things up more often | 0.25 |
| Match strictness | How closely a compendium passage must match your question before the app gives it to the AI | More passages, some off topic | Only close matches, so some questions find nothing | 0.67, or the value the compendium recommends |

The smallest model runs 0.15 below the creativity number shown, because small models make things up more easily.

Some compendium files carry their own recommended match strictness, measured when the file was built. When such a file is loaded, the **Reset** button shows that value, and the app uses it until you change the setting yourself. A value you set yourself stays until you press **Reset**.

If answers ignore the compendium, first look at the Sources row under the answer. If it lists the right pages, the model is the weak link, so try a larger model. If it lists nothing, try a slightly lower match strictness.

## Manage Storage

The app saves chats, attachments, downloaded models, and compendiums in this browser. The Storage dialog shows what is saved and lets you delete items one at a time.

To open it, choose the menu button at the top right (three lines), then **Manage storage**.

The top line shows how much space the app uses and how much this browser allows. Below it are four groups:

| Group | What it lists | Time shown |
| --- | --- | --- |
| Chats | Every saved chat, with the number of files attached to it | When the chat last changed |
| Attachments | Every file you attached, and the chat it belongs to | When you added the file |
| Models | Every AI model this browser has downloaded | When the model last loaded |
| Compendiums | Every compendium file this browser has saved | When the file was saved |

Each row shows a size and a **Delete** button. Next to the name of each group is the total size of that group.

To delete an item:

1. Choose **Delete** on its row.
2. Confirm in the box that appears. Choose **Cancel** to keep the item.

Each chat row has two more controls:

- **The pencil** next to the name renames the chat. You can also double-click the name. The tab in the main screen shows the new name.
- **The pin** to the left of **Delete** pins or unpins the chat. A gray pin with a dashed border means the chat is not pinned. A pin in color with a solid border means it is pinned.

A pinned chat cannot be deleted here. Its **Delete** button is gray with a dashed border. Choose the pin to unpin the chat, and **Delete** works again.

Things to know before you delete:

- A deleted item cannot be brought back.
- Deleting a chat also deletes the files attached to it.
- A deleted model or compendium downloads again the next time the app needs it. That takes time and a network connection.
- You cannot delete while the AI is writing a reply. Wait for the reply to finish.
- If you set a PIN and did not enter it, the Chats and Attachments groups stay hidden. Reload the page and enter your PIN to see them.

Sizes are close, not exact. The size of a chat is the size of its text, and a PIN adds about a third. The total at the top comes from the browser, and it leaves out chat text.

## Export Data

Available exports depend on context:

- Chat transcript as text where available.
- Field Kit result CSVs.
- Transcripts and summaries as text.
- CSV Combiner notebook where available.

Review exports before sharing. Exported files may contain study data unless the tool explicitly states otherwise.

[⬅ Back to Documentation](README.md) | [⬅ Back to project README](../README.md)

---

Documentation licensed under the GNU Free Documentation License, version 1.3 or later.

Copyright © 2026 The Regents of the University of Michigan