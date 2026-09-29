// This file is part of Field Station AI
// tests/helpers/skill-offer-block.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-28
// Last Modified: 2026-09-28
// Summary: Loads what the skill offer tests share: the skill offer block
// and the router's intent data, both cut out of index.html and evaluated
// with no browser, and the synthetic prompt fixture.
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

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, INDEX_HTML, loadMarkedBlock } from './marked-block.mjs';

export { REPO_ROOT, INDEX_HTML };
export const FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'skill-offer-prompts.json');

// The two blocks in index.html these tests read. Both must stay free of
// DOM and app state, because they are run here with nothing else loaded.
export const OFFER_BLOCK_NAME = 'Skill offer: data and pure helpers';
export const ROUTER_BLOCK_NAME = 'Router intents: data';

export const OFFER_FUNCTIONS = ['skillRequestCandidates', 'pickSkillOffer'];
export const OFFER_CONSTANTS = [
    'SKILL_OFFER_INTENTS', 'SKILL_OFFER_CONTRAST_ID', 'SKILL_OFFER_EXEMPLARS',
    'SKILL_OFFER_MIN_SCORE', 'SKILL_OFFER_MIN_MARGIN',
    'SKILL_REQUEST_MAX_CHARS', 'SKILL_OFFER_MAX_CANDIDATES'
];
export const ROUTER_CONSTANTS = ['CORE_INTENTS', 'HINT_INTENTS', 'SKILL_HINT_TABLE', 'ROUTER_EXEMPLARS', 'ROUTER_NLI_HYPOTHESES'];

/** Evaluates the skill offer block and returns its names as an object. */
export function loadSkillOfferBlock() {
    return loadMarkedBlock(OFFER_BLOCK_NAME, [...OFFER_FUNCTIONS, ...OFFER_CONSTANTS]);
}

/** Evaluates the router's intent data and returns its names as an object. */
export function loadRouterBlock() {
    return loadMarkedBlock(ROUTER_BLOCK_NAME, ROUTER_CONSTANTS);
}

/**
 * Loads the prompt fixture: { offer, noOffer, knownMisses }. Each offer
 * entry is { skill, prompt, text? }; noOffer is a list of prompts.
 */
export function loadFixture() {
    return JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
}

/**
 * A block runs in its own context, so its arrays and objects are not
 * instances of the caller's Array and Object. Copying through JSON gives
 * plain values that deepEqual can compare.
 */
export function plain(value) {
    return JSON.parse(JSON.stringify(value));
}
