// This file is part of Field Station AI
// tests/skill-offer.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-28
// Last Modified: 2026-09-28
// Summary: Checks the data and pure helpers behind the chat's skill offer
// with no model and no browser: how a prompt is split into a request and
// the text it is about, how one scored request turns into an offer or
// none, and that the lists, thresholds, and prompt fixture are sound.
// Evaluates the app's own blocks from index.html. All sample text is
// synthetic.
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
import {
    INDEX_HTML, OFFER_FUNCTIONS, loadSkillOfferBlock, loadRouterBlock, loadFixture, plain
} from './helpers/skill-offer-block.mjs';

const block = loadSkillOfferBlock();
const router = loadRouterBlock();
const fixture = loadFixture();
const html = fs.readFileSync(INDEX_HTML, 'utf8');

const { skillRequestCandidates, pickSkillOffer } = block;
const {
    SKILL_OFFER_INTENTS, SKILL_OFFER_CONTRAST_ID, SKILL_OFFER_EXEMPLARS,
    SKILL_OFFER_MIN_SCORE, SKILL_OFFER_MIN_MARGIN, SKILL_REQUEST_MAX_CHARS, SKILL_OFFER_MAX_CANDIDATES
} = block;

const TEXT = 'The visit went well and I left feeling hopeful about the new plan.';

// The ids of the skills the app marks as ready, read from its SKILLS list.
function readySkillIds() {
    const ids = [];
    const entry = /\{ id: '([\w-]+)',[^\n]*status: '([\w-]+)' \}/g;
    let match;
    while ((match = entry.exec(html)) !== null) {
        if (match[2] === 'ready') ids.push(match[1]);
    }
    return ids;
}

// Scores that pass both bars for one list, with every other list far below.
function passingScores(id) {
    return { [id]: SKILL_OFFER_MIN_SCORE + 0.1, factual: 0.4, [SKILL_OFFER_CONTRAST_ID]: 0.4 };
}

// ### Block Contract ###

test('the skill offer block evaluates on its own and exports its helpers', () => {
    for (const name of OFFER_FUNCTIONS) assert.equal(typeof block[name], 'function', name + ' is a function');
    for (const bar of [SKILL_OFFER_MIN_SCORE, SKILL_OFFER_MIN_MARGIN]) {
        assert.ok(typeof bar === 'number' && bar > 0 && bar < 1, 'each bar is a number between 0 and 1');
    }
    assert.ok(Number.isInteger(SKILL_REQUEST_MAX_CHARS) && SKILL_REQUEST_MAX_CHARS > 0, 'the request limit is a positive whole number');
    assert.ok(Number.isInteger(SKILL_OFFER_MAX_CANDIDATES) && SKILL_OFFER_MAX_CANDIDATES >= 1, 'at least one reading is scored');
});

test('the router block evaluates on its own', () => {
    assert.ok(Object.keys(plain(router.ROUTER_EXEMPLARS)).length > 0, 'the router has example lists');
    for (const id of router.CORE_INTENTS) {
        assert.ok(Array.isArray(plain(router.ROUTER_EXEMPLARS)[id]), `the intent ${id} has an example list`);
    }
});

// ### Lists ###

test('every offered skill is a ready skill of the app', () => {
    const ready = readySkillIds();
    assert.ok(ready.length > 0, 'the SKILLS list was read');
    for (const [intent, skillId] of Object.entries(plain(SKILL_OFFER_INTENTS))) {
        assert.ok(ready.includes(skillId), `${intent} points at the ready skill ${skillId}`);
    }
});

test('every offered skill has one example list, and the contrast list is not a skill', () => {
    const offerLists = plain(SKILL_OFFER_EXEMPLARS);
    const routerLists = plain(router.ROUTER_EXEMPLARS);
    for (const intent of Object.keys(plain(SKILL_OFFER_INTENTS))) {
        const here = Array.isArray(offerLists[intent]);
        const there = Array.isArray(routerLists[intent]);
        assert.ok(here !== there, `${intent} has an example list in exactly one block`);
    }
    assert.ok(!Object.hasOwn(SKILL_OFFER_INTENTS, SKILL_OFFER_CONTRAST_ID), 'the contrast list opens no skill');
    assert.ok(offerLists[SKILL_OFFER_CONTRAST_ID].length > 0, 'the contrast list is not empty');
});

