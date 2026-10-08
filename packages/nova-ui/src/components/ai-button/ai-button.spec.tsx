import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiButton } from './ai-button';

afterEach(() => cleanup());

const button = (name: string | RegExp = 'Draft summary') =>
  screen.getByRole('button', { name });

// The ✦ of the label that is showing.
const liveMark = (root: Element) =>
  root.querySelector('[data-label]:not([aria-hidden]) [data-mark]');

// Every class token on the button and everything inside it.
function classTokens(root: Element): string[] {
  return [root, ...root.querySelectorAll('*')].flatMap((element) =>
    (element.getAttribute('class') ?? '').split(/\s+/).filter(Boolean),
  );
}

describe('AiButton: structure', () => {
  it('is a real button named by its label, type="button" by default', () => {
    render(
      <form>
        <AiButton>Draft summary</AiButton>
      </form>,
    );
    expect(button().tagName).toBe('BUTTON');
    expect(button().getAttribute('type')).toBe('button');
  });

  it('always draws the ✦ mark with the label, so AI is never colour-only', () => {
    render(<AiButton>Draft summary</AiButton>);
    const mark = button().querySelector('[data-mark]');
    expect(mark?.textContent).toBe('✦');
    // The mark is decoration: never in the accessible name.
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(button().textContent).toContain('Draft summary');
  });

  it('keeps the ✦ and a text label in every state', () => {
    for (const state of ['idle', 'thinking', 'done'] as const) {
      const { unmount } = render(
        <AiButton state={state}>Draft summary</AiButton>,
      );
      expect(liveMark(button(/./))?.textContent).toBe('✦');
      const visible = button(/./).querySelector(
        '[data-label]:not([aria-hidden])',
      );
      expect(visible?.textContent?.trim().length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('exposes its size and state, defaulting to md and idle', () => {
    render(
      <>
        <AiButton>Default</AiButton>
        <AiButton size="sm">Small</AiButton>
      </>,
    );
    expect([
      button('Default').dataset['size'],
      button('Default').dataset['state'],
    ]).toEqual(['md', 'idle']);
    expect(button('Small').dataset['size']).toBe('sm');
  });

  it('stretches with fullWidth', () => {
    render(<AiButton fullWidth>Draft summary</AiButton>);
    expect(button().classList).toContain('w-full');
  });

  it('takes its keyboard ring from the shared focus ring', () => {
    render(<AiButton>Draft summary</AiButton>);
    expect(button().className).toContain('focus-visible:outline-focus');
  });

  it('is at least 44px tall at md (the touch target)', () => {
    render(<AiButton>Draft summary</AiButton>);
    expect(button().classList).toContain('min-h-touch');
  });

  it('takes its padding, gap, corner and type from the control tokens, as Button does', () => {
    render(
      <>
        <AiButton>Draft summary</AiButton>
        <AiButton size="sm">Draft note</AiButton>
      </>,
    );
    for (const cls of [
      'rounded-control',
      'gap-control',
      'px-control-md',
      'py-control-md',
      'text-control',
    ]) {
      expect(button().classList).toContain(cls);
    }
    for (const cls of ['px-control-sm', 'py-control-sm', 'text-label']) {
      expect(button('Draft note').classList).toContain(cls);
    }
  });

  it('draws its fill and text from the AI tokens, with the proven hover fill', () => {
    render(<AiButton>Draft summary</AiButton>);
    const classes = button().classList;
    expect(classes).toContain('bg-ai');
    expect(classes).toContain('text-on-primary');
    expect(classes).toContain('hover:bg-ai-hover');
  });

  it('forwards its ref and extra props to the <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <AiButton ref={ref} data-testid="x" className="extra">
        Draft summary
      </AiButton>,
    );
    expect(ref.current).toBe(button());
    expect(button().getAttribute('data-testid')).toBe('x');
    expect(button().classList).toContain('extra');
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<AiButton onClick={onClick}>Draft summary</AiButton>);
    fireEvent.click(button());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts a lang for a non-English label', () => {
    render(<AiButton lang="te">సారాంశం</AiButton>);
    expect(button('సారాంశం').getAttribute('lang')).toBe('te');
  });
});

describe('AiButton: thinking', () => {
  it('shows "Thinking…" by default, is aria-busy and keeps the ✦', () => {
    render(<AiButton loading>Draft summary</AiButton>);
    expect(button('Thinking…').getAttribute('aria-busy')).toBe('true');
    expect(button('Thinking…').dataset['state']).toBe('thinking');
    expect(liveMark(button('Thinking…'))?.textContent).toBe('✦');
  });

  it('takes the thinking label as a prop, for translation', () => {
    render(
      <AiButton state="thinking" thinkingLabel="ఆలోచిస్తోంది…">
        Draft summary
      </AiButton>,
    );
    expect(button('ఆలోచిస్తోంది…')).toBeTruthy();
  });

  it('lets `state` win over `loading`', () => {
    render(
      <AiButton loading state="idle">
        Draft summary
      </AiButton>,
    );
    expect(button().dataset['state']).toBe('idle');
    expect(button().getAttribute('aria-busy')).toBeNull();
  });

  it('cannot be activated twice: a press does nothing, but it stays focusable', () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <AiButton type="submit" loading onClick={onClick}>
          Draft summary
        </AiButton>
      </form>,
    );
    const thinking = button('Thinking…');
    thinking.focus();
    fireEvent.click(thinking);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(thinking);
  });

  it('holds its width: every state label stays in the layout, only the live one is visible', () => {
    const { rerender } = render(<AiButton>Draft summary</AiButton>);
    const labels = () =>
      [...button(/./).querySelectorAll('[data-label]')].map((label) => [
        label.getAttribute('data-label'),
        label.getAttribute('aria-hidden'),
      ]);
    expect(labels()).toEqual([
      ['idle', null],
      ['thinking', 'true'],
      ['done', 'true'],
    ]);
    rerender(<AiButton loading>Draft summary</AiButton>);
    expect(labels()).toEqual([
      ['idle', 'true'],
      ['thinking', null],
      ['done', 'true'],
    ]);
    // The hidden labels are invisible, not removed, so they still size the button.
    const hidden = button(/./).querySelector('[data-label="idle"]');
    expect(hidden?.classList).toContain('invisible');
    expect(hidden?.classList).not.toContain('hidden');
  });

  it('circles a sparkle around the label and runs a shimmer, only while thinking', () => {
    const { rerender } = render(<AiButton>Draft summary</AiButton>);
    expect(button().querySelector('[data-layer="orbit"]')).toBeNull();
    expect(button().querySelector('[data-layer="shimmer"]')).toBeNull();
    rerender(<AiButton loading>Draft summary</AiButton>);
    expect(button(/./).querySelector('[data-layer="orbit"]')).not.toBeNull();
    expect(button(/./).querySelector('[data-layer="shimmer"]')).not.toBeNull();
  });

  it('turns to the darker AI fill so thinking is distinct without motion', () => {
    render(<AiButton loading>Draft summary</AiButton>);
    expect(button('Thinking…').classList).toContain('bg-ai-hover');
    expect(button('Thinking…').classList).not.toContain('hover:bg-ai-hover');
  });
});

