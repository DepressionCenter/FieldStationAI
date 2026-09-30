// This file is part of Field Station AI
// tests/emotions.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-30
// Last Modified: 2026-09-30
// Summary: Checks the pure helpers behind Emotions and sentiment: the label
// lists, the top-feeling ranking, the table's "none above" cut, the
// three-way tone, and the download columns and rows, which must hold every
// label whatever the table shows. Evaluates the app's own block from
// index.html with no browser. All sample scores are synthetic.
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
import { loadMarkedBlock } from './helpers/marked-block.mjs';

// Values from the block live in their own realm, so their prototypes
// differ from this file's. Compare by content, not by identity.
const plain = (value) => JSON.parse(JSON.stringify(value));
const same = (actual, expected, message) => assert.deepEqual(plain(actual), plain(expected), message || 'values match');

const block = loadMarkedBlock('Emotions results: pure helpers', [
    'EMOTIONS_LABELS', 'EMOTIONS_CURATED', 'EMOTIONS_SENTIMENT_GROUPS', 'EMOTIONS_TABLE_MIN_SCORE',
    'EMOTIONS_TABLE_TOP_N', 'EMOTIONS_EXPORT_DECIMALS', 'EMOTIONS_EXPORT_KEYS', 'EMOTIONS_EXPORT_LABEL_PREFIX',
    'emotionsScoreByLabel', 'emotionsSentimentRollup', 'emotionsTopFeelings', 'emotionsTableCells',
    'emotionsNoneText', 'emotionsRound', 'emotionsExportColumns', 'emotionsExportRow'
]);
const {
    EMOTIONS_LABELS, EMOTIONS_CURATED, EMOTIONS_SENTIMENT_GROUPS, EMOTIONS_TABLE_MIN_SCORE, EMOTIONS_EXPORT_KEYS,
    emotionsScoreByLabel, emotionsSentimentRollup, emotionsTopFeelings, emotionsTableCells,
    emotionsNoneText, emotionsRound, emotionsExportColumns, emotionsExportRow
} = block;

// A synthetic result shaped like a warm, formal message: one strong
// positive label, a few small ones, and every curated label near zero.
function gratefulText() {
    const scores = {};
    for (const label of EMOTIONS_LABELS) scores[label] = 0.001;
    Object.assign(scores, { gratitude: 0.96, approval: 0.054, optimism: 0.031, joy: 0.0099, annoyance: 0.0036, disapproval: 0.0024 });
    return scores;
}

// ### Label Lists ###

test('the label lists are complete and consistent', () => {
    assert.equal(EMOTIONS_LABELS.length, 28);
    assert.equal(new Set(EMOTIONS_LABELS).size, 28, 'no label repeats');
    assert.equal(EMOTIONS_CURATED.length, 10);
    for (const label of EMOTIONS_CURATED) assert.ok(EMOTIONS_LABELS.includes(label), label + ' is a model label');
    const grouped = [].concat(EMOTIONS_SENTIMENT_GROUPS.positive, EMOTIONS_SENTIMENT_GROUPS.negative, EMOTIONS_SENTIMENT_GROUPS.ambiguous, ['neutral']);
    same(grouped.slice().sort(), EMOTIONS_LABELS.slice().sort(), 'every label is in exactly one tone group');
});

// ### Ranking ###

test('the model output becomes a label-to-score object', () => {
    const scores = emotionsScoreByLabel([{ label: 'joy', score: 0.5 }, { label: 'fear', score: 0.25 }]);
    same(scores, { joy: 0.5, fear: 0.25 });
});

test('the top feelings come from the chosen pool, highest first', () => {
    const scores = gratefulText();
    same(emotionsTopFeelings(scores, EMOTIONS_LABELS, 3).map(r => r.label), ['gratitude', 'approval', 'optimism']);
    same(emotionsTopFeelings(scores, EMOTIONS_CURATED, 3).map(r => r.label), ['joy', 'annoyance', 'disapproval']);
    same(emotionsTopFeelings({ joy: 0.5 }, EMOTIONS_LABELS, 3).map(r => r.label), ['joy'], 'missing labels are skipped');
    same(emotionsTopFeelings(null, EMOTIONS_LABELS, 3), []);
});

