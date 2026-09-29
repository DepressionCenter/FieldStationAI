// This file is part of Field Station AI
// tests/helpers/crisis-block.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-29
// Summary: Shared helpers for the crisis check tests. Names the crisis
// check's data block in index.html and its exports, loads the block
// through the marked-block helper, and loads the shared prompt fixture.
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
import { REPO_ROOT, INDEX_HTML, blockMarkers, markedBlockSource, loadMarkedBlock } from './marked-block.mjs';

export { REPO_ROOT, INDEX_HTML };
export const FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'crisis-prompts.json');

// The block in index.html that holds the crisis check's data. It must stay
// free of DOM and app state, because it is run here with nothing else loaded.
export const BLOCK_NAME = 'Crisis check: data and pure helpers';
export const BLOCK_START = blockMarkers(BLOCK_NAME).start;
export const BLOCK_END = blockMarkers(BLOCK_NAME).end;

// Every name the block must define. The block's completion value is an
// object holding them, which is how a bare vm context hands them back.
export const BLOCK_EXPORTS = [
    'CRISIS_TIER0_MAX_CHARS', 'CRISIS_TIER0_RE', 'CRISIS_TIER0_TOPIC_RE', 'crisisTier0',
    'CRISIS_SUBJECT_RE', 'crisisMentionsSubject',
    'CRISIS_EXEMPLARS', 'CRISIS_CONTRAST_EXEMPLARS', 'CRISIS_EVERYDAY_EXEMPLARS', 'CRISIS_NLI_HYPOTHESES',
    'CRISIS_COSINE_MIN', 'CRISIS_MARGIN_MIN', 'CRISIS_CLEAR_MARGIN', 'CRISIS_EVERYDAY_MARGIN_MIN',
    'crisisVerdictFromScores',
    'CRISIS_ANSWERED_AFTER_NOTICE', 'crisisTurnAction'
];

/**
 * Returns the source text between the two markers, without the markers.
 * Throws when either marker is missing or they are out of order.
 */
export function crisisBlockSource() {
    return markedBlockSource(BLOCK_NAME);
}

/**
 * Evaluates the data block in a fresh context with no globals beyond the
 * language itself, and returns its exported names as an object.
 */
export function loadCrisisBlock() {
    return loadMarkedBlock(BLOCK_NAME, BLOCK_EXPORTS);
}

/**
 * Loads the shared prompt fixture: { crisis, tier0, notCrisis }, each a
 * list of synthetic prompts.
 */
export function loadFixture() {
    return JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
}
