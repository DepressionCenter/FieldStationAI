// This file is part of Field Station AI
// tests/pain-estimate-models.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-29
// Last Modified: 2026-09-29
// Summary: Scores the synthetic texts in tests/fixtures/pain-estimate-texts.json
// with the real model behind Estimate pain level, using the app's own
// helpers from index.html, and checks the expected intensity and
// interference results. Prints every result so a change to the wording or
// the thresholds can be judged. Opt-in, because the model download is about
// 440 MB: set FSAI_PAIN_MODEL_TEST=1. FSAI_PAIN_DTYPE picks the weights
// (q4 by default, the first CPU rung the app uses).
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
import path from 'node:path';
import { REPO_ROOT, loadPainBlock, loadPainFixture, fixtureText, plain } from './helpers/pain-block.mjs';

const MODEL_CACHE = path.join(REPO_ROOT, 'tests', '.cache', 'models');
const DTYPE = process.env.FSAI_PAIN_DTYPE || 'q4';

// ### Load Dependency ###

let skip = false;
let transformers = null;
if (process.env.FSAI_PAIN_MODEL_TEST !== '1') {
    skip = 'set FSAI_PAIN_MODEL_TEST=1 to run this test; it downloads about 440 MB';
} else if (process.env.FSAI_SKIP_MODEL_TESTS === '1') {
    skip = 'FSAI_SKIP_MODEL_TESTS is set';
} else {
    try {
        transformers = await import('@huggingface/transformers');
    } catch {
        skip = 'test dependency not installed; run: npm ci --prefix tests';
    }
}

// The model id comes from index.html, so this test follows the app.
function modelIdFromApp() {
    const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
    const match = html.match(/const SKILL_ZEROSHOT_ID = '([^']+)'/);
    assert.ok(match, 'index.html names the zero-shot model');
    return match[1];
}

function allowed(expected, label) {
    if (expected === undefined) return true;
    return Array.isArray(expected) ? expected.includes(label) : expected === label;
}

// ### Score the Fixture ###

test('pain estimate check against the real model', { skip, timeout: 1800000 }, async () => {
    const { pipeline, env } = transformers;
    env.cacheDir = MODEL_CACHE;
    const block = loadPainBlock();
    const fixture = loadPainFixture();
    const modelId = modelIdFromApp();
    const clf = await pipeline('zero-shot-classification', modelId, { dtype: DTYPE });
    const label2id = clf.model.config.label2id || {};
    const find = (name, fallback) => {
        const key = Object.keys(label2id).find(k => k.toLowerCase().startsWith(name));
        return key === undefined ? fallback : label2id[key];
    };
    const ids = { contradiction: find('contra', 0), neutral: find('neutral', 1), entailment: find('entail', 2) };
    const wording = plain(block.PAIN_DEFAULT_WORDING);
    const countTokens = t => clf.tokenizer(t).input_ids.dims[1];

    async function logits(text, statements) {
        const rows = [];
        for (const statement of statements) {
            const inputs = clf.tokenizer(text, { text_pair: statement, padding: true, truncation: true });
            const out = await clf.model(inputs);
            rows.push(Array.from(out.logits.data));
        }
        return rows;
    }

    const failures = [];
    const knownMisses = [];
    const lines = [];
    for (const item of fixture.items) {
        const text = fixtureText(fixture, item);
        const fit = block.painFitTextToBudget(text, countTokens, block.PAIN_TEXT_TOKEN_BUDGET);
        const intensity = block.painSetScores(await logits(fit.text, wording.intensity), ids);
        const interference = block.painThreeWay((await logits(fit.text, wording.interference))[0], ids);
        assert.ok(intensity && interference, item.id + ' gave usable scores');
        const summary = plain(block.summarizePainItem({
            intensityShares: intensity.shares, intensitySupport: intensity.support, interference,
            textTokens: fit.tokens, shortened: fit.shortened, stated: block.findStatedPainScores(text)
        }));
        const shares = intensity.shares.map(s => s.toFixed(2)).join(' ');
        const three = [interference.agree, interference.disagree, interference.neither].map(s => s.toFixed(2)).join(' ');
        lines.push([item.id.padEnd(11), summary.intensity.label.padEnd(10), 'support ' + Math.max(...intensity.support).toFixed(2),
            'shares ' + shares, '|', summary.interference.label.padEnd(25), 'agree/disagree/neither ' + three,
            '|', summary.notes.join(', ')].join(' '));
        const expect = item.expect || {};
        const wrong = [];
        if (!allowed(expect.intensity, summary.intensity.label)) wrong.push(item.id + ': intensity ' + summary.intensity.label + ', expected ' + JSON.stringify(expect.intensity));
        if (!allowed(expect.interference, summary.interference.label)) wrong.push(item.id + ': interference ' + summary.interference.label + ', expected ' + JSON.stringify(expect.interference));
        if (expect.shortened !== undefined && fit.shortened !== expect.shortened) wrong.push(item.id + ': shortened ' + fit.shortened);
        // A known miss is reported so it stays visible, and it does not
        // fail the test until the model or the wording reaches it.
        if (item.knownMiss) {
            if (wrong.length) knownMisses.push(...wrong.map(w => w + ' (known miss: ' + item.knownMiss + ')'));
            else knownMisses.push(item.id + ': now reached; remove its knownMiss note');
        } else {
            failures.push(...wrong);
        }
    }
    console.log('\nPain estimate fixture, ' + modelId + ' (' + DTYPE + '), transformers.js ' + env.version + ':\n' + lines.join('\n') + '\n');
    if (knownMisses.length) console.log('Known misses (' + knownMisses.length + '):\n' + knownMisses.join('\n') + '\n');
    assert.deepEqual(failures, [], failures.join('\n'));
});
