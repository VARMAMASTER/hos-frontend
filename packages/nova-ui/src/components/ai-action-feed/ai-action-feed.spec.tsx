import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { AiActionFeed, type AiAction } from './ai-action-feed';

afterEach(() => cleanup());

const ACTIONS: AiAction[] = [
  {
    id: 'a1',
    agent: 'WhatsApp Assistant',
    body: 'booked K. Manjula — Gynecology, token T-04.',
    time: '09:42 AM',
    resolution: 'approved',
    resolutionLabel: 'Confirmed by Swapna',
  },
  {
    id: 'a2',
    agent: 'AI Scribe',
    body: 'drafted a consult note for Dr. K. Ramesh.',
    time: '09:47 AM',
    resolution: 'approved',
    resolutionLabel: 'Approved in 40s',
  },
  {
    id: 'a3',
    agent: 'Discharge Drafter',
    body: 'drafted a discharge summary for B. Srinu.',
    time: '12:15 PM',
    resolution: 'pending',
  },
  {
    id: 'a4',
    agent: 'Billing Agent',
    body: 'flagged a duplicate pharmacy charge.',
    time: '12:30 PM',
    resolution: 'escalated',
  },
  {
    id: 'a5',
    agent: 'AI Scribe',
    body: 'drafted a referral letter.',
    time: '12:41 PM',
    resolution: 'rejected',
  },
];

const rows = () => document.querySelectorAll('[data-ai-action-feed] > li');
const live = () => document.querySelector('[data-feed-live]') as HTMLElement;

describe('AiActionFeed', () => {
  it('lists each action with the agent, the body, the time and its resolution chip', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    expect(rows()).toHaveLength(5);
    const first = rows()[0] as HTMLElement;
    expect(first.textContent).toContain('09:42 AM');
    expect(first.textContent).toContain('WhatsApp Assistant');
    expect(first.textContent).toContain('booked K. Manjula');
    expect(
      first.querySelector('[data-resolution="approved"]')?.textContent,
    ).toContain('Confirmed by Swapna');
  });

  it('marks every row as AI with the AI mark and a text label, the agent in the AI ink', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    const first = rows()[0] as HTMLElement;
    expect(first.querySelector('[data-badge]')?.textContent).toContain('AI');
    expect(first.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(first.querySelector('[data-agent]')?.className).toContain(
      'text-ai-deep',
    );
  });

  it('says each resolution in words, with its own tone', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    const chip = (state: string) =>
      document.querySelector(`[data-resolution="${state}"]`) as HTMLElement;
    expect(chip('pending').textContent).toContain('Draft — awaiting approval');
    expect(chip('pending').dataset['tone']).toBe('ai');
    expect(chip('escalated').textContent).toContain('Escalated');
    expect(chip('escalated').dataset['tone']).toBe('warn');
    expect(chip('rejected').textContent).toContain('Rejected');
    expect(chip('rejected').dataset['tone']).toBe('crit');
    expect(
      (document.querySelector('[data-resolution="approved"]') as HTMLElement)
        .dataset['tone'],
    ).toBe('good');
  });

  it('filters by agent from a labelled select', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    fireEvent.change(screen.getByLabelText('Agent'), {
      target: { value: 'AI Scribe' },
    });
    expect(rows()).toHaveLength(2);
    for (const row of rows()) expect(row.textContent).toContain('AI Scribe');
  });

  it('filters by resolution state', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    fireEvent.change(screen.getByLabelText('Resolution'), {
      target: { value: 'pending' },
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]?.textContent).toContain('Discharge Drafter');
  });

  it('offers each agent once in the agent filter, after "All agents"', () => {
    render(<AiActionFeed actions={ACTIONS} />);
    const options = within(screen.getByLabelText('Agent')).getAllByRole(
      'option',
    );
    expect(options.map((option) => option.textContent)).toEqual([
      'All agents',
      'AI Scribe',
      'Billing Agent',
      'Discharge Drafter',
      'WhatsApp Assistant',
    ]);
  });

  it('is controllable: the filters report and the parent decides', () => {
    const onAgentFilterChange = vi.fn();
    render(
      <AiActionFeed
        actions={ACTIONS}
        agentFilter="Billing Agent"
        onAgentFilterChange={onAgentFilterChange}
      />,
    );
    expect(rows()).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Agent'), {
      target: { value: '' },
    });
    expect(onAgentFilterChange).toHaveBeenCalledWith(null);
    expect(rows()).toHaveLength(1);
  });

  it('says so when nothing matches the filters', () => {
    render(
      <AiActionFeed actions={ACTIONS} defaultResolutionFilter="escalated" />,
    );
    fireEvent.change(screen.getByLabelText('Agent'), {
      target: { value: 'AI Scribe' },
    });
    expect(rows()).toHaveLength(0);
    expect(document.body.textContent).toContain(
      'No AI actions match these filters',
    );
  });

  it('announces new entries politely, once, by agent and resolution and not the body', () => {
    const { rerender } = render(<AiActionFeed actions={ACTIONS} />);
    expect(live().getAttribute('role')).toBe('status');
    expect(live().textContent).toBe('');
    const added: AiAction = {
      id: 'a6',
      agent: 'Lab Summarizer',
      body: 'sent a CBC summary to Ramesh in Telugu.',
      time: '01:02 PM',
      resolution: 'pending',
    };
    rerender(<AiActionFeed actions={[added, ...ACTIONS]} />);
    expect(live().textContent).toBe(
      'New AI action: Lab Summarizer, Draft — awaiting approval',
    );
    expect(live().textContent).not.toContain('Ramesh');
  });

  it('stays on the opaque data surface and takes a lang per entry', () => {
    render(
      <AiActionFeed
        actions={[
          { ...ACTIONS[0]!, body: 'అన్ని విలువలు సాధారణం', lang: 'te' },
        ]}
      />,
    );
    expect(document.querySelector('[data-surface="data"]')).not.toBe(null);
    expect(
      screen
        .getByText('అన్ని విలువలు సాధారణం')
        .closest('[lang]')
        ?.getAttribute('lang'),
    ).toBe('te');
  });

  it('takes every fixed word as a prop', () => {
    render(
      <AiActionFeed
        actions={ACTIONS}
        labels={{
          agentFilter: 'एजेंट',
          allAgents: 'सभी एजेंट',
          resolution: { rejected: 'अस्वीकृत' },
        }}
      />,
    );
    expect(screen.getByLabelText('एजेंट')).toBeTruthy();
    expect(document.body.textContent).toContain('सभी एजेंट');
    expect(
      document.querySelector('[data-resolution="rejected"]')?.textContent,
    ).toContain('अस्वीकृत');
  });
});
