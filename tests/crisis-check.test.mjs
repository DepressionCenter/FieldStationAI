// This file is part of Field Station AI
// tests/crisis-check.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-29
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
    assert.equal(Object.prototype.toString.call(block.CRISIS_SUBJECT_RE), '[object RegExp]');
    assert.equal(typeof block.crisisTier0, 'function');
    assert.equal(typeof block.crisisMentionsSubject, 'function');
    assert.equal(typeof block.crisisVerdictFromScores, 'function');
});

// ### Fixture Shape ###

test('the fixture holds enough prompts of each kind', () => {
    assert.ok(fixture.crisis.length >= 15, 'at least ten English and five Spanish crisis prompts');
    assert.ok(fixture.notCrisis.length >= 10, 'at least ten research prompts');
    assert.ok(fixture.everyday.length >= 20, 'at least twenty everyday prompts');
    assert.ok(fixture.noSubject.length >= 10, 'at least ten everyday prompts with no subject word');
    assert.ok(fixture.everyday.length > fixture.noSubject.length, 'everyday prompts that do use a subject word');
    assert.ok(fixture.tier0.length > 0, 'a regex-tier subset');
    for (const prompt of fixture.noSubject) {
        assert.ok(fixture.everyday.includes(prompt), `noSubject prompt is also an everyday prompt: ${prompt}`);
    }
    const mustShow = new Set(fixture.crisis.map(s => s.toLowerCase()));
    for (const prompt of [...fixture.notCrisis, ...fixture.everyday]) {
        assert.ok(!mustShow.has(prompt.toLowerCase()), `prompt is on both sides: ${prompt}`);
    }
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

for (const prompt of [...fixture.notCrisis, ...fixture.everyday]) {
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

// ### Subject Words ###

// A crisis prompt the gate dropped would never reach the models, so this
// is the check that the gate costs no fixture prompt its notice.
for (const prompt of fixture.crisis) {
    test(`a crisis prompt mentions the subject: ${prompt}`, () => {
        assert.equal(block.crisisMentionsSubject(prompt), true);
    });
}

for (const prompt of fixture.noSubject) {
    test(`dropped before any model runs: ${prompt}`, () => {
        assert.equal(block.crisisTier0(prompt), false);
        assert.equal(block.crisisMentionsSubject(prompt), false);
    });
}

test('every crisis exemplar mentions the subject', () => {
    for (const entry of block.CRISIS_EXEMPLARS) {
        assert.equal(block.crisisMentionsSubject(entry), true, `no prompt like this one could match it: ${entry}`);
    }
});

test('the subject check reads whole words, in any case, and survives bad input', () => {
    assert.equal(block.crisisMentionsSubject('I WANT TO DIE'), true);
    assert.equal(block.crisisMentionsSubject('what is the best diet for runners'), false, 'diet is not die');
    assert.equal(block.crisisMentionsSubject('how do I send an email'), false, 'send is not end');
    assert.equal(block.crisisMentionsSubject(''), false);
    assert.equal(block.crisisMentionsSubject(null), false);
    assert.equal(block.crisisMentionsSubject(undefined), false);
    assert.equal(block.crisisMentionsSubject('<script>alert(1)</script>'), false);
});

// ### Exemplar Lists ###

for (const name of ['CRISIS_EXEMPLARS', 'CRISIS_CONTRAST_EXEMPLARS', 'CRISIS_EVERYDAY_EXEMPLARS']) {
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
    const seen = new Map();
    for (const name of ['CRISIS_EXEMPLARS', 'CRISIS_CONTRAST_EXEMPLARS', 'CRISIS_EVERYDAY_EXEMPLARS']) {
        for (const entry of block[name]) {
            const key = entry.toLowerCase();
            assert.ok(!seen.has(key), `appears twice, in ${seen.get(key)} and ${name}: ${entry}`);
            seen.set(key, name);
        }
    }
});

// A prompt copied from a list scores 1.0 against it, which would say
// nothing about prompts the lists have not seen.
test('no everyday prompt in the fixture is copied from an exemplar list', () => {
    const exemplars = new Set([
        ...block.CRISIS_EXEMPLARS, ...block.CRISIS_CONTRAST_EXEMPLARS, ...block.CRISIS_EVERYDAY_EXEMPLARS
    ].map(s => s.toLowerCase()));
    for (const prompt of fixture.everyday) {
        assert.ok(!exemplars.has(prompt.toLowerCase()), `copied from a list: ${prompt}`);
    }
});

test('the NLI hypotheses name a crisis and a topic', () => {
    assert.equal(typeof block.CRISIS_NLI_HYPOTHESES.crisis, 'string');
    assert.equal(typeof block.CRISIS_NLI_HYPOTHESES.topic, 'string');
    assert.notEqual(block.CRISIS_NLI_HYPOTHESES.crisis, block.CRISIS_NLI_HYPOTHESES.topic);
});

// ### Thresholds ###

test('thresholds sit in range and in order', () => {
    const { CRISIS_COSINE_MIN, CRISIS_MARGIN_MIN, CRISIS_CLEAR_MARGIN, CRISIS_EVERYDAY_MARGIN_MIN } = block;
    assert.ok(CRISIS_COSINE_MIN > 0 && CRISIS_COSINE_MIN < 1);
    assert.ok(CRISIS_MARGIN_MIN >= 0 && CRISIS_MARGIN_MIN < 1);
    assert.ok(CRISIS_EVERYDAY_MARGIN_MIN >= 0 && CRISIS_EVERYDAY_MARGIN_MIN < 1);
    assert.ok(CRISIS_CLEAR_MARGIN > CRISIS_MARGIN_MIN && CRISIS_CLEAR_MARGIN < 1);
});

test('the verdict helper follows the thresholds', () => {
    const { CRISIS_COSINE_MIN, CRISIS_MARGIN_MIN, CRISIS_CLEAR_MARGIN, crisisVerdictFromScores } = block;
    const high = Math.min(0.99, CRISIS_COSINE_MIN + 0.2);
    assert.equal(crisisVerdictFromScores(CRISIS_COSINE_MIN - 0.01, 0, 0), 'none', 'below the floor');
    assert.equal(crisisVerdictFromScores(high, high - CRISIS_MARGIN_MIN / 2, 0), 'none', 'topic overlap');
    assert.equal(crisisVerdictFromScores(high, high - CRISIS_CLEAR_MARGIN - 0.01, 0), 'crisis', 'clear margin');
    assert.equal(crisisVerdictFromScores(high, high - (CRISIS_MARGIN_MIN + CRISIS_CLEAR_MARGIN) / 2, 0), 'ambiguous', 'in the band');
});

test('an everyday match as strong as the crisis match means no notice', () => {
    const { CRISIS_COSINE_MIN, CRISIS_EVERYDAY_MARGIN_MIN, crisisVerdictFromScores } = block;
    const high = Math.min(0.99, CRISIS_COSINE_MIN + 0.2);
    assert.equal(crisisVerdictFromScores(high, 0, high), 'none', 'equal scores');
    assert.equal(crisisVerdictFromScores(high, 0, high + 0.05), 'none', 'everyday ahead');
    assert.equal(crisisVerdictFromScores(high, 0, high - CRISIS_EVERYDAY_MARGIN_MIN / 2), 'none', 'inside the margin');
    assert.equal(crisisVerdictFromScores(high, 0, high - CRISIS_EVERYDAY_MARGIN_MIN - 0.01), 'crisis', 'past the margin');
});

test('a missing or invalid score never shows the notice', () => {
    const { crisisVerdictFromScores } = block;
    assert.equal(crisisVerdictFromScores(0.9, 0, undefined), 'none', 'no everyday score');
    assert.equal(crisisVerdictFromScores(0.9, 0, NaN), 'none');
    assert.equal(crisisVerdictFromScores(0.9, undefined, 0), 'none', 'no contrast score');
    assert.equal(crisisVerdictFromScores(undefined, 0, 0), 'none', 'no crisis score');
});

// ### Escalation ###

test('the first flagged prompt in a chat gets the notice with the continue line', () => {
    assert.equal(block.crisisTurnAction(false, 0), 'notice-continue');
});

test('the invited re-send is answered, and a further flagged prompt escalates', () => {
    const { crisisTurnAction, CRISIS_ANSWERED_AFTER_NOTICE } = block;
    assert.ok(Number.isInteger(CRISIS_ANSWERED_AFTER_NOTICE) && CRISIS_ANSWERED_AFTER_NOTICE >= 1);
    for (let flags = 0; flags < CRISIS_ANSWERED_AFTER_NOTICE; flags++) {
        assert.equal(crisisTurnAction(true, flags), 'answer', `flag ${flags} after the notice is answered`);
    }
    assert.equal(crisisTurnAction(true, CRISIS_ANSWERED_AFTER_NOTICE), 'notice-only');
    assert.equal(crisisTurnAction(true, CRISIS_ANSWERED_AFTER_NOTICE + 5), 'notice-only', 'stays escalated');
    assert.equal(crisisTurnAction(true, undefined), 'answer', 'a chat saved before the counter existed');
});
