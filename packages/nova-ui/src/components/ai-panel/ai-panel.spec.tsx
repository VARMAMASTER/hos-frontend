import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { AiPanel } from './ai-panel';

afterEach(() => cleanup());

function panel(name = 'Discharge summary') {
  return screen.getByRole('group', { name });
}

function rail(root: HTMLElement) {
  return root.querySelector<HTMLElement>('[data-rail]');
}

describe('AiPanel', () => {
  it('shows its title as a heading, with its content and footer', () => {
    render(
      <AiPanel title="Discharge summary" footer={<span>Review below</span>}>
        <p>Patient stable, discharge advised.</p>
      </AiPanel>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Discharge summary' }),
    ).toBeTruthy();
    expect(screen.getByText('Patient stable, discharge advised.')).toBeTruthy();
    expect(screen.getByText('Review below')).toBeTruthy();
  });

  it('is a group named by its title', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    expect(panel().getAttribute('role')).toBe('group');
  });

  it('is a draft unless told otherwise', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    expect(panel().getAttribute('data-state')).toBe('draft');
  });

  it('takes a heading level', () => {
    render(
      <AiPanel title="Discharge summary" headingLevel={3}>
        Body
      </AiPanel>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Discharge summary' }),
    ).toBeTruthy();
  });

  it('uses the nova-surface material and sits on an ai-toned rail in draft', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    expect(panel().classList.contains('nova-surface')).toBe(true);
    expect(rail(panel())?.classList.contains('bg-ai')).toBe(true);
  });

  it('shows the AI badge in draft: a spark and the text "AI draft"', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    const badge = screen.getByText('AI draft');
    expect(badge.textContent).toContain('✦');
    expect(badge.dataset['tone']).toBe('ai');
    expect(screen.queryByText('Approved')).toBeNull();
  });

  it('says it is approved in text once approved, not just by changing colour', () => {
    render(
      <AiPanel title="Discharge summary" state="approved">
        Body
      </AiPanel>,
    );
    expect(screen.getByText('Approved')).toBeTruthy();
    expect(panel().getAttribute('data-state')).toBe('approved');
  });

  it('drops the draft styling once approved', () => {
    render(
      <AiPanel title="Discharge summary" state="approved">
        Body
      </AiPanel>,
    );
    expect(screen.queryByText('AI draft')).toBeNull();
    expect(rail(panel())?.classList.contains('bg-ai')).toBe(false);
    expect(panel().classList.contains('nova-surface')).toBe(true);
  });

  it('still says an AI produced it once approved: provenance outlives the draft', () => {
    render(
      <AiPanel title="Discharge summary" state="approved">
        Body
      </AiPanel>,
    );
    const badge = screen.getByText('AI-assisted');
    expect(badge.textContent).toContain('✦');
    expect(badge.dataset['tone']).toBe('ai');
  });

  it('leaves out the footer area when there is no footer', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    expect(panel().querySelectorAll('.border-t')).toHaveLength(0);
  });

  it('hosts an ApprovalBar in its footer', () => {
    const onApprove = vi.fn();
    render(
      <AiPanel
        title="Discharge summary"
        footer={<ApprovalBar onApprove={onApprove} />}
      >
        Body
      </AiPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('merges a custom className and passes attributes through', () => {
    render(
      <AiPanel title="Discharge summary" className="mt-4" id="summary">
        Body
      </AiPanel>,
    );
    expect(panel().classList.contains('mt-4')).toBe(true);
    expect(panel().classList.contains('nova-surface')).toBe(true);
    expect(panel().id).toBe('summary');
  });
});
