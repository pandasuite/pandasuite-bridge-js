/* react-search-component's tailwind.config.js, adopting the theme plugin: its
 * own purge (here on a fixture of its markup), its own font sizes, no preset. */
const path = require('path');

module.exports = {
  purge: [path.join(__dirname, 'src/**/*.{js,jsx,ts,tsx}')],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    fontSize: {
      xs: '.625rem',
      sm: '.75rem',
      base: '.875rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.25rem',
      '3xl': '1.5rem',
      '4xl': '1.875rem',
      '5xl': '2.25rem',
      '6xl': '3rem',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('../../../studio-theme')],
};
