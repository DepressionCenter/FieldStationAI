// This file is part of Field Station AI
// tests/helpers/marked-block.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-28
// Last Modified: 2026-09-28
// Summary: Cuts a marked block of pure code out of index.html and evaluates
// it in a bare JavaScript context, so a test can exercise the exact
// constants and helpers the app ships without a browser. A block is fenced
// by two comments, "### <name> (start) ###" and "### <name> (end) ###",
// and must not touch the DOM, app state, or anything outside itself.
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

/** The two marker comments that fence a block named `name`. */
export function blockMarkers(name) {
    return {
        start: '// ### ' + name + ' (start) ###',
        end: '// ### ' + name + ' (end) ###'
    };
}

/**
 * Returns the source text between a block's markers, without the markers.
 * Throws when either marker is missing or they are out of order.
 */
export function markedBlockSource(name) {
    const { start, end } = blockMarkers(name);
    const html = fs.readFileSync(INDEX_HTML, 'utf8');
    const from = html.indexOf(start);
    const to = html.indexOf(end);
    if (from === -1 || to === -1 || to < from) {
        throw new Error('index.html does not carry the markers for the block "' + name + '"');
    }
    return html.slice(from + start.length, to);
}

/**
 * Evaluates a block in a fresh context with no globals beyond the language
 * itself, and returns the named exports as an object. The block's
 * completion value is that object, which is how a bare vm context hands
 * the names back.
 */
export function loadMarkedBlock(name, exportNames) {
    const source = markedBlockSource(name) + '\n;({ ' + exportNames.join(', ') + ' })';
    return vm.runInNewContext(source, Object.create(null), { filename: name + '.js' });
}
