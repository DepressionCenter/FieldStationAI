// This file is part of Field Station AI
// tests/index-html.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-29
// Summary: Static checks on index.html, the whole application: the file
// header carries the project and license notice, the app is still one
// module script, the crisis notice constants point at the 988 Lifeline,
// the excerpt reranker is wired the way that yields real scores, the
// Field Kit text skills offer a "Paste text" tab whose text is never
// parsed as markup or stored, the chat's skill offer hands text to a
// skill without writing to chat history or storage, the storage dialog
// shows names as text and deletes through the app's own paths, and the
// startup cleanup keeps the files of every model the app uses, and names
// are edited in place, with no dialog and without opening the chat.
// Runs with Node's built-in test runner and no dependencies.
// Notes: See README file for documentation and full license information.
//
// Copyright © 2026 The Regents of the University of Michigan
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along
// with this program. If not, see <https://www.gnu.org/licenses/>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INDEX_HTML } from './helpers/crisis-block.mjs';

const html = fs.readFileSync(INDEX_HTML, 'utf8');

// Reads a single-quoted string constant out of the source by name.
function stringConstant(name) {
    const match = html.match(new RegExp("const " + name + " = '((?:[^'\\\\]|\\\\.)*)';"));
    assert.ok(match, `index.html does not define ${name} as a single-quoted string`);
    return match[1].replace(/\\'/g, "'");
}

// Reads a numeric constant out of the source by name.
function numberConstant(name) {
    const match = html.match(new RegExp('const ' + name + ' = ([0-9.]+)'));
    assert.ok(match, `index.html does not define ${name} as a number`);
    return Number(match[1]);
}

// Reads the source of one top-level function of the app script, from its
// declaration up to the next top-level function. Top-level functions sit
// at the script's base indent, and the functions inside them sit deeper.
const TOP_LEVEL_INDENT = '        ';
function functionSource(name) {
    let start = html.indexOf('\n' + TOP_LEVEL_INDENT + 'function ' + name + '(');
    if (start === -1) start = html.indexOf('\n' + TOP_LEVEL_INDENT + 'async function ' + name + '(');
    assert.ok(start !== -1, `index.html does not define the function ${name}`);
    const rest = html.slice(start + 1);
    const next = rest.search(new RegExp('\\n' + TOP_LEVEL_INDENT + '(?:async )?function \\w+\\('));
    return next === -1 ? rest : rest.slice(0, next);
}

// ### File Header ###

test('index.html opens with the project and license header', () => {
    const head = html.split('\n').slice(0, 25).join('\n');
    assert.ok(head.includes('This file is part of Field Station AI'), 'header names the project');
    assert.ok(head.includes('GNU General Public License'), 'header names the license');
});

// ### Single File ###

test('index.html is one module script', () => {
    const modules = html.match(/<script type="module">/g) || [];
    assert.equal(modules.length, 1, 'the app must stay a single module script');
});

// ### Crisis Notice ###

test('the crisis notice points at the 988 Lifeline', () => {
    assert.equal(stringConstant('CRISIS_CHAT_URL'), 'https://chat.988lifeline.org/');
    assert.ok(stringConstant('CRISIS_NOTICE_TEXT').includes('988'), 'the notice names 988');
    assert.ok(stringConstant('CRISIS_NOTICE_SPANISH').includes('988'), 'the Spanish line names 988');
    assert.ok(stringConstant('CRISIS_NOTICE_CONTINUE').length > 0, 'the continue line is not empty');
});

// ### Excerpt Reranking ###

// The reranker is a one-label cross-encoder. Run through the library's
// text-classification pipeline, its single logit goes through a softmax
// and every passage scores exactly 1, so nothing is reranked. The app
// must read the raw score from the model itself.
test('the reranker reads raw scores from the model, not the classification pipeline', () => {
    assert.ok(!html.includes("pipeline('text-classification', COMPENDIUM_RERANK_MODEL_ID"), 'the reranker is not loaded as a text-classification pipeline');
    assert.ok(html.includes('AutoModelForSequenceClassification.from_pretrained(COMPENDIUM_RERANK_MODEL_ID'), 'the reranker is loaded as a sequence-classification model');
    const importLine = html.match(/import \{([^}]+)\} from 'https:\/\/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@/);
    assert.ok(importLine, 'the Transformers.js import line is present');
    for (const name of ['AutoTokenizer', 'AutoModelForSequenceClassification']) {
        assert.ok(importLine[1].split(',').map(s => s.trim()).includes(name), `the import brings in ${name}`);
    }
});

// Reranking can only improve the excerpt set when it sees more sections
// than the prompt keeps, and each section must appear at most once: a
// hit is a section's full text, so a second window of the same section
// would put the same excerpt in the prompt twice.
test('the rerank shortlist is longer than the excerpt count and holds one hit per section', () => {
    const topK = numberConstant('COMPENDIUM_TOPK');
    const shortlist = numberConstant('COMPENDIUM_RERANK_TOPN_INPUT');
    assert.ok(topK >= 1, 'at least one excerpt per turn');
    assert.ok(shortlist > topK, `the shortlist (${shortlist}) must exceed the excerpt count (${topK})`);
    assert.equal(numberConstant('COMPENDIUM_SOURCE_CAP'), 1, 'one hit per section');
});

// ### Paste Text Tab ###

// Three of the text skills take their input tabs from one shared helper.
// The category sorter builds its own, because its spreadsheet tab reads
// files with extra rows above the header.
const SHARED_TAB_SKILLS = ['mountEmotionsSkill', 'mountPainLevelSkill', 'mountNerSkill', 'mountBucketsSkill'];
const TAB_BUILDERS = ['mountClassifierInputTabs', 'mountTaxonomySkill'];

test('every text skill offers a Paste text tab', () => {
    for (const name of TAB_BUILDERS) {
        const source = functionSource(name);
        assert.ok(source.includes('data-mode="paste">Paste text</button>'), `${name} has a Paste text tab`);
        assert.ok(source.includes('mountPasteTextPane('), `${name} builds the shared paste pane`);
        assert.ok(source.includes('wireSkillTabs('), `${name} wires its tabs through the shared helper`);
    }
    for (const name of SHARED_TAB_SKILLS) {
        assert.ok(functionSource(name).includes('mountClassifierInputTabs('), `${name} uses the shared input tabs`);
    }
});

test('pasted text counts as unsaved input in every text skill', () => {
    for (const name of SHARED_TAB_SKILLS) {
        assert.ok(functionSource(name).includes('inputTabs.hasUnsavedInput()'), `${name} asks the tabs for unsaved input`);
    }
    assert.ok(functionSource('mountClassifierInputTabs').includes('pasteInput.hasText()'), 'the shared tabs count pasted text');
    assert.ok(functionSource('mountTaxonomySkill').includes('pasteInputRef.hasText()'), 'the category sorter counts pasted text');
});

// Pasted text is untrusted input. The pane that holds it must build its
// elements one by one, so no part of the text can be read as markup.
test('the paste pane never parses text as markup', () => {
    const source = functionSource('mountPasteTextPane');
    for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(']) {
        assert.ok(!source.includes(sink), `mountPasteTextPane does not use ${sink}`);
    }
});

// Pasted text belongs to the skill. It must not reach chat, browser
// storage, or the network from the pane that holds it.
test('the paste pane keeps its text out of chat, storage, and the network', () => {
    const source = functionSource('mountPasteTextPane');
    for (const exit of ['chatBridge', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon']) {
        assert.ok(!source.includes(exit), `mountPasteTextPane does not use ${exit}`);
    }
});

// A spell-checked box can send its text to an online service in some
// browsers, and pasted research text may hold PHI.
test('the paste box turns spell checking off and carries a label and a size limit', () => {
    const source = functionSource('mountPasteTextPane');
    assert.ok(source.includes('textarea.spellcheck = false'), 'spell checking is off');
    assert.ok(source.includes('label.htmlFor = textarea.id'), 'the label points at the box');
    assert.ok(source.includes('textarea.maxLength = PASTED_TEXT_MAX_CHARS'), 'the box has the size limit');
});

// ### Skill Offer ###

const OFFER_SINKS = ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval('];
const OFFER_EXITS = ['chat.messages', 'saveStore', 'chatBridge', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon'];

// The skills a chat offer can open, with the function that mounts each.
const OFFERED_SKILLS = {
    'emotions': 'mountEmotionsSkill',
    'pain-level': 'mountPainLevelSkill',
    'ner': 'mountNerSkill',
    'taxonomy-classify': 'mountTaxonomySkill'
};

// The offer sits in the chat next to a prompt, which is untrusted input.
// It must show fixed wording and the skill's name only, built element by
// element.
test('the skill offer never parses text as markup and shows none of the prompt', () => {
    const source = functionSource('appendSkillOffer');
    for (const sink of OFFER_SINKS) {
        assert.ok(!source.includes(sink), `appendSkillOffer does not use ${sink}`);
    }
    assert.ok(source.includes('note.textContent = SKILL_OFFER_NOTE'), 'the line is the fixed note');
    assert.ok(source.includes("open.textContent = 'Open in ' + skill.name"), 'the button names the skill');
    assert.ok(!/textContent = [^;]*offer\.text/.test(source), 'the prompt text is never shown in the offer');
    assert.ok(stringConstant('SKILL_OFFER_NOTE').length > 0, 'the note is not empty');
});

test('the skill offer is a real button and is read out when it appears', () => {
    const source = functionSource('appendSkillOffer');
    assert.ok(source.includes("document.createElement('button')"), 'the offer is a button element');
    assert.ok(source.includes("open.type = 'button'"), 'the button does not submit anything');
    assert.ok(source.includes('chatLivePolite.textContent'), 'the offer is written to the polite live region');
    assert.ok(/<div class="chat-sr" id="chat-live-polite" aria-live="polite"/.test(html), 'the polite live region is in the page');
});

// Opening a skill from the chat moves text one way, into the skill's
// paste box. It must not write to chat history, storage, or the network.
test('opening a skill from chat writes nothing to chat, storage, or the network', () => {
    for (const name of ['openSkillWithText', 'skillOfferForPrompt', 'rememberSkillOffer', 'appendSkillOffer']) {
        const source = functionSource(name);
        for (const exit of OFFER_EXITS) {
            assert.ok(!source.includes(exit), `${name} does not use ${exit}`);
        }
    }
});

test('an offer is kept in memory only and leaves with its chat', () => {
    assert.ok(html.includes('const skillOffersByChat = new Map();'), 'offers live in a Map');
    assert.ok(functionSource('deleteChat').includes('skillOffersByChat.delete(id)'), 'deleting a chat drops its offers');
    assert.ok(!/skillOffer\w*\s*:/.test(functionSource('createChat')), 'a chat record has no offer field');
});

// An offer must come from what the prompt says. A file attached to the
// chat must not produce one, and a skill that is not ready must not be
// offered.
test('the offer check reads the prompt only and offers ready skills only', () => {
    const check = functionSource('skillOfferForPrompt');
    assert.ok(!check.includes('attachment'), 'the check does not look at attachments');
    assert.ok(check.includes('skillRequestCandidates(prompt)'), 'the check reads the prompt');
    assert.ok(check.includes('skillCanTakeText(skillId)'), 'the check asks whether the skill can be offered');
    assert.ok(functionSource('skillCanTakeText').includes("skill.status === 'ready'"), 'only a ready skill is offered');
    assert.ok(functionSource('openSkillWithText').includes('skillCanTakeText(skillId)'), 'only a ready skill is opened');
});

test('the offer check runs with the router on and never blocks the reply', () => {
    const send = functionSource('handleSend');
    const at = send.indexOf('await skillOfferForPrompt(text)');
    assert.ok(at !== -1, 'handleSend runs the offer check');
    const before = send.slice(0, at);
    assert.ok(before.lastIndexOf('if (routerActive) {') > before.lastIndexOf('await routeIntent(text, chat)'), 'the check sits inside a router-only branch, after routing');
    assert.ok(before.lastIndexOf('try {') > before.lastIndexOf('if (routerActive) {'), 'a failed check is caught, so the reply still runs');
    assert.ok(send.indexOf('promptSignalsCrisis(text)') < at, 'the crisis check comes first');
});

test('every offered skill can take text into its paste box', () => {
    for (const [skillId, mount] of Object.entries(OFFERED_SKILLS)) {
        const source = functionSource(mount);
        assert.ok(source.includes('skillTextReceiver = {'), `${mount} registers a text receiver`);
        assert.ok(source.includes("id: '" + skillId + "'"), `${mount} registers it under ${skillId}`);
    }
    assert.ok(functionSource('mountClassifierInputTabs').includes("tabStrip.open('paste')"), 'the shared tabs open the paste tab');
    assert.ok(functionSource('mountTaxonomySkill').includes("inputTabStrip.open('paste')"), 'the category sorter opens the paste tab');
});

// Text that arrives from the chat is set as the box's value, the same
// as typed text, and replaces other text only after the person agrees.
test('text from the chat goes through the paste box and asks before replacing', () => {
    const source = functionSource('mountPasteTextPane');
    assert.ok(source.includes('const next = normalizePastedText(incoming)'), 'incoming text is cleaned and capped');
    assert.ok(source.includes('textarea.value = next'), 'incoming text is set as the value of the box');
    assert.ok(source.includes("confirm('Replace the text already in the box?')"), 'the person is asked before text is replaced');
});

test('leaving another skill for an offer asks before its work is discarded', () => {
    const source = functionSource('openSkillWithText');
    assert.ok(source.includes('skillHasStateToPreserve(skillsCurrentId)'), 'the open skill is asked for unsaved work');
    assert.ok(source.includes('confirm('), 'the person is asked first');
});

// ### Sources Row ###

// A URL or a file name is one long word. Without these two properties a
// flex item cannot get narrower than that word, and the chat box scrolls
// sideways on a narrow screen.
test('items in the Sources row can shrink and break, and the row has no scrollbar', () => {
    const items = html.match(/\.sources-row > \* \{([^}]*)\}/);
    assert.ok(items, 'index.html has no rule for the items of the Sources row');
    assert.ok(/min-width:\s*0\b/.test(items[1]), 'an item may get narrower than its longest word');
    assert.ok(/overflow-wrap:\s*anywhere\b/.test(items[1]), 'a long word breaks onto the next line');
    const row = html.match(/\.sources-row \{([^}]*)\}/);
    assert.ok(row, 'index.html has no rule for the Sources row');
    assert.ok(/flex-wrap:\s*wrap\b/.test(row[1]), 'items wrap onto new lines');
    assert.ok(!/overflow|max-height|white-space:\s*nowrap/.test(row[1]), 'the row grows taller and never scrolls');
});

// ### Pain Estimate ###

// The results table shows item names and phrases from a person's text,
// and the wording editor shows statements a person typed. Both are
// untrusted input, so both are built element by element.
test('the pain results and wording editor never parse text as markup', () => {
    for (const name of ['renderPainResults', 'mountPainWordingEditor']) {
        const source = functionSource(name);
        for (const sink of OFFER_SINKS) {
            assert.ok(!source.includes(sink), `${name} does not use ${sink}`);
        }
    }
    const editor = functionSource('mountPainWordingEditor');
    assert.ok(editor.includes('label.htmlFor = id'), 'each wording box has a label');
    assert.ok(editor.includes("setAttribute('aria-invalid', 'true')"), 'an invalid box is marked for assistive technology');
    assert.ok(editor.includes('PAIN_WORDING_KEY') === false && editor.includes('writePainWording('), 'the editor saves through the wording helpers');
    const results = functionSource('renderPainResults');
    assert.ok(results.includes("th.scope = 'col'"), 'header cells carry scope');
    assert.ok(results.includes('container.replaceChildren()'), 'old results are cleared without markup');
});

// The wording helpers save statements only. The text a person checks
// never goes through them.
test('the pain wording helpers store wording and nothing else', () => {
    for (const name of ['readPainWording', 'writePainWording']) {
        const source = functionSource(name);
        assert.ok(!source.includes('inputTabs') && !source.includes('getDocs'), `${name} does not touch the text being checked`);
        assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(source), `${name} does not use the network`);
    }
    const read = functionSource('readPainWording');
    assert.ok(read.includes('validatePainWording('), 'saved wording is checked again when it is read');
});

// The skill sends every statement to the model as written, reads the
// model's raw answers, and records the model variant with each item.
test('the pain skill reads raw model answers and records how each item was scored', () => {
    const source = functionSource('mountPainLevelSkill');
    assert.ok(source.includes('classifier.tokenizer(text, { text_pair: statement'), 'text and statement go to the model as a pair');
    assert.ok(source.includes('painFitTextToBudget('), 'long text is fitted before it is scored');
    assert.ok(source.includes('loadModelRung(SKILL_ZEROSHOT_ID)'), 'the model variant is recorded');
    assert.ok(source.includes('findStatedPainScores(text)'), 'stated scores are read from the whole text');
    assert.ok(!source.includes('multi_label'), 'the zero-shot pipeline call is no longer used');
});

// ### Storage Dialog ###

// The dialog shows names that came from a person's files and chats, which
// are untrusted input. Rows are built element by element.
test('the storage dialog never parses a name as markup', () => {
    for (const name of ['buildStorageRow', 'renderStorageGroup', 'refreshStorage', 'announceStorage', 'toggleStoragePin']) {
        const source = functionSource(name);
        for (const sink of OFFER_SINKS) {
            assert.ok(!source.includes(sink), `${name} does not use ${sink}`);
        }
    }
    const row = functionSource('buildStorageRow');
    assert.ok(row.includes('nameText.textContent = row.name'), 'the name is set as text');
    assert.ok(row.includes("remove.setAttribute('aria-label', row.deleteLabel)"), 'the button is labeled with the item it deletes');
    assert.ok(row.includes("document.createElement('button')"), 'delete is a button element');
    assert.ok(row.includes("remove.type = 'button'"), 'the button does not submit anything');
});

test('the storage dialog is a labeled modal that is opened from the menu', () => {
    assert.ok(/<div class="storage-dialog" id="storage-dialog" role="dialog" aria-modal="true" aria-labelledby="storage-title"/.test(html), 'the dialog has a role and a label');
    assert.ok(/<h2 class="settings-title" id="storage-title">/.test(html), 'the label is the dialog title');
    assert.ok(/<button type="button" class="settings-close" id="storage-close" aria-label="Close">/.test(html), 'the close button is labeled');
    assert.ok(/<p class="storage-status" id="storage-live" aria-live="polite"/.test(html), 'results are written to a live region');
    assert.ok(html.includes("{ label: 'Manage storage', action: () => openStorage() }"), 'the menu opens the dialog');
    for (const group of ['chats', 'attachments', 'models', 'compendiums']) {
        assert.ok(html.includes(`<section class="storage-group" data-group="${group}" aria-labelledby="storage-${group}-name">`), `the ${group} group is in the page`);
    }
    const keys = functionSource('onStorageKey');
    assert.ok(keys.includes("e.key === 'Escape'"), 'Escape closes the dialog');
    assert.ok(keys.includes("e.key !== 'Tab'"), 'Tab is kept inside the dialog');
    assert.ok(functionSource('closeStorage').includes('menuBtn.focus()'), 'focus returns to the menu button');
});

// Each group deletes through the path the rest of the app uses, so that
// no related record is left behind, and asks before it deletes.
test('every storage group deletes through the app\'s own path and asks first', () => {
    const chats = functionSource('listStoredChats');
    assert.ok(chats.includes('deleteChat(chat.id)'), 'a chat is deleted by deleteChat');
    assert.ok(functionSource('deleteChat').includes('confirm('), 'deleteChat asks first');
    assert.ok(functionSource('deleteChat').includes('deleteAttachmentsForChat(chat)'), 'a chat takes its attachments with it');

    const attachments = functionSource('listStoredAttachments');
    assert.ok(attachments.includes('deleteAttachmentEverywhere('), 'an attachment is deleted by deleteAttachmentEverywhere');
    const everywhere = functionSource('deleteAttachmentEverywhere');
    assert.ok(everywhere.includes('AttachmentStore.deleteAttachment(id)'), 'the file and its vectors are removed');
    assert.ok(everywhere.includes('removeAttachmentIndex(id)'), 'the index line is removed');
    assert.ok(everywhere.includes('chat.attachments.splice('), 'the chat lets go of the file');
    assert.ok(functionSource('deleteAttachmentChip').includes('deleteAttachmentEverywhere(id)'), 'the chat uses the same path');

    const model = functionSource('deleteCachedModel');
    assert.ok(model.includes('purgeModelFromCache(group.repoId)'), 'a model is deleted by purgeModelFromCache');
    assert.ok(model.includes('localStorage.removeItem(cachedFlag(id))'), 'the downloaded flag is removed');
    assert.ok(model.includes('clearModelRung(id)'), 'the saved load settings are removed');

    const compendiums = functionSource('listCachedCompendiums');
    assert.ok(compendiums.includes('purgeCompendiumEntry(request.url)'), 'a compendium is deleted by purgeCompendiumEntry');

    for (const [name, source] of Object.entries({ listStoredAttachments: attachments, listCachedModels: functionSource('listCachedModels'), listCachedCompendiums: compendiums })) {
        const removals = source.split('remove: async () => {').slice(1);
        assert.ok(removals.length > 0, `${name} can delete`);
        for (const body of removals) {
            assert.ok(/^\s*if \(!confirm\(/.test(body), `${name} asks before it deletes`);
        }
    }
});

// A link to a private compendium may carry an access token in its query.
test('the storage dialog leaves the query out of a compendium address', () => {
    const source = functionSource('listCachedCompendiums');
    assert.ok(source.includes('where.host + where.pathname'), 'the row shows the host and the path');
    assert.ok(!/where\.(search|href)/.test(source), 'the row shows no query');
    assert.ok(!/details: \[[^\]]*request\.url/.test(source), 'the row does not show the whole address');
});

// The startup cleanup removes files of models the app no longer offers. It
// must know every model the app does use by the name its files are cached
// under, or it deletes them on each load.
test('the startup cleanup keeps the files of every model the app uses', () => {
    const source = functionSource('knownModelIds');
    assert.ok(source.includes('webllmRepoId(v)'), 'chat models are known by their repository names');
    for (const id of ['ROUTER_NLI_ID', 'DAISY_VISION_ID', 'DAISY_AUDIO_ID', 'COMPENDIUM_EMBED_ID', 'COMPENDIUM_RERANK_MODEL_ID', 'CPU_FALLBACK_TJS_ID']) {
        assert.ok(source.includes(id), `${id} is kept`);
    }
    assert.ok(source.includes('for (const s of SKILLS) if (s.modelId) ids.add(s.modelId)'), 'Field Kit models are kept');
});

test('a storage group shows its total size and no count', () => {
    const source = functionSource('renderStorageGroup');
    assert.ok(source.includes("'(' + formatStorageBytes(rows.reduce((sum, row) => sum + row.bytes, 0)) + ')'"), 'the total is the size alone');
    assert.ok(!source.includes('rows.length +'), 'the number of rows is not shown');
});

// A pinned chat is protected: its Delete button does nothing until the
// chat is unpinned. The button stays focusable so that it can say why.
test('a pinned chat cannot be deleted from the storage dialog', () => {
    const row = functionSource('buildStorageRow');
    assert.ok(row.includes("if (row.pinned) remove.setAttribute('aria-disabled', 'true')"), 'Delete is marked as disabled');
    assert.ok(!row.includes('remove.disabled'), 'Delete stays focusable');
    assert.ok(row.includes("pin.setAttribute('aria-pressed', String(row.pinned))"), 'the pin button carries its state');
    assert.ok(row.includes("pin.setAttribute('aria-label', 'Pin chat ' + row.name)"), 'the pin button is labeled');
    const remove = functionSource('deleteStorageRow');
    const guard = remove.indexOf('if (row.pinned)');
    assert.ok(guard !== -1, 'a delete checks the pin');
    assert.ok(guard < remove.indexOf('row.remove()'), 'the pin is checked before anything is deleted');
    assert.ok(functionSource('toggleStoragePin').includes('togglePin(row.chatId)'), 'the dialog pins through the existing path');
    assert.ok(functionSource('listStoredChats').includes('pinned: !!chat.pinned'), 'a chat row knows whether it is pinned');
});

// ### Rename In Place ###

// A name is typed by a person and shown in tabs, chips, and the storage
// dialog. It is edited in a text box, never in a browser dialog, and
// never built into markup.
test('names are edited in place, in a text box with a size limit', () => {
    const source = functionSource('beginInlineRename');
    for (const sink of OFFER_SINKS) {
        assert.ok(!source.includes(sink), `beginInlineRename does not use ${sink}`);
    }
    assert.ok(source.includes("document.createElement('input')"), 'the editor is an input element');
    assert.ok(source.includes('field.maxLength = RENAME_MAX_CHARS'), 'the box has the size limit');
    assert.ok(source.includes('.slice(0, RENAME_MAX_CHARS)'), 'the stored name has the size limit');
    assert.equal(numberConstant('RENAME_MAX_CHARS'), 40);
    assert.ok(source.includes('field.select()'), 'the text is selected when the box opens');
    assert.ok(source.includes("field.setAttribute('aria-label', options.ariaLabel)"), 'the box is labeled');
    assert.ok(source.includes("e.key === 'Enter'") && source.includes("e.key === 'Escape'"), 'Enter keeps and Escape cancels');
    assert.ok(source.includes("name !== ''"), 'an empty name is not stored');
    for (const name of ['renameChat', 'renameTemplate']) {
        const rename = functionSource(name);
        assert.ok(!rename.includes('prompt('), `${name} opens no dialog`);
        assert.ok(rename.includes('beginInlineRename('), `${name} edits in place`);
    }
});

test('renaming a chat does not open it or wait for a reply', () => {
    const rename = functionSource('renameChat');
    assert.ok(!rename.includes('setActive'), 'renaming does not switch chats');
    assert.ok(!rename.includes('busy'), 'renaming does not depend on a reply');
    assert.ok(!rename.includes('stopAll') && !rename.includes('interrupt'), 'renaming stops nothing');
    const button = functionSource('buildRenameButton');
    assert.ok(button.includes('e.stopPropagation()'), 'a press on the pencil does not reach the tab');
    assert.ok(button.includes("edit.setAttribute('aria-label', 'Rename ' + itemName)"), 'the pencil is labeled');
    const tabs = functionSource('renderTabs');
    assert.ok(!tabs.includes("'dblclick'"), 'a tab has no double-click action');
    assert.ok(tabs.includes('buildItemMenuButton('), 'a tab has one menu button');
    // The Field Kit tab keeps its own close button; a chat tab has none.
    assert.ok(!tabs.includes("className = 'tab-pin'") && !tabs.includes("x.title = 'Delete chat'"), 'a chat tab has no pin or delete button of its own');
    assert.ok(tabs.includes('holdInlineRename(tabBar)') && tabs.includes('resumeInlineRename(tabBar, heldRename)'), 'a redraw keeps an edit in progress');
    const chip = functionSource('addTemplateChip');
    assert.ok(!chip.includes("'dblclick'"), 'a chip has no double-click action');
    assert.ok(chip.includes('buildItemMenuButton('), 'a chip has one menu button');
    assert.ok(functionSource('buildStorageRow').includes('renameChat(row.chatId, nameText, storageDialog)'), 'the storage dialog renames the same way');
});

// ### Item Menu ###

// One button per tab and per chip opens a menu with the actions. The menu
// follows the menu button pattern: labeled, keyboard operable, and closed
// with Escape, with focus back on the button.
test('the item menu is labeled, keyboard operable, and returns focus', () => {
    assert.ok(/<div id="item-menu" class="item-menu" role="menu" hidden><\/div>/.test(html), 'the menu element is in the page');
    const button = functionSource('buildItemMenuButton');
    assert.ok(button.includes("more.setAttribute('aria-label', 'Options for ' + itemName)"), 'the button is labeled');
    assert.ok(button.includes("more.setAttribute('aria-haspopup', 'menu')") && button.includes("more.setAttribute('aria-expanded', 'false')"), 'the button says it opens a menu');
    assert.ok(button.includes('e.stopPropagation()'), 'a press on the button does not reach the tab');
    const open = functionSource('openItemMenu');
    for (const sink of OFFER_SINKS) assert.ok(!open.includes(sink), `openItemMenu does not use ${sink}`);
    assert.ok(open.includes("entry.setAttribute('role', 'menuitem')"), 'entries are menu items');
    assert.ok(open.includes("itemMenu.querySelector('button').focus()"), 'focus moves into the menu');
    const keys = functionSource('onItemMenuKey');
    for (const key of ['Escape', 'ArrowDown', 'ArrowUp', 'Home', 'End']) assert.ok(keys.includes(`'${key}'`), `${key} is handled`);
    assert.ok(functionSource('closeItemMenu').includes('anchor.focus()'), 'closing can put focus back on the button');
    const tabs = functionSource('renderTabs');
    for (const label of ["'Rename'", "'Unpin'", "'Delete'"]) assert.ok(tabs.includes(label), `a tab's menu has ${label}`);
    assert.ok(tabs.includes("mark.setAttribute('aria-label', 'Pinned')"), 'a pinned tab shows a labeled pin mark');
    assert.ok(tabs.includes('openItemMenuOnContextMenu(tab, more)'), 'a right-click opens the same menu');
    assert.ok(tabs.includes('holdItemMenu(tabBar)') && tabs.includes('resumeItemMenu(tabBar, heldMenu)'), 'a redraw closes the menu and keeps focus in the bar');
});
