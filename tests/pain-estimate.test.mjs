// This file is part of Field Station AI
// tests/pain-estimate.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-29
// Last Modified: 2026-09-29
// Summary: Checks the pure helpers behind the Field Kit skill Estimate pain
// level: the default statements, the checks on statements a person types,
// how a level is picked and when the result is "not stated", how scores the
// writer states are found, and the columns and rows of the download.
// Evaluates the app's own block from index.html with no browser and no
// model. All sample text is synthetic.
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
import { loadPainBlock, loadPainFixture, fixtureText, plain } from './helpers/pain-block.mjs';

const block = loadPainBlock();
const {
    validatePainStatement, clonePainWording, validatePainWording, isDefaultPainWording,
    painThreeWay, painSetScores, pickPainIntensity, pickPainInterference, painFitTextToBudget,
    findStatedPainScores, summarizeStatedPainScores, summarizePainItem,
    painExportColumns, painExportRow, painChatSummary
} = block;
const {
    PAIN_SCALE_VERSION, PAIN_NOT_STATED, PAIN_INTENSITY_LABELS, PAIN_INTERFERENCE_LABELS,
    PAIN_DEFAULT_WORDING, PAIN_STATEMENT_MAX_CHARS, PAIN_SUPPORT_MIN, PAIN_INTERFERENCE_MIN,
    PAIN_CLOSE_MARGIN, PAIN_LONG_TEXT_TOKENS, PAIN_TEXT_TOKEN_BUDGET, PAIN_STATED_SCORE_LIMIT
} = block;
// The model's three answers sit at these positions in its raw scores.
const IDS = { contradiction: 0, neutral: 1, entailment: 2 };

const defaults = () => plain(PAIN_DEFAULT_WORDING);
const statedTexts = text => plain(findStatedPainScores(text)).map(f => f.text);

// One item as the skill records it: pain and interference both stated.
function sampleResult(changes) {
    return {
        intensityShares: [0.05, 0.15, 0.6, 0.2],
        intensitySupport: [0.01, 0.4, 0.9, 0.3],
        interference: { agree: 0.8, disagree: 0.05, neither: 0.15 },
        textTokens: 40,
        stated: [{ text: '7 out of 10', value: 7, scaleMax: 10 }],
        shortened: false,
        model: 'Xenova/bart-large-mnli',
        modelVariant: 'wasm/q4',
        runtime: 'transformers.js 4.2.0',
        wording: defaults(),
        runAtUtc: '2026-09-29T15:00:00.000Z',
        ...changes
    };
}

// ### Block Contract ###

test('the pain block evaluates on its own and exports its helpers', () => {
    for (const name of ['validatePainStatement', 'validatePainWording', 'painThreeWay', 'painSetScores', 'pickPainIntensity', 'pickPainInterference', 'painFitTextToBudget', 'findStatedPainScores', 'painExportColumns', 'painExportRow', 'painChatSummary']) {
        assert.equal(typeof block[name], 'function', name + ' is a function');
    }
    assert.equal(PAIN_SCALE_VERSION, '2');
    assert.equal(PAIN_NOT_STATED, 'not stated');
});

test('the scales start at 0, with four intensity levels and one interference statement', () => {
    assert.deepEqual(plain(PAIN_INTENSITY_LABELS), ['none', 'mild', 'moderate', 'severe']);
    assert.deepEqual(plain(PAIN_INTERFERENCE_LABELS), ['does not limit activities', 'limits activities']);
    assert.equal(PAIN_DEFAULT_WORDING.intensity.length, PAIN_INTENSITY_LABELS.length);
    assert.equal(PAIN_DEFAULT_WORDING.interference.length, 1);
});

