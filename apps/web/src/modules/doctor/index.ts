export * from './manifest';
export * from './routes';
export * from './tabs';
// The data layer, for the app's root: mount DoctorDataProvider with the real API client when it
// exists; until then the tabs fall back to the in-memory mock.
export * from './data';
export { createMockDoctorSource } from './data/mock';