test('a tie keeps the pool order', () => {
    const scores = { sadness: 0.4, fear: 0.4, anger: 0.4 };
    same(emotionsTopFeelings(scores, EMOTIONS_CURATED, 2).map(r => r.label), ['sadness', 'fear']);
});

// ### The Table Cut ###

test('the table names no feeling when none reaches the cut', () => {
    assert.equal(EMOTIONS_TABLE_MIN_SCORE, 0.05);
    const shown = emotionsTableCells(gratefulText(), EMOTIONS_CURATED);
    assert.equal(shown.none, true);
    same(shown.cells, []);
    assert.equal(emotionsNoneText(), 'none above 5%');
});

test('the table shows only the feelings that reach the cut', () => {
    const shown = emotionsTableCells(gratefulText(), EMOTIONS_LABELS);
    assert.equal(shown.none, false);
    same(shown.cells.map(r => r.label), ['gratitude', 'approval'], 'optimism at 3.1% is left out');
    const edge = emotionsTableCells({ joy: 0.05, fear: 0.0499 }, EMOTIONS_LABELS);
    same(edge.cells.map(r => r.label), ['joy'], 'the cut is inclusive');
});

// ### Tone ###

test('the three-way tone adds up to one and follows the groups', () => {
    const tone = emotionsSentimentRollup(gratefulText());
    assert.ok(Math.abs(tone.positive + tone.negative + tone.neutral - 1) < 1e-9);
    assert.ok(tone.positive > 0.9, 'a grateful text reads as positive');
    const empty = emotionsSentimentRollup({});
    assert.equal(empty.positive + empty.negative + empty.neutral, 0, 'an empty result does not divide by zero');
});

// ### Downloads ###

test('the download columns hold the top three, the tone, and every label', () => {
    const columns = emotionsExportColumns([]);
    assert.equal(columns.length, EMOTIONS_EXPORT_KEYS.length + 28);
    same(columns.slice(0, 9).map(c => c.name), EMOTIONS_EXPORT_KEYS);
    same(columns.slice(9).map(c => c.name), EMOTIONS_LABELS.map(l => 'feeling_' + l));
    for (const c of columns) assert.equal(c.key, c.name, 'no collision, so key and name match');
});

test('an added column never overwrites a column the spreadsheet already has', () => {
    const columns = emotionsExportColumns(['id', 'Top_1_Feeling', 'feeling_joy', 'feeling_joy_2']);
    const byKey = Object.fromEntries(columns.map(c => [c.key, c.name]));
    assert.equal(byKey.top_1_feeling, 'top_1_feeling_2', 'the comparison ignores case');
    assert.equal(byKey.feeling_joy, 'feeling_joy_3', 'the suffix skips a taken number');
    assert.equal(byKey.top_2_feeling, 'top_2_feeling');
    assert.equal(new Set(columns.map(c => c.name.toLowerCase())).size, columns.length, 'added names are unique');
});

test('a download row ranks all 28 labels and rounds to four places', () => {
    const row = emotionsExportRow(gratefulText());
    assert.equal(row.top_1_feeling, 'gratitude');
    assert.equal(row.top_1_score, 0.96);
    assert.equal(row.top_2_feeling, 'approval');
    assert.equal(row.top_3_feeling, 'optimism');
    assert.equal(row.feeling_gratitude, 0.96);
    assert.equal(row.feeling_annoyance, 0.0036);
    assert.equal(row.feeling_grief, 0.001);
    assert.equal(emotionsRound(0.00004), 0);
    assert.equal(emotionsRound(0.12345), 0.1235);
    assert.ok(Math.abs(row.sentiment_positive + row.sentiment_negative + row.sentiment_neutral - 1) < 0.001);
});

test('a row with no result is empty in every column', () => {
    const row = emotionsExportRow(null);
    assert.equal(Object.keys(row).length, EMOTIONS_EXPORT_KEYS.length + 28);
    for (const value of Object.values(row)) assert.equal(value, '');
});

test('no download column or value can start a spreadsheet formula', () => {
    for (const c of emotionsExportColumns([])) assert.ok(/^[a-z]/.test(c.name), c.name);
    const row = emotionsExportRow(gratefulText());
    for (const value of Object.values(row)) assert.ok(typeof value === 'number' || /^[a-z]/.test(value), String(value));
});
