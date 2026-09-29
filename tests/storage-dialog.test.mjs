// This file is part of Field Station AI
// tests/storage-dialog.test.mjs
// Author(s): Gabriel Mongefranco.
// Created: 2026-09-29
// Last Modified: 2026-09-29
// Summary: Checks the pure helpers behind the storage dialog: sizes and the
// usage sentence are written correctly, a stored time is told apart from a
// flag that holds no time, a chat model's repository name is worked out
// from the app's name for it, and cached files are grouped by the model
// they belong to. Evaluates the app's own block from index.html with no
// browser. All names and URLs here are synthetic.
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

const BLOCK_NAME = 'Storage dialog: pure helpers';
const FUNCTIONS = [
    'formatStorageBytes', 'storageUsageText', 'storageTime', 'splitCacheUrl', 'webllmRepoId', 'modelFlagIds',
    'modelRepoOfCacheUrl', 'webllmLibFileOfCacheUrl', 'libBelongsToRepo', 'groupModelCacheEntries'
];
const EXPORTS = [...FUNCTIONS, 'STORAGE_MIN_TIME_MS'];

const block = loadMarkedBlock(BLOCK_NAME, EXPORTS);
// Values made inside the block belong to another context, so they are
// copied into plain values of this one before they are compared.
const plain = (value) => JSON.parse(JSON.stringify(value));

const WEIGHTS = 'https://huggingface.co/mlc-ai/Example-1B-Instruct-q4f16_1-MLC/resolve/main/';
const LIBS = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/';
const HELPER = 'https://huggingface.co/Example/helper-small/resolve/main/';

// ### Block Contract ###

test('the storage block evaluates on its own and exports its helpers', () => {
    for (const name of FUNCTIONS) assert.equal(typeof block[name], 'function', name + ' is a function');
    assert.equal(typeof block.STORAGE_MIN_TIME_MS, 'number');
});

// ### Sizes ###

test('a size is written in the largest unit that keeps it at 1 or more', () => {
    const { formatStorageBytes } = block;
    assert.equal(formatStorageBytes(0), '0 B');
    assert.equal(formatStorageBytes(1023), '1023 B');
    assert.equal(formatStorageBytes(1024), '1.0 KB');
    assert.equal(formatStorageBytes(1536), '1.5 KB');
    assert.equal(formatStorageBytes(5 * 1024 * 1024), '5.0 MB');
    assert.equal(formatStorageBytes(3 * 1024 ** 3), '3.0 GB');
    assert.equal(formatStorageBytes(2 * 1024 ** 4), '2.0 TB');
    assert.equal(formatStorageBytes(5000 * 1024 ** 4), '5000.0 TB', 'the last unit takes anything larger');
});

test('a size just under a unit is not written as 1024.0 of the smaller one', () => {
    const { formatStorageBytes } = block;
    assert.equal(formatStorageBytes(1024 * 1024 - 1), '1.0 MB');
    assert.equal(formatStorageBytes(1024 ** 3 - 1), '1.0 GB');
});

test('a size that is not a number of zero or more is reported as unknown', () => {
    const { formatStorageBytes } = block;
    for (const bad of [undefined, null, NaN, Infinity, -1, '12', {}, []]) {
        assert.equal(formatStorageBytes(bad), 'Size unknown', String(bad));
    }
});

test('the usage sentence covers a missing estimate and a missing quota', () => {
    const { storageUsageText } = block;
    assert.equal(storageUsageText(1024 * 1024, 1024 ** 3), 'Using 1.0 MB of 1.0 GB.');
    assert.equal(storageUsageText(0, 1024 ** 3), 'Using 0 B of 1.0 GB.');
    assert.equal(storageUsageText(2048), 'Using 2.0 KB.');
    assert.equal(storageUsageText(2048, 0), 'Using 2.0 KB.');
    assert.equal(storageUsageText(2048, NaN), 'Using 2.0 KB.');
    assert.equal(storageUsageText(), 'This browser does not report the space in use.');
    assert.equal(storageUsageText(-5, 100), 'This browser does not report the space in use.');
    assert.equal(storageUsageText('100', 100), 'This browser does not report the space in use.');
});

