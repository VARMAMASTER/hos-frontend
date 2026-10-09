import { AiMark } from '@hos/nova-ui';
import { createElement } from 'react';
import type { ModuleManifest } from '../types';

export const aiWorkforceManifest: ModuleManifest = {
  id: 'ai-workforce',
  title: 'AI Workforce Fleet',
  category: 'intelligence',
  icon: createElement(AiMark, { size: 'md' }),
  requiredRoles: ['ROLE_OWNER', 'ROLE_ADMIN'],
  defaultPath: '/ai-workforce/overview',
  description:
    '5-worker summary feed, WhatsApp agent, Voice agent, Scribe agent, Billing agent, Discharge & Lab agent',
  tabs: [
    {
      id: 'overview',
      label: 'Overview',
      path: '/ai-workforce/overview',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Assistant',
      path: '/ai-workforce/whatsapp',
    },
    {
      id: 'voice',
      label: 'Voice Assistant',
      path: '/ai-workforce/voice',
    },
    {
      id: 'scribe',
      label: 'AI Scribe',
      path: '/ai-workforce/scribe',
    },
    {
      id: 'billing',
      label: 'Billing Agent',
      path: '/ai-workforce/billing',
    },
    {
      id: 'discharge-lab',
      label: 'Discharge & Lab',
      path: '/ai-workforce/discharge-lab',
    },
  ],
};

export const manifest = aiWorkforceManifest;
