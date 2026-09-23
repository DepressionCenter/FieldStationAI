// This file is part of Field Station AI
// tests/docs.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-23
// Last Modified: 2026-09-23
// Summary: Checks that the written documentation agrees with the repository.
// Every relative link under docs/, skills/, the README, and SKILLS.md
// resolves to a file; every page opens with the license comment; and every
// page under docs/ has one H1, no skipped heading level, and a link back to
// the project README. Runs with Node's built-in test runner and no
// dependencies: node --test tests/
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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The sentence every page carries inside its opening HTML comment.
const LICENSE_SENTENCE = 'This file is part of Field Station AI';

// The template page holds placeholder links on purpose, so it is exempt
// from the link check and from the structure checks.
const TEMPLATE_PAGE = path.join(REPO_ROOT, 'docs', 'doc-template.md');

// Folders that never hold documentation of this project.
const SKIPPED_FOLDERS = new Set(['node_modules', '.git', '.venv', '__pycache__', '.kb_cache', '.claude', '.cache']);

// Fenced code blocks are removed before headings and links are read,
// because a shell prompt or a comment inside one looks like a heading.
const FENCE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HEADING = /^(#{1,6})[ \t]+\S[^\n]*$/gm;
// Inline links and images: the text in brackets, then the target in parentheses.
const LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
// A "Back to ... README" link that climbs to the project README.
const BACK_LINK = /\[[^\]]*Back to[^\]]*\]\((?:\.\.\/)+README\.md\)/;

// ### Page Inventory ###

function markdownUnder(folder) {
    const found = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!SKIPPED_FOLDERS.has(entry.name)) walk(full);
            } else if (entry.name.endsWith('.md')) {
                found.push(full);
            }
        }
    };
    walk(path.join(REPO_ROOT, folder));
    return found.sort();
}

const DOC_PAGES = markdownUnder('docs');
const ALL_PAGES = [
    ...DOC_PAGES,
    ...markdownUnder('skills'),
    path.join(REPO_ROOT, 'README.md'),
    path.join(REPO_ROOT, 'SKILLS.md')
];
const STRUCTURED_PAGES = DOC_PAGES.filter(page => page !== TEMPLATE_PAGE);

function relative(page) {
    return path.relative(REPO_ROOT, page).split(path.sep).join('/');
}

function prose(page) {
    // The page with its HTML comments and fenced code blocks removed.
    const text = fs.readFileSync(page, 'utf8');
    return text.replace(HTML_COMMENT, '').replace(FENCE, '');
}

function headings(page) {
    const found = [];
    for (const match of prose(page).matchAll(HEADING)) {
        found.push({ level: match[1].length, line: match[0].trim() });
    }
    return found;
}

// ### Links ###

for (const page of ALL_PAGES) {
    if (page === TEMPLATE_PAGE) continue;
    test(`every relative link resolves: ${relative(page)}`, () => {
        const broken = [];
        for (const match of prose(page).matchAll(LINK)) {
            const target = match[1];
            if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
            const file = decodeURIComponent(target.split('#')[0]);
            if (!file) continue;
            if (!fs.existsSync(path.join(path.dirname(page), file))) broken.push(target);
        }
        assert.deepEqual(broken, [], `${relative(page)} links to files that do not exist`);
    });
}

// ### License Comment ###

for (const page of ALL_PAGES) {
    test(`page opens with the license comment: ${relative(page)}`, () => {
        const text = fs.readFileSync(page, 'utf8').replace(FENCE, '');
        const first = HEADING.exec(text);
        HEADING.lastIndex = 0;
        const head = first ? text.slice(0, first.index) : text;
        assert.ok(head.includes(LICENSE_SENTENCE), `${relative(page)} has no license comment before its first heading`);
        assert.ok(head.includes('GNU'), `${relative(page)} names no license in its opening comment`);
    });
}

// ### Page Structure ###

for (const page of STRUCTURED_PAGES) {
    test(`page has exactly one H1: ${relative(page)}`, () => {
        const levels = headings(page).map(h => h.level);
        assert.equal(levels.filter(level => level === 1).length, 1, `${relative(page)} must have one H1`);
        assert.equal(levels[0], 1, `${relative(page)} does not open with its H1`);
    });

    test(`page skips no heading level: ${relative(page)}`, () => {
        let previous = 0;
        for (const { level, line } of headings(page)) {
            assert.ok(level <= previous + 1, `${relative(page)} jumps to "${line}" from level ${previous}`);
            previous = level;
        }
    });

    test(`page links back to the project README: ${relative(page)}`, () => {
        assert.ok(BACK_LINK.test(prose(page)), `${relative(page)} has no "Back to ... README" link`);
    });
}
