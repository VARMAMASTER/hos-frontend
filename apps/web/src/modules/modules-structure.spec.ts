import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY } from './registry';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Modules Directory Structure', () => {
  const modulesRoot = path.resolve(__dirname);

  it.each(MODULE_REGISTRY)('module "$id" satisfies the MFE directory contract', (manifest) => {
    const modDir = path.join(modulesRoot, manifest.id);
    expect(fs.existsSync(modDir), `Directory for ${manifest.id} must exist`).toBe(true);
    expect(fs.existsSync(path.join(modDir, 'manifest.ts')), `manifest.ts must exist in ${manifest.id}`).toBe(true);
    expect(fs.existsSync(path.join(modDir, 'routes.tsx')), `routes.tsx must exist in ${manifest.id}`).toBe(true);
    expect(fs.existsSync(path.join(modDir, 'index.ts')), `index.ts must exist in ${manifest.id}`).toBe(true);

    const tabsDir = path.join(modDir, 'tabs');
    expect(fs.existsSync(tabsDir), `tabs directory must exist in ${manifest.id}`).toBe(true);

    manifest.tabs.forEach((tab) => {
      const tabDir = path.join(tabsDir, tab.id);
      expect(fs.existsSync(tabDir), `tab folder "${tab.id}" must exist in ${manifest.id}`).toBe(true);
      expect(fs.existsSync(path.join(tabDir, 'index.ts')), `index.ts must exist in ${manifest.id}/tabs/${tab.id}`).toBe(true);
      expect(fs.existsSync(path.join(tabDir, `${tab.id}-view.tsx`)), `${tab.id}-view.tsx must exist in ${manifest.id}/tabs/${tab.id}`).toBe(true);
    });
  });
});
