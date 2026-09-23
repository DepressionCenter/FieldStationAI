// This file is part of Field Station AI
// tests/crisis-models.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-23
// Summary: Runs the crisis check's embedding and tiebreak tiers over the
// prompt fixture with the real models, in Node on the CPU, using the same
// package the app loads in the browser. Every crisis prompt must end as a
// crisis and every research prompt must not. Needs the test dependency
// installed (npm ci --prefix tests); without it, or with
// FSAI_SKIP_MODEL_TESTS=1, the file skips itself so the fast suite stays
// dependency-free. Model files cache under tests/.cache/.
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
import path from 'node:path';
import { REPO_ROOT, loadCrisisBlock, loadFixture } from './helpers/crisis-block.mjs';

// Same model ids and settings as index.html. The app runs the embedder
// with 4-bit weights and 32-bit math; full precision is the reference
// those weights are checked against, so it is what the test uses.
const EMBED_MODEL = 'Xenova/bge-small-en-v1.5';
const NLI_MODEL = 'Xenova/nli-deberta-v3-xsmall';
const EMBED_DIMS = 384;
const TEXT_LIMIT = 400;
const MODEL_CACHE = path.join(REPO_ROOT, 'tests', '.cache', 'models');

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

// ### Score Prompts ###

test('crisis check against the real models', { skip, timeout: 900000 }, async (t) => {
    const { pipeline, env } = transformers;
    env.cacheDir = MODEL_CACHE;
    const block = loadCrisisBlock();
    const fixture = loadFixture();

    const embed = await pipeline('feature-extraction', EMBED_MODEL, { dtype: 'fp32' });
    let nli = null; // loaded only when a prompt lands in the ambiguous band

    const encode = async (strings) => {
        const out = await embed(strings.map(s => s.slice(0, TEXT_LIMIT)), { pooling: 'cls', normalize: true });
        assert.equal(out.dims[1], EMBED_DIMS);
        return out.data;
    };
    const crisisVecs = await encode(block.CRISIS_EXEMPLARS);
    const contrastVecs = await encode(block.CRISIS_CONTRAST_EXEMPLARS);

    // Max cosine over a list; both sides are unit vectors, so a dot product.
    const maxCosine = (vec, listVecs, count) => {
        let best = -Infinity;
        for (let row = 0; row < count; row++) {
            let dot = 0;
            const off = row * EMBED_DIMS;
            for (let i = 0; i < EMBED_DIMS; i++) dot += vec[i] * listVecs[off + i];
            if (dot > best) best = dot;
        }
        return best;
    };

    // Reproduces promptSignalsCrisis() in index.html tier by tier.
    const verdict = async (prompt) => {
        const trimmed = prompt.trim();
        if (block.crisisTier0(trimmed)) return { verdict: 'crisis', tier: 0 };
        const vec = await encode([trimmed]);
        const crisis = maxCosine(vec, crisisVecs, block.CRISIS_EXEMPLARS.length);
        const contrast = maxCosine(vec, contrastVecs, block.CRISIS_CONTRAST_EXEMPLARS.length);
        const scored = block.crisisVerdictFromScores(crisis, contrast);
        const detail = { tier: 1, crisis: crisis.toFixed(3), contrast: contrast.toFixed(3), margin: (crisis - contrast).toFixed(3) };
        if (scored !== 'ambiguous') return { verdict: scored, ...detail };
        if (!nli) nli = await pipeline('zero-shot-classification', NLI_MODEL, { dtype: 'q8' });
        const hyps = [block.CRISIS_NLI_HYPOTHESES.crisis, block.CRISIS_NLI_HYPOTHESES.topic];
        const res = await nli(trimmed.slice(0, TEXT_LIMIT), hyps);
        const wins = res.labels[0] === hyps[0];
        return { verdict: wins ? 'crisis' : 'none', ...detail, tier: 2, nli: res.scores[0].toFixed(3) };
    };

    for (const prompt of fixture.crisis) {
        await t.test(`shows the notice: ${prompt}`, async () => {
            const result = await verdict(prompt);
            assert.equal(result.verdict, 'crisis', JSON.stringify(result));
        });
    }
    for (const prompt of fixture.notCrisis) {
        await t.test(`answers normally: ${prompt}`, async () => {
            const result = await verdict(prompt);
            assert.equal(result.verdict, 'none', JSON.stringify(result));
        });
    }
});
