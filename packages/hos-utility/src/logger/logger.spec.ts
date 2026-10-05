import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

function memorySink() {
  const entries: Array<{ level: string; payload: Record<string, unknown> }> =
    [];
  const record = (level: string) => (payload: Record<string, unknown>) => {
    entries.push({ level, payload });
  };
  return {
    entries,
    sink: {
      debug: record('debug'),
      info: record('info'),
      warn: record('warn'),
      error: record('error'),
    },
  };
}

describe('createLogger', () => {
  it('writes structured entries with level, event, timestamp and context', () => {
    const { entries, sink } = memorySink();
    createLogger({
      sink,
      now: () => new Date('2026-10-04T10:00:00.000Z'),
    }).info('page_loaded', { page: 'home' });
    expect(entries).toEqual([
      {
        level: 'info',
        payload: {
          page: 'home',
          level: 'info',
          event: 'page_loaded',
          ts: '2026-10-04T10:00:00.000Z',
        },
      },
    ]);
  });

  it('drops entries below the configured level', () => {
    const { entries, sink } = memorySink();
    const logger = createLogger({ level: 'warn', sink });
    logger.info('ignored');
    logger.warn('kept');
    expect(entries.map((entry) => entry.payload['event'])).toEqual(['kept']);
  });

  it('does not let context overwrite level or event', () => {
    const { entries, sink } = memorySink();
    createLogger({ sink }).info('real', { level: 'error', event: 'spoofed' });
    expect(entries[0]?.payload).toMatchObject({ level: 'info', event: 'real' });
  });
});
