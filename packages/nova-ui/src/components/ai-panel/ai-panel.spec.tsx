import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ApprovalBar } from '../approval-bar/approval-bar';
import { AiPanel } from './ai-panel';

afterEach(() => cleanup());

function panel(name = 'Discharge summary') {
  return screen.getByRole('group', { name });
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

  // The prototype's .ai-block: the AI wash and the gradient rail come from the ai-block surface.
  it('is the prototype AI block, headed by the spark', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    expect(panel().classList.contains('nova-ai-block')).toBe(true);
    expect(panel().dataset['surface']).toBe('ai-block');
    expect(panel().dataset['approved']).toBeUndefined();
    const spark = panel().querySelector('.nova-ai-spark');
    expect(spark?.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(spark?.textContent).toBe('');
    expect(spark?.getAttribute('aria-hidden')).toBe('true');
    // The tile is only the mark: the title and the badge beside it are the words.
    expect(screen.getByText('AI draft')).toBeTruthy();
  });

  it('shows the AI badge in draft: a spark and the text "AI draft"', () => {
    render(<AiPanel title="Discharge summary">Body</AiPanel>);
    const badge = screen.getByText('AI draft');
    expect(badge.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(badge.textContent).toBe('AI draft');
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
    // The block settles to green (theme.css) and its spark turns to a tick.
    expect(panel().dataset['approved']).toBe('true');
    const tile = panel().querySelector('.nova-ai-spark');
    expect(tile?.textContent).toBe('✓');
    expect(tile?.querySelector('[data-ai-mark]')).toBeNull();
  });

  it('still says an AI produced it once approved: provenance outlives the draft', () => {
    render(
      <AiPanel title="Discharge summary" state="approved">
        Body
      </AiPanel>,
    );
    const badge = screen.getByText('AI-assisted');
    expect(badge.querySelector('[data-ai-mark]')).not.toBeNull();
    expect(badge.textContent).toBe('AI-assisted');
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

  it('takes a status for its header, in place of the default "Approved" chip', () => {
    render(
      <AiPanel
        title="Discharge summary"
        state="approved"
        status={<span>✓ Signed · Dr. Meera Iyer</span>}
      >
        Body
      </AiPanel>,
    );
    expect(screen.getByText('✓ Signed · Dr. Meera Iyer')).toBeTruthy();
    expect(screen.queryByText('Approved')).toBeNull();
  });

  it('takes the badge words, so they can be translated', () => {
    render(
      <AiPanel title="Discharge summary" badgeLabel="AI ड्राफ्ट">
        Body
      </AiPanel>,
    );
    expect(screen.getByText('AI ड्राफ्ट')).toBeTruthy();
  });

  it('takes an id for its title, so controls elsewhere can be named by it', () => {
    render(
      <AiPanel title="Discharge summary" titleId="summary-title">
        Body
      </AiPanel>,
    );
    expect(document.getElementById('summary-title')?.textContent).toBe(
      'Discharge summary',
    );
    expect(panel().getAttribute('aria-labelledby')).toBe('summary-title');
  });

  it('takes a different glyph for the spark (the prototype uses ₹ on a money gate)', () => {
    render(
      <AiPanel title="Discharge summary" spark="₹">
        Body
      </AiPanel>,
    );
    expect(panel().querySelector('.nova-ai-spark')?.textContent).toBe('₹');
  });

  it('merges a custom className and passes attributes through', () => {
    render(
      <AiPanel title="Discharge summary" className="mt-s6" id="summary">
        Body
      </AiPanel>,
    );
    expect(panel().classList.contains('mt-s6')).toBe(true);
    expect(panel().classList.contains('nova-ai-block')).toBe(true);
    expect(panel().id).toBe('summary');
  });
});
