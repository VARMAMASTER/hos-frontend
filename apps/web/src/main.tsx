import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createApiClient, createLogger } from '@hos/hos-utility';
import { App } from './app/app';
import './styles.css';

const api = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  logger: createLogger({ level: import.meta.env.DEV ? 'debug' : 'warn' }),
});

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing <div id="root">');

createRoot(root).render(
  <StrictMode>
    <App api={api} />
  </StrictMode>,
);
