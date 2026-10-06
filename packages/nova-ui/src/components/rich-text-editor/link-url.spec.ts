import { describe, expect, it } from 'vitest';
import { isAllowedLinkUrl, normalizeLinkUrl } from './link-url';

// Built from parts so the lint rule against script URLs does not flag a test about refusing them.
const SCRIPT = ['java', 'script'].join('');

describe('normalizeLinkUrl', () => {
  it.each([
    ['https://example.org/care', 'https://example.org/care'],
    ['http://example.org', 'http://example.org/'],
    ['  https://example.org  ', 'https://example.org/'],
    ['HTTPS://Example.org', 'https://example.org/'],
    ['mailto:ward@example.org', 'mailto:ward@example.org'],
    ['example.org', 'https://example.org/'],
    ['www.example.org/guidelines', 'https://www.example.org/guidelines'],
    ['ward@example.org', 'mailto:ward@example.org'],
  ])('accepts %s as %s', (input, expected) => {
    expect(normalizeLinkUrl(input)).toBe(expected);
  });

  it.each([
    `${SCRIPT}:alert(1)`,
    `${SCRIPT.toUpperCase()}:alert(1)`,
    ` ${SCRIPT}:alert(1)`,
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'jav&#x61;script:alert(1)',
    `\u0000${SCRIPT}:alert(1)`,
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.org',
    'tel:+911234567890',
    'mailto:',
    '//evil.example.org',
    '/relative/path',
    'https://',
    'https://exa mple.org',
    '',
    '   ',
  ])('rejects %j', (input) => {
    expect(normalizeLinkUrl(input)).toBeNull();
  });
});

describe('isAllowedLinkUrl', () => {
  it('allows only http, https and mailto', () => {
    expect(isAllowedLinkUrl('https://example.org')).toBe(true);
    expect(isAllowedLinkUrl('http://example.org')).toBe(true);
    expect(isAllowedLinkUrl('mailto:ward@example.org')).toBe(true);
    expect(isAllowedLinkUrl(`${SCRIPT}:alert(1)`)).toBe(false);
    expect(isAllowedLinkUrl('data:text/html,x')).toBe(false);
    expect(isAllowedLinkUrl(undefined)).toBe(false);
  });
});
