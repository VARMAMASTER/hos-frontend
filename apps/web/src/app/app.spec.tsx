import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ApiError } from '@hos/hos-utility';
import { App, type AppProps } from './app';

afterEach(() => cleanup());

const pendingApi = () =>
  ({
    get: vi.fn(() => new Promise(() => undefined)),
  }) as unknown as AppProps['api'];
const resolvingApi = (value: unknown) =>
  ({ get: vi.fn(() => Promise.resolve(value)) }) as unknown as AppProps['api'];
const rejectingApi = (error: unknown) =>
  ({ get: vi.fn(() => Promise.reject(error)) }) as unknown as AppProps['api'];

describe('App', () => {
  it('renders the HOS heading and starts by checking the API', () => {
    render(<App api={pendingApi()} />);
    expect(screen.getByRole('heading', { level: 1, name: 'HOS' })).toBeTruthy();
    expect(screen.getByText('Checking API…')).toBeTruthy();
  });

  it('shows the API as reachable when /health answers', async () => {
    const api = resolvingApi({ data: { status: 'ok', db: 'up' } });
    render(<App api={api} />);
    expect(await screen.findByText('API reachable')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/health');
  });

  it('shows the API as degraded when /health answers 503 (database down)', async () => {
    render(
      <App
        api={rejectingApi(
          new ApiError(
            'http_error',
            'Request failed with status 503.',
            503,
            'r-1',
          ),
        )}
      />,
    );
    expect(await screen.findByText('API degraded')).toBeTruthy();
  });

  it('shows the API as unreachable, with the reason, when the request fails', async () => {
    render(
      <App
        api={rejectingApi(
          new ApiError(
            'network_error',
            'Could not reach the server.',
            null,
            'r-2',
          ),
        )}
      />,
    );
    expect(await screen.findByText('API unreachable')).toBeTruthy();
    expect(screen.getByText('Could not reach the server.')).toBeTruthy();
  });

  // The client normalises failures only, so a 2xx whose body is not the health
  // payload (an SPA fallback from a wrong VITE_API_BASE_URL, a captive portal)
  // resolves as success. It must not read as "reachable".
  it.each([
    ['an HTML page', '<!doctype html><html></html>'],
    ['an empty body', ''],
    ['a null body', null],
    ['a JSON body whose status is not ok', { status: 'degraded', db: 'down' }],
  ])(
    'shows the API as unreachable when /health answers 2xx with %s',
    async (_label, data) => {
      render(<App api={resolvingApi({ data })} />);
      expect(await screen.findByText('API unreachable')).toBeTruthy();
      expect(
        screen.getByText('The API answered with an unexpected response.'),
      ).toBeTruthy();
    },
  );
});
