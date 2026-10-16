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
    return { ok: true, blob: async () => new Blob(['photo'], { type: 'image/png' }) };
  };
  // FileReader is a browser boundary; resolveTypes and its conversion helpers are real.
  globalThis.FileReader = class {
    async readAsDataURL(blob) {
      this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
      this.onloadend();
    }
  };
});

test('materializes packaged resource text before it becomes an HTTP request body', async () => {
  assert.equal(await PandaBridge.resolveTypes(resourceUrl), dataUrl);
  assert.deepEqual(fetched, [resourceUrl]);
});

test('materializes packaged URLs nested in request data and embedded JSON strings', async () => {
  const input = {
    attachments: [resourceUrl, { type: 'Image', value: resourceUrl }],
    body: JSON.stringify({ first: resourceUrl, second: resourceUrl }),
  };
  assert.deepEqual(await PandaBridge.resolveTypes(input), {
    attachments: [dataUrl, { type: 'Image', value: dataUrl }],
    body: JSON.stringify({ first: dataUrl, second: dataUrl }),
  });
  assert.equal(fetched.length, 3, 'repeated URL within one string is fetched once');
});

test('preserves ordinary remote URLs and existing blob and localhost conversion', async () => {
  assert.deepEqual(
    await PandaBridge.resolveTypes(['https://example.test/image.png', 'blob:photo', 'http://localhost:8000/photo']),
    ['https://example.test/image.png', dataUrl, dataUrl],
  );
  assert.deepEqual(fetched, ['blob:photo', 'http://localhost:8000/photo']);
});
