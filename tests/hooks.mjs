/* Test runner only. Two things Node's resolver needs that a bundler does not: the
 * extension on the `lodash-es` subpaths, so the tests load the source exactly as
 * it is published, and the module format of that source, which `package.json`
 * cannot declare because `main` is the UMD build. */
const source = new URL('../src/index.js', import.meta.url).href;

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('lodash-es/') && !specifier.endsWith('.js')) {
    return next(`${specifier}.js`, context);
  }

  const resolved = await next(specifier, context);

  if (resolved.url === source) {
    return { ...resolved, format: 'module' };
  }
  return resolved;
}