// The app scores a request against both blocks' lists in one table, keyed
// by list id. A shared id would let one list replace the other.
test('no list id is used by both blocks', () => {
    const routerIds = Object.keys(plain(router.ROUTER_EXEMPLARS));
    for (const id of Object.keys(plain(SKILL_OFFER_EXEMPLARS))) {
        assert.ok(!routerIds.includes(id), `${id} is not also a router list`);
    }
});

test('the example lists hold no blank, repeated, or shared lines', () => {
    const lists = plain(SKILL_OFFER_EXEMPLARS);
    const seen = new Map();
    for (const [id, lines] of Object.entries(lists)) {
        assert.ok(lines.length >= 5, `${id} has at least five lines`);
        for (const line of lines) {
            assert.ok(typeof line === 'string' && line.trim().length > 0, `${id} has no blank line`);
            const key = line.trim().toLowerCase();
            assert.ok(!seen.has(key), `"${line}" appears once (in ${id} and ${seen.get(key)})`);
            seen.set(key, id);
        }
    }
});

// ### Splitting a Prompt ###

test('a request before a colon is split from its text', () => {
    const found = plain(skillRequestCandidates('Analyze this text for sentiment: ' + TEXT));
    assert.deepEqual(found[0], { request: 'Analyze this text for sentiment', text: TEXT });
});

test('a request on the first line is split from the lines below it', () => {
    const found = plain(skillRequestCandidates('Find the names in the text below\n\n' + TEXT + '\nA second line.'));
    assert.deepEqual(found[0], { request: 'Find the names in the text below', text: TEXT + '\nA second line.' });
});

test('a request that ends in a question mark keeps the mark', () => {
    const found = plain(skillRequestCandidates('What emotions are in this text? ' + TEXT));
    assert.deepEqual(found[0], { request: 'What emotions are in this text?', text: TEXT });
});

test('a request that ends in a period is split from its text', () => {
    const found = plain(skillRequestCandidates('Rate the pain in the following text. ' + TEXT));
    assert.deepEqual(found[0], { request: 'Rate the pain in the following text.', text: TEXT });
});

test('a title such as "Dr." does not end a request', () => {
    const found = plain(skillRequestCandidates('Find names and places: Dr. Rivera met the team in Toledo.'));
    assert.deepEqual(found[0], { request: 'Find names and places', text: 'Dr. Rivera met the team in Toledo.' });
});

test('a clock time or a web address is not read as a colon split', () => {
    for (const prompt of ['At 10:30 my knee hurt so much I sat down', 'See https://example.org/page for the form']) {
        assert.deepEqual(plain(skillRequestCandidates(prompt)), [{ request: prompt, text: prompt }]);
    }
});

test('quoted text is split from the request around it', () => {
    const straight = plain(skillRequestCandidates('what is the sentiment of "I hate waiting in line"'));
    assert.deepEqual(straight[0], { request: 'what is the sentiment of', text: 'I hate waiting in line' });
    const curly = plain(skillRequestCandidates('what is the sentiment of “I hate waiting in line”'));
    assert.deepEqual(curly[0], { request: 'what is the sentiment of', text: 'I hate waiting in line' });
});

test('one quoted word is not taken as the text', () => {
    const prompt = 'what does "affect" mean';
    assert.deepEqual(plain(skillRequestCandidates(prompt)), [{ request: prompt, text: prompt }]);
});

test('a request on the last line is split from the lines above it', () => {
    const found = plain(skillRequestCandidates(TEXT + '\nIt rained all week.\n\nWhat is the sentiment here?'));
    assert.ok(found.some(c => c.request === 'What is the sentiment here?' && c.text === TEXT + '\nIt rained all week.'));
});

