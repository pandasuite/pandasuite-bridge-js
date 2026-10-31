/* The Studio theme for a component's editor: an opt-in Tailwind 2 plugin.
 *
 *   plugins: [
 *     require('@tailwindcss/forms')({ strategy: 'class' }),
 *     require('pandasuite-bridge/studio-theme'),
 *   ]
 *
 * with `PandaBridge.followStudioTheme()`, which sets `dark` on <html>.
 *
 * Editors are written with Tailwind's light palette. Rather than a `dark:`
 * variant on every class, the shades that carry roles read CSS variables, and
 * `.dark` swaps them, as the dashboard does (Bamboo's `tailwind.config.js`):
 * the greys run the other way, the soft tints of the accents become deep ones
 * and their text shades light ones. The light values are the installed
 * Tailwind's own defaults, so an editor renders the same until `.dark` is set,
 * as long as its config keeps Tailwind's colours: one that replaces a themed
 * family (gray, and the accents below) gets the defaults in light, and a
 * themed shade it extends keeps its own value in dark. Forms must use the
 * class strategy: under `base`, a bare `select` loses its caret.
 */

const plugin = require('tailwindcss/plugin');
const { colors } = require('tailwindcss/defaultTheme');

/* The Studio's dark greys: gray-100 is the stage, below the surface */
const DARK_GRAY = {
  50: '#262b36',
  100: '#171a21',
  200: '#2f3440',
  300: '#3f4553',
  400: '#6f7786',
  500: '#8f97a6',
  600: '#b3bac6',
  700: '#cfd4dc',
  800: '#e1e4ea',
  900: '#eef0f4',
};
const SURFACE = '#1f232c';

/* The accents whose soft tints and text shades swap in dark. Their 50 takes the
 * Studio's status surface, the 950 Tailwind 2 does not have. */
const ACCENT_SURFACES = {
  red: '#450a0a',
  yellow: '#451a03',
  green: '#022c22',
  blue: '#172554',
  indigo: '#1e1b4b',
  purple: '#2e1065',
};
const ACCENT_SWAPS = { 100: 900, 200: 800, 700: 300, 800: 200, 900: 100 };

const triplet = (hex) => {
  const n = parseInt(hex.slice(1), 16);

  return `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`;
};

/* A colour Tailwind calls with the opacity it needs (`0` for gradient stops),
 * and without one for a plain value. It prints as that plain value where
 * Tailwind writes it out instead of calling it (Tailwind 2.1's preflight). */
const reads = (variable) => {
  const color = ({ opacityValue } = {}) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgba(var(${variable}), ${opacityValue})`;

  color.toString = () => color();
  return color;
};

const light = {};
const dark = {};
const palette = {};

const swap = (family, shade, darkHex) => {
  const variable = `--c-${family}-${shade}`;

  light[variable] = triplet(colors[family][shade]);
  dark[variable] = triplet(darkHex);
  palette[family] = { ...palette[family], [shade]: reads(variable) };
};

Object.entries(DARK_GRAY).forEach(([shade, hex]) => swap('gray', shade, hex));
Object.entries(ACCENT_SURFACES).forEach(([family, surface]) => {
  swap(family, 50, surface);
  Object.entries(ACCENT_SWAPS).forEach(([shade, to]) =>
    swap(family, shade, colors[family][to]),
  );
});

const withOpacity = (hex, opacityVariable) =>
  `rgba(${triplet(hex)}, var(${opacityVariable}))`;

/* The 600 text shades stay literal, and sit on swapped tints and on the
 * surface (the kit's Button, Alert and Loader, the editors' key names): in
 * dark they take their 300, the Studio's accent text. A checkbox or radio
 * keeps its 600: forms paints its checked fill with it, and a fill does not
 * move. (A `:not()` on the first rule would outrank the hover texts.) */
const darkText = Object.fromEntries(
  ['purple', 'indigo', 'blue', 'red'].flatMap((family) => [
    [
      `.dark .text-${family}-600`,
      { color: withOpacity(colors[family][300], '--tw-text-opacity') },
    ],
    [
      `.dark .text-${family}-600[type="checkbox"], .dark .text-${family}-600[type="radio"]`,
      { color: withOpacity(colors[family][600], '--tw-text-opacity') },
    ],
  ]),
);

/* The kit Dropdown's caret, painted `currentColor` inside an image: black */
const dropdownCaret = (hex) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 512'><path fill='${encodeURIComponent(hex)}' d='M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z'/></svg>")`;

/* @tailwindcss/forms 0.3.2's select caret, drawn with the light gray-500 */
const formSelectCaret = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='${encodeURIComponent(colors.gray[500])}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

module.exports = plugin(
  ({ addBase, postcss }) => {
    addBase([
      /* `.dark` is set at runtime: a production purge must keep these rules */
      postcss.comment({ text: 'purgecss start ignore' }),
      {
        ':root': { ...light, colorScheme: 'light' },
        '.dark': { ...dark, colorScheme: 'dark' },
        /* White is the editors' surface: the page, their rows and tab bars,
         * a focused field, the invisible border of a tab. `white` itself
         * stays, the label of a filled button. */
        '.dark body': { backgroundColor: SURFACE },
        '.dark .bg-white': {
          backgroundColor: withOpacity(SURFACE, '--tw-bg-opacity'),
        },
        '.dark .focus\\:bg-white:focus': {
          backgroundColor: withOpacity(SURFACE, '--tw-bg-opacity'),
        },
        '.dark .border-white': {
          borderColor: withOpacity(SURFACE, '--tw-border-opacity'),
        },
        /* The action green rests on the Studio's action, the 600, and darkens
         * on hover as in light, keeping its white label readable */
        '.dark .bg-green-500': {
          backgroundColor: withOpacity(colors.green[600], '--tw-bg-opacity'),
        },
        '.dark .hover\\:bg-green-600:hover': {
          backgroundColor: withOpacity(colors.green[700], '--tw-bg-opacity'),
        },
        ...darkText,
        /* Fields with no background of their own keep the browser's white,
         * which Chromium 87 does not darken: they take the surface, as a white
         * field on a white page. Their text stays theirs (their own class, or
         * the root's, which preflight's `color: inherit` hands down). A field
         * with any `bg-` utility is left to it (the kit's grey wells), and so
         * are checkboxes and radios, whose checked fill forms paints. */
        '.dark input:not([class*="bg-"]):not([type="checkbox"]):not([type="radio"]), .dark select:not([class*="bg-"]), .dark textarea:not([class*="bg-"])':
          { backgroundColor: SURFACE },
        /* Forms 0.3.2 puts a 2px white ring offset around a focused checkbox
         * or radio, which the kit Checkbox's `focus:ring-0` keeps */
        '.dark .form-checkbox:focus, .dark .form-radio:focus': {
          '--tw-ring-offset-color': SURFACE,
        },
        /* An image cannot read a variable: forms' caret keeps its light grey,
         * and the kit Dropdown's black one turns light in dark (over its
         * inline style) */
        '.form-select': { backgroundImage: formSelectCaret },
        '.dark select[style*="data:image/svg+xml"]': {
          backgroundImage: `${dropdownCaret(DARK_GRAY[600])} !important`,
        },
      },
      postcss.comment({ text: 'purgecss end ignore' }),
    ]);
  },
  {
    theme: {
      extend: {
        colors: palette,
        /* Tailwind 2.2 writes the default border with its opacity variable
         * only from a colour it can call, and the default config's
         * `theme('colors.gray.200')` would have called gray-200 already */
        borderColor: { DEFAULT: palette.gray[200] },
      },
    },
  },
);