test('the thresholds are scores between 0 and 1 and the token limits are whole numbers', () => {
    for (const value of [PAIN_SUPPORT_MIN, PAIN_INTERFERENCE_MIN, PAIN_CLOSE_MARGIN]) {
        assert.ok(value > 0 && value < 1, value + ' is between 0 and 1');
    }
    assert.ok(Number.isInteger(PAIN_LONG_TEXT_TOKENS) && PAIN_LONG_TEXT_TOKENS > 0);
    assert.ok(Number.isInteger(PAIN_TEXT_TOKEN_BUDGET) && PAIN_TEXT_TOKEN_BUDGET > PAIN_LONG_TEXT_TOKENS && PAIN_TEXT_TOKEN_BUDGET < 1024);
});

// The interface and the download must not name a questionnaire, a
// population, or a 0 to 10 scale the skill does not produce.
test('the default statements name no instrument, population, or 0 to 10 scale', () => {
    const all = [...PAIN_DEFAULT_WORDING.intensity, ...PAIN_DEFAULT_WORDING.interference].join(' ');
    assert.ok(!/promis|brief pain inventory|\bbpi\b|\bpeg\b|dvprs|autis|\b10\b|worst pain imaginable/i.test(all), all);
});

// ### Default Wording ###

test('the default wording passes its own checks', () => {
    const check = plain(validatePainWording(defaults()));
    assert.equal(check.ok, true);
    for (const set of Object.keys(check.errors)) {
        for (const message of check.errors[set]) assert.equal(message, '');
    }
    assert.equal(isDefaultPainWording(defaults()), true);
});

test('an edited statement is no longer the default', () => {
    const wording = defaults();
    wording.intensity[3] = 'The person has very strong pain.';
    assert.equal(validatePainWording(wording).ok, true);
    assert.equal(isDefaultPainWording(wording), false);
});

test('statements are trimmed before they are compared or kept', () => {
    const wording = defaults();
    wording.intensity[0] = '  ' + wording.intensity[0] + '  ';
    assert.equal(isDefaultPainWording(wording), true);
    assert.equal(clonePainWording(wording).intensity[0], PAIN_DEFAULT_WORDING.intensity[0]);
});

// ### Statement Checks ###

test('a plain statement is allowed', () => {
    assert.equal(validatePainStatement('The person has mild pain.'), '');
    assert.equal(validatePainStatement('Pain stops the person from working (most days); it is severe.'), '');
    assert.equal(validatePainStatement('La persona tiene dolor leve.'), '');
    assert.equal(validatePainStatement('The person’s pain is mild.'), '');
});

test('empty and non-text statements are refused', () => {
    for (const value of ['', '   ', null, undefined, 7, {}, []]) {
        assert.notEqual(validatePainStatement(value), '', JSON.stringify(value) + ' is refused');
    }
});

test('a statement at the length limit is allowed and one past it is refused', () => {
    assert.equal(validatePainStatement('a'.repeat(PAIN_STATEMENT_MAX_CHARS)), '');
    assert.notEqual(validatePainStatement('a'.repeat(PAIN_STATEMENT_MAX_CHARS + 1)), '');
});

// A statement is written to a CSV file. A spreadsheet reads a cell that
// starts with one of these characters as a formula.
test('a statement that a spreadsheet would read as a formula is refused', () => {
    for (const text of ['=HYPERLINK("http://example.invalid")', '+1 pain', '-1 pain', '@SUM(A1)', '\tThe person has pain.=1', '1 pain']) {
        assert.notEqual(validatePainStatement(text), '', JSON.stringify(text) + ' is refused');
    }
});

test('a statement that holds markup or template characters is refused', () => {
    for (const text of ['The person <b>has</b> pain.', 'Pain <script>alert(1)</script>', 'Pain "quoted"', 'Pain & more', 'Pain {} here', 'Pain $& here', 'Pain\nsecond line', 'Pain `x`']) {
        assert.notEqual(validatePainStatement(text), '', JSON.stringify(text) + ' is refused');
    }
});

test('a repeated statement inside one set is refused', () => {
    const wording = defaults();
    wording.intensity[2] = wording.intensity[1].toUpperCase();
    const check = plain(validatePainWording(wording));
    assert.equal(check.ok, false);
    assert.equal(check.errors.intensity[1], '');
    assert.notEqual(check.errors.intensity[2], '');
});