// ### Times ###

test('a stored time is read as a number or as text', () => {
    const { storageTime, STORAGE_MIN_TIME_MS } = block;
    const time = Date.UTC(2026, 8, 29, 12, 0, 0);
    assert.equal(storageTime(time), time);
    assert.equal(storageTime(String(time)), time);
    assert.equal(storageTime(STORAGE_MIN_TIME_MS), STORAGE_MIN_TIME_MS);
});

test('a flag that holds no time reads as no time', () => {
    const { storageTime, STORAGE_MIN_TIME_MS } = block;
    for (const bad of ['1', 1, 0, '', null, undefined, 'yesterday', NaN, Infinity, -1, {}, STORAGE_MIN_TIME_MS - 1]) {
        assert.equal(storageTime(bad), null, String(bad));
    }
});

// ### Model Names ###

test('a chat model is cached under its repository name', () => {
    const { webllmRepoId, modelFlagIds } = block;
    assert.equal(webllmRepoId('webllm:Example-1B-Instruct-q4f16_1-MLC'), 'mlc-ai/Example-1B-Instruct-q4f16_1-MLC');
    assert.deepEqual(plain(modelFlagIds('mlc-ai/Example-1B-Instruct-q4f16_1-MLC')),
        ['mlc-ai/Example-1B-Instruct-q4f16_1-MLC', 'webllm:Example-1B-Instruct-q4f16_1-MLC']);
});

test('any other model id has no chat model repository', () => {
    const { webllmRepoId, modelFlagIds } = block;
    for (const other of ['Example/helper-small', 'webllm:', 'router:webllm:Example', '', null, undefined, 7]) {
        assert.equal(webllmRepoId(other), null, String(other));
    }
    assert.deepEqual(plain(modelFlagIds('Example/helper-small')), ['Example/helper-small']);
    assert.deepEqual(plain(modelFlagIds('mlc-ai/')), ['mlc-ai/']);
});

// ### Cached Files ###

test('a URL is split into its host and path, without its query', () => {
    const { splitCacheUrl } = block;
    assert.deepEqual(plain(splitCacheUrl('https://Example.ORG:8443/a/b/c.bin?token=EXAMPLE#part')),
        { host: 'example.org', parts: ['a', 'b', 'c.bin'] });
    for (const bad of ['', 'ftp://example.org/a', 'javascript:alert(1)', 'example.org/a/b', null, undefined, 42, {}]) {
        assert.equal(splitCacheUrl(bad), null, String(bad));
    }
});

test('a model file is known by the host it came from', () => {
    const { modelRepoOfCacheUrl } = block;
    assert.equal(modelRepoOfCacheUrl(HELPER + 'onnx/model_q4.onnx'), 'Example/helper-small');
    assert.equal(modelRepoOfCacheUrl('https://cdn-lfs.huggingface.co/Example/helper-small/file'), 'Example/helper-small');
    assert.equal(modelRepoOfCacheUrl('https://huggingface.co/only-one-part'), null);
    // A host that only ends with the same letters is another site.
    assert.equal(modelRepoOfCacheUrl('https://nothuggingface.co/Example/helper-small/file'), null);
    assert.equal(modelRepoOfCacheUrl('https://huggingface.co.example.org/Example/helper-small/file'), null);
    assert.equal(modelRepoOfCacheUrl('https://example.org/huggingface.co/Example/file'), null);
});

test('a chat model library is known by its host and repository', () => {
    const { webllmLibFileOfCacheUrl } = block;
    assert.equal(webllmLibFileOfCacheUrl(LIBS + 'Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm'), 'Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm');
    assert.equal(webllmLibFileOfCacheUrl('https://raw.githubusercontent.com/someone/else/main/file.wasm'), null);
    assert.equal(webllmLibFileOfCacheUrl('https://example.org/mlc-ai/binary-mlc-llm-libs/main/file.wasm'), null);
    assert.equal(webllmLibFileOfCacheUrl(HELPER + 'onnx/model_q4.onnx'), null);
});

