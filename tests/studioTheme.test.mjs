/* The opt-in Tailwind plugin that turns a light editor dark under `html.dark`,
 * compiled with the Tailwind versions the editors build with. */

import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
  compile,
  contrast,
  firstDifference,
  luminance,
  normalizeColors,
  rulesOf,
  splitThemeBlock,
  Stylesheet,
} from './tailwind.mjs';

const require = createRequire(import.meta.url);
const studioTheme = require('../studio-theme.js');
const preset = require('../tailwind.config.js');

const rgb = normalizeColors;

/* Verbatim from pandasuite-bridge-react 2.8.0 `lib/ui` */
const KIT_2 = {
  input:
    'form-input py-1 px-3 rounded text-sm leading-none bg-gray-100 border-none hover:bg-gray-200 focus:ring-2 focus:ring-purple-400 focus:bg-white focus:outline-none ',
  button:
    'inline-flex items-center py-1 px-5 text-sm font-medium rounded text-purple-600 bg-gray-100 hover:bg-gray-200 focus:outline-none transition ease-in-out duration-150 ',
  primaryButton:
    'inline-flex items-center py-1 px-5 text-sm font-medium rounded text-white bg-green-500 hover:bg-green-600 focus:outline-none transition ease-in-out duration-150 ',
  alert:
    'flex rounded-lg p-5 text-base place-items-center font-light bg-blue-50 text-blue-600 ',
  dangerAlert:
    'flex rounded-lg p-5 text-base place-items-center font-light bg-red-50 text-red-600 ',
  tabs: 'flex sticky top-0 z-50 bg-white w-full ',
  tab: 'border-t-2 m-1 mt-0 p-1 focus:outline-none ',
  tabTitle: 'uppercase font-sans text-base pt-2.5 ',
  dropdown:
    'py-1 px-3 bg-no-repeat appearance-none rounded text-sm bg-gray-100 border-none hover:bg-gray-200 focus:ring-0 focus:outline-none ',
  /* Verbatim, the stray `"` included: the class attribute holds it */
  checkbox:
    'form-checkbox rounded bg-gray-100 border-transparent focus:border-transparent focus:ring-0 hover:bg-gray-200 focus:bg-gray-200 checked:bg-gray-100 focus:outline-none" ',
  checkboxLabel:
    '<label class="inline-flex items-center"><span class="ml-2 text-sm">',
  /* The inline style React writes for the Dropdown's caret */
  dropdownStyle:
    "background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 512'><path fill='currentColor' d='M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z'></path></svg>\"); background-position: right center; background-size: 9px; padding-right: calc(1.5em + 9px);",
};

/* Verbatim from pandasuite-bridge-react 3.1.0 `src/ui` */
const KIT_3 = {
  input:
    'form-input rounded px-3 py-1 text-sm leading-none text-gray-700 transition placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100 hover:bg-gray-200 border-0',
  button:
    'inline-flex items-center gap-2 rounded px-5 py-1 text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 text-purple-600 bg-gray-100 hover:bg-gray-200',
  primaryButton:
    'inline-flex items-center gap-2 rounded px-5 py-1 text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 text-white bg-green-500 hover:bg-green-600',
  alert: (container) =>
    `flex items-center gap-2 rounded-lg p-5 text-base font-light ${container}`,
  tabs: 'sticky top-0 z-50 flex w-full bg-white',
  tab: 'm-1 mt-0 border-t-2 p-1 focus:outline-none',
  tabTitle: 'pt-2.5 font-sans text-base uppercase',
  loaderLabel: 'font-medium text-purple-600 text-sm',
  loaderDescription: 'text-gray-500 text-xs',
  dropdown:
    'appearance-none rounded bg-gray-100 px-3 py-1 text-sm transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400',
  checkboxLabel:
    '<label class="inline-flex items-center gap-2"><span class="text-sm">',
};

/* Search's own fields, which set no background: its `SearchInput` and the
 * weight of a key (`Keys.js`) */
const SEARCH_INPUT =
  '<div class="px-2 pb-2.5"><input type="text" class="my-4 text-gray-500 border rounded focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent">';
