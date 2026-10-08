import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY, getEntitledModules, getModuleManifest } from './registry';
import type { ModuleManifest } from './types';

describe('Module Registry', () => {
  it('registers all 16 canonical staff modules', () => {
    expect(MODULE_REGISTRY.length).toBe(16);
    const ids = MODULE_REGISTRY.map((m: ModuleManifest) => m.id);
    expect(ids).toContain('reception');
    expect(ids).toContain('doctor');
    expect(ids).toContain('patient-record');
    expect(ids).toContain('ipd');
    expect(ids).toContain('nursing');
    expect(ids).toContain('ot');
    expect(ids).toContain('emergency');
    expect(ids).toContain('billing');
    expect(ids).toContain('insurance');
    expect(ids).toContain('pharmacy');
    expect(ids).toContain('lab');
    expect(ids).toContain('analytics');
    expect(ids).toContain('ai-workforce');
    expect(ids).toContain('quality');
    expect(ids).toContain('administration');
    expect(ids).toContain('superadmin');
  });

  it('filters entitled modules based on tenant subscription and user roles', () => {
    const entitled = getEntitledModules(['billing', 'reception'], ['ROLE_BILLING']);
    expect(entitled.map((m: ModuleManifest) => m.id)).toEqual(['billing']);
  });

  it('retrieves manifest by id', () => {
    const reception = getModuleManifest('reception');
    expect(reception).toBeDefined();
    expect(reception?.title).toBe('Reception / OPD');
    expect(reception?.tabs.length).toBeGreaterThanOrEqual(8);
  });
});
