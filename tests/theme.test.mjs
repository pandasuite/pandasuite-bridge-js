/* The Studio theme, component side. */

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { PandaBridge, receive, reset, themeAtImport } from './harness.mjs';

beforeEach(reset);

const root = document.documentElement;

const send = (theme) => receive('__ps_theme', { theme });

describe('the theme the Studio sends', () => {
  test('is undefined until the Studio sends one, and nothing follows it', () => {
    assert.deepEqual(themeAtImport, {
      theme: undefined,
      subscribers: 0,
      isFollowingStudioTheme: false,
      rootClasses: [],
      colorScheme: '',
    });
  });

  test('is set by a valid __ps_theme', () => {
    send('dark');
    assert.equal(PandaBridge.theme, 'dark');

    send('light');
    assert.equal(PandaBridge.theme, 'light');
  });

  test('ignores invalid values', () => {
    send('dark');

    send('Dark');
    send(null);
    receive('__ps_theme', {});
    receive('__ps_theme', undefined);

    assert.equal(PandaBridge.theme, 'dark');
  });
});

describe('onThemeChange', () => {
  test('tells subscribers a value once', () => {
    const heard = [];

    PandaBridge.onThemeChange((theme) => heard.push(theme));
    send('dark');
    send('dark');
    send('light');

    assert.deepEqual(heard, ['dark', 'light']);
  });

  test('calls a late subscriber at once with the known theme', () => {
    const heard = [];

    send('dark');
    PandaBridge.onThemeChange((theme) => heard.push(theme));

    assert.deepEqual(heard, ['dark']);
  });

  test('returns a function that unsubscribes', () => {
    const heard = [];
    const unsubscribe = PandaBridge.onThemeChange((theme) => heard.push(theme));

    unsubscribe();
    send('light');

    assert.deepEqual(heard, []);
  });

  test('lets a subscriber unsubscribe itself without silencing the next', () => {
    const heard = [];
    const unsubscribe = PandaBridge.onThemeChange(() => unsubscribe());

    PandaBridge.onThemeChange((theme) => heard.push(theme));
    send('dark');

    assert.deepEqual(heard, ['dark']);
  });
});

describe('followStudioTheme', () => {
  test('leaves the document untouched without it', () => {
    send('dark');

    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, '');
  });

  test('does nothing before a theme', () => {
    PandaBridge.followStudioTheme();

    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, '');
  });

  test('applies a theme received earlier', () => {
    send('dark');
    PandaBridge.followStudioTheme();

    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });

  test('follows live changes', () => {
    PandaBridge.followStudioTheme();

    send('dark');
    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');

    send('light');
    assert.equal(root.classList.contains('dark'), false);
    assert.equal(root.style.colorScheme, 'light');
  });

  test('is harmless when called twice', () => {
    PandaBridge.followStudioTheme();
    PandaBridge.followStudioTheme();
    send('dark');

    assert.equal(PandaBridge.themeReceive.length, 1);
    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
  });
});