const WEIGHT_INPUT =
  '<td class="px-6 py-4 whitespace-nowrap"><div class="w-0 flex-1 flex items-center"><input type="number" class="w-10 ml-2 flex-1 border text-right rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent">';

/* HTTP's `Configuration.js` and `Persistence.js`, Search's `Keys.js` and
 * `Configuration.js`: a key's path segments and its Delete button */
const TABLE_ROW = '<tbody class="bg-white divide-y divide-gray-200"><tr>';
const KEY_PATH =
  '<td class="w-1/4 px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="flex flex-col"><div class="flex text-sm text-gray-500 divide-x shadow-sm">';
const DELETE =
  '<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button type="button" class="text-indigo-600 hover:text-indigo-900 focus:outline-none">';

/* Foreground on background, as the kit and the Tailwind editors write them: the
 * innermost element's text on the first background up its chain */
const PAIRS = [
  [
    'kit 2.x Tabs, active tab',
    `<div class="${KIT_2.tabs}"><button class="${KIT_2.tab}border-indigo-600"><span class="${KIT_2.tabTitle}text-gray-700">`,
  ],
  [
    'kit 2.x Tabs, inactive tab',
    `<div class="${KIT_2.tabs}"><button class="${KIT_2.tab}border-white"><span class="${KIT_2.tabTitle}text-gray-400">`,
  ],
  ['kit 2.x Button', `<button class="${KIT_2.button}">`],
  ['kit 2.x Button, hovered', `<button class="${KIT_2.button}">`, ['hover']],
  ['kit 2.x primary Button', `<button class="${KIT_2.primaryButton}">`],
  [
    'kit 2.x primary Button, hovered',
    `<button class="${KIT_2.primaryButton}">`,
    ['hover'],
  ],
  ['kit 2.x Alert', `<div class="${KIT_2.alert}">`],
  ['kit 2.x Alert, danger', `<div class="${KIT_2.dangerAlert}">`],
  [
    'kit 2.x Alert, its action (HTTP Persistence)',
    `<div class="${KIT_2.alert}"><div class="flex px-2 items-center"><button class="font-medium underline text-right">`,
  ],
  [
    'kit 3.x Tabs, active tab',
    `<div class="${KIT_3.tabs}"><button class="${KIT_3.tab} border-indigo-600"><span class="${KIT_3.tabTitle} text-gray-700">`,
  ],
  [
    'kit 3.x Tabs, inactive tab',
    `<div class="${KIT_3.tabs}"><button class="${KIT_3.tab} border-white"><span class="${KIT_3.tabTitle} text-gray-400">`,
  ],
  ['kit 3.x Button', `<button class="${KIT_3.button}">`],
  ['kit 3.x Button, hovered', `<button class="${KIT_3.button}">`, ['hover']],
  ['kit 3.x primary Button', `<button class="${KIT_3.primaryButton}">`],
  [
    'kit 3.x primary Button, hovered',
    `<button class="${KIT_3.primaryButton}">`,
    ['hover'],
  ],
  [
    'kit 3.x Alert, info',
    `<div class="${KIT_3.alert('bg-blue-50 text-blue-600')}">`,
  ],
  [
    'kit 3.x Alert, danger',
    `<div class="${KIT_3.alert('bg-red-50 text-red-600')}">`,
  ],
  [
    'kit 3.x Alert, success',
    `<div class="${KIT_3.alert('bg-green-50 text-green-600')}">`,
  ],
  [
    'kit 3.x Alert, warning',
    `<div class="${KIT_3.alert('bg-yellow-50 text-yellow-700')}">`,
  ],
  ['kit 3.x Input', `<input class="${KIT_3.input}">`],
  ['kit 3.x Input, hovered', `<input class="${KIT_3.input}">`, ['hover']],
  ['kit 3.x Input, focused', `<input class="${KIT_3.input}">`, ['focus']],
  [
    'kit 3.x Loader label',
    `<div class="flex flex-col gap-1 items-center"><span class="${KIT_3.loaderLabel}">`,
  ],
  [
    'kit 3.x Loader description',
    `<div class="flex flex-col gap-1 items-center"><span class="${KIT_3.loaderDescription}">`,
  ],
  [
    'HTTP and Search key path',
    `${TABLE_ROW}${KEY_PATH}<div class="flex-1 p-1 px-2">`,
  ],
  [
    'HTTP and Search key name',
    `${TABLE_ROW}${KEY_PATH}<div class="flex-1 p-1 px-2 text-indigo-600">`,
  ],
  ['HTTP and Search Delete', `${TABLE_ROW}${DELETE}`],
  ['HTTP and Search Delete, hovered', `${TABLE_ROW}${DELETE}`, ['hover']],
  [
    'HTTP table header',
    '<thead class="bg-gray-50"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">',
  ],
  [
    'HTTP Persistence, key path of a resource to download',
    `${TABLE_ROW.replace('<tr>', '<tr class="bg-green-50">')}${KEY_PATH}<div class="flex-1 p-1 px-2">`,
  ],
  [
    'HTTP Persistence, key name of a resource to download',
    `${TABLE_ROW.replace('<tr>', '<tr class="bg-green-50">')}${KEY_PATH}<div class="flex-1 p-1 px-2 text-indigo-600">`,
  ],
  [
    'Search tabs, active tab',
    '<div class="relative"><div class="flex"><button type="button" class="border-t-2 m-1 mt-0 p-1 focus:outline-none border-indigo-600"><span class="uppercase font-sans text-base pt-2.5 text-gray-700">',
  ],
  [
    'Search tabs, inactive tab',
    '<div class="relative"><div class="flex"><button type="button" class="border-t-2 m-1 mt-0 p-1 focus:outline-none border-white"><span class="uppercase font-sans text-base pt-2.5 text-gray-400">',
  ],
  [
    'Search info',
    '<div class="flex bg-blue-50 rounded-lg p-5 text-base text-blue-600 place-items-center font-light">',
  ],
  [
    'Search results count',
    '<div class="px-2 pb-2.5"><div><p class="text-sm text-gray-700">',
  ],
  /* Text the browser colours: inherited down from the root */
  ['kit 2.x Input, typed text', `<input class="${KIT_2.input}">`],
  [
    'kit 2.x Input, typed text, hovered',
    `<input class="${KIT_2.input}">`,
    ['hover'],
  ],
  [
    'kit 2.x Input, typed text, focused',
    `<input class="${KIT_2.input}">`,
    ['focus'],
  ],
  ['kit 2.x Dropdown', `<select class="${KIT_2.dropdown}">`],
  ['kit 3.x Dropdown', `<select class="${KIT_3.dropdown}">`],
  [
    'kit 2.x Checkbox label (HTTP key type)',
    `${TABLE_ROW}<td class="px-6 py-4 whitespace-nowrap"><div class="w-full flex items-center space-x-3">${KIT_2.checkboxLabel}`,
  ],
  ['kit 3.x Checkbox label', KIT_3.checkboxLabel],
  ['Search input', SEARCH_INPUT],
  ['Search input, focused', SEARCH_INPUT, ['focus']],
  ['Search key weight', `${TABLE_ROW}${WEIGHT_INPUT}`],
];

