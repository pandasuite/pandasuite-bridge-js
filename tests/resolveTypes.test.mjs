import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { PandaBridge } from './harness.mjs';

const resourceUrl = `panda-storage://${'a'.repeat(64)}/saved-photo`;
const dataUrl = 'data:image/png;base64,cGhvdG8=';
let fetched;

beforeEach(() => {
  fetched = [];
  globalThis.fetch = async (url) => {
    fetched.push(url);
    return {
      ok: true,
      blob: async () => new Blob(['photo'], { type: 'image/png' }),
    };
  };
  // FileReader is a browser boundary; resolveTypes and its conversion helpers are real.
  globalThis.FileReader = class {
    async readAsDataURL(blob) {
      this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
      this.onloadend();
    }
  };
});

test('former native scheme strings remain ordinary text', async () => {
  assert.equal(await PandaBridge.resolveTypes(resourceUrl), resourceUrl);
  assert.deepEqual(fetched, []);
});

test('converts blob URLs in nested typed media and JSON strings', async () => {
  const input = {
    attachments: ['blob:photo', { type: 'Image', value: 'blob:photo' }],
    body: JSON.stringify({ photo: 'blob:photo' }),
  };
  assert.deepEqual(await PandaBridge.resolveTypes(input), {
    attachments: [dataUrl, { type: 'Image', value: dataUrl }],
    body: JSON.stringify({ photo: dataUrl }),
  });
});

test('preserves ordinary remote URLs and existing blob and localhost conversion', async () => {
  assert.deepEqual(
    await PandaBridge.resolveTypes([
      'https://example.test/image.png',
      'blob:photo',
      'http://localhost:8000/photo',
    ]),
    ['https://example.test/image.png', dataUrl, dataUrl]
  );
  assert.deepEqual(fetched, ['blob:photo', 'http://localhost:8000/photo']);
});
