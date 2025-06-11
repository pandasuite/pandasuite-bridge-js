import { defineConfig } from 'vite';
import { resolve } from 'path';
import babel from '@rollup/plugin-babel';

const isMinified = process.env.BUILD_MINIFIED === 'true';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'PandaBridge',
      fileName: (format) => {
        if (isMinified) {
          return 'pandasuite-bridge.min.js';
        }
        if (format === 'umd') {
          return 'pandasuite-bridge.js';
        }
        return `pandasuite-bridge.${format}.js`;
      },
      formats: isMinified ? ['umd'] : ['umd', 'es'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named',
      },
      plugins: [
        babel({
          babelHelpers: 'bundled',
          exclude: 'node_modules/**',
        }),
      ],
    },
    outDir: 'lib',
    emptyOutDir: false,
    sourcemap: false,
    minify: isMinified ? 'terser' : false,
    terserOptions: isMinified
      ? {
          compress: true,
          mangle: true,
        }
      : undefined,
    target: 'esnext',
  },
});
