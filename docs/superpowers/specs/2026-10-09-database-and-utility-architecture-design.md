# HOS Database & Utility Package Architecture Design Specification

- **Date:** 2026-10-09
- **Status:** Proposed for User Review
- **Repository Impact:**
  - `hos-backend/packages/hos-utility`: Shared domain utilities, tenant scoping, money arithmetic, and event spine envelopes.
  - `hos-backend/packages/db`: Drizzle ORM schemas, relations, and PostgreSQL migrations.
  - `os/`: Aligned prototype deployed live at `https://tryhos.vercel.app`.

---

## 1. Executive Summary & Philosophy

HOS is a multi-tenant hospital operating system built for high-throughput, Tier-2/3 Indian private hospitals (e.g. Sri Venkateshwara Multi-Speciality Hospital). In accordance with **ADR #5 (Engineering Foundations)**:

1. **The database is the source of truth.** AI outputs (SOAP notes, prescriptions, pre-authorizations) are strictly **drafts** until explicitly signed off by a licensed human operator.
2. **Immutable Event Spine:** Every clinical and financial transition (registered, consulted, prescribed, ordered, dispensed, billed) emits an immutable domain event.
3. **Paise-Safe Financial Precision:** All money values are stored as integers in paise (`₹1.00 = 100 paise`), eliminating IEEE floating-point rounding bugs in pharmacy and hospital bills.
4. **Strict Multi-Tenancy:** Every table contains `tenant_id` and `company_id`. No query runs across tenants without explicit scoping.

---

## 2. Utility Package Architecture (`@hos/hos-utility`)

Before creating database tables, `@hos/hos-utility` will be expanded to provide the shared runtime foundation:

### 2.1 Multi-Tenancy Scoping (`src/tenancy/`)

- `TenantContext`: Interface carrying `tenantId: string`, `companyId: string`, and `userId: string`.
- `withTenant(table, tenantId)`: Drizzle SQL helper ensuring automatic `eq(table.tenantId, tenantId)` filtering.

### 2.2 Identifier & Token Generators (`src/ids/`)

- **Prefixed Typed IDs:** ULID/CUID-based globally unique, timestamp-ordered identifiers:
  - `pat_` (Patient)
  - `enc_` (Encounter)
  - `con_` (Consultation)
  - `rx_` (Prescription)
  - `ord_` (Service Request / Order)
  - `inv_` (Billing Invoice)
  - `evt_` (Domain Event)
- **Clinical Sequence Numbers:**
  - Token generator: `T-01` through `T-99` for daily outpatient clinic pacing.
  - Medical Record Number (MRN): `MRN-2026-XXXX`.
  - Tax Invoice Number: `INV-2026-XXXX`.

### 2.3 Financial Math (`src/money/`)

- `paiseToRupees(paise: number): string` &rarr; e.g. `63100` &rarr; `"₹631.00"` (Indian numbering format).
- `rupeesToPaise(rupees: number): number`.
- `calculateGst(paise: number, ratePercent: number): { basePaise: number, gstPaise: number, totalPaise: number }`.

### 2.4 Date & Time (IST-First) (`src/time/`)

- IST time helpers (Asia/Kolkata, UTC+05:30).
- Appointment slot calculation and clinical age / DOB calculators.

### 2.5 Event Spine Envelope (`src/events/`)

- `DomainEvent<T>` contract:
  ```typescript
  export interface DomainEvent<T = unknown> {
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    tenantId: string;
    actorId: string;
    payload: T;
    occurredAt: Date;
  }
  ```

### 2.6 PII Sanitization & Masking (`src/masking/`)

- Phone masking: `+91 98490 12345` &rarr; `+91 98*** **345`.
- Aadhaar / ABHA masking: `ABHA 14-XXXX-XXXX-1234`.

---

## 3. Database Table Schemas (`@hos/db` with Drizzle ORM)

### Domain 1: Tenancy & Staff (Identity)