/* Placeholders: the text is the input's `::placeholder`, on the input */
const PLACEHOLDERS = [
  ['kit 2.x Input placeholder', `<input class="${KIT_2.input}">`],
  [
    'kit 2.x Input placeholder, hovered',
    `<input class="${KIT_2.input}">`,
    ['hover'],
  ],
  [
    'kit 2.x Input placeholder, focused',
    `<input class="${KIT_2.input}">`,
    ['focus'],
  ],
  ['kit 3.x Input placeholder', `<input class="${KIT_3.input}">`],
  [
    'kit 3.x Input placeholder, hovered',
    `<input class="${KIT_3.input}">`,
    ['hover'],
  ],
  [
    'kit 3.x Input placeholder, focused',
    `<input class="${KIT_3.input}">`,
    ['focus'],
  ],
  ['Search input placeholder', SEARCH_INPUT],
];

const VERSIONS = {
  2.1: {
    tailwind: require('tailwindcss'),
    plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
    input: KIT_2.input,
  },
  2.2: {
    tailwind: require('tailwindcss-2.2'),
    plugins: [],
    input: KIT_3.input,
  },
};

const build = async ({ tailwind, plugins }, theme) =>
  new Stylesheet(
    await compile(tailwind, {
      presets: [preset],
      purge: false,
      plugins: theme ? [...plugins, studioTheme] : plugins,
    }),
  );

