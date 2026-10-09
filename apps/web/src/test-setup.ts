import { configure } from '@testing-library/react';

// Shared setup for every web app spec (vite.config.mts → test.setupFiles). Module tabs load their
// data asynchronously and render a lot, so under a full workspace run an update can take well over
// Testing Library's default 1 s wait. Five seconds is still fast to fail on a real bug.
configure({ asyncUtilTimeout: 5000 });
