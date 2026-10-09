import { ModuleManifest } from './types';

export const MODULE_REGISTRY: ModuleManifest[] = [
  // Clinical
  {
    id: 'reception',
    title: 'Reception / OPD',
    category: 'clinical',
    icon: 'Re',
    requiredRoles: ['ROLE_RECEPTION', 'ROLE_ADMIN'],
    defaultPath: '/reception/queue',
    description:
      'Live token queue, appointments, registration, AI calling, referrals',
    tabs: [
      {
        id: 'queue',
        label: 'Live Queue',
        path: '/reception/queue',
        badge: '14',
      },
      {
        id: 'appointments',
        label: 'Appointments',
        path: '/reception/appointments',
      },
      { id: 'schedule', label: 'Day Schedule', path: '/reception/schedule' },
      {
        id: 'registration',
        label: 'Registration',
        path: '/reception/registration',
      },
      { id: 'admission', label: 'Admission', path: '/reception/admission' },
      { id: 'aicalling', label: 'AI Calling', path: '/reception/aicalling' },
      {
        id: 'whatsapp',
        label: 'WhatsApp Assistant',
        path: '/reception/whatsapp',
      },
      { id: 'referrals', label: 'Referrals', path: '/reception/referrals' },
    ],
  },
  {
    id: 'doctor',
    title: 'Doctor Workspace',
    category: 'clinical',
    icon: 'Dr',
    requiredRoles: ['ROLE_DOCTOR', 'ROLE_CLINICAL_HEAD'],
    defaultPath: '/doctor/queue',
    description:
      'Queue, consultation scribe, progress notes, orders & Rx, case discussion, AI insights',
    tabs: [
      { id: 'queue', label: 'My Queue', path: '/doctor/queue', badge: '26' },
      { id: 'consult', label: 'Consultation', path: '/doctor/consult' },
      { id: 'notes', label: 'Progress Notes', path: '/doctor/notes' },
      { id: 'orders', label: 'Orders & Rx', path: '/doctor/orders' },
      { id: 'coding', label: 'Coding & Claims', path: '/doctor/coding' },
      { id: 'referrals', label: 'Referrals Out', path: '/doctor/referrals' },
      { id: 'history', label: 'Patient History', path: '/doctor/history' },
      { id: 'discuss', label: 'Case Discussion', path: '/doctor/discuss' },
      { id: 'aiteam', label: 'My AI Team', path: '/doctor/aiteam' },
      { id: 'insights', label: 'AI Insights', path: '/doctor/insights' },
    ],
  },
  {
    id: 'patient-record',
    title: 'Patient Records',
    category: 'clinical',
    icon: 'Pt',
    requiredRoles: ['ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_ADMIN'],
    defaultPath: '/patient-record/snapshot',
    description:
      'Clinical snapshot, demographics, clinical timeline, document vault, family & consent',
    tabs: [
      {
        id: 'snapshot',
        label: 'Clinical Snapshot',
        path: '/patient-record/snapshot',
      },
      { id: 'profile', label: 'Profile', path: '/patient-record/profile' },
      { id: 'timeline', label: 'Timeline', path: '/patient-record/timeline' },
      {
        id: 'documents',
        label: 'Documents',
        path: '/patient-record/documents',
      },
      {
        id: 'family',
        label: 'Family & Consent',
        path: '/patient-record/family',
      },
      {
        id: 'patientview',
        label: 'Patient View',
        path: '/patient-record/patientview',
      },
    ],
  },
  {
    id: 'ipd',
    title: 'Inpatient (IPD)',
    category: 'clinical',
    icon: 'IP',
    requiredRoles: ['ROLE_NURSE', 'ROLE_DOCTOR', 'ROLE_ADMIN'],
    defaultPath: '/ipd/bedboard',
    description:
      '60-bed ward board, live ICU vitals, admissions, nursing station, discharge summary',
    tabs: [
      {
        id: 'bedboard',
        label: 'Bed Board',
        path: '/ipd/bedboard',
        badge: '48/60',
      },
      { id: 'icu', label: 'ICU & Emergency', path: '/ipd/icu' },
      { id: 'admissions', label: 'Admissions', path: '/ipd/admissions' },
      { id: 'nursing', label: 'Nursing Station', path: '/ipd/nursing' },
      { id: 'discharge', label: 'Discharge', path: '/ipd/discharge' },
    ],
  },
  {
    id: 'nursing',
    title: 'Ward Nursing',
    category: 'clinical',
    icon: 'Nu',
    requiredRoles: ['ROLE_NURSE'],
    defaultPath: '/nursing/patients',
    description:
      'My patients, SBAR shift handover, medication round eMAR, ward stock, voice vitals, assessments',
    tabs: [
      {
        id: 'patients',
        label: 'My Patients',
        path: '/nursing/patients',
        badge: '8',
      },
      { id: 'handover', label: 'Shift Handover', path: '/nursing/handover' },
      { id: 'meds', label: 'Medication Round', path: '/nursing/meds' },
      { id: 'stock', label: 'Ward Stock', path: '/nursing/stock' },
      { id: 'vitals', label: 'Vitals & Charting', path: '/nursing/vitals' },
      { id: 'assessments', label: 'Assessments', path: '/nursing/assessments' },
      { id: 'careplans', label: 'Care Plans', path: '/nursing/careplans' },
    ],
  },
  {
    id: 'ot',
    title: 'Operation Theatre',
    category: 'clinical',
    icon: 'OT',
    requiredRoles: ['ROLE_SURGEON', 'ROLE_OT_NURSE', 'ROLE_ADMIN'],
    defaultPath: '/ot/schedule',
    description:
      'Theatre schedule, WHO surgical safety checklist, instruments & CSSD, implants, recovery',
    tabs: [
      { id: 'schedule', label: 'OT Schedule', path: '/ot/schedule' },
      { id: 'checklist', label: 'Safety Checklist', path: '/ot/checklist' },
      { id: 'cssd', label: 'Instruments & CSSD', path: '/ot/cssd' },
      { id: 'implants', label: 'Implants', path: '/ot/implants' },
      { id: 'store', label: 'Theatre Store', path: '/ot/store' },
      { id: 'recovery', label: 'Recovery (PACU)', path: '/ot/recovery' },
      { id: 'utilisation', label: 'OT Utilisation', path: '/ot/utilisation' },
    ],
  },
  {
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
      { id: 'triage', label: 'Triage Board', path: '/emergency/triage' },
      { id: 'fasttrack', label: 'Fast Track', path: '/emergency/fasttrack' },
      {
        id: 'observation',
        label: 'Observation',
        path: '/emergency/observation',
      },
      { id: 'ambulance', label: 'Ambulance', path: '/emergency/ambulance' },
      { id: 'mlc', label: 'MLC Register', path: '/emergency/mlc' },
    ],
  },

  // Financial & Ancillary
  {
    id: 'billing',
    title: 'Billing & Cashier',
    category: 'financial',
    icon: 'Bi',
    requiredRoles: ['ROLE_BILLING', 'ROLE_ACCOUNTANT', 'ROLE_ADMIN'],
    defaultPath: '/billing/composer',
    description:
      'Bill composer, AI line items, advances & packages, GST invoices, claims & pre-auth, AR',
    tabs: [
      { id: 'composer', label: 'Bill Composer', path: '/billing/composer' },
      {
        id: 'advances',
        label: 'Advances & Packages',
        path: '/billing/advances',
      },
      { id: 'gst', label: 'GST Invoices', path: '/billing/gst' },
      { id: 'claims', label: 'Claims & Pre-auth', path: '/billing/claims' },
      { id: 'ar', label: 'Outstanding (AR)', path: '/billing/ar' },
    ],
  },
  {
    id: 'insurance',
    title: 'Insurance & Claims',
    category: 'financial',
    icon: 'In',
    requiredRoles: ['ROLE_INSURANCE_DESK', 'ROLE_BILLING', 'ROLE_ADMIN'],
    defaultPath: '/insurance/eligibility',
    description:
      'PM-JAY/TPA eligibility, pre-auth & enhancements, settlement & deductions, reimbursement, ageing',
    tabs: [
      {
        id: 'eligibility',
        label: 'Eligibility',
        path: '/insurance/eligibility',
      },
      {
        id: 'preauth',
        label: 'Pre-auth & Enhancement',
        path: '/insurance/preauth',
      },
      {
        id: 'settlement',
        label: 'Settlement & Deductions',
        path: '/insurance/settlement',
      },
      {
        id: 'reimbursement',
        label: 'Reimbursement',
        path: '/insurance/reimbursement',
      },
      { id: 'payers', label: 'Payers & Contracts', path: '/insurance/payers' },
      { id: 'ageing', label: 'Ageing by Payer', path: '/insurance/ageing' },
    ],
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy & Dispense',
    category: 'financial',
    icon: 'Ph',
    requiredRoles: ['ROLE_PHARMACIST', 'ROLE_ADMIN'],
    defaultPath: '/pharmacy/dispense',
    description:
      'Dispense queue, counter sale, stock & batches, FEFO expiry, registers, purchase & GRN',
    tabs: [
      {
        id: 'dispense',
        label: 'Dispense Queue',
        path: '/pharmacy/dispense',
        badge: '11',
      },
      { id: 'counter', label: 'Counter Sale', path: '/pharmacy/counter' },
      { id: 'stock', label: 'Stock & Batches', path: '/pharmacy/stock' },
      {
        id: 'fillrate',
        label: 'Fill Rate & Lost Sales',
        path: '/pharmacy/fillrate',
      },
      { id: 'expiry', label: 'Expiry & FEFO', path: '/pharmacy/expiry' },
      { id: 'stores', label: 'Stores & Transfers', path: '/pharmacy/stores' },
      { id: 'count', label: 'Count & Variance', path: '/pharmacy/count' },
      {
        id: 'registers',
        label: 'Statutory Registers',
        path: '/pharmacy/registers',
      },
      { id: 'forecast', label: 'Demand Forecast', path: '/pharmacy/forecast' },
      { id: 'purchase', label: 'Purchase & GRN', path: '/pharmacy/purchase' },
      { id: 'master', label: 'Drug Master', path: '/pharmacy/master' },
    ],
  },
  {
    id: 'lab',
    title: 'Laboratory & Diagnostics',
    category: 'financial',
    icon: 'La',
    requiredRoles: ['ROLE_LAB_TECH', 'ROLE_PATHOLOGIST', 'ROLE_ADMIN'],
    defaultPath: '/lab/queue',
    description:
      'Order queue, critical results, sample tracking kanban, analyser interface, result entry, TAT',
    tabs: [
      { id: 'queue', label: 'Order Queue', path: '/lab/queue', badge: '19' },
      {
        id: 'critical',
        label: 'Critical Results',
        path: '/lab/critical',
        badge: '2',
      },
      { id: 'tracking', label: 'Sample Tracking', path: '/lab/tracking' },
      { id: 'analyzer', label: 'Analyser Interface', path: '/lab/analyzer' },
      { id: 'entry', label: 'Result Entry', path: '/lab/entry' },
      { id: 'tat', label: 'TAT Intelligence', path: '/lab/tat' },
      { id: 'reports', label: 'Reports & Delivery', path: '/lab/reports' },
    ],
  },

  // Intelligence & Governance
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    category: 'intelligence',
    icon: 'An',
    requiredRoles: ['ROLE_OWNER', 'ROLE_ADMIN'],
    defaultPath: '/analytics/ask',
    description:
      'Ask anything NL queries, return on HOS, census occupancy trend, revenue leaderboard',
    tabs: [
      { id: 'ask', label: 'Ask Anything', path: '/analytics/ask' },
      { id: 'roi', label: 'Return on HOS', path: '/analytics/roi' },
      { id: 'census', label: 'Census & Occupancy', path: '/analytics/census' },
      { id: 'revenue', label: 'Revenue Trends', path: '/analytics/revenue' },
    ],
  },
  {
    id: 'ai-workforce',
    title: 'AI Workforce Fleet',
    category: 'intelligence',
    icon: '✦',
    requiredRoles: ['ROLE_OWNER', 'ROLE_ADMIN'],
    defaultPath: '/ai-workforce/overview',
    description:
      '5-worker summary feed, WhatsApp agent, Voice agent, Scribe agent, Billing agent, Discharge & Lab agent',
    tabs: [
      { id: 'overview', label: 'Overview', path: '/ai-workforce/overview' },
      {
        id: 'whatsapp',
        label: 'WhatsApp Assistant',
        path: '/ai-workforce/whatsapp',
      },
      { id: 'voice', label: 'Voice Assistant', path: '/ai-workforce/voice' },
      { id: 'scribe', label: 'AI Scribe', path: '/ai-workforce/scribe' },
      { id: 'billing', label: 'Billing Agent', path: '/ai-workforce/billing' },
      {
        id: 'discharge-lab',
        label: 'Discharge & Lab',
        path: '/ai-workforce/discharge-lab',
      },
    ],
  },
  {
    id: 'quality',
    title: 'Quality & Accreditation',
    category: 'governance',
    icon: 'Qs',
    requiredRoles: [
      'ROLE_QUALITY_NURSE',
      'ROLE_NABH_COORDINATOR',
      'ROLE_ADMIN',
    ],
    defaultPath: '/quality/accreditation',
    description:
      'NABH accreditation evidence ledger, incident reporting, HAI infection surveillance, mortality review, audit loops',
    tabs: [
      {
        id: 'accreditation',
        label: 'Accreditation',
        path: '/quality/accreditation',
      },
      { id: 'incidents', label: 'Incidents', path: '/quality/incidents' },
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
      { id: 'audit', label: 'Clinical Audit', path: '/quality/audit' },
      { id: 'risk', label: 'Risk Register', path: '/quality/risk' },
      { id: 'sops', label: 'SOP Library', path: '/quality/sops' },
    ],
  },

  // Settings & Platform
  {
    id: 'administration',
    title: 'Administration',
    category: 'settings',
    icon: 'Ad',
    requiredRoles: ['ROLE_ADMIN', 'ROLE_OWNER'],
    defaultPath: '/administration/overview',
    description:
      'Hospital profile, departments, staff & roles, tariff master, GST & templates, AI ethics committee, audit log',
    tabs: [
      { id: 'overview', label: 'Overview', path: '/administration/overview' },
      {
        id: 'departments',
        label: 'Departments',
        path: '/administration/departments',
      },
      { id: 'staff', label: 'Staff & Roles', path: '/administration/staff' },
      { id: 'tariff', label: 'Tariff Master', path: '/administration/tariff' },
      { id: 'gst', label: 'GST & Templates', path: '/administration/gst' },
      {
        id: 'aiquality',
        label: 'AI Quality & Ethics',
        path: '/administration/aiquality',
      },
      {
        id: 'compliance',
        label: 'Compliance & NABH',
        path: '/administration/compliance',
      },
      {
        id: 'training',
        label: 'Training Sandbox',
        path: '/administration/training',
      },
      { id: 'audit', label: 'Audit Log', path: '/administration/audit' },
    ],
  },
  {
    id: 'superadmin',
    title: 'HOS HQ Superadmin',
    category: 'platform',
    icon: 'HQ',
    requiredRoles: ['ROLE_SUPERADMIN'],
    defaultPath: '/superadmin/tenants',
    description:
      'Fleet tenants, plans & pricing, usage metering, AI fleet kill switch, releases, system health, telemetry',
    tabs: [
      { id: 'tenants', label: 'Tenants', path: '/superadmin/tenants' },
      { id: 'plans', label: 'Plans & Pricing', path: '/superadmin/plans' },
      { id: 'usage', label: 'Usage Metering', path: '/superadmin/usage' },
      {
        id: 'aicontrol',
        label: 'AI Fleet Control',
        path: '/superadmin/aicontrol',
      },
      {
        id: 'releases',
        label: 'Release & Rollout',
        path: '/superadmin/releases',
      },
      { id: 'incidents', label: 'Incidents', path: '/superadmin/incidents' },
      { id: 'health', label: 'System Health', path: '/superadmin/health' },
      {
        id: 'observability',
        label: 'Telemetry & Logs',
        path: '/superadmin/observability',
      },
      { id: 'support', label: 'Tickets & Issues', path: '/superadmin/support' },
      {
        id: 'provisioning',
        label: 'Provisioning',
        path: '/superadmin/provisioning',
      },
      { id: 'team', label: 'HOS Team', path: '/superadmin/team' },
      {
        id: 'breakglass',
        label: 'Break-glass Log',
        path: '/superadmin/breakglass',
      },
    ],
  },
];

export function getModuleManifest(id: string): ModuleManifest | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getEntitledModules(
  tenantModules: string[],
  userRoles: string[],
): ModuleManifest[] {
  return MODULE_REGISTRY.filter((module) => {
    const isTenantEntitled = tenantModules.includes(module.id);
    const isRoleAuthorized =
      module.requiredRoles.some((r) => userRoles.includes(r)) ||
      userRoles.includes('ROLE_SUPERADMIN');
    return isTenantEntitled && isRoleAuthorized;
  });
}