for (const [version, setup] of Object.entries(VERSIONS)) {
  describe(`with Tailwind ${version}`, () => {
    let themed;
    let plain;

    before(async () => {
      themed = await build(setup, true);
      plain = await build(setup, false);
    });

    const dark = (markup, property, options) =>
      themed.render(markup, { dark: true, ...options }).value(property);

    test('light rendering is identical', () => {
      const { block, rest } = splitThemeBlock(themed.root);
      const root = block.find(
        (node) => node.type === 'rule' && node.selector === ':root',
      );
      const light = Object.fromEntries(
        root.nodes
          .filter(
            ({ type, prop }) => type === 'decl' && prop.startsWith('--c-'),
          )
          .map(({ prop, value }) => [prop, value]),
      );
      /* Forms' own select caret embeds a variable in an image; the winning
       * caret is checked apart */
      const omit = (selector, prop) =>
        selector === '.form-select' && prop === 'background-image';
      const withLightValues = (value) =>
        value.replace(
          /url\((?:"[^"]*"|'[^']*'|[^)]*)\)|var\((--c-[\w-]+)\)/g,
          (match, name) =>
            name && light[name] !== undefined ? light[name] : match,
        );

      assert.equal(
        firstDifference(
          rulesOf(rest, {
            transform: (value) => normalizeColors(withLightValues(value)),
            omit,
          }),
          rulesOf(plain.root.nodes, { transform: normalizeColors, omit }),
        ),
        null,
      );
    });

    test('dark uses the Studio roles', () => {
      assert.equal(
        dark('<div class="bg-gray-100">', 'background-color'),
        rgb('#171a21'),
      );
      assert.equal(
        dark('<div class="bg-gray-200">', 'background-color'),
        rgb('#2f3440'),
      );
      assert.equal(dark('<p class="text-gray-900">', 'color'), rgb('#eef0f4'));
      assert.equal(
        dark('<div class="bg-white">', 'background-color'),
        rgb('#1f232c'),
      );
      assert.equal(
        dark('<input class="focus:bg-white">', 'background-color', {
          states: ['focus'],
        }),
        rgb('#1f232c'),
      );
      assert.equal(
        dark('<button class="border-t-2 border-white">', 'border-color'),
        rgb('#1f232c'),
      );
      assert.equal(
        themed.render('<main>', { dark: true }).backdrop(),
        rgb('#1f232c'),
      );
      assert.equal(dark('<span class="text-white">', 'color'), rgb('#ffffff'));
    });

    test('the action green rests on the Studio action and darkens on hover, as in light', () => {
      const button = `<button class="${KIT_2.primaryButton}">`;

      assert.equal(dark(button, 'background-color'), rgb('#059669'));
      assert.equal(
        dark(button, 'background-color', { states: ['hover'] }),
        rgb('#047857'),
      );
    });

    test('kit controls keep their well', () => {
      const input = `<input class="${setup.input}">`;
      const background = (options) =>
        themed.render(input, options).value('background-color');

      assert.deepEqual(
        {
          light: background({}),
          lightHover: background({ states: ['hover'] }),
          lightFocus: background({ states: ['focus'] }),
          lightFocusHover: background({ states: ['focus', 'hover'] }),
          dark: background({ dark: true }),
          darkHover: background({ dark: true, states: ['hover'] }),
          darkFocus: background({ dark: true, states: ['focus'] }),
          darkFocusHover: background({
            dark: true,
            states: ['focus', 'hover'],
          }),
        },
        {
          light: rgb('#f3f4f6'),
          lightHover: rgb('#e5e7eb'),
          lightFocus: rgb('#ffffff'),
          lightFocusHover: rgb('#ffffff'),
          dark: rgb('#171a21'),
          darkHover: rgb('#2f3440'),
          darkFocus: rgb('#1f232c'),
          darkFocusHover: rgb('#1f232c'),
        },
      );
    });

    test('text stays readable in dark', () => {
      const measure = (markup, states, pseudoElement) => (isDark) => {
        const element = themed.render(markup, { dark: isDark, states });

        return contrast(
          element.value('color', pseudoElement),
          pseudoElement
            ? element.value('background-color')
            : element.backdrop(),
        );
      };
      const unreadable = [
        ...PAIRS.map(([name, markup, states]) => [
          name,
          measure(markup, states),
        ]),
        ...PLACEHOLDERS.map(([name, markup, states]) => [
          name,
          measure(markup, states, 'placeholder'),
        ]),
      ]
        .map(([name, of]) => ({ name, light: of(false), dark: of(true) }))
        .filter(({ light, dark: inDark }) => inDark < Math.min(4.5, light))
        .map(
          ({ name, light, dark: inDark }) =>
            `${name}: ${inDark.toFixed(2)}:1 in dark, ${light.toFixed(2)}:1 in light`,
        );

      assert.deepEqual(unreadable, []);
    });

    test('no :is or :where', () => {
      assert.doesNotMatch(themed.css, /:is\(|:where\(/);
    });

    test('fields without a background take the surface in dark and keep their inherited text', () => {
      const look = (markup) => {
        const field = themed.render(markup, { dark: true });

        return {
          background: field.value('background-color'),
          color: field.value('color'),
        };
      };
      /* The text is the root's, which a dark colour scheme turns white */
      const studioField = { background: rgb('#1f232c'), color: rgb('#ffffff') };

      assert.deepEqual(look('<input type="text">'), studioField);
      assert.deepEqual(look('<select>'), studioField);
      assert.deepEqual(look('<textarea>'), studioField);
    });

    if (version === '2.1') {
      test('the focused kit 2.x Checkbox has no white halo in dark', () => {
        const offset = (isDark) =>
          themed
            .render(
              `<label class="inline-flex items-center"><input type="checkbox" class='${KIT_2.checkbox}'>`,
              { dark: isDark, states: ['focus'] },
            )
            .value('--tw-ring-offset-color');

        assert.deepEqual(
          { light: offset(false), dark: offset(true) },
          { light: rgb('#ffffff'), dark: rgb('#1f232c') },
        );
      });

      test('winning images hold no variable', () => {
        const formSelect = (sheet, isDark) =>
          sheet
            .render('<select class="form-select">', { dark: isDark })
            .value('background-image');
        const dropdown = (isDark) =>
          themed
            .render(`<select class="${KIT_2.dropdown}">`, {
              dark: isDark,
              style: KIT_2.dropdownStyle,
            })
            .value('background-image');
        const darkCaret = dropdown(true);
        const svg = decodeURIComponent(
          darkCaret.slice(darkCaret.indexOf(',') + 1),
        );

        assert.equal(formSelect(themed, false), formSelect(plain, false));
        assert.doesNotMatch(formSelect(themed, false), /var\(/);
        assert.doesNotMatch(formSelect(themed, true), /var\(/);
        assert.equal(
          dropdown(false),
          /background-image: (url\(".*"\));/.exec(KIT_2.dropdownStyle)[1],
        );
        assert.doesNotMatch(darkCaret, /var\(/);
        assert.ok(
          luminance(/fill='([^']+)'/.exec(svg)[1]) >= luminance('#b3bac6'),
          `the dark caret is light: ${darkCaret}`,
        );
      });

      test('production purge keeps the dark rules', async () => {
        const environment = process.env.NODE_ENV;

        process.env.NODE_ENV = 'production';
        try {
          const sheet = new Stylesheet(
            await compile(
              setup.tailwind,
              require('./fixtures/search/tailwind.config.js'),
            ),
          );

          assert.equal(
            sheet.render('<div class="bg-pink-500">').value('background-color'),
            undefined,
            'purged',
          );
          assert.equal(
            sheet
              .render('<p class="text-gray-700">', { dark: true })
              .value('color'),
            rgb('#cfd4dc'),
          );
          assert.equal(
            sheet.render(TABLE_ROW, { dark: true }).backdrop(),
            rgb('#1f232c'),
          );
        } finally {
          if (environment === undefined) {
            delete process.env.NODE_ENV;
          } else {
            process.env.NODE_ENV = environment;
          }
        }
      });
    }
  });
}