test('wording of the wrong shape is refused', () => {
    const short = defaults();
    short.intensity.pop();
    const missing = defaults();
    delete missing.interference;
    const notText = defaults();
    notText.interference[0] = 42;
    for (const wording of [null, undefined, 'text', [], {}, short, missing, notText]) {
        assert.equal(clonePainWording(wording), null);
        assert.equal(validatePainWording(wording).ok, false);
        assert.equal(isDefaultPainWording(wording), false);
    }
});

// ### Reading the Model ###

test('three raw scores become three probabilities that add up to 1', () => {
    const three = plain(painThreeWay([1, 0, 3], IDS));
    assert.ok(three.agree > three.disagree && three.disagree > three.neither);
    assert.ok(Math.abs(three.agree + three.disagree + three.neither - 1) < 1e-9);
    const swapped = plain(painThreeWay([3, 0, 1], { contradiction: 2, neutral: 1, entailment: 0 }));
    for (const key of ['agree', 'disagree', 'neither']) assert.ok(Math.abs(swapped[key] - three[key]) < 1e-9, key);
});

test('unusable raw scores give null', () => {
    for (const logits of [null, undefined, [], [1, 2], [1, 2, 3, 4], [1, NaN, 2], [1, 'a', 2]]) {
        assert.equal(painThreeWay(logits, IDS), null, JSON.stringify(logits));
    }
    assert.equal(painThreeWay([1, 2, 3], null), null);
});

test('a set of statements gets shares that add up to 1 and its own support', () => {
    const set = plain(painSetScores([[0, 0, 4], [0, 0, 2], [0, 0, 1], [0, 0, 0]], IDS));
    assert.ok(Math.abs(set.shares.reduce((a, b) => a + b, 0) - 1) < 1e-9);
    assert.ok(set.shares[0] > set.shares[1] && set.shares[1] > set.shares[2] && set.shares[2] > set.shares[3]);
    assert.ok(set.support[0] > 0.9 && set.support[3] < 0.4);
    assert.equal(painSetScores([[0, 0, 4], [0, NaN, 2]], IDS), null);
    assert.equal(painSetScores([], IDS), null);
});

// ### Picking a Level ###

test('the intensity level with the highest share is picked', () => {
    const pick = plain(pickPainIntensity([0.1, 0.2, 0.6, 0.1], [0.1, 0.5, 0.95, 0.2]));
    assert.deepEqual(pick, { stated: true, level: 2, label: 'moderate', matchScore: 0.6, close: false });
});

test('level 0 can be picked, and it is not the same as not stated', () => {
    const pick = plain(pickPainIntensity([0.7, 0.1, 0.1, 0.1], [0.99, 0.1, 0.05, 0.01]));
    assert.deepEqual(pick, { stated: true, level: 0, label: 'none', matchScore: 0.7, close: false });
});

test('equal top shares give the lower level and count as a close call', () => {
    const pick = pickPainIntensity([0.1, 0.4, 0.4, 0.1], [0.2, 0.9, 0.9, 0.1]);
    assert.equal(pick.level, 1);
    assert.equal(pick.close, true);
});

test('a close call is flagged only inside the margin', () => {
    const near = PAIN_CLOSE_MARGIN - 0.01;
    assert.equal(pickPainIntensity([0.05, 0.45, 0.45 - near, 0.05 + near], [0.1, 0.9, 0.9, 0.5]).close, true);
    assert.equal(pickPainIntensity([0.05, 0.6, 0.3, 0.05], [0.1, 0.9, 0.9, 0.5]).close, false);
});

test('intensity is not stated when no statement has enough support', () => {
    const pick = plain(pickPainIntensity([0.1, 0.2, 0.6, 0.1], [0.01, 0.02, PAIN_SUPPORT_MIN - 0.01, 0.01]));
    assert.deepEqual(pick, { stated: false, level: null, label: 'not stated', matchScore: null, close: false });
    assert.equal(pickPainIntensity([0.1, 0.2, 0.6, 0.1], [0.01, 0.02, PAIN_SUPPORT_MIN, 0.01]).stated, true);
});

