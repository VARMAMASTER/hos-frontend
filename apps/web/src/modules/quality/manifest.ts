import type { ModuleManifest } from '../types';

export const qualityManifest: ModuleManifest = {
  id: 'quality',
  title: 'Quality & Accreditation',
  category: 'governance',
  icon: 'Qs',
  requiredRoles: ['ROLE_QUALITY_NURSE', 'ROLE_NABH_COORDINATOR', 'ROLE_ADMIN'],
  defaultPath: '/quality/accreditation',
  description:
    'NABH accreditation evidence ledger, incident reporting, HAI infection surveillance, mortality review, audit loops',
  tabs: [
    {
      id: 'accreditation',
      label: 'Accreditation',
      path: '/quality/accreditation',
    },
    {
      id: 'incidents',
      label: 'Incidents',
      path: '/quality/incidents',
    },
    {
      id: 'infection',
      label: 'Infection Control',
      path: '/quality/infection',
    },
    {
      id: 'medication',
      label: 'Medication Safety',
      path: '/quality/medication',
    },
    {
      id: 'mortality',
      label: 'Mortality Review',
      path: '/quality/mortality',
    },
    {
      id: 'audit',
      label: 'Clinical Audit',
      path: '/quality/audit',
    },
    {
      id: 'risk',
      label: 'Risk Register',
      path: '/quality/risk',
    },
    {
      id: 'sops',
      label: 'SOP Library',
      path: '/quality/sops',
    },
  ],
};

export const manifest = qualityManifest;
