import axios, { type AxiosInstance } from 'axios';
import type { Logger } from '../logger/logger.js';
import { ApiError } from './api-error.js';

export type ApiClient = Pick<
  AxiosInstance,
  'get' | 'post' | 'put' | 'patch' | 'delete'
>;

export interface ApiClientOptions {
  baseURL: string;
  timeoutMs?: number;
  logger?: Logger;
}

export function createApiClient({
  baseURL,
  timeoutMs = 15_000,
  logger,
}: ApiClientOptions): ApiClient {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
  });

  client.interceptors.request.use((config) => {
    config.headers.set('x-request-id', crypto.randomUUID());
    return config;
  });

  client.interceptors.response.use(undefined, (error: unknown) => {
    const apiError = toApiError(error);
    const config = axios.isAxiosError(error) ? error.config : undefined;
    logger?.error('api_request_failed', {
      code: apiError.code,
      status: apiError.status,
      requestId: apiError.requestId,
      method: config?.method?.toUpperCase(),
      path: config?.url ? stripQuery(config.url) : undefined,
    });
    return Promise.reject(apiError);
  });

  return client;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiError(
      'unknown',
      error instanceof Error ? error.message : 'Unexpected error.',
      null,
      null,
    );
  }
  const header = error.config?.headers?.['x-request-id'];
  const requestId = typeof header === 'string' ? header : null;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError(
      'timeout',
      'The server took too long to respond.',
      null,
      requestId,
    );
  }
  if (!error.response) {
    return new ApiError(
      'network_error',
      'Could not reach the server.',
      null,
      requestId,
    );
  }
  const { status, data } = error.response;
  return new ApiError(
    'http_error',
    serverMessage(data) ?? `Request failed with status ${status}.`,
    status,
    requestId,
  );
}

function serverMessage(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('message' in data))
    return null;
  const { message } = data as { message: unknown };
  if (typeof message === 'string' && message.trim() !== '') return message;
  if (
    Array.isArray(message) &&
    message.length > 0 &&
    message.every((part) => typeof part === 'string')
  ) {
    return message.join('; ');
  }
  return null;
}

function stripQuery(url: string): string {
  const index = url.indexOf('?');
  return index === -1 ? url : url.slice(0, index);
}
