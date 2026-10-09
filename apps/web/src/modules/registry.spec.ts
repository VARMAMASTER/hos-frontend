import { describe, it, expect } from 'vitest';
import {
  MODULE_REGISTRY,
  getEntitledModules,
  getModuleManifest,
} from './registry';
import type { ModuleManifest } from './types';
import { receptionManifest as reception } from './reception/manifest';
import { doctorManifest as doctor } from './doctor/manifest';
import { patientRecordManifest as patientRecord } from './patient-record/manifest';
import { ipdManifest as ipd } from './ipd/manifest';
import { nursingManifest as nursing } from './nursing/manifest';
import { otManifest as ot } from './ot/manifest';
import { emergencyManifest as emergency } from './emergency/manifest';
import { billingManifest as billing } from './billing/manifest';
import { insuranceManifest as insurance } from './insurance/manifest';
import { pharmacyManifest as pharmacy } from './pharmacy/manifest';
import { labManifest as lab } from './lab/manifest';
import { analyticsManifest as analytics } from './analytics/manifest';
import { aiWorkforceManifest as aiWorkforce } from './ai-workforce/manifest';
import { qualityManifest as quality } from './quality/manifest';
import { administrationManifest as administration } from './administration/manifest';
import { superadminManifest as superadmin } from './superadmin/manifest';

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
    const entitled = getEntitledModules(
      ['billing', 'reception'],
      ['ROLE_BILLING'],
    );
    expect(entitled.map((m: ModuleManifest) => m.id)).toEqual(['billing']);
  });

  it('retrieves manifest by id', () => {
    const reception = getModuleManifest('reception');
    expect(reception).toBeDefined();
    expect(reception?.title).toBe('Reception / OPD');
    expect(reception?.tabs.length).toBeGreaterThanOrEqual(8);
  });

  // One source per module: the registry is assembled from each module's own manifest.ts, so the
  // two can never drift apart.
  const OWN_MANIFESTS: Array<[string, ModuleManifest]> = [
    ['reception', reception],
    ['doctor', doctor],
    ['patient-record', patientRecord],
    ['ipd', ipd],
    ['nursing', nursing],
    ['ot', ot],
    ['emergency', emergency],
    ['billing', billing],
    ['insurance', insurance],
    ['pharmacy', pharmacy],
    ['lab', lab],
    ['analytics', analytics],
    ['ai-workforce', aiWorkforce],
    ['quality', quality],
    ['administration', administration],
    ['superadmin', superadmin],
  ];

  it.each(OWN_MANIFESTS)(
    'holds the %s module own manifest.ts, not a copy',
    (id, own) => {
      expect(own.id).toBe(id);
      expect(getModuleManifest(id)).toBe(own);
    },
  );

  it('lists the modules in the sidebar order, each once', () => {
    expect(MODULE_REGISTRY.map((m) => m.id)).toEqual(
      OWN_MANIFESTS.map(([id]) => id),
    );
  });

  it('calls a module a module, never a workspace (BLUEPRINT §6)', () => {
    for (const manifest of MODULE_REGISTRY) {
      expect(manifest.title, manifest.id).not.toMatch(/workspace/i);
    }
    expect(getModuleManifest('doctor')?.title).toBe('Doctor');
  });
});