test('missing or unusable intensity scores give not stated', () => {
    for (const [shares, support] of [[null, [0.9, 0.9, 0.9, 0.9]], [[0.5, 0.5], [0.9, 0.9]], [[0.1, 0.2, NaN, 0.1], [0.9, 0.9, 0.9, 0.9]], [[0.1, 0.2, 0.6, 0.1], null], [[0.1, 0.2, 0.6, 0.1], [0.9, '0.9', 0.9, 0.9]]]) {
        assert.equal(pickPainIntensity(shares, support).stated, false);
    }
});

test('interference is limits, does not limit, or not stated', () => {
    assert.deepEqual(plain(pickPainInterference({ agree: 0.9, disagree: 0.05, neither: 0.05 }, true)), { stated: true, level: 1, label: 'limits activities', matchScore: 0.9 });
    assert.deepEqual(plain(pickPainInterference({ agree: 0.02, disagree: 0.96, neither: 0.02 }, true)), { stated: true, level: 0, label: 'does not limit activities', matchScore: 0.96 });
    assert.deepEqual(plain(pickPainInterference({ agree: 0.03, disagree: 0.01, neither: 0.96 }, true)), { stated: false, level: null, label: 'not stated', matchScore: null });
});

test('interference at the threshold counts, and below it does not', () => {
    assert.equal(pickPainInterference({ agree: PAIN_INTERFERENCE_MIN, disagree: 0.1, neither: 0.4 }, true).stated, true);
    assert.equal(pickPainInterference({ agree: PAIN_INTERFERENCE_MIN - 0.01, disagree: 0.1, neither: 0.41 }, true).stated, false);
});

test('interference is not stated whenever pain is not stated', () => {
    assert.equal(pickPainInterference({ agree: 0.95, disagree: 0.02, neither: 0.03 }, false).stated, false);
    const summary = plain(summarizePainItem(sampleResult({ intensitySupport: [0.1, 0.1, 0.1, 0.1] })));
    assert.equal(summary.intensity.stated, false);
    assert.equal(summary.interference.label, 'not stated');
});

test('unusable interference scores give not stated', () => {
    for (const three of [null, undefined, {}, { agree: NaN, disagree: 0.1, neither: 0.1 }, { agree: '0.9', disagree: 0.1, neither: 0.1 }]) {
        assert.equal(pickPainInterference(three, true).stated, false);
    }
});

test('notes flag shortened text, long text, and close calls', () => {
    assert.deepEqual(plain(summarizePainItem(sampleResult()).notes), []);
    assert.deepEqual(plain(summarizePainItem(sampleResult({ shortened: true })).notes), ['Text shortened']);
    assert.deepEqual(plain(summarizePainItem(sampleResult({ textTokens: PAIN_LONG_TEXT_TOKENS + 1 })).notes), ['Long text']);
    assert.deepEqual(plain(summarizePainItem(sampleResult({ textTokens: PAIN_LONG_TEXT_TOKENS })).notes), []);
    assert.deepEqual(plain(summarizePainItem(sampleResult({ intensityShares: [0.05, 0.45, 0.45, 0.05] })).notes), ['Close call']);
    assert.deepEqual(plain(summarizePainItem(sampleResult({ shortened: true, textTokens: 2000, intensityShares: [0.05, 0.45, 0.45, 0.05] })).notes), ['Text shortened', 'Long text', 'Close call']);
});

// ### Fitting Text to the Model ###

// One token per four characters stands in for the real tokenizer.
const countTokens = text => Math.ceil(text.length / 4);

test('short text is passed through untouched', () => {
    assert.deepEqual(plain(painFitTextToBudget('The pain is mild.', countTokens, 900)), { text: 'The pain is mild.', tokens: 5, shortened: false });
});

