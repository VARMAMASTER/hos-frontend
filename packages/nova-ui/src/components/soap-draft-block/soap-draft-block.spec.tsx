import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  SoapDraftBlock,
  type SoapDraftBlockProps,
  type SoapSections,
} from './soap-draft-block';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TITLE = 'AI SOAP draft';

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

function block() {
  return screen.getByRole('group', { name: TITLE });
}

function statusText() {
  const region = block().querySelector('[role="status"]');
  return assistiveText(region as Node)
    .replace(/\s+/g, ' ')
    .trim();
}

function section(key: string) {
  const found = block().querySelector<HTMLElement>(`[data-section="${key}"]`);
  expect(found).not.toBeNull();
  return found as HTMLElement;
}

const DRAFTED: SoapSections = {
  subjective: {
    text: 'రెండు వారాలుగా అలసట, ఎక్కువ దాహం అనిపిస్తోంది.',
    gloss: 'Fatigue and increased thirst over 2 weeks.',
    lang: 'te',
  },
  objective: {
    text: 'BP 148/92 mmHg · పల్స్ 82/నిమిషం',
    gloss: 'BP 148/92 mmHg · Pulse 82/min',
    lang: 'te',
  },
  assessment: {
    text: 'టైప్ 2 డయాబెటిస్ — HbA1c 8.4%',
    gloss: 'Type 2 diabetes mellitus, HbA1c 8.4% today.',
    lang: 'te',
  },
};

const WITH_PLAN: SoapSections = {
  ...DRAFTED,
  plan: {
    text: 'మెట్‌ఫార్మిన్ కొనసాగించండి. రెండు వారాల్లో రివ్యూ.',
    gloss: 'Continue metformin. Review in two weeks.',
    lang: 'te',
  },
};

function Soap(props: Partial<SoapDraftBlockProps>) {
  return (
    <SoapDraftBlock
      approverName="Dr. Meera Iyer"
      defaultSections={DRAFTED}
      {...props}
    />
  );
}

describe('SoapDraftBlock: anatomy', () => {
  it('is an AI draft block with the four sections, S, O, A and P, in order', () => {
    render(<Soap />);
    expect(block().classList.contains('nova-ai-block')).toBe(true);
    const headings = within(block())
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'S — Subjective',
      'O — Objective',
      'A — Assessment',
      'P — Plan',
    ]);
  });

  it('sets each section label in the label tokens, as VoiceEntryCapture does, on a control-cornered panel', () => {
    render(<Soap />);
    const heading = within(block()).getAllByRole('heading', { level: 4 })[0];
    for (const cls of ['text-label', 'uppercase', 'tracking-label']) {
      expect(heading?.className.split(' ')).toContain(cls);
    }
    const section = block().querySelector('[data-section]');
    expect(section?.className.split(' ')).toContain('rounded-control');
  });

  it('gives each section an editable body in its own language, named by its heading', () => {
    render(<Soap />);
    const body = screen.getByRole('textbox', {
      name: 'S — Subjective',
    }) as HTMLTextAreaElement;
    expect(body.value).toBe(DRAFTED.subjective?.text);
    expect(body.getAttribute('lang')).toBe('te');
  });

  it('shows the English gloss under the original, in English, and describes the body with it', () => {
    render(<Soap />);
    const gloss = screen.getByText(
      'Fatigue and increased thirst over 2 weeks.',
    );
    expect(gloss.getAttribute('lang')).toBe('en');
    const body = screen.getByRole('textbox', { name: 'S — Subjective' });
    expect(body.getAttribute('aria-describedby')).toContain(gloss.id);
  });

  it('marks where each section came from with a provenance chip', () => {
    render(<Soap />);
    expect(
      within(section('subjective')).getByText('transcribed verbatim'),
    ).toBeTruthy();
    expect(
      within(section('objective')).getByText('transcribed verbatim'),
    ).toBeTruthy();
    expect(within(section('assessment')).getByText('your words')).toBeTruthy();
    expect(within(section('plan')).getByText('yours to dictate')).toBeTruthy();
  });

  it('takes a provenance per section', () => {
    render(
      <Soap
        defaultSections={{
          ...DRAFTED,
          assessment: { text: 'T2DM', provenance: 'verbatim' },
        }}
      />,
    );
    expect(
      within(section('assessment')).getByText('transcribed verbatim'),
    ).toBeTruthy();
  });
});

