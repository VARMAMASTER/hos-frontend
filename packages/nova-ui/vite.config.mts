/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'node:fs';
import * as path from 'path';
import type { Plugin } from 'vite';

// Resolved from the consumer's node_modules, never bundled: React (and its subpaths) is a peer, and
// Recharts and react-is are ordinary dependencies the app installs once.
const EXTERNAL = /^(?:react|react-dom|recharts|react-is)(?:\/|$)/;

// theme.css is the package's other half: the tokens, the material utilities and the Tailwind
// @theme mapping every component's classes rely on. It ships as dist/theme.css (exported as
// "@hos/nova-ui/theme.css") for the app's own Tailwind build to import.
function shipThemeCss(): Plugin {
  return {
    name: 'nova:ship-theme-css',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'theme.css',
        source: readFileSync(
          path.join(import.meta.dirname, 'src/styles/theme.css'),
          'utf8',
        ),
      });
    },
  };
}

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/nova-ui',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
    }),
    tailwindcss(),
    shipThemeCss(),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'nova-ui',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const],
    },
    rolldownOptions: {
      external: (id: string) => EXTERNAL.test(id),
    },
  },
  test: {
    name: 'nova-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
