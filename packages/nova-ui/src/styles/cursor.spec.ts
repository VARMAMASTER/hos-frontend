// @vitest-environment node
// Hovering anything clickable shows the pointer hand, from one rule in the base layer: no component
// has to remember `cursor-pointer` (Tailwind 4's preflight leaves buttons on the default arrow).
// Disabled and aria-disabled controls keep the arrow, and a component can still choose its own
// cursor with a utility (cursor-progress on a loading Button), because utilities sit above base.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  fileURLToPath(new URL('./theme.css', import.meta.url)),
  'utf8',
);

// The base layer's blocks, each as { selector, body } pairs.
function baseRules(): { selector: string; body: string }[] {
  const rules: { selector: string; body: string }[] = [];
  for (const layer of css.matchAll(/@layer base\s*\{/g)) {
    let depth = 1;
    let i = (layer.index ?? 0) + layer[0].length;
    const start = i;
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') depth -= 1;
      i += 1;
    }
    const block = css.slice(start, i - 1);
    for (const rule of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      rules.push({
        selector: (rule[1] ?? '').trim(),
        body: (rule[2] ?? '').trim(),
      });
    }
  }
  return rules;
}

const pointerRule = () =>
  baseRules().find((rule) => /cursor:\s*pointer/.test(rule.body));

describe('the pointer cursor', () => {
  it('is set once, in the base layer, on everything clickable', () => {
    const rule = pointerRule();
    expect(rule, 'a base-layer rule with cursor: pointer').toBeDefined();
    const selector = rule?.selector ?? '';
    for (const clickable of [
      'button',
      "[role='button']",
      "[role='tab']",
      "[role='menuitem']",
      "[role='switch']",
      "[role='option']",
      "[role='radio']",
      "[role='checkbox']",
      'a[href]',
      'summary',
      "[type='checkbox']",
      "[type='radio']",
      'select',
      'label',
    ]) {
      expect(selector, clickable).toContain(clickable);
    }
  });

  it('leaves disabled and aria-disabled controls on the default arrow', () => {
    const selector = pointerRule()?.selector ?? '';
    // Every selector in the list excludes both kinds of disabled, so the rule never reaches them.
    for (const part of selector.split(',').map((s) => s.trim())) {
      // A summary cannot be disabled, and a label follows its control (the next test).
      if (part === 'summary' || part.startsWith('label')) continue;
      expect(part, part).toMatch(/:not\(:disabled\)|:not\(\[aria-disabled/);
    }
    expect(selector).toContain("[aria-disabled='true']");
  });

  it('does not force a pointer on a label whose control is disabled', () => {
    const selector = pointerRule()?.selector ?? '';
    expect(selector).toMatch(/label:not\(:has\(:disabled\)\)/);
  });

  it('sits in the base layer, below utilities, so cursor-progress and cursor-not-allowed still win', () => {
    const layerOfRule = css.lastIndexOf(
      '@layer base',
      css.indexOf('cursor: pointer'),
    );
    expect(layerOfRule).toBeGreaterThan(-1);
    expect(css.slice(layerOfRule, css.indexOf('cursor: pointer'))).not.toMatch(
      /@layer utilities|@utility/,
    );
  });
});

// The rule above is the one place the pointer is set. A component that hard-codes cursor-pointer
// shows the hand even when its control is disabled (a disabled ButtonGroup segment did), so only an
// element the rule cannot reach, or one that chooses its cursor by state, may set its own.
const EXCEPTIONS: Record<string, string> = {
  'card/card.tsx':
    'an interactive Card is a div, which the base rule does not reach',
  'checkbox/checkbox.tsx':
    'chooses cursor-not-allowed or cursor-pointer by disabled',
  'radio/radio.tsx': 'chooses cursor-not-allowed or cursor-pointer by disabled',
  'switch/switch.tsx':
    'chooses cursor-not-allowed or cursor-pointer by disabled',
  'choice-card/choice-card.tsx':
    'chooses cursor-not-allowed or cursor-pointer by disabled',
  'whatsapp-thread/wa-quick-reply-buttons.tsx':
    'a locked reply set drops the pointer by state',
};

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return componentFiles(path);
    return /\.tsx$/.test(name) && !/\.(spec|stories)\.tsx$/.test(name)
      ? [path]
      : [];
  });
}

describe('components leave the pointer to the base rule', () => {
  const componentsDir = fileURLToPath(
    new URL('../components', import.meta.url),
  );
  const offenders = componentFiles(componentsDir)
    .map((path) => ({
      path: path.slice(componentsDir.length + 1).replaceAll('\\', '/'),
      text: readFileSync(path, 'utf8'),
    }))
    .filter(
      (file) =>
        /(^|[\s'"`:])cursor-pointer(?![\w-])/.test(file.text) &&
        !(file.path in EXCEPTIONS),
    )
    .map((file) => file.path);

  it('hard-codes cursor-pointer nowhere but its listed exceptions', () => {
    expect(offenders).toEqual([]);
  });

  it('lists only exceptions that still exist and still set it', () => {
    for (const path of Object.keys(EXCEPTIONS)) {
      const text = readFileSync(join(componentsDir, path), 'utf8');
      expect(text, path).toMatch(/cursor-pointer/);
    }
  });
});
