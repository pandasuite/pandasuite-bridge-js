module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './node_modules/pandasuite-bridge/tailwind*.{js,jsx,ts,tsx}',
  ],
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
};
