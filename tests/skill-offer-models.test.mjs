// This file is part of Field Station AI
// tests/skill-offer-models.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-28
// Last Modified: 2026-09-28
// Summary: Runs the chat's skill offer check over the prompt fixture with
// the real embedding model, in Node on the CPU, using the same package
// the app loads in the browser. Every prompt that asks for something a
// text skill does must get an offer for that skill, with the right part
// of the prompt as its text, and every other prompt must get none. Needs
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
import path from 'node:path';
import { REPO_ROOT, loadSkillOfferBlock, loadRouterBlock, loadFixture, plain } from './helpers/skill-offer-block.mjs';

// Same model id and settings as index.html. The app runs the embedder
// with 4-bit weights and 32-bit math; full precision is the reference
// those weights are checked against, so it is what the test uses.
const EMBED_MODEL = 'Xenova/bge-small-en-v1.5';
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

test('skill offer check against the real model', { skip, timeout: 900000 }, async (t) => {
    const { pipeline, env } = transformers;
    env.cacheDir = MODEL_CACHE;
    const block = loadSkillOfferBlock();
    const router = loadRouterBlock();
    const fixture = loadFixture();

    const embed = await pipeline('feature-extraction', EMBED_MODEL, { dtype: 'fp32' });
    const encode = async (strings) => {
        const out = await embed(strings.map(s => s.slice(0, TEXT_LIMIT)), { pooling: 'cls', normalize: true });
        assert.equal(out.dims[1], EMBED_DIMS);
        return out.data;
    };

    // One table of example lines, the router's lists and the offer
    // block's lists together, each row tagged with its list id.
    const lists = { ...plain(router.ROUTER_EXEMPLARS), ...plain(block.SKILL_OFFER_EXEMPLARS) };
    const rowIds = [];
    const rowLines = [];
    for (const id of Object.keys(lists)) {
        for (const line of lists[id]) { rowIds.push(id); rowLines.push(line); }
    }
    const rowVecs = await encode(rowLines);

    // A reading's score for a list is its highest cosine over that list's
    // rows; both sides are unit vectors, so a dot product.
    const scoresFor = (vecs, reading) => {
        const scores = {};
        for (let row = 0; row < rowIds.length; row++) {
            let dot = 0;
            for (let i = 0; i < EMBED_DIMS; i++) dot += vecs[reading * EMBED_DIMS + i] * rowVecs[row * EMBED_DIMS + i];
            const id = rowIds[row];
            if (!(id in scores) || dot > scores[id]) scores[id] = dot;
        }
        return scores;
    };

    // The best skill list and the best other list, for a failure message.
    const describe = (scores) => {
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const skill = sorted.find(([id]) => Object.hasOwn(block.SKILL_OFFER_INTENTS, id));
        const other = sorted.find(([id]) => !Object.hasOwn(block.SKILL_OFFER_INTENTS, id));
        return `${skill[0]} ${skill[1].toFixed(3)}, ${other[0]} ${other[1].toFixed(3)}, margin ${(skill[1] - other[1]).toFixed(3)}`;
    };

    // Reproduces skillOfferForPrompt() in index.html: every reading of
    // the prompt is encoded in one call, and the first reading that earns
    // an offer decides the skill and the text.
    const offerFor = async (prompt) => {
        const readings = plain(block.skillRequestCandidates(prompt));
        const vecs = await encode(readings.map(reading => reading.request));
        const detail = [];
        for (let i = 0; i < readings.length; i++) {
            const scores = scoresFor(vecs, i);
            detail.push(describe(scores));
            const skill = block.pickSkillOffer(scores);
            if (skill) return { skill, text: readings[i].text, detail };
        }
        return { skill: null, text: null, detail };
    };

    for (const item of fixture.offer) {
        await t.test(`offers ${item.skill}: ${item.prompt.slice(0, 70)}`, async () => {
            const result = await offerFor(item.prompt);
            assert.equal(result.skill, item.skill, JSON.stringify(result.detail));
            if (item.text !== undefined) assert.equal(result.text, item.text);
        });
    }
    for (const prompt of fixture.noOffer) {
        await t.test(`offers nothing: ${prompt.slice(0, 70)}`, async () => {
            const result = await offerFor(prompt);
            assert.equal(result.skill, null, JSON.stringify(result.detail));
        });
    }
});
