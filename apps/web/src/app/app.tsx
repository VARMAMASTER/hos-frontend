import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Chip } from '@hos/nova-ui';
import { toApiError, type ApiClient } from '@hos/hos-utility';

type ApiStatus =
  | { kind: 'checking' }
  | { kind: 'reachable' }
  | { kind: 'degraded' }
  | { kind: 'unreachable'; reason: string };

export interface AppProps {
  api: Pick<ApiClient, 'get'>;
}

const UNEXPECTED_RESPONSE = 'The API answered with an unexpected response.';

// GET /health answers 200 { status: 'ok', db: 'up' }. The client normalises
// failures only, so a 2xx with any other body (an SPA fallback page from a
// wrong VITE_API_BASE_URL, a captive portal) must not read as a healthy API.
function isHealthyBody(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'status' in data &&
    data.status === 'ok'
  );
}

export function App({ api }: AppProps) {
  const [status, setStatus] = useState<ApiStatus>({ kind: 'checking' });

  useEffect(() => {
    let active = true;
    api.get('/health').then(
      (response) => {
        if (!active) return;
        setStatus(
          isHealthyBody(response.data)
            ? { kind: 'reachable' }
            : { kind: 'unreachable', reason: UNEXPECTED_RESPONSE },
        );
      },
      (error: unknown) => {
        if (!active) return;
        const apiError = toApiError(error);
        setStatus(
          apiError.status === 503
            ? { kind: 'degraded' }
            : { kind: 'unreachable', reason: apiError.message },
        );
      },
    );
    return () => {
      active = false;
    };
  }, [api]);

  return (
    <main className="mx-auto max-w-3xl p-s8">
      <h1 className="mb-s8 text-display font-semibold tracking-h1">HOS</h1>
      <Card>
        <CardHeader
          title="System status"
          description="Backend API health"
          actions={<StatusChip status={status} />}
        />
        {status.kind === 'unreachable' ? (
          <CardBody>
            <p className="text-body text-ink-2">{status.reason}</p>
          </CardBody>
        ) : null}
      </Card>
    </main>
  );
}

function StatusChip({ status }: { status: ApiStatus }) {
  switch (status.kind) {
    case 'checking':
      return <Chip>Checking API…</Chip>;
    case 'reachable':
      return <Chip tone="good">API reachable</Chip>;
    case 'degraded':
      return <Chip tone="warn">API degraded</Chip>;
    case 'unreachable':
      return <Chip tone="crit">API unreachable</Chip>;
  }
}

export default App;
