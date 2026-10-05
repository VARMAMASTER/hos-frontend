export type ApiErrorCode =
  | 'network_error'
  | 'timeout'
  | 'http_error'
  | 'unknown';

export class ApiError extends Error {
  override name = 'ApiError';

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status: number | null,
    readonly requestId: string | null,
  ) {
    super(message);
  }
}
