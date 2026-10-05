// @vitest-environment node
// Nova is publishable from day one (BLUEPRINT §3), so moving it out of the monorepo stays mechanical.
// These pin what a consumer of the built package relies on.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import viteConfig from '../vite.config.mjs';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const libTsconfig = JSON.parse(
  readFileSync(join(root, 'tsconfig.lib.json'), 'utf8'),
);

describe('the published package', () => {
  it('ships theme.css and exports it, since every component is unstyled without it', () => {
    expect(pkg.exports['./theme.css']).toMatchObject({
      default: './dist/theme.css',
    });
    expect(pkg.files).toContain('dist');
  });

  it('takes React from the app as a peer, never a copy of its own', () => {
    expect(pkg.peerDependencies).toMatchObject({
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    });
    expect(pkg.dependencies ?? {}).not.toHaveProperty('react');
    expect(pkg.dependencies ?? {}).not.toHaveProperty('react-dom');
  });

  it('keeps the Storybook helpers out of the library build', () => {
    expect(libTsconfig.exclude).toContain('src/stories/**');
  });

  it('bundles none of React, Recharts or react-is: they resolve from node_modules', () => {
    const config =
      typeof viteConfig === 'function'
        ? viteConfig({ command: 'build', mode: 'production' })
        : viteConfig;
    const external = config.build?.rolldownOptions?.external;
    expect(typeof external).toBe('function');
    const isExternal = external as (id: string) => boolean;
    for (const id of [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'recharts',
      'react-is',
    ]) {
      expect(isExternal(id), id).toBe(true);
    }
    for (const id of ['./components/button/button', 'reactive', 'clsx']) {
      expect(isExternal(id), id).toBe(false);
    }
  });
});