test('a closing question is split from the sentences before it', () => {
    const found = plain(skillRequestCandidates('I loved the new garden. It made my week. How does the writer feel?'));
    assert.ok(found.some(c => c.request === 'How does the writer feel?' && c.text === 'I loved the new garden. It made my week.'));
});

test('the whole prompt is always the last reading', () => {
    for (const prompt of ['analyze this text for sentiment', 'Analyze this: ' + TEXT, TEXT + '\nWhat is the tone?']) {
        const found = plain(skillRequestCandidates(prompt));
        assert.deepEqual(found[found.length - 1], { request: prompt, text: prompt });
    }
});

test('a request with no text gives the whole prompt only', () => {
    assert.deepEqual(plain(skillRequestCandidates('  analyze this text for sentiment  ')), [
        { request: 'analyze this text for sentiment', text: 'analyze this text for sentiment' }
    ]);
});

test('Windows and old Mac line endings split like any other', () => {
    for (const ending of ['\r\n', '\r']) {
        const found = plain(skillRequestCandidates('Find the names below' + ending + TEXT));
        assert.deepEqual(found[0], { request: 'Find the names below', text: TEXT });
    }
});

// ### Empty and Invalid Input ###

test('blank input gives no reading', () => {
    for (const blank of ['', '   ', '\n\n', '\t']) {
        assert.deepEqual(plain(skillRequestCandidates(blank)), []);
    }
});

test('a value that is not a string gives no reading', () => {
    for (const value of [null, undefined, 42, true, {}, [], ['analyze this'], () => 'analyze this']) {
        assert.deepEqual(plain(skillRequestCandidates(value)), []);
    }
});

// ### Boundaries ###

test('a lead longer than the limit is text, not a request', () => {
    const long = 'word '.repeat(SKILL_REQUEST_MAX_CHARS).trim();
    const prompt = long + ': ' + TEXT;
    assert.deepEqual(plain(skillRequestCandidates(prompt)), [{ request: prompt, text: prompt }]);
});

test('a lead at the limit is still a request', () => {
    const lead = 'a'.repeat(SKILL_REQUEST_MAX_CHARS);
    const found = plain(skillRequestCandidates(lead + ': ' + TEXT));
    assert.deepEqual(found[0], { request: lead, text: TEXT });
});

test('no prompt gives more readings than the limit', () => {
    const prompts = [
        'Find the names: ' + TEXT + '\nMore text here.\nWhat is the tone?',
        'What is this? "Some quoted text here" and more. Is it sad?',
        ...fixture.offer.map(item => item.prompt),
        ...fixture.noOffer
    ];
    for (const prompt of prompts) {
        const found = skillRequestCandidates(prompt);
        assert.ok(found.length >= 1 && found.length <= SKILL_OFFER_MAX_CANDIDATES, `${found.length} readings for: ${prompt.slice(0, 40)}`);
    }
});

test('a very long prompt is handled without being cut', () => {
    const body = (TEXT + ' ').repeat(5000).trim();
    const found = plain(skillRequestCandidates('Analyze this text for sentiment: ' + body));
    assert.equal(found[0].request, 'Analyze this text for sentiment');
    assert.equal(found[0].text, body);
});

// ### Untrusted Text ###

// A prompt is untrusted input. The helper only cuts and trims it, so
// markup comes back as the same characters and nothing else is added.
test('markup in a prompt stays plain text', () => {
    const hostile = '<img src=x onerror="alert(1)"><script>alert(2)</script> I felt fine & calm.';
    const found = plain(skillRequestCandidates('Analyze this text for sentiment: ' + hostile));
    assert.deepEqual(found[0], { request: 'Analyze this text for sentiment', text: hostile });
    for (const reading of found) {
        assert.deepEqual(Object.keys(reading).sort(), ['request', 'text']);
        assert.equal(typeof reading.request, 'string');
        assert.equal(typeof reading.text, 'string');
    }
});

