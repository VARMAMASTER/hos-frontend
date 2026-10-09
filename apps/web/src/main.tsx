import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createApiClient, createLogger } from '@hos/hos-utility';
import { DEMO_ENTITLEMENTS } from './app/demo-entitlements';
import { Root } from './app/root';
import './styles.css';

const api = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  logger: createLogger({ level: import.meta.env.DEV ? 'debug' : 'warn' }),
});

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">');

// Root mounts the one NovaThemeProvider (theme, scheme, material, font). Until sign-in and the
// tenant's entitlements come from the API, the demo build grants DEMO_ENTITLEMENTS explicitly: the
// app itself grants nothing by default.
createRoot(root).render(
  <StrictMode>
    <Root api={api} {...DEMO_ENTITLEMENTS} />
  </StrictMode>,
);
