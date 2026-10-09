// The Reception data layer the tabs use: the domain types, the source interface and the hooks.
// The mock is deliberately not exported here, so no tab reaches it by accident.
export * from './types';
export type { ReceptionDataSource } from './source';
export * from './use-reception';
