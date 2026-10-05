import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createLogger } from '../logger/logger.js';
import { ApiError } from './api-error.js';
import { createApiClient, toApiError } from './create-api-client.js';

const BASE = 'http://api.test/api/v1';
const UUID = /^[0-9a-f-]{36}$/;
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function failureOf(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the request to fail');
}

describe('createApiClient', () => {
  it('sends a fresh x-request-id with every request', async () => {
    const seen: string[] = [];
    server.use(
      http.get(`${BASE}/health`, ({ request }) => {
        seen.push(request.headers.get('x-request-id') ?? '');
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    const api = createApiClient({ baseURL: BASE });
    await api.get('/health');
    await api.get('/health');
    expect(seen[0]).toMatch(UUID);
    expect(seen[1]).toMatch(UUID);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('turns a server error body into an ApiError carrying the server message and the request id', async () => {
    server.use(
      http.get(`${BASE}/patients/7`, () =>
        HttpResponse.json(
          { statusCode: 404, message: 'Patient not found' },
          { status: 404 },
        ),
      ),
    );
    const error = await failureOf(
      createApiClient({ baseURL: BASE }).get('/patients/7'),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'http_error',
      status: 404,
      message: 'Patient not found',
    });
    expect(error.requestId).toMatch(UUID);
  });

  it('joins a validation message array into one readable message', async () => {
    server.use(
      http.post(`${BASE}/patients`, () =>
        HttpResponse.json(
          {
            statusCode: 400,
            message: ['name should not be empty', 'age must be a number'],
          },
          { status: 400 },
        ),
      ),
    );
    const error = await failureOf(
      createApiClient({ baseURL: BASE }).post('/patients', {}),
    );
    expect(error.message).toBe(
      'name should not be empty; age must be a number',
    );
  });

  it('normalises a non-JSON error page (a gateway 502) instead of leaking HTML', async () => {
    server.use(
      http.get(
        `${BASE}/health`,
        () =>
          new HttpResponse('<html>Bad Gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );
    const error = await failureOf(
      createApiClient({ baseURL: BASE }).get('/health'),
    );
    expect(error).toMatchObject({
      code: 'http_error',
      status: 502,
      message: 'Request failed with status 502.',
    });
  });

  it('turns a dropped connection into a network_error', async () => {
    server.use(http.get(`${BASE}/health`, () => HttpResponse.error()));
    const error = await failureOf(
      createApiClient({ baseURL: BASE }).get('/health'),
    );
    expect(error).toMatchObject({
      code: 'network_error',
      status: null,
      message: 'Could not reach the server.',
    });
  });

  it('turns a slow server into a timeout', async () => {
    server.use(
      http.get(`${BASE}/health`, async () => {
        await delay(200);
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    const error = await failureOf(
      createApiClient({ baseURL: BASE, timeoutMs: 20 }).get('/health'),
    );
    expect(error).toMatchObject({ code: 'timeout', status: null });
  });

  it('logs failures without the query string, which can carry patient data', async () => {
    const logged: unknown[] = [];
    const record = (entry: unknown) => {
      logged.push(entry);
    };
    const logger = createLogger({
      level: 'debug',
      sink: { debug: record, info: record, warn: record, error: record },
    });
    server.use(
      http.get(`${BASE}/patients`, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    );
    await failureOf(
      createApiClient({ baseURL: BASE, logger }).get('/patients?name=Ramesh'),
    );
    expect(JSON.stringify(logged)).toContain('/patients');
    expect(JSON.stringify(logged)).not.toContain('Ramesh');
  });

  it('keeps the request id on dropped connections and timeouts, not only on HTTP errors', async () => {
    server.use(
      http.get(`${BASE}/down`, () => HttpResponse.error()),
      http.get(`${BASE}/slow`, async () => {
        await delay(200);
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    const dropped = await failureOf(
      createApiClient({ baseURL: BASE }).get('/down'),
    );
    const slow = await failureOf(
      createApiClient({ baseURL: BASE, timeoutMs: 20 }).get('/slow'),
    );
    expect(dropped).toMatchObject({ code: 'network_error' });
    expect(slow).toMatchObject({ code: 'timeout' });
    expect(dropped.requestId).toMatch(UUID);
    expect(slow.requestId).toMatch(UUID);
  });
});

describe('toApiError', () => {
  it('passes an ApiError through unchanged and wraps anything else as unknown', () => {
    const original = new ApiError('timeout', 'slow', null, 'r-1');
    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error('boom'))).toMatchObject({
      code: 'unknown',
      message: 'boom',
      status: null,
      requestId: null,
    });
  });
});