describe('SoapDraftBlock: the plan is blocked by design', () => {
  it('blocks approval while the plan is empty, and says why', () => {
    render(<Soap />);
    expect(statusText()).toBe('Blocked — no plan dictated yet');
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
    expect(section('plan').dataset['flagged']).toBe('true');
    expect(
      within(section('plan')).getByText(/No plan dictated yet/),
    ).toBeTruthy();
  });

  it('treats a plan of only spaces as empty', () => {
    render(<Soap defaultSections={{ ...DRAFTED, plan: { text: '   \n ' } }} />);
    expect(statusText()).toBe('Blocked — no plan dictated yet');
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
  });

  it('stays blocked even when the caller says approved: an empty plan is never signed', () => {
    render(<Soap status="approved" approvedBy="Dr. Meera Iyer" />);
    expect(statusText()).toBe('Blocked — no plan dictated yet');
    expect(block().dataset['status']).toBe('blocked');
  });

  it('offers "Dictate the plan" while blocked', () => {
    const onDictatePlan = vi.fn();
    render(<Soap onDictatePlan={onDictatePlan} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dictate the plan' }));
    expect(onDictatePlan).toHaveBeenCalledTimes(1);
  });

  it('becomes approvable the moment the plan is dictated, and approval makes it read-only', () => {
    const onApprove = vi.fn();
    const onSectionsChange = vi.fn();
    render(<Soap onApprove={onApprove} onSectionsChange={onSectionsChange} />);
    const plan = screen.getByRole('textbox', { name: 'P — Plan' });
    fireEvent.change(plan, { target: { value: 'Continue metformin.' } });
    expect(onSectionsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({ text: 'Continue metformin.' }),
      }),
    );
    expect(statusText()).toBe('Draft — awaiting approval');
    expect(section('plan').dataset['flagged']).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: /^Approve/ }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(statusText()).toMatch(/^✓? ?Approved · Dr. Meera Iyer/);
    expect(within(block()).queryAllByRole('textbox')).toHaveLength(0);
    expect(
      within(section('plan')).getByText('Continue metformin.'),
    ).toBeTruthy();
  });

  it('keeps the language on the read-only text once approved', () => {
    render(<Soap defaultSections={WITH_PLAN} status="approved" />);
    const text = within(section('subjective')).getByText(
      WITH_PLAN.subjective?.text ?? '',
    );
    expect(text.getAttribute('lang')).toBe('te');
  });

  it('reports edits but leaves controlled sections to the caller', () => {
    const onSectionsChange = vi.fn();
    render(<Soap sections={DRAFTED} onSectionsChange={onSectionsChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'P — Plan' }), {
      target: { value: 'Review in two weeks.' },
    });
    expect(onSectionsChange).toHaveBeenCalledTimes(1);
    expect(statusText()).toBe('Blocked — no plan dictated yet');
  });
});

describe('SoapDraftBlock: streaming', () => {
  it('reveals the sections one after another while generating, and is busy', () => {
    render(<Soap status="generating" revealed={2} />);
    const headings = within(block())
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent);
    expect(headings).toEqual(['S — Subjective', 'O — Objective']);
    expect(block().getAttribute('aria-busy')).toBe('true');
    expect(statusText()).toBe('Working…');
  });

  it('shows the caret after the newest section only, and no editing while it streams', () => {
    render(<Soap status="generating" revealed={2} />);
    const carets = block().querySelectorAll('[data-slot="caret"]');
    expect(carets).toHaveLength(1);
    expect(section('objective').contains(carets[0] as Node)).toBe(true);
    expect(within(block()).queryAllByRole('textbox')).toHaveLength(0);
  });

  it('fades a new section in only when motion is welcome', () => {
    render(<Soap status="generating" revealed={1} />);
    const animated = section('subjective')
      .className.split(/\s+/)
      .filter((cls) => cls.includes('animate'));
    expect(animated.length).toBeGreaterThan(0);
    for (const cls of animated)
      expect(cls.startsWith('motion-safe:')).toBe(true);
  });
});

describe('SoapDraftBlock: labels', () => {
  it('takes the section headings and provenance words as props', () => {
    render(
      <Soap
        soapLabels={{
          headings: {
            subjective: 'S — రోగి చెప్పినది',
            objective: 'O — పరీక్ష',
            assessment: 'A — అంచనా',
            plan: 'P — ప్రణాళిక',
          },
          provenance: { dictate: 'మీరు చెప్పాలి' },
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'P — ప్రణాళిక' })).toBeTruthy();
    expect(within(section('plan')).getByText('మీరు చెప్పాలి')).toBeTruthy();
  });

  it('never logs or stores the note', () => {
    const logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method),
    );
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<Soap />);
    fireEvent.change(screen.getByRole('textbox', { name: 'P — Plan' }), {
      target: { value: 'Ramesh to continue metformin.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Approve/ }));
    for (const log of logs) expect(log).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
