import { defineConfig } from 'tsdown'

/**
 * term-explainer build config, aligned with the deepseek-harness monorepo
 * recipe (`packages/client/tsdown.client.ts`):
 *
 * - Node half (`lib/index.js`): plain ESM, node platform — the host Loader
 *   imports it as a cordis plugin; its peer deps resolve from the dsh
 *   installation's module fallback.
 * - Browser half (`lib/client.js`): a closure-factory artifact that calls
 *   `window.__ModuleLoader__.load({ id, factory })` and resolves platform
 *   seed modules through the injected `require` (loader module table). The
 *   `id` must equal the package name — that is the entry name the
 *   client-modules table keys on.
 *
 * Types ship from `lib/types` (tsc --emitDeclarationOnly, see tsconfig).
 */

const id = 'dsh-term-explainer'

/** Platform seed modules the shell shares into the frozen module table. */
const PLATFORM_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]

export default defineConfig([
  {
    name: id,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  {
    name: `${id}/client`,
    entry: { client: 'src/client/index.tsx' },
    // Browser bundle lands next to the node half (single lib/ artifact dir;
    // the entryFileNames pin keeps it exactly lib/client.js). clean must stay
    // off — a default clean would wipe the node-half output emitted above.
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    // tsdown auto-externalizes package dependencies; anything NOT in the
    // loader module table must inline instead. A require() the table cannot
    // answer is a guaranteed runtime throw, so the rule is the table list
    // itself: no opinion for table entries (external above wins), bundle
    // everything else.
    external: PLATFORM_EXTERNALS,
    noExternal: (specifier) => (PLATFORM_EXTERNALS.includes(specifier) ? undefined : true),
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
