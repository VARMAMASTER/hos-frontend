import { seedPatient } from './seed-patient';
import type { AccessGrant, FamilyOverview } from './types';

// The family and consent tab's sample data. Phone and ABHA numbers are invented.

export const ACCESS_CATEGORIES = [
  'OPD visit summaries',
  'Lab reports',
  'Bills & receipts',
  'Prescriptions',
] as const;

export function grants(allowed: boolean): AccessGrant[] {
  return ACCESS_CATEGORIES.map((category) => ({ category, allowed }));
}

export function seedFamily(): FamilyOverview {
  return {
    patient: seedPatient(),
    links: [
      {
        id: 'link-venkatesh',
        name: 'Venkatesh Naidu',
        initials: 'VN',
        relation: 'Son',
        phone: '+91 90140 55231',
        abha: '91-2298-1147-6603',
        status: 'linked',
        statusDate: '14 Mar 2022',
        access: grants(true),
      },
    ],
    consents: [
      {
        id: 'whatsapp',
        title: 'WhatsApp opt-in',
        detail:
          'Reminders & reports to +91 98491 22310 · consented 14 Mar 2022 at reception (Swapna)',
        enabled: true,
        changeable: true,
      },
      {
        id: 'abha',
        title: 'ABHA record sharing',
        detail: 'Linked to ABHA 91-4327-8810-4455 · scope: OPD + lab reports',
        enabled: true,
        changeable: false,
      },
    ],
    requests: [],
  };
}