test('a library belongs to the model whose name it begins with', () => {
    const { libBelongsToRepo } = block;
    const repo = 'mlc-ai/Example-1B-Instruct-q4f16_1-MLC';
    assert.equal(libBelongsToRepo('Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', repo), true);
    assert.equal(libBelongsToRepo('Example-1B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm', repo), true);
    // A longer name that starts the same way is another model.
    assert.equal(libBelongsToRepo('Example-1B-Instruct-q4f16_10_cs1k-webgpu.wasm', repo), false);
    assert.equal(libBelongsToRepo('Other-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', repo), false);
    assert.equal(libBelongsToRepo('Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', 'Example/helper-small'), false);
    assert.equal(libBelongsToRepo('anything.wasm', 'mlc-ai/'), false);
});

test('cached files are grouped by model, with one group per repository', () => {
    const { groupModelCacheEntries } = block;
    const groups = plain(groupModelCacheEntries([
        { cacheName: 'webllm/model', url: WEIGHTS + 'params_shard_0.bin', bytes: 1000 },
        { cacheName: 'webllm/model', url: WEIGHTS + 'params_shard_1.bin', bytes: 2000 },
        { cacheName: 'webllm/config', url: WEIGHTS + 'mlc-chat-config.json', bytes: 30 },
        { cacheName: 'webllm/wasm', url: LIBS + 'Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', bytes: 400 },
        { cacheName: 'transformers-cache', url: HELPER + 'onnx/model_q4.onnx', bytes: 5000 },
        { cacheName: 'transformers-cache', url: HELPER + 'config.json', bytes: 5 }
    ]));
    assert.equal(groups.length, 2);
    assert.deepEqual(groups.map(g => g.repoId), ['Example/helper-small', 'mlc-ai/Example-1B-Instruct-q4f16_1-MLC']);
    assert.equal(groups[0].bytes, 5005);
    assert.equal(groups[0].entries.length, 2);
    assert.equal(groups[1].bytes, 3430, 'the library counts toward its model');
    assert.equal(groups[1].entries.length, 4);
    assert.deepEqual(groups[1].entries[3], { cacheName: 'webllm/wasm', url: LIBS + 'Example-1B-Instruct-q4f16_1_cs1k-webgpu.wasm' });
});

test('files that belong to no model are left out', () => {
    const { groupModelCacheEntries } = block;
    const groups = plain(groupModelCacheEntries([
        { cacheName: 'transformers-cache', url: 'https://cdn.jsdelivr.net/npm/example-runtime@1.0.0/dist/runtime.wasm', bytes: 900 },
        { cacheName: 'fieldstation-compendium-v1', url: 'https://example.org/compendium.json.gz', bytes: 800 },
        // A library whose model has no cached weights has no group to join.
        { cacheName: 'webllm/wasm', url: LIBS + 'Absent-1B-Instruct-q4f16_1_cs1k-webgpu.wasm', bytes: 400 }
    ]));
    assert.deepEqual(groups, []);
});

test('empty and invalid input gives no groups, and a bad size counts as zero', () => {
    const { groupModelCacheEntries } = block;
    for (const bad of [undefined, null, [], 'text', 7, {}]) {
        assert.deepEqual(plain(groupModelCacheEntries(bad)), [], String(bad));
    }
    const groups = plain(groupModelCacheEntries([
        null, 7, {}, { url: 42 },
        { cacheName: 'c', url: HELPER + 'a.bin', bytes: -50 },
        { cacheName: 'c', url: HELPER + 'b.bin', bytes: 'large' },
        { cacheName: 'c', url: HELPER + 'c.bin' },
        { cacheName: 'c', url: HELPER + 'd.bin', bytes: 10 }
    ]));
    assert.equal(groups.length, 1);
    assert.equal(groups[0].bytes, 10);
    assert.equal(groups[0].entries.length, 4);
});
