// This file is part of Field Station AI
// tests/index-html.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-28
// Summary: Static checks on index.html, the whole application: the file
// header carries the project and license notice, the app is still one
// module script, the crisis notice constants point at the 988 Lifeline,
// and the excerpt reranker is wired the way that yields real scores.
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
