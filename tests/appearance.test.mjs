/* The Studio appearance, component side. */

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  PandaBridge,
  receive,
  reset,
  appearanceAtImport,
  appearanceListenedBeforeHandshake,
} from './harness.mjs';

beforeEach(reset);

const root = document.documentElement;

const send = (appearance) => receive('__ps_appearance', appearance);
const studio = () => receive('__ps_studio', { scale: 1 });

describe('the appearance the Studio sends', () => {
  test('is undefined until the Studio sends one, and nothing follows it', () => {
    assert.deepEqual(appearanceAtImport, {
      appearance: undefined,
      subscribers: 0,
      isFollowingStudioAppearance: false,
      isStudio: false,
      rootClasses: [],
      colorScheme: '',
    });
  });

  test('is listened to on every transport, not only after the web handshake', () => {
    assert.equal(appearanceListenedBeforeHandshake, true);
  });

  test('is set, frozen, by a valid __ps_appearance', () => {
    send({ theme: 'dark' });
    assert.deepEqual(PandaBridge.appearance, { theme: 'dark' });
    assert.equal(Object.isFrozen(PandaBridge.appearance), true);

    send({ theme: 'light' });
    assert.deepEqual(PandaBridge.appearance, { theme: 'light' });
  });

  test('keeps fields it does not know, for settings to come', () => {
    send({ theme: 'dark', contrast: 'more' });

    assert.deepEqual(PandaBridge.appearance, {
      theme: 'dark',
      contrast: 'more',
    });
  });

  test('drops an invalid theme and ignores what is left empty', () => {
    send({ theme: 'dark' });

    send({ theme: 'Dark' });
    send({ theme: null });
    send({});
    send(undefined);
    send(['dark']);
    send('dark');

    assert.deepEqual(PandaBridge.appearance, { theme: 'dark' });
  });
});

describe('onAppearanceChange', () => {
  test('tells subscribers each change once, with a new object', () => {
    const heard = [];

    PandaBridge.onAppearanceChange((appearance) => heard.push(appearance));
    send({ theme: 'dark' });
    send({ theme: 'dark' });
    send({ theme: 'light' });

    assert.deepEqual(heard, [{ theme: 'dark' }, { theme: 'light' }]);
    assert.notEqual(heard[0], heard[1]);
  });

  test('calls a late subscriber at once with the known appearance', () => {
    const heard = [];

    send({ theme: 'dark' });
    PandaBridge.onAppearanceChange((appearance) => heard.push(appearance));

    assert.deepEqual(heard, [{ theme: 'dark' }]);
  });

  test('returns a function that unsubscribes', () => {
    const heard = [];
    const unsubscribe = PandaBridge.onAppearanceChange((appearance) =>
      heard.push(appearance),
    );

    unsubscribe();
    send({ theme: 'light' });

    assert.deepEqual(heard, []);
  });

  test('lets a subscriber unsubscribe itself without silencing the next', () => {
    const heard = [];
    const unsubscribe = PandaBridge.onAppearanceChange(() => unsubscribe());

    PandaBridge.onAppearanceChange((appearance) => heard.push(appearance));
    send({ theme: 'dark' });

    assert.deepEqual(heard, [{ theme: 'dark' }]);
  });
});

describe('followStudioAppearance', () => {
  test('leaves the document untouched without it', () => {
    studio();
    send({ theme: 'dark' });

    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, '');
  });

  test('does nothing before an appearance', () => {
    studio();
    PandaBridge.followStudioAppearance();

    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, '');
  });

  test('applies an appearance received earlier', () => {
    studio();
    send({ theme: 'dark' });
    PandaBridge.followStudioAppearance();

    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });

  test('follows live changes', () => {
    studio();
    PandaBridge.followStudioAppearance();

    send({ theme: 'dark' });
    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');

    send({ theme: 'light' });
    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, 'light');
  });

  test('never touches the document outside the Studio', () => {
    PandaBridge.followStudioAppearance();
    send({ theme: 'dark' });

    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, '');
  });

  test('applies an appearance that came before __ps_studio once it arrives', () => {
    PandaBridge.followStudioAppearance();
    send({ theme: 'dark' });
    studio();

    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });

  test('keeps the theme when a change carries no theme', () => {
    studio();
    PandaBridge.followStudioAppearance();
    send({ theme: 'dark' });
    send({ contrast: 'more' });

    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });

  test('is harmless when called twice', () => {
    studio();
    PandaBridge.followStudioAppearance();
    PandaBridge.followStudioAppearance();
    send({ theme: 'dark' });

    assert.equal(PandaBridge.appearanceReceive.length, 1);
    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });
});
