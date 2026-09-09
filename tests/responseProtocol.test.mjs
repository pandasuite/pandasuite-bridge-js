/* Correlated responses, component side. */

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PandaBridge,
  PREFIX,
  flush,
  foreignThenable,
  lastOutcome,
  receive,
  refuseSending,
  refused,
  reset,
  responses,
  sent,
} from './harness.mjs';

beforeEach(reset);

const keyOf = (message) => message.args[message.args.length - 1];

describe('the component as caller', () => {
  test('mints a key, sends it last, and hands the outcome to the callback', () => {
    const outcomes = [];

    PandaBridge.send('search', [{ query: 'x' }], (outcome) =>
      outcomes.push(outcome),
    );

    assert.equal(sent.length, 1);
    assert.equal(sent[0].event, 'search');
    assert.deepEqual(sent[0].args[0], { query: 'x' });

    const key = keyOf(sent[0]);
    assert.ok(key.startsWith(PREFIX), `${key} is a response key`);
    assert.equal(sent[0].args.length, 2);

    receive(key, [{ status: 'ok', value: { result: 'found' } }]);
    assert.deepEqual(outcomes, [{ status: 'ok', value: { result: 'found' } }]);
  });

  test('sends the key alone when there is no payload', () => {
    PandaBridge.send('list_pages', undefined, () => {});
    PandaBridge.send('list_pages', [], () => {});

    assert.equal(sent.length, 2, 'both calls left');
    sent.forEach((message) => {
      assert.equal(message.args.length, 1, 'the key is the only argument');
      assert.ok(keyOf(message).startsWith(PREFIX));
    });
  });

  test('keeps a payload that is not an array at args[0]', () => {
    PandaBridge.send('update', { properties: [] }, () => {});

    assert.deepEqual(sent[0].args[0], { properties: [] });
    assert.ok(keyOf(sent[0]).startsWith(PREFIX));
    assert.equal(sent[0].args.length, 2);
  });

  test('fails the callback without registering a key when the message cannot be serialized', async () => {
    const outcomes = [];
    const cyclic = {};
    cyclic.self = cyclic;

    PandaBridge.send('search', [cyclic], (outcome) => outcomes.push(outcome));

    assert.equal(sent.length, 0, 'nothing left');
    assert.deepEqual(outcomes, [], 'not called synchronously');

    await flush();
    assert.equal(outcomes.length, 1);
    assert.equal(outcomes[0].status, 'failed');
    assert.equal(typeof outcomes[0].error, 'string');
    assert.ok(outcomes[0].error.length > 0);
  });

  test('settles two calls in flight independently, in any order', () => {
    const outcomes = {};

    PandaBridge.send('search', [{ query: 'a' }], (outcome) => {
      outcomes.a = outcome;
    });
    PandaBridge.send('search', [{ query: 'b' }], (outcome) => {
      outcomes.b = outcome;
    });

    const [first, second] = sent;
    assert.notEqual(keyOf(first), keyOf(second));

    receive(keyOf(second), [{ status: 'ok', value: 'B' }]);
    receive(keyOf(first), [{ status: 'ok', value: 'A' }]);

    assert.deepEqual(outcomes, {
      a: { status: 'ok', value: 'A' },
      b: { status: 'ok', value: 'B' },
    });
  });

  test('settles a key once: a second message under it is an ordinary event', () => {
    const outcomes = [];
    const seen = [];

    PandaBridge.send('search', [{ query: 'x' }], (outcome) =>
      outcomes.push(outcome),
    );
    const key = keyOf(sent[0]);

    receive(key, [{ status: 'ok', value: 1 }]);
    PandaBridge.listen(key, (args) => seen.push(args));
    receive(key, [{ status: 'ok', value: 2 }]);

    assert.deepEqual(outcomes, [{ status: 'ok', value: 1 }]);
    assert.deepEqual(seen, [[{ status: 'ok', value: 2 }]]);
  });

  test('leaves a key it does not wait for to the normal dispatch', () => {
    /* A component that carries the correlation by hand, as one had to before
     * this API, mints its own key and receives it through `listen`. */
    const seen = [];
    const globals = [];
    const key = `${PREFIX}hand-rolled`;

    PandaBridge.listen((event, args) => globals.push([event, args]));
    PandaBridge.listen(key, (args) => seen.push(args));

    receive(key, [{ status: 'ok', value: 'kept working' }]);

    assert.deepEqual(seen, [[{ status: 'ok', value: 'kept working' }]]);
    assert.deepEqual(globals, [
      [key, [{ status: 'ok', value: 'kept working' }]],
    ]);
    assert.equal(responses().length, 0, 'no settlement of our own');
  });

  test('reads a callback in place of the payload', () => {
    /* `send(event, callback)` is the shape an author reaches for after
     * `onLoad(cb)` and `synchronize(cb)`; unnormalized it would serialize the
     * callback away and send a message nobody can answer. */
    const outcomes = [];

    PandaBridge.send('list_pages', (outcome) => outcomes.push(outcome));

    assert.equal(sent.length, 1);
    assert.equal(sent[0].event, 'list_pages');
    assert.equal(sent[0].args.length, 1, 'the key is the only argument');

    receive(keyOf(sent[0]), [{ status: 'ok', value: ['a'] }]);
    assert.deepEqual(outcomes, [{ status: 'ok', value: ['a'] }]);
  });

  test('mints through crypto.randomUUID where there is one', () => {
    /* The arm a viewer iframe on a secure origin takes. */
    PandaBridge.send('a', [], () => {});
    assert.match(
      keyOf(sent[0]).slice(PREFIX.length),
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      'a uuid, so the guard reached the real crypto',
    );

    window.crypto = { randomUUID: () => 'minted-by-crypto' };
    PandaBridge.send('b', [], () => {});
    assert.equal(keyOf(sent[1]), `${PREFIX}minted-by-crypto`);
  });

  test('mints through the counter where there is no crypto', () => {
    /* `randomUUID` is gated on a secure context, so an insecure iframe has none
     * and the fallback is what mints. */
    delete window.crypto;

    PandaBridge.send('a', [], () => {});
    PandaBridge.send('b', [], () => {});

    const keys = sent.map((message) => keyOf(message).slice(PREFIX.length));

    keys.forEach((key) => assert.match(key, /^\d+-\d+$/));
    assert.notEqual(
      keys[0],
      keys[1],
      'the counter, not chance, separates them',
    );
  });

  test('fails the callback when the bridge itself refuses the message', async () => {
    const outcomes = [];

    refuseSending(new Error('bridge is gone'));
    PandaBridge.send('search', [{ query: 'x' }], (outcome) =>
      outcomes.push(outcome),
    );

    assert.equal(sent.length, 0, 'nothing left');
    await flush();
    assert.deepEqual(outcomes, [{ status: 'failed', error: 'bridge is gone' }]);

    /* The key of the message that never left is not left waiting either: its
     * own answer, arriving late, settles nothing a second time. */
    assert.equal(refused.length, 1);
    receive(keyOf(refused[0]), [{ status: 'ok', value: 'late' }]);
    assert.deepEqual(outcomes, [{ status: 'failed', error: 'bridge is gone' }]);
  });

  test('is unchanged without a callback', () => {
    PandaBridge.send('search', [{ query: 'x' }]);

    assert.deepEqual(sent, [{ event: 'search', args: [{ query: 'x' }] }]);
  });
});

