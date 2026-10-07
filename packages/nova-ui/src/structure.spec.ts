// @vitest-environment node
// The library's shape, checked: every component folder has its component, its spec and its stories;
// every public component is in the barrel and in index.spec.ts; and no file grows past a size a
// reviewer can hold in their head. A deliberate exception is listed with its reason.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as nova from './index';

const srcDir = fileURLToPath(new URL('.', import.meta.url));
const componentsDir = join(srcDir, 'components');
const folders = readdirSync(componentsDir).filter((name) =>
  statSync(join(componentsDir, name)).isDirectory(),
);

// The component a folder is named for: ai-badge is AiBadge, whatsapp-thread is WhatsAppThread.
const SPELLINGS: Record<string, string> = {
  'whatsapp-thread': 'WhatsAppThread',
  toast: 'Toaster',
};
const componentOf = (folder: string) =>
  SPELLINGS[folder] ??
  folder
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

// Folders that are not one component, and why.
const SHAPE_EXCEPTIONS: Record<string, string> = {
  chart:
    'a family of charts: each chart has its own stories (area-chart.stories.tsx …), chart.tsx is the shared frame',
};

// Files at the top of components/ that check several components at once.
const SHARED_SPECS = ['highlight.spec.tsx', 'tone-text.spec.tsx'];

describe('component folders', () => {
  it('finds the component folders', () => {
    expect(folders.length).toBeGreaterThan(60);
  });

  it.each(folders.filter((folder) => !(folder in SHAPE_EXCEPTIONS)))(
    '%s has its component, its spec and its stories',
    (folder) => {
      const files = readdirSync(join(componentsDir, folder));
      for (const file of [
        `${folder}.tsx`,
        `${folder}.spec.tsx`,
        `${folder}.stories.tsx`,
      ]) {
        expect(files, `${folder}/${file}`).toContain(file);
      }
    },
  );

  it('keeps each exception honest: the chart folder has a spec and stories for its charts', () => {
    const chart = readdirSync(join(componentsDir, 'chart'));
    expect(chart).toContain('chart.tsx');
    expect(chart).toContain('chart.spec.tsx');
    expect(
      chart.filter((file) => file.endsWith('.stories.tsx')).length,
    ).toBeGreaterThan(3);
  });

  it('holds only folders and the cross-component specs at the top of components/', () => {
    const loose = readdirSync(componentsDir).filter(
      (name) => !statSync(join(componentsDir, name)).isDirectory(),
    );
    expect(loose.sort()).toEqual([...SHARED_SPECS].sort());
  });
});

// The names index.spec.ts promises the barrel exports.
const promised = new Set(
  [
    ...readFileSync(join(srcDir, 'index.spec.ts'), 'utf8').matchAll(
      /^\s+'(\w+)',$/gm,
    ),
  ].map((match) => match[1] ?? ''),
);

describe('the barrel', () => {
  it.each(folders.filter((folder) => !(folder in SHAPE_EXCEPTIONS)))(
    "exports %s's component, and index.spec.ts promises it",
    (folder) => {
      const name = componentOf(folder);
      expect(nova, name).toHaveProperty(name);
      expect(promised.has(name), `${name} in index.spec.ts`).toBe(true);
    },
  );

  // Everything the barrel exports that is a component (a PascalCase function or a forwardRef) is in
  // index.spec.ts, so a removed export fails a test there.
  it('lists every exported component in index.spec.ts', () => {
    const components = Object.entries(nova)
      .filter(([name]) => /^[A-Z][a-z]/.test(name))
      .filter(
        ([, value]) =>
          typeof value === 'function' ||
          (typeof value === 'object' && value !== null && '$$typeof' in value),
      )
      .map(([name]) => name);
    expect(components.filter((name) => !promised.has(name))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------
// File size
// ---------------------------------------------------------------------------------------------------

const LIMITS = { source: 500, stories: 500, spec: 900 } as const;

// Files over the limit, and why each stays whole for now.
const SIZE_EXCEPTIONS: Record<string, string> = {
  'data-table/data-table.tsx':
    'one stateful table (sort, filter, select, pin, page, density); its parts and model are already split out',
  'extracted-values-review/extracted-values-review.tsx':
    'one review flow with five states; its model and its row are split out (extracted-values-review-model.tsx, extracted-row.tsx)',
  'ai-draft-block/ai-draft-block.tsx':
    'the draft lifecycle (generating, pending, approved, undone, rejected) in one state machine',
  'ambient-scribe-recorder/ambient-scribe-recorder.tsx':
    'the recorder state machine with its live level meter and announcements',
  'timeline/timeline.tsx':
    'events, groups, density, skeleton and the AI node in one list',
  'chart/vitals-chart.tsx':
    'normal-range bands, thresholds and readings for several vitals',
  'ai-quality-scorecard/ai-quality-scorecard.tsx':
    'the scorecard table with its status words, sparklines and thresholds',
  'call-transcript-console/call-transcript-console.tsx':
    'the call frame, its transcript turns, write-backs and system events',
  'voice-entry-capture/voice-entry-capture.tsx':
    'the capture states with the parsed readings grid',
  'chart/hospital-charts.spec.tsx': 'one spec for the eight hospital charts',
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? walk(path)
      : /\.tsx?$/.test(name)
        ? [path]
        : [];
  });
}

const sized = walk(componentsDir).map((path) => {
  const relativePath = path.slice(componentsDir.length + 1).replace(/\\/g, '/');
  const lines = readFileSync(path, 'utf8').split('\n').length;
  const kind = /\.spec\.tsx?$/.test(path)
    ? 'spec'
    : /\.stories\.tsx$/.test(path)
      ? 'stories'
      : 'source';
  return { path: relativePath, lines, limit: LIMITS[kind] };
});

describe('file size', () => {
  it(`keeps a component file under ${LIMITS.source} lines, stories under ${LIMITS.stories} and a spec under ${LIMITS.spec}`, () => {
    const over = sized
      .filter(
        (file) => file.lines > file.limit && !(file.path in SIZE_EXCEPTIONS),
      )
      .map((file) => `${file.path}: ${file.lines} lines (limit ${file.limit})`);
    expect(over).toEqual([]);
  });

  it('keeps no stale exception: each listed file is still over its limit', () => {
    for (const path of Object.keys(SIZE_EXCEPTIONS)) {
      const file = sized.find((candidate) => candidate.path === path);
      expect(file, path).toBeDefined();
      expect((file?.lines ?? 0) > (file?.limit ?? 0), path).toBe(true);
    }
  });
});