test('long text is cut until it fits the budget', () => {
    const long = 'word '.repeat(2000);
    const fit = plain(painFitTextToBudget(long, countTokens, 900));
    assert.equal(fit.shortened, true);
    assert.ok(fit.tokens <= 900, 'fits: ' + fit.tokens);
    assert.ok(fit.text.length > 3000, 'keeps most of what fits: ' + fit.text.length);
    assert.ok(long.startsWith(fit.text), 'keeps the start of the text');
});

test('empty and non-text input fit as empty text', () => {
    for (const value of ['', null, undefined, 7]) {
        assert.deepEqual(plain(painFitTextToBudget(value, countTokens, 900)), { text: '', tokens: 0, shortened: false });
    }
});

test('the default budget is used when none is given', () => {
    const fit = painFitTextToBudget('word '.repeat(2000), countTokens);
    assert.ok(fit.tokens <= PAIN_TEXT_TOKEN_BUDGET);
});

// ### Stated Scores ###

test('a score out of 10 or out of 5 is found', () => {
    assert.deepEqual(plain(findStatedPainScores('My back pain is 7 out of 10 today.')), [{ text: '7 out of 10', value: 7, scaleMax: 10 }]);
    assert.deepEqual(plain(findStatedPainScores('The pain was three out of five.')), [{ text: 'three out of five', value: 3, scaleMax: 5 }]);
    assert.deepEqual(plain(findStatedPainScores('Knee pain: 6/10 after the walk.')), [{ text: '6/10', value: 6, scaleMax: 10 }]);
    assert.deepEqual(plain(findStatedPainScores('It hurts, about 2.5/5.')), [{ text: '2.5/5', value: 2.5, scaleMax: 5 }]);
});

test('a score on a named scale is found', () => {
    assert.deepEqual(plain(findStatedPainScores('I would put the pain at 8 on a scale of 0 to 10.')), [{ text: '8 on a scale of 0 to 10', value: 8, scaleMax: 10 }]);
    assert.deepEqual(plain(findStatedPainScores('The ache is a 4 on a 10-point scale.')), [{ text: '4 on a 10-point scale', value: 4, scaleMax: 10 }]);
});

test('a pain level with no scale is found with an empty scale', () => {
    assert.deepEqual(plain(findStatedPainScores('Pain level 6 this morning.')), [{ text: 'Pain level 6', value: 6, scaleMax: null }]);
    assert.deepEqual(plain(findStatedPainScores('Her pain score was 3.')), [{ text: 'pain score was 3', value: 3, scaleMax: null }]);
});

test('a pain level followed by its scale is one score, not two', () => {
    assert.deepEqual(statedTexts('Pain level 7 out of 10 at night.'), ['7 out of 10']);
    assert.deepEqual(statedTexts('Pain rating 7/10 at night.'), ['7/10']);
});

test('a score of 0 is found', () => {
    assert.deepEqual(plain(findStatedPainScores('Pain is 0 out of 10 now.')), [{ text: '0 out of 10', value: 0, scaleMax: 10 }]);
});

test('a number past the top of its scale is kept as text with no value', () => {
    assert.deepEqual(plain(findStatedPainScores('The pain was 11 out of 10.')), [{ text: '11 out of 10', value: null, scaleMax: 10 }]);
});

test('dates, longer fractions, and other numbers are not scores', () => {
    for (const text of [
        'The pain started on 3/10/2026.',
        'Pain noted on 12/3/10.',
        'Blood pressure was 120/80 and the pain was mild.',
        'Blood pressure was 120/10 and the pain was mild.',
        'The pain comes back 9/10 times.',
        'Pain woke her 3 out of 5 nights.',
        'He attended 4/5 sessions even with the back pain.',
        'In the study, 9/10 participants reported pain.',
        'The pain score 3 days ago was not written down.',
        'I take 1/2 tablet when the pain comes.',
        'The pain has lasted 10 days.',
        'Pain in 2 joints.',
        'Version 1.7/10.2 of the pain diary.'
    ]) {
        assert.deepEqual(statedTexts(text), [], text);
    }
});

