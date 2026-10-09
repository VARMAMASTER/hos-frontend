// The Patient record data layer the tabs use: the domain types, the source interface and the hooks.
// The mock is deliberately not exported here, so no tab reaches it by accident.
export * from './types';
export type { PatientRecordDataSource } from './source';
export * from './use-patient-record';
