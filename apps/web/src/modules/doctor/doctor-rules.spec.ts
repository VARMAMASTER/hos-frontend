// @vitest-environment node
// The Doctor module's clinical-safety rules, held as a test over its own source (AGENTS.md, rules 6
// and 7): patient data never reaches a log or browser storage, nothing here makes a network call, the
// word is "module" and never "workspace", and no AI draft is auto-approved.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(import.meta.url));

function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.spec\.(ts|tsx)$/.test(name)
      ? [path]
      : [];
  });
}

const files = sources(root).map((path) => ({
  name: relative(root, path).replace(/\\/g, '/'),
  text: readFileSync(path, 'utf8'),
}));

function offenders(pattern: RegExp): string[] {
  return files.filter(({ text }) => pattern.test(text)).map(({ name }) => name);
}

describe('the Doctor module keeps the clinical-safety rules', () => {
  it('has source to check', () => {
    expect(files.length).toBeGreaterThan(80);
  });

  it('writes nothing to the console: patient data never reaches a log', () => {
    expect(offenders(/\bconsole\s*\./)).toEqual([]);
  });

  it('stores nothing in the browser', () => {
    expect(
      offenders(/\b(localStorage|sessionStorage|indexedDB|document\.cookie)\b/),
    ).toEqual([]);
  });

  it('makes no network call: the mock is the only source', () => {
    expect(
      offenders(/\b(fetch\s*\(|XMLHttpRequest|axios|WebSocket|sendBeacon)/),
    ).toEqual([]);
  });

  it('says "module", never "workspace"', () => {
    expect(offenders(/workspace/i)).toEqual([]);
  });

  it('has no raw hex colour and no arbitrary pixel value', () => {
    expect(offenders(/#[0-9a-fA-F]{6}\b|\[\d+px\]/)).toEqual([]);
  });

  it('never approves an AI draft on the doctor’s behalf: no draft starts approved', () => {
    expect(
      offenders(/(defaultStatus|initial|status)\s*[=:]\s*['"]approved['"]/),
    ).toEqual([]);
  });

  it('keeps the tabs off the mock: they read through useDoctor only', () => {
    const tabs = files.filter(
      ({ name }) => name.startsWith('tabs/') || name.startsWith('ui/'),
    );
    const reaching = tabs
      .filter(({ text }) => /\/(mock|seed-)[\w-]*['"]/.test(text))
      .map(({ name }) => name);
    expect(reaching).toEqual([]);
  });
});
