// This file is part of Field Station AI
// tests/crisis-check.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-23
// Summary: Tests the crisis check's data block without any model: the
// block evaluates on its own, the regex tier fires on every explicit
// first-person crisis prompt in the fixture and on none of the research
// prompts, the exemplar lists are well formed, and the thresholds are in
// range. The embedding and tiebreak tiers are covered by
// crisis-models.test.mjs. Runs with Node's built-in test runner and no
// dependencies.
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
import { loadCrisisBlock, loadFixture, BLOCK_EXPORTS } from './helpers/crisis-block.mjs';

const block = loadCrisisBlock();
const fixture = loadFixture();

// ### Block Contract ###

test('the data block evaluates on its own and defines every expected name', () => {
    for (const name of BLOCK_EXPORTS) {
        assert.notEqual(block[name], undefined, `the block does not define ${name}`);
    }
    assert.equal(Object.prototype.toString.call(block.CRISIS_TIER0_RE), '[object RegExp]');
    assert.equal(Object.prototype.toString.call(block.CRISIS_TIER0_TOPIC_RE), '[object RegExp]');
    assert.equal(typeof block.crisisTier0, 'function');
    assert.equal(typeof block.crisisVerdictFromScores, 'function');
});

// ### Fixture Shape ###

test('the fixture holds enough prompts of each kind', () => {
    assert.ok(fixture.crisis.length >= 15, 'at least ten English and five Spanish crisis prompts');
    assert.ok(fixture.notCrisis.length >= 10, 'at least ten research prompts');
    assert.ok(fixture.tier0.length > 0, 'a regex-tier subset');
    for (const prompt of fixture.tier0) {
        assert.ok(fixture.crisis.includes(prompt), `tier0 prompt is also a crisis prompt: ${prompt}`);
    }
});

// ### Regex Tier ###

for (const prompt of fixture.tier0) {
    test(`regex tier fires: ${prompt}`, () => {
        assert.equal(block.crisisTier0(prompt), true);
    });
}

for (const prompt of fixture.notCrisis) {
    test(`regex tier stays silent: ${prompt}`, () => {
        assert.equal(block.crisisTier0(prompt), false);
    });
}

test('regex tier ignores prompts longer than its limit', () => {
    const long = fixture.tier0[0] + ' ' + 'and then '.repeat(block.CRISIS_TIER0_MAX_CHARS / 9);
    assert.ok(long.length > block.CRISIS_TIER0_MAX_CHARS);
    assert.equal(block.crisisTier0(long), false);
});

test('regex tier accepts curly apostrophes', () => {
    assert.equal(block.crisisTier0('I don’t want to be alive anymore'), true);
});

// ### Exemplar Lists ###

for (const name of ['CRISIS_EXEMPLARS', 'CRISIS_CONTRAST_EXEMPLARS']) {
    test(`${name} is a non-empty list of short strings`, () => {
        const list = block[name];
        assert.ok(Array.isArray(list) && list.length >= 10, `${name} needs at least ten entries`);
        for (const entry of list) {
            assert.equal(typeof entry, 'string');
            assert.ok(entry.trim().length > 0 && entry.length <= 400, `entry out of range: ${entry}`);
        }
    });
}

test('the exemplar lists do not overlap', () => {
    const contrast = new Set(block.CRISIS_CONTRAST_EXEMPLARS.map(s => s.toLowerCase()));
    for (const entry of block.CRISIS_EXEMPLARS) {
        assert.ok(!contrast.has(entry.toLowerCase()), `appears in both lists: ${entry}`);
    }
});

test('the NLI hypotheses name a crisis and a topic', () => {
    assert.equal(typeof block.CRISIS_NLI_HYPOTHESES.crisis, 'string');
    assert.equal(typeof block.CRISIS_NLI_HYPOTHESES.topic, 'string');
    assert.notEqual(block.CRISIS_NLI_HYPOTHESES.crisis, block.CRISIS_NLI_HYPOTHESES.topic);
});

// ### Thresholds ###

test('thresholds sit in range and in order', () => {
    const { CRISIS_COSINE_MIN, CRISIS_MARGIN_MIN, CRISIS_CLEAR_MARGIN } = block;
    assert.ok(CRISIS_COSINE_MIN > 0 && CRISIS_COSINE_MIN < 1);
    assert.ok(CRISIS_MARGIN_MIN >= 0 && CRISIS_MARGIN_MIN < 1);
    assert.ok(CRISIS_CLEAR_MARGIN > CRISIS_MARGIN_MIN && CRISIS_CLEAR_MARGIN < 1);
});

test('the verdict helper follows the thresholds', () => {
    const { CRISIS_COSINE_MIN, CRISIS_MARGIN_MIN, CRISIS_CLEAR_MARGIN, crisisVerdictFromScores } = block;
    const high = Math.min(0.99, CRISIS_COSINE_MIN + 0.2);
    assert.equal(crisisVerdictFromScores(CRISIS_COSINE_MIN - 0.01, 0), 'none', 'below the floor');
    assert.equal(crisisVerdictFromScores(high, high - CRISIS_MARGIN_MIN / 2), 'none', 'topic overlap');
    assert.equal(crisisVerdictFromScores(high, high - CRISIS_CLEAR_MARGIN - 0.01), 'crisis', 'clear margin');
    assert.equal(crisisVerdictFromScores(high, high - (CRISIS_MARGIN_MIN + CRISIS_CLEAR_MARGIN) / 2), 'ambiguous', 'in the band');
});