```typescript
// tenants
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(), // e.g. 'sri-venkateshwara'
  name: text('name').notNull(),
  legalName: text('legal_name'),
  gstin: text('gstin'),
  tier: text('tier').default('T2').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// staff_users
export const staffUsers = pgTable('staff_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  name: text('name').notNull(), // e.g. 'Dr. K. Ramesh'
  role: text('role').notNull(), // 'DOCTOR' | 'RECEPTIONIST' | 'NURSE' | 'PHARMACIST' | 'BILLING'
  specialty: text('specialty'), // 'General Medicine'
  phone: text('phone').notNull(),
  email: text('email'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Domain 2: Patients & Encounters

```typescript
// patients
export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  mrn: text('mrn').notNull(), // 'MRN-2026-0812'
  name: text('name').notNull(), // 'Lakshmi Devi'
  age: integer('age').notNull(),
  gender: text('gender').notNull(), // 'FEMALE' | 'MALE' | 'OTHER'
  phone: text('phone').notNull(),
  abhaId: text('abha_id'),
  address: text('address'),
  allergies: jsonb('allergies').default([]).notNull(), // ['Penicillin', 'Sulfa']
  problemList: jsonb('problem_list').default([]).notNull(), // ['T2DM', 'HTN', 'CKD 3a']
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// queue_tokens (Daily clinic queue)
export const queueTokens = pgTable('queue_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  tokenDisplay: text('token_display').notNull(), // 'T-12'
  tokenNumber: integer('token_number').notNull(), // 12
  patientId: uuid('patient_id')
    .references(() => patients.id)
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => staffUsers.id)
    .notNull(),
  status: text('status').default('WAITING').notNull(), // 'WAITING' | 'IN_ROOM' | 'DONE' | 'CANCELLED'
  queueDate: date('queue_date').notNull(),
  complaint: text('complaint'), // 'T2DM follow-up'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Domain 3: Clinical Encounters, SOAP Notes & Prescriptions

```typescript
// consultations
export const consultations = pgTable('consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  tokenId: uuid('token_id')
    .references(() => queueTokens.id)
    .notNull(),
  patientId: uuid('patient_id')
    .references(() => patients.id)
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => staffUsers.id)
    .notNull(),
  status: text('status').default('IN_PROGRESS').notNull(), // 'IN_PROGRESS' | 'COMPLETED'
  vitals: jsonb('vitals'), // { bp: '148/92', rbs: 214, pulse: 82, weight: 68 }
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// soap_notes
export const soapNotes = pgTable('soap_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  consultationId: uuid('consultation_id')
    .references(() => consultations.id)
    .notNull(),
  subjective: jsonb('subjective').notNull(), // { te: '...', en: '...' }
  objective: jsonb('objective').notNull(), // { exam: '...', labs: '...' }
  assessment: jsonb('assessment').notNull(), // clinical impressions & regulatory tier
  plan: jsonb('plan').notNull(), // orders, advice, follow-up
  signatoryId: uuid('signatory_id').references(() => staffUsers.id),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// prescriptions
export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  consultationId: uuid('consultation_id')
    .references(() => consultations.id)
    .notNull(),
  patientId: uuid('patient_id')
    .references(() => patients.id)
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => staffUsers.id)
    .notNull(),
  status: text('status').default('DRAFT').notNull(), // 'DRAFT' | 'APPROVED' | 'DISPENSED'
  totalPaise: integer('total_paise').default(0).notNull(), // ₹631 = 63100 paise
  signedAt: timestamp('signed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// prescription_items
export const prescriptionItems = pgTable('prescription_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  prescriptionId: uuid('prescription_id')
    .references(() => prescriptions.id)
    .notNull(),
  medicineName: text('medicine_name').notNull(), // 'Metformin'
  brandName: text('brand_name'),
  dosage: text('dosage').notNull(), // '1000mg'
  frequency: text('frequency').notNull(), // 'BD' (Twice daily)
  durationDays: integer('duration_days').notNull(), // 30
  instructionsTe: text('instructions_te'), // Telugu instructions
  instructionsEn: text('instructions_en'), // English instructions
  unitPricePaise: integer('unit_price_paise').notNull(),
  totalPricePaise: integer('total_price_paise').notNull(),
});
```

### Domain 4: AI Human-In-The-Loop & Domain Event Spine

```typescript
// ai_drafts (Human-in-the-loop regulatory gate)
export const aiDrafts = pgTable('ai_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  companyId: text('company_id').notNull(),
  entityType: text('entity_type').notNull(), // 'SOAP_NOTE' | 'PRESCRIPTION' | 'DISCHARGE_SUMMARY'
  entityId: uuid('entity_id').notNull(),
  draftPayload: jsonb('draft_payload').notNull(),
  regulatoryTier: text('regulatory_tier').notNull(), // 'GREEN' | 'AMBER'
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
  signatoryId: uuid('signatory_id').references(() => staffUsers.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// domain_events (ADR #5 Immutable Audit Spine)
export const domainEvents = pgTable('domain_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  eventType: text('event_type').notNull(), // e.g. 'CONSULTATION_STARTED', 'PRESCRIPTION_APPROVED'
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  actorId: uuid('actor_id')
    .references(() => staffUsers.id)
    .notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 4. Implementation Phasing

1. **Step 1: Utility Package Foundation (`@hos/hos-utility`)**
   - Implement `ids`, `money`, `time`, `tenancy`, and `events` modules.
   - Comprehensive unit test suite with 100% coverage.
2. **Step 2: Drizzle ORM Schema Migration (`@hos/db`)**
   - Implement tables in `packages/db/src/schema/`.
   - Wire export barrel and relations.
   - Generate initial migration with `drizzle-kit`.
3. **Step 3: Verification & Integration**
   - Run tests, compile monorepo packages, verify type-safety.
