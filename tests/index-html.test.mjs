// This file is part of Field Station AI
// tests/index-html.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-28
// Summary: Static checks on index.html, the whole application: the file
// header carries the project and license notice, the app is still one
// module script, the crisis notice constants point at the 988 Lifeline,
// the excerpt reranker is wired the way that yields real scores, and the
// Field Kit text skills offer a "Paste text" tab whose text is never
// parsed as markup or stored.
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
    const start = html.indexOf('\n' + TOP_LEVEL_INDENT + 'function ' + name + '(');
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