// The skill that opens is chosen from a fixed table, never from the
// prompt. Text that names a skill, or a property every object has, must
// not steer the choice.
test('a list id that is not in the table never opens a skill', () => {
    for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'emotions', 'ner', 'summarize']) {
        const scores = Object.create(null);
        scores[id] = 0.99;
        scores.factual = 0.3;
        assert.equal(pickSkillOffer(scores), null, `${id} opens nothing`);
    }
});

// ### Choosing an Offer ###

test('a skill list that clears both bars opens its skill', () => {
    for (const [intent, skillId] of Object.entries(plain(SKILL_OFFER_INTENTS))) {
        assert.equal(pickSkillOffer(passingScores(intent)), skillId);
    }
});

test('a score under the bar gives no offer, however wide the margin', () => {
    assert.equal(pickSkillOffer({ 'detect-emotions': SKILL_OFFER_MIN_SCORE - 0.01, factual: 0.1 }), null);
});

test('a margin under the bar gives no offer, however high the score', () => {
    const near = 0.95 - SKILL_OFFER_MIN_MARGIN + 0.01;
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.95, summarize: near }), null);
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.95, [SKILL_OFFER_CONTRAST_ID]: near }), null);
});

test('a margin just over the bar gives the offer', () => {
    const far = 0.95 - SKILL_OFFER_MIN_MARGIN - 0.01;
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.95, summarize: far, [SKILL_OFFER_CONTRAST_ID]: far }), 'emotions');
});

test('another list that scores higher gives no offer', () => {
    assert.equal(pickSkillOffer({ 'find-names-places': 0.85, factual: 0.9 }), null);
    assert.equal(pickSkillOffer({ 'estimate-pain-level': 0.85, [SKILL_OFFER_CONTRAST_ID]: 0.97 }), null);
});

test('the higher of two skill lists is the one offered', () => {
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.84, 'estimate-pain-level': 0.92, factual: 0.5 }), 'pain-level');
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.92, 'estimate-pain-level': 0.84, factual: 0.5 }), 'emotions');
});

test('no scores, or scores that are not numbers, give no offer', () => {
    for (const scores of [null, undefined, {}, { 'detect-emotions': NaN }, { 'detect-emotions': '0.99' }, { 'detect-emotions': null }]) {
        assert.equal(pickSkillOffer(scores), null);
    }
});

test('a score that is not a number is skipped, not counted', () => {
    assert.equal(pickSkillOffer({ 'detect-emotions': 0.9, factual: NaN, summarize: 'high' }), 'emotions');
});

// ### Prompt Fixture ###

test('the fixture covers every offered skill and both outcomes', () => {
    const skills = Object.values(plain(SKILL_OFFER_INTENTS));
    for (const skillId of skills) {
        const count = fixture.offer.filter(item => item.skill === skillId).length;
        assert.ok(count >= 5, `${skillId} has at least five prompts (${count})`);
    }
    for (const item of [...fixture.offer, ...fixture.knownMisses]) {
        assert.ok(skills.includes(item.skill), `${item.skill} is an offered skill`);
        assert.ok(typeof item.prompt === 'string' && item.prompt.trim().length > 0, 'each prompt is text');
    }
    assert.ok(fixture.noOffer.length >= 10, 'at least ten prompts that must get no offer');
});

test('no prompt is in the fixture twice', () => {
    const seen = new Set();
    const all = [...fixture.offer.map(item => item.prompt), ...fixture.noOffer, ...fixture.knownMisses.map(item => item.prompt)];
    for (const prompt of all) {
        assert.ok(!seen.has(prompt), `"${prompt.slice(0, 60)}" appears once`);
        seen.add(prompt);
    }
});

// The model decides which reading wins. This checks, without a model,
// that the text each prompt must hand over is one of the readings.
test('the text each fixture prompt must hand over is one of its readings', () => {
    for (const item of fixture.offer) {
        if (item.text === undefined) continue;
        const found = plain(skillRequestCandidates(item.prompt));
        assert.ok(found.some(reading => reading.text === item.text), `a reading carries the text of: ${item.prompt.slice(0, 60)}`);
    }
});