test('a score in a sentence with no pain word is not counted', () => {
    assert.deepEqual(statedTexts('I would give the film 7 out of 10.'), []);
    assert.deepEqual(statedTexts('The pain was bad. I would give the film 7 out of 10.'), []);
    assert.deepEqual(statedTexts('The film was dull.\nIt hurts, 7 out of 10.'), ['7 out of 10']);
});

test('several scores come back in reading order, up to the limit', () => {
    assert.deepEqual(statedTexts('Pain was 3/10 at rest and 8 out of 10 when walking.'), ['3/10', '8 out of 10']);
    const many = Array(PAIN_STATED_SCORE_LIMIT + 5).fill('The pain is 5/10.').join(' ');
    assert.equal(findStatedPainScores(many).length, PAIN_STATED_SCORE_LIMIT);
});

test('only the matched phrase is returned, never the sentence', () => {
    const found = plain(findStatedPainScores('Synthetic participant P-000 said the shoulder pain was 7 out of 10 at the clinic.'));
    assert.deepEqual(found.map(f => f.text), ['7 out of 10']);
});

test('text with no score, empty text, and non-text give no scores', () => {
    for (const value of ['My lower back aches all day.', '', null, undefined, 7, {}]) {
        assert.deepEqual(plain(findStatedPainScores(value)), []);
    }
});

test('markup in the text stays plain data', () => {
    const found = plain(findStatedPainScores('<img src=x onerror=alert(1)> pain 7 out of 10'));
    assert.deepEqual(found.map(f => f.text), ['7 out of 10']);
});

test('one stated score fills the value and the scale', () => {
    assert.deepEqual(plain(summarizeStatedPainScores([{ text: '7 out of 10', value: 7, scaleMax: 10 }])), { text: '7 out of 10', count: 1, value: 7, scaleMax: 10 });
    assert.deepEqual(plain(summarizeStatedPainScores([{ text: 'pain level 6', value: 6, scaleMax: null }])), { text: 'pain level 6', count: 1, value: 6, scaleMax: '' });
});

test('scores that disagree keep their text and leave the value empty', () => {
    const summary = plain(summarizeStatedPainScores([{ text: '3/10', value: 3, scaleMax: 10 }, { text: '8 out of 10', value: 8, scaleMax: 10 }]));
    assert.deepEqual(summary, { text: '3/10 | 8 out of 10', count: 2, value: '', scaleMax: '' });
});

test('no stated score gives three empty fields', () => {
    for (const value of [[], null, undefined]) {
        assert.deepEqual(plain(summarizeStatedPainScores(value)), { text: '', count: 0, value: '', scaleMax: '' });
    }
});

// ### Fixture ###

// The stated scores in the model fixture need no model, so the fast
// suite checks them, along with the shape of every item.
test('the fixture is well formed and its stated scores are found', () => {
    const fixture = loadPainFixture();
    assert.ok(typeof fixture._license === 'string' && fixture._license.includes('Field Station AI'));
    assert.ok(Array.isArray(fixture.items) && fixture.items.length >= 40);
    const ids = new Set();
    for (const item of fixture.items) {
        assert.ok(item.id && !ids.has(item.id), 'unique id ' + item.id);
        ids.add(item.id);
        assert.equal(typeof item.text, 'string');
        assert.ok(item.expect && Array.isArray(item.expect.stated), item.id + ' lists its stated scores');
        for (const key of ['intensity', 'interference']) {
            const expected = item.expect[key];
            if (expected === undefined) continue;
            const labels = key === 'intensity' ? plain(PAIN_INTENSITY_LABELS) : plain(PAIN_INTERFERENCE_LABELS);
            for (const label of [].concat(expected)) assert.ok(label === PAIN_NOT_STATED || labels.includes(label), item.id + ' ' + key + ' ' + label);
        }
        assert.deepEqual(statedTexts(fixtureText(fixture, item)), item.expect.stated, item.id);
    }
});

// ### Download ###

