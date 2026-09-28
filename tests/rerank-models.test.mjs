// This file is part of Field Station AI
// tests/rerank-models.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-28
// Last Modified: 2026-09-28
// Summary: Scores synthetic question-and-passage pairs with the real
// reranker model, in Node on the CPU, the same way the app does: the
// tokenizer and sequence-classification model directly, reading the raw
// score. A passage that answers the question must score above an author
// bio and above an unrelated passage, and the scores must differ. Needs
// the test dependency installed (npm ci --prefix tests); without it, or
// with FSAI_SKIP_MODEL_TESTS=1, the file skips itself so the fast suite
// stays dependency-free. Model files cache under tests/.cache/.
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
import { REPO_ROOT, INDEX_HTML } from './helpers/marked-block.mjs';

const MODEL_CACHE = path.join(REPO_ROOT, 'tests', '.cache', 'models');

// The reranker id is read from the app so the test never drifts from it.
const html = fs.readFileSync(INDEX_HTML, 'utf8');
const RERANK_MODEL = (html.match(/const COMPENDIUM_RERANK_MODEL_ID = '([^']+)'/) || [])[1];

// Synthetic pairs. Each case has one passage that answers the question, an
// author bio under the same page heading (the shape that a heading-heavy
// search ranks first), and a passage on another subject.
const CASES = [
    {
        query: 'Why does a glucose monitor read low at night?',
        answer: 'When a participant sleeps on the sensor, pressure on the site lowers the fluid it reads and the monitor reports a false low. The graph shows a sudden steep drop.',
        bio: 'Jordan Example is a data architect at an academic research center with a decade of experience in analytics, dashboards, and technical writing.',
        other: 'Survey invitations can be sent by text message from the study platform once the messaging service is enabled for the project.'
    },
    {
        query: 'How do I filter list items by a lookup column?',
        answer: 'Use a filter query on the lookup field\'s id, for example Category/Id eq 12, so the list returns only the items that point at that lookup value.',
        bio: 'Casey Sample manages a research core and has led mobile technology projects for several longitudinal studies.',
        other: 'Sleep estimates from a wearable can be used as a predictor or an outcome, but the algorithm differs from one device to another.'
    }
];

// ### Load Dependency ###

let skip = false;
let transformers = null;
if (process.env.FSAI_SKIP_MODEL_TESTS === '1') {
    skip = 'FSAI_SKIP_MODEL_TESTS is set';
} else {
    try {
        transformers = await import('@huggingface/transformers');
    } catch {
        skip = 'test dependency not installed; run: npm ci --prefix tests';
    }
}

// ### Score Pairs ###

test('the reranker separates an answering passage from a bio and an unrelated passage', { skip, timeout: 900000 }, async () => {
    assert.ok(RERANK_MODEL, 'index.html names the reranker model');
    const { AutoTokenizer, AutoModelForSequenceClassification, env } = transformers;
    env.cacheDir = MODEL_CACHE;
    const tokenizer = await AutoTokenizer.from_pretrained(RERANK_MODEL);
    const model = await AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { dtype: 'fp32' });
    // Mirrors rerankHits in index.html: one query-and-passage pair per
    // call, the raw score read from the single logit.
    async function score(query, passage) {
        const out = await model(tokenizer(query, { text_pair: passage, padding: true, truncation: true }));
        return Number(out.logits.data[0]);
    }
    for (const c of CASES) {
        const answer = await score(c.query, c.answer);
        const bio = await score(c.query, c.bio);
        const other = await score(c.query, c.other);
        for (const v of [answer, bio, other]) assert.ok(Number.isFinite(v), 'score is a finite number');
        assert.ok(answer > bio, `answer (${answer.toFixed(2)}) must outscore the bio (${bio.toFixed(2)}) for: ${c.query}`);
        assert.ok(answer > other, `answer (${answer.toFixed(2)}) must outscore the unrelated passage (${other.toFixed(2)}) for: ${c.query}`);
        assert.ok(new Set([answer, bio, other]).size === 3, 'scores differ; a constant score would mean the reranker is not ranking');
    }
});
