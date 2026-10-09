import type { ModuleManifest } from '../types';

export const emergencyManifest: ModuleManifest = {
  id: 'emergency',
  title: 'Emergency & Casualty',
  category: 'clinical',
  icon: 'ER',
  requiredRoles: ['ROLE_EMERGENCY_DOC', 'ROLE_NURSE', 'ROLE_ADMIN'],
  defaultPath: '/emergency/arrivals',
  description:
    'Unknown patient intake, triage board, fast track, observation clocks, ambulance, MLC register',
  tabs: [
    {
      id: 'arrivals',
      label: 'Arrivals',
      path: '/emergency/arrivals',
      badge: '3',
    },
    {
      id: 'triage',
      label: 'Triage Board',
      path: '/emergency/triage',
    },
    {
      id: 'fasttrack',
      label: 'Fast Track',
      path: '/emergency/fasttrack',
    },
    {
      id: 'observation',
      label: 'Observation',
      path: '/emergency/observation',
    },
    {
      id: 'ambulance',
      label: 'Ambulance',
      path: '/emergency/ambulance',
    },
    {
      id: 'mlc',
      label: 'MLC Register',
      path: '/emergency/mlc',
    },
  ],
};

export const manifest = emergencyManifest;