describe('AiButton: done', () => {
  it('shows "Done" with a check, and keeps the ✦', () => {
    render(<AiButton state="done">Draft summary</AiButton>);
    const done = button('Done');
    expect(done.dataset['state']).toBe('done');
    expect(liveMark(done)?.textContent).toBe('✦');
    expect(done.querySelector('[data-check]')).not.toBeNull();
    expect(done.getAttribute('aria-busy')).toBeNull();
  });

  it('takes the done label as a prop', () => {
    render(
      <AiButton state="done" doneLabel="పూర్తయింది">
        Draft summary
      </AiButton>,
    );
    expect(button('పూర్తయింది')).toBeTruthy();
  });

  it('bursts sparkles once, only in the done state', () => {
    const { rerender } = render(<AiButton>Draft summary</AiButton>);
    expect(button().querySelector('[data-layer="burst"]')).toBeNull();
    rerender(<AiButton state="done">Draft summary</AiButton>);
    const burst = button('Done').querySelector('[data-layer="burst"]');
    expect(burst?.getAttribute('aria-hidden')).toBe('true');
    expect(burst?.children.length).toBe(6);
  });

  it('can be pressed again in the done state', () => {
    const onClick = vi.fn();
    render(
      <AiButton state="done" onClick={onClick}>
        Draft summary
      </AiButton>,
    );
    fireEvent.click(button('Done'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('AiButton: live announcements', () => {
  it('announces thinking and done politely, in a status region, never per character', () => {
    const { rerender } = render(<AiButton>Draft summary</AiButton>);
    const status = () => screen.getByRole('status');
    expect(status().getAttribute('aria-live')).toBe('polite');
    expect(status().textContent).toBe('');
    rerender(<AiButton loading>Draft summary</AiButton>);
    expect(status().textContent).toBe('Thinking…');
    rerender(<AiButton state="done">Draft summary</AiButton>);
    expect(status().textContent).toBe('Done');
    rerender(<AiButton>Draft summary</AiButton>);
    expect(status().textContent).toBe('');
  });
});

describe('AiButton: idle breathing', () => {
  it('is off by default so a clinical screen stays calm', () => {
    render(<AiButton>Draft summary</AiButton>);
    expect(button().dataset['idle']).toBeUndefined();
    expect(
      classTokens(button()).some((c) => c.includes('animate-ai-breathe')),
    ).toBe(false);
  });

  it('turns on a slow glow with `idle`, motion-safe, over a still halo', () => {
    render(<AiButton idle>Draft summary</AiButton>);
    expect(button().dataset['idle']).toBe('true');
    expect(button().classList).toContain('motion-safe:animate-ai-breathe');
    expect(button().classList).toContain('nova-ai-halo');
  });

  it('breathes only while it is available', () => {
    render(
      <>
        <AiButton idle disabled>
          Off
        </AiButton>
        <AiButton idle loading>
          Busy
        </AiButton>
      </>,
    );
    for (const root of [button('Off'), button('Thinking…')]) {
      expect(
        classTokens(root).some((c) => c.includes('animate-ai-breathe')),
      ).toBe(false);
    }
  });
});

describe('AiButton: interactive motion', () => {
  it('twinkles the ✦, sweeps one sheen and glows the edge on hover and keyboard focus', () => {
    render(<AiButton>Draft summary</AiButton>);
    const tokens = classTokens(button());
    for (const trigger of ['hover', 'focus-visible']) {
      expect(tokens).toContain(
        `motion-safe:group-${trigger}/ai:animate-ai-twinkle`,
      );
      expect(tokens).toContain(
        `motion-safe:group-${trigger}/ai:animate-ai-sheen`,
      );
    }
    expect(button().classList).toContain('group/ai');
    // The glow is a static state (a shadow), so it survives reduced motion.
    expect(button().classList).toContain('hover:nova-ai-glow');
    expect(button().classList).toContain('focus-visible:nova-ai-glow');
  });

  it('squashes on press with the spring easing', () => {
    render(<AiButton>Draft summary</AiButton>);
    const classes = button().classList;
    expect(classes).toContain('motion-safe:active:scale-95');
    expect(classes).toContain('motion-safe:ease-spring');
    expect(classes).toContain('motion-safe:duration-base');
  });

  it.each([
    ['disabled', { disabled: true }, 'disabled:opacity-50'],
    [
      'aria-disabled',
      { 'aria-disabled': true as const },
      'aria-disabled:opacity-50',
    ],
  ])('has no motion and a lower opacity when %s', (_name, props, opacity) => {
    render(<AiButton {...props}>Draft summary</AiButton>);
    const tokens = classTokens(button());
    expect(tokens.some((c) => /animate-ai-|active:scale/.test(c))).toBe(false);
    expect(tokens.some((c) => /nova-ai-glow/.test(c))).toBe(false);
    expect(button().classList).toContain(opacity);
  });

  it('does nothing when pressed while aria-disabled, and keeps focus', () => {
    const onClick = vi.fn();
    render(
      <AiButton aria-disabled onClick={onClick}>
        Draft summary
      </AiButton>,
    );
    button().focus();
    fireEvent.click(button());
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button());
  });
});

describe('AiButton: reduced motion', () => {
  // Every moving class is behind motion-safe (a media query for "no reduced-motion preference"), so
  // under prefers-reduced-motion nothing moves and every state is still told by its fill, label and
  // ✦. Static cues (the glow, the darker thinking fill, the check) have no motion prefix.
  const MOVING = /animate-ai-|scale-|transition|duration-|ease-/;

  it.each([
    ['idle', { idle: true }],
    ['thinking', { state: 'thinking' as const }],
    ['done', { state: 'done' as const }],
  ])(
    'puts every moving class of the %s state behind motion-safe',
    (_name, props) => {
      render(<AiButton {...props}>Draft summary</AiButton>);
      const unsafe = classTokens(button(/./)).filter(
        (token) => MOVING.test(token) && !token.includes('motion-safe:'),
      );
      expect(unsafe).toEqual([]);
    },
  );

  it('hides the loops that exist only as motion (orbit, shimmer) when motion is reduced', () => {
    render(<AiButton state="thinking">Draft summary</AiButton>);
    for (const layer of ['orbit', 'shimmer']) {
      expect(
        button(/./).querySelector(`[data-layer="${layer}"]`)?.classList,
      ).toContain('motion-reduce:hidden');
    }
  });

  it('hides the burst when motion is reduced, so no stray particles are left behind', () => {
    render(<AiButton state="done">Draft summary</AiButton>);
    expect(
      button('Done').querySelector('[data-layer="burst"]')?.classList,
    ).toContain('motion-reduce:hidden');
  });

  it('plays no loop, burst or check animation while disabled', () => {
    render(
      <>
        <AiButton disabled state="thinking">
          Busy
        </AiButton>
        <AiButton disabled state="done">
          Finished
        </AiButton>
      </>,
    );
    for (const root of [button('Thinking…'), button('Done')]) {
      expect(
        classTokens(root).filter((token) => /animate-ai-/.test(token)),
      ).toEqual([]);
      expect(root.querySelector('[data-layer="orbit"]')).toBeNull();
      expect(root.querySelector('[data-layer="shimmer"]')).toBeNull();
    }
  });

  it('keeps the check and the label visible with no animation class of their own outside motion-safe', () => {
    render(<AiButton state="done">Draft summary</AiButton>);
    const check = button('Done').querySelector('[data-check]');
    expect(check).not.toBeNull();
    const unsafe = classTokens(check as Element).filter(
      (token) => /animate-ai-/.test(token) && !token.includes('motion-safe:'),
    );
    expect(unsafe).toEqual([]);
  });
});

describe('AiButton: glow & hero variants', () => {
  it('renders glow variant with data-variant="glow" and rounded-full pill styling', () => {
    render(<AiButton variant="glow">Chat with AI</AiButton>);
    const btn = button('Chat with AI');
    expect(btn.dataset['variant']).toBe('glow');
    expect(btn.classList).toContain('rounded-full');
  });

  it('renders hero variant with data-variant="hero", 3-star cluster icon, and prominent pill padding', () => {
    render(<AiButton variant="hero">Chat with our AI agent</AiButton>);
    const btn = button('Chat with our AI agent');
    expect(btn.dataset['variant']).toBe('hero');
    expect(btn.classList).toContain('rounded-full');
    expect(btn.querySelector('[data-sparkle-cluster]')).not.toBeNull();
  });

  it('renders floating badge when provided', () => {
    render(
      <AiButton variant="hero" badge="NEW">
        Chat with our AI agent
      </AiButton>,
    );
    const badge = screen.getByText('NEW');
    expect(badge).not.toBeNull();
    expect(badge.getAttribute('data-badge')).toBe('true');
  });
});