test('the download columns carry both outputs, every score, and how the run was made', () => {
    const { keys, names } = plain(painExportColumns([]));
    assert.deepEqual(names, keys);
    assert.equal(new Set(keys).size, keys.length, 'no column is listed twice');
    for (const key of [
        'pain_intensity_level', 'pain_intensity_label', 'pain_intensity_match_score', 'pain_intensity_support',
        'pain_intensity_share_0', 'pain_intensity_share_3', 'pain_intensity_agree_0', 'pain_intensity_agree_3',
        'pain_interference_level', 'pain_interference_label', 'pain_interference_match_score',
        'pain_interference_agree', 'pain_interference_disagree', 'pain_interference_neither',
        'pain_stated_score_text', 'pain_stated_score_count', 'pain_stated_score_value', 'pain_stated_score_max',
        'pain_notes', 'pain_text_shortened', 'pain_text_tokens',
        'pain_scale_version', 'pain_model', 'pain_model_variant', 'pain_runtime',
        'pain_intensity_wording', 'pain_interference_wording', 'pain_thresholds',
        'pain_wording_edited', 'pain_run_at_utc'
    ]) {
        assert.ok(keys.includes(key), key);
    }
    assert.ok(!keys.some(k => /1_to_10|confidence/.test(k)), 'the retired columns are gone');
});

test('a column the spreadsheet already has is never overwritten, whatever its letter case', () => {
    const { keys, names } = plain(painExportColumns(['id', 'Pain_Intensity_Level', 'pain_intensity_level_2']));
    assert.equal(names[keys.indexOf('pain_intensity_level')], 'pain_intensity_level_3');
    assert.equal(names[keys.indexOf('pain_notes')], 'pain_notes');
    assert.equal(new Set(names).size, names.length);
});

test('a row holds the picked levels, every score, and the run details', () => {
    const row = plain(painExportRow(sampleResult()));
    assert.deepEqual(Object.keys(row), plain(painExportColumns([])).keys);
    assert.equal(row.pain_intensity_level, 2);
    assert.equal(row.pain_intensity_label, 'moderate');
    assert.equal(row.pain_intensity_match_score, 0.6);
    assert.equal(row.pain_intensity_support, 0.9);
    assert.equal(row.pain_intensity_share_0, 0.05);
    assert.equal(row.pain_intensity_agree_1, 0.4);
    assert.equal(row.pain_interference_level, 1);
    assert.equal(row.pain_interference_label, 'limits activities');
    assert.equal(row.pain_interference_match_score, 0.8);
    assert.equal(row.pain_interference_disagree, 0.05);
    assert.equal(row.pain_interference_neither, 0.15);
    assert.equal(row.pain_stated_score_text, '7 out of 10');
    assert.equal(row.pain_stated_score_count, 1);
    assert.equal(row.pain_stated_score_value, 7);
    assert.equal(row.pain_stated_score_max, 10);
    assert.equal(row.pain_notes, '');
    assert.equal(row.pain_text_shortened, 'false');
    assert.equal(row.pain_text_tokens, 40);
    assert.equal(row.pain_scale_version, '2');
    assert.equal(row.pain_model, 'Xenova/bart-large-mnli');
    assert.equal(row.pain_model_variant, 'wasm/q4');
    assert.equal(row.pain_runtime, 'transformers.js 4.2.0');
    assert.equal(row.pain_wording_edited, 'false');
    assert.equal(row.pain_run_at_utc, '2026-09-29T15:00:00.000Z');
    assert.ok(row.pain_intensity_wording.startsWith('0=The person has no pain. | 1='));
    assert.equal(row.pain_interference_wording, '0=' + PAIN_DEFAULT_WORDING.interference[0]);
    assert.ok(row.pain_thresholds.includes(String(PAIN_SUPPORT_MIN)));
});

test('scores are rounded to 4 decimal places', () => {
    const row = painExportRow(sampleResult({ interference: { agree: 0.123456789, disagree: 0.5, neither: 0.376543211 }, intensityShares: [0.00004, 0.33335, 0.6, 0.06661] }));
    assert.equal(row.pain_interference_agree, 0.1235);
    assert.equal(row.pain_intensity_share_0, 0);
    assert.equal(row.pain_intensity_share_1, 0.3334);
});

