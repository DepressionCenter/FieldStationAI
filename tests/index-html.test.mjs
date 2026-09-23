// This file is part of Field Station AI
// tests/index-html.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-23
// Summary: Static checks on index.html, the whole application: the file
// header carries the project and license notice, the app is still one
// module script, and the crisis notice constants point at the 988 Lifeline.
// Runs with Node's built-in test runner and no dependencies.
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
import { INDEX_HTML } from './helpers/crisis-block.mjs';

const html = fs.readFileSync(INDEX_HTML, 'utf8');

// Reads a single-quoted string constant out of the source by name.
function stringConstant(name) {
    const match = html.match(new RegExp("const " + name + " = '((?:[^'\\\\]|\\\\.)*)';"));
    assert.ok(match, `index.html does not define ${name} as a single-quoted string`);
    return match[1].replace(/\\'/g, "'");
}

// ### File Header ###

test('index.html opens with the project and license header', () => {
    const head = html.split('\n').slice(0, 25).join('\n');
    assert.ok(head.includes('This file is part of Field Station AI'), 'header names the project');
    assert.ok(head.includes('GNU General Public License'), 'header names the license');
});

// ### Single File ###

test('index.html is one module script', () => {
    const modules = html.match(/<script type="module">/g) || [];
    assert.equal(modules.length, 1, 'the app must stay a single module script');
});

// ### Crisis Notice ###

test('the crisis notice points at the 988 Lifeline', () => {
    assert.equal(stringConstant('CRISIS_CHAT_URL'), 'https://chat.988lifeline.org/');
    assert.ok(stringConstant('CRISIS_NOTICE_TEXT').includes('988'), 'the notice names 988');
    assert.ok(stringConstant('CRISIS_NOTICE_SPANISH').includes('988'), 'the Spanish line names 988');
    assert.ok(stringConstant('CRISIS_NOTICE_CONTINUE').length > 0, 'the continue line is not empty');
});