describe('the component as producer', () => {
  test("answers with the first listener's returned value, and hides the key from it", () => {
    const seen = [];
    const key = `${PREFIX}1`;

    PandaBridge.listen('search', (args) => {
      seen.push(args);
      return { results: [1, 2] };
    });

    receive('search', [{ query: 'x' }, key]);

    assert.deepEqual(seen, [[{ query: 'x' }]], 'the key is not an argument');
    assert.deepEqual(sent, [
      { event: key, args: [{ status: 'ok', value: { results: [1, 2] } }] },
    ]);
  });

  test('waits for a returned promise, and calls a resolved undefined absent', async () => {
    PandaBridge.listen('slow', () => Promise.resolve({ ok: true }));
    PandaBridge.listen('void', () => Promise.resolve(undefined));

    receive('slow', [{}, `${PREFIX}slow`]);
    assert.equal(sent.length, 0, 'nothing before the promise settles');

    receive('void', [{}, `${PREFIX}void`]);
    await flush();

    assert.deepEqual(sent, [
      { event: `${PREFIX}slow`, args: [{ status: 'ok', value: { ok: true } }] },
      { event: `${PREFIX}void`, args: [{ status: 'ok' }] },
    ]);
  });

  test('calls a returned undefined absent, at once', () => {
    PandaBridge.listen('act', () => undefined);

    receive('act', [{}, `${PREFIX}1`]);

    assert.deepEqual(lastOutcome(), { status: 'ok' });
  });

  test('turns a rejection into failed, through the guarded conversion', async () => {
    PandaBridge.listen('boom', () => Promise.reject(new Error('no network')));
    PandaBridge.listen('bare', () => Promise.reject('plain string'));
    PandaBridge.listen('opaque', () =>
      Promise.reject(Object.create(null, { message: { value: 42 } })),
    );

    receive('boom', [{}, `${PREFIX}boom`]);
    receive('bare', [{}, `${PREFIX}bare`]);
    receive('opaque', [{}, `${PREFIX}opaque`]);
    await flush();

    assert.deepEqual(sent, [
      {
        event: `${PREFIX}boom`,
        args: [{ status: 'failed', error: 'no network' }],
      },
      {
        event: `${PREFIX}bare`,
        args: [{ status: 'failed', error: 'plain string' }],
      },
      {
        event: `${PREFIX}opaque`,
        args: [{ status: 'failed', error: 'failed' }],
      },
    ]);
  });

  test('turns a synchronous exception into failed, once', () => {
    PandaBridge.listen('throws', () => {
      throw new Error('bad params');
    });

    receive('throws', [{}, `${PREFIX}1`]);

    assert.deepEqual(sent, [
      {
        event: `${PREFIX}1`,
        args: [{ status: 'failed', error: 'bad params' }],
      },
    ]);
  });

  test('answers absent when the event has no listener', () => {
    receive('unhandled', [{}, `${PREFIX}1`]);

    assert.deepEqual(sent, [{ event: `${PREFIX}1`, args: [{ status: 'ok' }] }]);
  });

  test('answers absent when every listener of the event was unlistened', () => {
    /* `unlisten(name)` leaves an empty array, not an absent entry — the state a
     * React component's action sits in after its effect cleans up. */
    PandaBridge.listen('search', () => 'stale');
    PandaBridge.unlisten('search');

    receive('search', [{}, `${PREFIX}1`]);

    assert.deepEqual(sent, [{ event: `${PREFIX}1`, args: [{ status: 'ok' }] }]);
  });

  test('lets only the first listener answer; the others observe', () => {
    const calls = [];
    const key = `${PREFIX}1`;

    PandaBridge.listen((event, args) => calls.push(['global', event, args]));
    PandaBridge.listen('search', (args) => {
      calls.push(['first', args]);
      return 'mine';
    });
    PandaBridge.listen('search', (args) => {
      calls.push(['second', args]);
      return 'ignored';
    });
    PandaBridge.listen('search', (args) => {
      calls.push(['third', args]);
    });

    receive('search', [{ query: 'x' }, key]);

    assert.deepEqual(calls, [
      ['global', 'search', [{ query: 'x' }]],
      ['first', [{ query: 'x' }]],
      ['second', [{ query: 'x' }]],
      ['third', [{ query: 'x' }]],
    ]);
    assert.deepEqual(sent, [
      { event: key, args: [{ status: 'ok', value: 'mine' }] },
    ]);
  });

  test('fails once when the returned value does not go on the wire', () => {
    PandaBridge.listen('act', () => ({ big: 1n }));

    receive('act', [{}, `${PREFIX}1`]);

    assert.equal(sent.length, 1);
    assert.equal(sent[0].event, `${PREFIX}1`);
    assert.equal(lastOutcome().status, 'failed');
    assert.equal(typeof lastOutcome().error, 'string');
  });

  test('answers failed when the bridge refuses the outcome it built', () => {
    /* The first attempt carries the value and is refused; a string error always
     * serializes, so a failure leaves instead — the host hears it rather than
     * waiting out its lease. On this synchronous path two guards reach that
     * outcome, `respond`'s retry and `settleFrom`'s own catch; the promised-value
     * case below is where the retry is the only one. */
    PandaBridge.listen('act', () => ({ results: [1] }));
    refuseSending(new Error('bridge is gone'));

    receive('act', [{}, `${PREFIX}1`]);

    assert.deepEqual(refused, [
      {
        event: `${PREFIX}1`,
        args: [{ status: 'ok', value: { results: [1] } }],
      },
    ]);
    assert.deepEqual(sent, [
      {
        event: `${PREFIX}1`,
        args: [{ status: 'failed', error: 'bridge is gone' }],
      },
    ]);
  });

  test('answers failed when the bridge refuses a promised outcome', async () => {
    /* Same guard on the asynchronous path, where an escaping throw would be an
     * unhandled rejection and the slot would only close on the host's lease. */
    PandaBridge.listen('act', () => Promise.resolve('late value'));

    receive('act', [{}, `${PREFIX}1`]);
    refuseSending(new Error('bridge is gone'));
    await flush();

    assert.deepEqual(sent, [
      {
        event: `${PREFIX}1`,
        args: [{ status: 'failed', error: 'bridge is gone' }],
      },
    ]);
  });

  test('does not answer an action message without a key', () => {
    const seen = [];

    PandaBridge.listen('search', (args) => {
      seen.push(args);
      return { results: [] };
    });

    receive('search', [{ query: 'x' }]);

    assert.deepEqual(seen, [[{ query: 'x' }]]);
    assert.deepEqual(sent, [], 'an unreferenced action sees no difference');
  });

  test('fails the slot when a returned thenable throws instead of settling', async () => {
    PandaBridge.listen('getter', () => ({
      get then() {
        throw new Error('hostile getter');
      },
    }));
    PandaBridge.listen('call', () =>
      foreignThenable(() => {
        throw new Error('hostile then');
      }),
    );

    receive('getter', [{}, `${PREFIX}getter`]);
    receive('call', [{}, `${PREFIX}call`]);
    await flush();

    assert.deepEqual(sent, [
      {
        event: `${PREFIX}getter`,
        args: [{ status: 'failed', error: 'hostile getter' }],
      },
      {
        event: `${PREFIX}call`,
        args: [{ status: 'failed', error: 'hostile then' }],
      },
    ]);
  });

  test('answers once for a thenable that settles more than once', async () => {
    PandaBridge.listen('act', () =>
      foreignThenable((onFulfilled) => {
        onFulfilled('first');
        onFulfilled('second');
        onFulfilled('third');
      }),
    );

    receive('act', [{}, `${PREFIX}1`]);
    await flush();

    assert.deepEqual(sent, [
      { event: `${PREFIX}1`, args: [{ status: 'ok', value: 'first' }] },
    ]);
  });

  test('resolves through a nested thenable', async () => {
    PandaBridge.listen('act', () => Promise.resolve(Promise.resolve(42)));

    receive('act', [{}, `${PREFIX}1`]);
    await flush();

    assert.deepEqual(lastOutcome(), { status: 'ok', value: 42 });
  });

  test('serves an action named after an Object.prototype key', () => {
    /* The registry is looked up by event name, so an inherited property must not
     * pass for a settlement. `unlisten` first, because that is how such a name is
     * reachable: `eventReceive` is a plain object and `listen` alone trips on the
     * inherited `constructor`, a sharp edge this protocol does not touch. */
    const seen = [];

    PandaBridge.unlisten('constructor');
    PandaBridge.listen('constructor', (args) => {
      seen.push(args);
      return 'served';
    });

    receive('constructor', [{ query: 'x' }]);
    assert.deepEqual(seen, [[{ query: 'x' }]]);
    assert.deepEqual(sent, []);

    receive('constructor', [{ query: 'y' }, `${PREFIX}1`]);
    assert.deepEqual(seen[1], [{ query: 'y' }]);
    assert.deepEqual(sent, [
      { event: `${PREFIX}1`, args: [{ status: 'ok', value: 'served' }] },
    ]);
  });
});

