import type { ModuleManifest } from '../types';

export const otManifest: ModuleManifest = {
  id: 'ot',
  title: 'Operation Theatre',
  category: 'clinical',
  icon: 'OT',
  requiredRoles: ['ROLE_SURGEON', 'ROLE_OT_NURSE', 'ROLE_ADMIN'],
  defaultPath: '/ot/schedule',
  description:
    'Theatre schedule, WHO surgical safety checklist, instruments & CSSD, implants, recovery',
  tabs: [
    {
      id: 'schedule',
      label: 'OT Schedule',
      path: '/ot/schedule',
    },
    {
      id: 'checklist',
      label: 'Safety Checklist',
      path: '/ot/checklist',
    },
    {
      id: 'cssd',
      label: 'Instruments & CSSD',
      path: '/ot/cssd',
    },
    {
      id: 'implants',
      label: 'Implants',
      path: '/ot/implants',
    },
    {
      id: 'store',
      label: 'Theatre Store',
      path: '/ot/store',
    },
    {
      id: 'recovery',
      label: 'Recovery (PACU)',
      path: '/ot/recovery',
    },
    {
      id: 'utilisation',
      label: 'OT Utilisation',
      path: '/ot/utilisation',
    },
  ],
};

export const manifest = otManifest;
