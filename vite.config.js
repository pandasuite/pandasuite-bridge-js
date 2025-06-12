import { defineConfig } from 'vite';
import { resolve } from 'path';
import babel from '@rollup/plugin-babel';

const isMinified = process.env.BUILD_MINIFIED === 'true';
const buildType = process.env.BUILD_TYPE || 'both';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(
        __dirname,
        buildType === 'umd' || isMinified ? 'src/index.umd.js' : 'src/index.js',
      ),
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
      formats: (() => {
        if (isMinified) return ['umd'];
        if (buildType === 'umd') return ['umd'];
        if (buildType === 'es') return ['es'];
        return ['umd', 'es'];
      })(),
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: buildType === 'umd' || isMinified ? 'default' : 'named',
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