describe('the messages the library handles for itself', () => {
  /* `executeHook` is the function this protocol rewrote, and it is the only
   * dispatcher for the library's own bootstrap messages — the ones the host
   * posts on every iframe load and every marker update. */

  test('still fills properties, markers and resources on __ps_initialize', () => {
    const loaded = [];

    PandaBridge.onLoad((data) => loaded.push(data));
    receive(PandaBridge.INITIALIZE, [
      { color: 'red' },
      [{ id: 'm1' }],
      [{ id: 'r1', path: '/r1.png' }],
    ]);

    assert.deepEqual(loaded, [
      {
        properties: { color: 'red' },
        markers: [{ id: 'm1' }],
        resources: [{ id: 'r1', path: '/r1.png' }],
      },
    ]);
    assert.equal(PandaBridge.resolvePath('r1'), '/r1.png');
    assert.deepEqual(sent, [], 'a bootstrap message is never answered');
  });

  test('still updates on __ps_update', () => {
    const updated = [];

    PandaBridge.onUpdate((data) => updated.push(data));
    receive(PandaBridge.UPDATE, [{ color: 'blue' }, [], []]);

    assert.deepEqual(updated, [
      { properties: { color: 'blue' }, markers: [], resources: [] },
    ]);
  });

  test('hands an object-shaped args to its listener untouched', () => {
    /* `__ps_language` arrives as an object, not an array: the host posts
     * `{ event: '__ps_language', args: { language } }`. */
    const seen = [];

    PandaBridge.listen(PandaBridge.LANGUAGE, (args) => seen.push(args));
    receive(PandaBridge.LANGUAGE, { language: 'fr' });

    assert.deepEqual(seen, [{ language: 'fr' }]);
    assert.equal(PandaBridge.currentLanguage, 'fr');
  });

  test('hands no args at all to its listener as an empty array', () => {
    /* `PandaBridge.takeScreenshot` dispatches with a null args. */
    const seen = [];

    PandaBridge.getScreenshot((resultCallback, args) => {
      seen.push(args);
      resultCallback('data:image/png;base64,x');
    });
    PandaBridge.takeScreenshot();

    assert.deepEqual(seen, [[]]);
    assert.deepEqual(sent, [
      {
        event: PandaBridge.SCREENSHOT_RESULT,
        args: ['data:image/png;base64,x'],
      },
    ]);
  });
});

describe('the async bridge methods that predate the protocol', () => {
  test('keep their own response names, neither stripped nor settled', async () => {
    const { Binder } = await import('../src/index.js');
    const resolved = Binder.resolveShortTags('[data:x]');

    assert.equal(sent.length, 1);
    assert.equal(sent[0].event, 'resolveShortTags');

    const ownName = keyOf(sent[0]);
    assert.equal(sent[0].args[0], '[data:x]');
    assert.ok(
      !ownName.startsWith(PREFIX),
      'its response name is outside the reserved prefix',
    );

    /* The host answers under that name; the library must hand it to the
     * listener `createAsyncBridgeMethod` registered, not treat it as a
     * settlement of its own. */
    receive(ownName, ['resolved value']);
    assert.deepEqual(await resolved, ['resolved value']);
    assert.equal(responses().length, 0);
  });
});

describe('the constant', () => {
  test('names the wire prefix the three hosts read', () => {
    assert.equal(PandaBridge.RESPONSE_EVENT_PREFIX, PREFIX);
  });
});
