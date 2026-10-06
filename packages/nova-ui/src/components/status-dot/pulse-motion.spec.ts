// @vitest-environment node
// The heartbeat's keyframes and cadence tokens live in theme.css, next to the other nova-* motion.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  fileURLToPath(new URL('../../styles/theme.css', import.meta.url)),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

function body(header: string): string {
  const at = css.search(new RegExp(`${header}\\s*\\{`));
  if (at === -1) throw new Error(`theme.css declares no "${header}" block`);
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      return squash(css.slice(open + 1, i));
    }
  }
  throw new Error(`theme.css has an unclosed "${header}" block`);
}

describe('theme.css pulse motion', () => {
  it('names the two cadences as tokens: 1.4s slow, 0.9s fast', () => {
    const theme = body('@theme');
    expect(theme).toContain('--nova-pulse-slow: 1400ms;');
    expect(theme).toContain('--nova-pulse-fast: 900ms;');
  });

  // These are utilities, not --animate-* theme variables: a theme variable is resolved once on
  // :root, where --nova-pulse-duration is unset, so an element could not pick its own cadence.
  it('exposes animate-heartbeat and animate-pulse-ring, looping on the cadence token and a motion curve', () => {
    expect(body('@utility animate-heartbeat')).toBe(
      'animation: nova-heartbeat var(--nova-pulse-duration, var(--nova-pulse-slow)) var(--nova-ease-standard) infinite;',
    );
    expect(body('@utility animate-pulse-ring')).toBe(
      'animation: nova-pulse-ring var(--nova-pulse-duration, var(--nova-pulse-slow)) var(--nova-ease-standard) infinite;',
    );
  });

  it('beats twice (lub-dub) per cycle and settles back to rest', () => {
    const frames = body('@keyframes nova-heartbeat');
    const scales = [...frames.matchAll(/transform: scale\(([\d.]+)\)/g)].map(
      (match) => Number(match[1]),
    );
    // Two peaks above rest, and the loop ends at rest.
    expect(scales.filter((scale) => scale > 1)).toHaveLength(2);
    expect(scales.at(-1)).toBe(1);
  });

  it('expands the ring while it fades to nothing', () => {
    const frames = body('@keyframes nova-pulse-ring');
    expect(frames).toMatch(/opacity: 0;/);
    expect(frames).toMatch(/transform: scale\(\d/);
  });

  it('picks the cadence with pulse-slow and pulse-fast utilities over the tokens', () => {
    expect(body('@utility pulse-slow')).toBe(
      '--nova-pulse-duration: var(--nova-pulse-slow);',
    );
    expect(body('@utility pulse-fast')).toBe(
      '--nova-pulse-duration: var(--nova-pulse-fast);',
    );
  });
});
