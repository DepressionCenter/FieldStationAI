// This file is part of Field Station AI
// tests/helpers/crisis-block.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-23
// Summary: Shared helpers for the crisis check tests. Cuts the crisis
// check's data block out of index.html and evaluates it in a bare
// JavaScript context, so the tests exercise the exact regexes, exemplar
// lists, thresholds, and pure helpers the app ships, without a browser.
// Also loads the shared prompt fixture.
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
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INDEX_HTML = path.join(REPO_ROOT, 'index.html');
export const FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'crisis-prompts.json');

// The two marker comments that fence the data block in index.html. The
// block between them must stay free of DOM and app state, because it is
// run here with nothing else loaded.
export const BLOCK_START = '// ### Crisis check: data and pure helpers (start) ###';
export const BLOCK_END = '// ### Crisis check: data and pure helpers (end) ###';

// Every name the block must define. The block's completion value is an
// object holding them, which is how a bare vm context hands them back.
export const BLOCK_EXPORTS = [
    'CRISIS_TIER0_MAX_CHARS', 'CRISIS_TIER0_RE', 'CRISIS_TIER0_TOPIC_RE', 'crisisTier0',
    'CRISIS_EXEMPLARS', 'CRISIS_CONTRAST_EXEMPLARS', 'CRISIS_NLI_HYPOTHESES',
    'CRISIS_COSINE_MIN', 'CRISIS_MARGIN_MIN', 'CRISIS_CLEAR_MARGIN', 'crisisVerdictFromScores'
];

/**
 * Returns the source text between the two markers, without the markers.
 * Throws when either marker is missing or they are out of order.
 */
export function crisisBlockSource() {
    const html = fs.readFileSync(INDEX_HTML, 'utf8');
    const start = html.indexOf(BLOCK_START);
    const end = html.indexOf(BLOCK_END);
    if (start === -1 || end === -1 || end < start) {
        throw new Error('index.html does not carry the crisis check data block markers');
    }
    return html.slice(start + BLOCK_START.length, end);
}

/**
 * Evaluates the data block in a fresh context with no globals beyond the
 * language itself, and returns its exported names as an object.
 */
export function loadCrisisBlock() {
    const source = crisisBlockSource() + '\n;({ ' + BLOCK_EXPORTS.join(', ') + ' })';
    return vm.runInNewContext(source, Object.create(null), { filename: 'crisis-block.js' });
}

/**
 * Loads the shared prompt fixture: { crisis, tier0, notCrisis }, each a
 * list of synthetic prompts.
 */
export function loadFixture() {
    return JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
}