test('not stated leaves the level and match empty and keeps every score', () => {
    const row = plain(painExportRow(sampleResult({ intensitySupport: [0.1, 0.2, 0.2, 0.1] })));
    assert.equal(row.pain_intensity_level, '');
    assert.equal(row.pain_intensity_label, 'not stated');
    assert.equal(row.pain_intensity_match_score, '');
    assert.equal(row.pain_intensity_support, 0.2);
    assert.equal(row.pain_interference_level, '');
    assert.equal(row.pain_interference_label, 'not stated');
    assert.equal(row.pain_intensity_share_2, 0.6);
    assert.equal(row.pain_interference_agree, 0.8);
});

test('a picked level of 0 is written as 0, not as empty', () => {
    const row = painExportRow(sampleResult({ intensityShares: [0.7, 0.1, 0.1, 0.1], intensitySupport: [0.9, 0.1, 0.1, 0.1], interference: { agree: 0.02, disagree: 0.96, neither: 0.02 } }));
    assert.equal(row.pain_intensity_level, 0);
    assert.equal(row.pain_intensity_label, 'none');
    assert.equal(row.pain_interference_level, 0);
});

test('edited wording, shortened text, and notes are written to the row', () => {
    const wording = defaults();
    wording.interference[0] = 'Pain keeps the person from normal activities.';
    const row = painExportRow(sampleResult({ wording, shortened: true, textTokens: 950 }));
    assert.equal(row.pain_wording_edited, 'true');
    assert.equal(row.pain_text_shortened, 'true');
    assert.equal(row.pain_notes, 'Text shortened; Long text');
    assert.equal(row.pain_interference_wording, '0=Pain keeps the person from normal activities.');
});

test('an item with no result gives a row of empty fields, with the error in the notes', () => {
    for (const value of [null, undefined]) {
        const row = plain(painExportRow(value));
        assert.deepEqual(Object.keys(row), plain(painExportColumns([])).keys);
        for (const key of Object.keys(row)) assert.equal(row[key], '', key);
    }
    assert.equal(painExportRow(null, 'This item has no readable text.').pain_notes, 'Not estimated: This item has no readable text.');
});

// No field the skill adds may start with a character a spreadsheet reads
// as a formula, whatever the text held.
test('no added field starts with a formula character', () => {
    const row = painExportRow(sampleResult({ stated: plain(findStatedPainScores('=cmd pain 7 out of 10')) }));
    for (const key of Object.keys(row)) {
        assert.ok(!/^[=+\-@\t\r]/.test(String(row[key])), key + ': ' + row[key]);
    }
    assert.ok(!/^[=+\-@]/.test(painExportRow(null, '=1+1').pain_notes));
});

// ### Send to Chat ###

test('the chat text says the values are model estimates and lists each item', () => {
    const text = painChatSummary([
        { id: 'row-1', result: sampleResult() },
        { id: 'row-2', result: sampleResult({ intensitySupport: [0.1, 0.1, 0.1, 0.1], stated: [], shortened: true }) }
    ]);
    assert.ok(text.includes('2 items'));
    assert.ok(/model estimates, not scores the person gave/.test(text));
    assert.ok(text.includes('- row-1: intensity 2 moderate; interference 1 limits activities; stated by the writer: 7 out of 10'));
    assert.ok(text.includes('- row-2: intensity not stated; interference not stated (text shortened)'));
    assert.ok(!/\/10\b(?! )/.test(text.replace('7 out of 10', '')), 'no inferred score out of 10');
});

test('the chat text for one item and for none reads correctly', () => {
    assert.ok(painChatSummary([{ id: 'Pasted text', result: sampleResult() }]).includes('1 item.'));
    assert.ok(painChatSummary([]).includes('0 items.'));
    assert.ok(painChatSummary(null).includes('0 items.'));
});
