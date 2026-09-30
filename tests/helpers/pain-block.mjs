// This file is part of Field Station AI
// tests/helpers/pain-block.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-29
// Last Modified: 2026-09-30
// Summary: Loads the marked block of index.html that holds the data and pure
// helpers of the Field Kit skill Estimate pain level, and the synthetic text
// fixture the model test scores. Shared by the pain estimate tests so both
// read the same names.
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
import { fileURLToPath } from 'node:url';
import { loadMarkedBlock } from './marked-block.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PAIN_BLOCK_NAME = 'Pain estimate: data and pure helpers';

export const PAIN_BLOCK_EXPORTS = [
    'PAIN_SCALE_VERSION', 'PAIN_NOT_STATED', 'PAIN_INTENSITY_LABELS', 'PAIN_INTERFERENCE_LABELS',
    'PAIN_DEFAULT_WORDING', 'PAIN_WORDING_SETS', 'PAIN_STATEMENT_MAX_CHARS', 'PAIN_SUPPORT_MIN',
    'PAIN_INTERFERENCE_MIN', 'PAIN_CLOSE_MARGIN', 'PAIN_LONG_TEXT_TOKENS', 'PAIN_TEXT_TOKEN_BUDGET',
    'PAIN_STATED_SCORE_LIMIT', 'PAIN_NOTE_SHORTENED', 'PAIN_NOTE_LONG', 'PAIN_NOTE_CLOSE',
    'validatePainStatement', 'clonePainWording', 'validatePainWording', 'isDefaultPainWording',
    'painSoftmax', 'painThreeWay', 'painSetScores', 'pickPainIntensity', 'pickPainInterference',
    'painFitTextToBudget', 'painNumberValue', 'findStatedPainScores', 'summarizeStatedPainScores',
    'summarizePainItem', 'painRound', 'painWordingLine', 'painExportColumns', 'painExportRow',
    'painLevelText', 'painChatSummary'
];

/** Returns the pain estimate block's constants and functions, evaluated with no browser. */
export function loadPainBlock() {
    return loadMarkedBlock(PAIN_BLOCK_NAME, PAIN_BLOCK_EXPORTS);
}

/** Builds an item's text, repeating the filler for the long-text items. */
export function fixtureText(fixture, item) {
    if (!item.repeat) return item.text;
    const filler = fixture.filler.repeat(item.repeat);
    return item.place === 'before' ? filler + item.text : item.text + ' ' + filler;
}

/** Returns the synthetic texts the model test scores. */
export function loadPainFixture() {
    const file = path.join(REPO_ROOT, 'tests', 'fixtures', 'pain-estimate-texts.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// The block runs in its own context, so its arrays and objects are not
// instances of this file's Array and Object. Copying through JSON gives
// plain values that deepEqual can compare.
export function plain(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
