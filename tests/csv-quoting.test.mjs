// This file is part of Field Station AI
// tests/csv-quoting.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-30
// Last Modified: 2026-09-30
// Summary: Checks the cell quoting behind every Field Kit download: values
// with commas, quotes, or line breaks are wrapped and escaped, and a value a
// spreadsheet would run as a formula is neutralized, while numbers and
// plain dashes pass through unchanged. Evaluates the app's own block from
// index.html with no browser. All sample values are synthetic.
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

const block = loadMarkedBlock('CSV cell quoting: pure helpers', ['quoteField', 'csvCellLooksLikeFormula', 'CSV_NUMBER_RE']);
const { quoteField, csvCellLooksLikeFormula } = block;

// ### Ordinary Values ###

test('plain text and numbers pass through unchanged', () => {
    for (const value of ['hello', 'row-12', '5', '-5', '+5', '-1.25', '.5', '-1e3', '12%', 0, 7, -3]) {
        assert.equal(quoteField(value), String(value), JSON.stringify(value));
    }
});

test('empty and missing values give an empty cell', () => {
    assert.equal(quoteField(''), '');
    assert.equal(quoteField(null), '');
    assert.equal(quoteField(undefined), '');
});

test('commas, quotes, and line breaks are wrapped and escaped', () => {
    assert.equal(quoteField('a,b'), '"a,b"');
    assert.equal(quoteField('say "hi"'), '"say ""hi"""');
    assert.equal(quoteField('two\nlines'), '"two\nlines"');
    assert.equal(quoteField('two\r\nlines'), '"two\r\nlines"');
});

// ### Formula Injection ###

test('cells a spreadsheet would run as a formula are neutralized', () => {
    for (const value of ['=SUM(A1)', '=1+1', '@SUM(A1)', '+cmd|calc', '-cmd|calc', '+abc', '-abc', '=HYPERLINK("http://example.invalid")', '\tx', '\rx', '-2+3']) {
        assert.ok(csvCellLooksLikeFormula(value), JSON.stringify(value) + ' looks like a formula');
        const cell = quoteField(value);
        assert.ok(cell.startsWith('"\'') || cell.startsWith("'"), JSON.stringify(value) + ' -> ' + cell);
    }
    assert.equal(quoteField('=SUM(A1)'), "'=SUM(A1)");
    assert.equal(quoteField('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
});

test('numbers, a lone sign, and a sign before a space are not formulas', () => {
    for (const value of ['-5', '+5', '-1.5', '-1e3', '-', '+', '- see note', '+ 1 more', '1-2', 'a=b']) {
        assert.ok(!csvCellLooksLikeFormula(value), JSON.stringify(value) + ' is not a formula');
    }
    assert.ok(csvCellLooksLikeFormula('@home'));
});

test('the sign rule does not change a negative number in a spreadsheet column', () => {
    assert.equal(quoteField(-12.5), '-12.5');
    assert.equal(quoteField('-12.5'), '-12.5');
});
