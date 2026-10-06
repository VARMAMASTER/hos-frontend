import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ApprovalBar } from './approval-bar';

afterEach(() => cleanup());

const noop = () => undefined;

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

function button(name: string) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

describe('ApprovalBar', () => {
  it('fires onApprove, onEdit and onReject from their buttons', () => {
    const onApprove = vi.fn();
    const onEdit = vi.fn();
    const onReject = vi.fn();
    render(
      <ApprovalBar onApprove={onApprove} onEdit={onEdit} onReject={onReject} />,
    );
    fireEvent.click(button('Approve'));
    fireEvent.click(button('Edit'));
    fireEvent.click(button('Reject'));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('makes Approve the AI-variant button', () => {
    render(<ApprovalBar onApprove={noop} />);
    expect(button('Approve').dataset['variant']).toBe('ai');
  });

  it('only offers Edit and Reject when it has a handler for them', () => {
    render(<ApprovalBar onApprove={noop} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    cleanup();
    render(<ApprovalBar onApprove={noop} onEdit={noop} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Approve',
      'Edit',
    ]);
  });

  it('is a labelled group, so the buttons say what they act on', () => {
    render(<ApprovalBar onApprove={noop} />);
    expect(
      screen.getByRole('group', { name: 'Review AI output' }),
    ).toBeTruthy();
  });

  it('is not busy by default', () => {
    render(<ApprovalBar onApprove={noop} onEdit={noop} onReject={noop} />);
    const group = screen.getByRole('group', { name: 'Review AI output' });
    expect(group.getAttribute('aria-busy')).not.toBe('true');
    for (const control of screen.getAllByRole('button')) {
      expect((control as HTMLButtonElement).disabled).toBe(false);
    }
  });

  // aria-disabled, not disabled: a disabled button drops the keyboard focus it holds to <body>.
  it('while busy, marks every button aria-disabled, announces it with aria-busy and fires nothing', () => {
    const onApprove = vi.fn();
    const onEdit = vi.fn();
    const onReject = vi.fn();
    render(
      <ApprovalBar
        busy
        onApprove={onApprove}
        onEdit={onEdit}
        onReject={onReject}
      />,
    );
    const group = screen.getByRole('group', { name: 'Review AI output' });
    expect(group.getAttribute('aria-busy')).toBe('true');
    const controls = screen.getAllByRole('button') as HTMLButtonElement[];
    expect(controls).toHaveLength(3);
    for (const control of controls) {
      expect(control.getAttribute('aria-disabled')).toBe('true');
      expect(control.disabled).toBe(false);
      fireEvent.click(control);
    }
    expect(onApprove).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('replaces the controls with who approved, as an audit trail', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        onEdit={noop}
        onReject={noop}
        approvedBy="Dr. Meera Iyer"
      />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('Approved by Dr. Meera Iyer')).toBeTruthy();
  });

  it('reads the approval as text alone, with the check mark left to the eye', () => {
    render(<ApprovalBar onApprove={noop} approvedBy="Dr. Meera Iyer" />);
    expect(assistiveText(screen.getByRole('status')).trim()).toBe(
      'Approved by Dr. Meera Iyer',
    );
  });

  it('announces an approval made in front of the user, from a live region that was already there', () => {
    const { rerender } = render(<ApprovalBar onApprove={noop} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    rerender(<ApprovalBar onApprove={noop} approvedBy="Dr. Meera Iyer" />);
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toContain('Approved by Dr. Meera Iyer');
  });

  it('keeps keyboard focus on Approve while the decision is submitted', () => {
    const { rerender } = render(<ApprovalBar onApprove={noop} />);
    button('Approve').focus();
    rerender(<ApprovalBar onApprove={noop} busy />);
    expect(document.activeElement).toBe(button('Approve'));
  });

  it('moves focus to the approval record when the controls go, instead of dropping it to <body>', () => {
    const { rerender } = render(<ApprovalBar onApprove={noop} onEdit={noop} />);
    button('Approve').focus();
    rerender(<ApprovalBar onApprove={noop} onEdit={noop} busy />);
    rerender(
      <ApprovalBar
        onApprove={noop}
        onEdit={noop}
        approvedBy="Dr. Meera Iyer"
      />,
    );
    const status = screen.getByRole('status');
    expect(document.activeElement).toBe(status);
    expect(status.tabIndex).toBe(-1);
  });

  it('leaves focus alone when the user was elsewhere as the approval arrived', () => {
    const { rerender } = render(
      <>
        <ApprovalBar onApprove={noop} />
        <input aria-label="Notes" />
      </>,
    );
    const notes = screen.getByLabelText('Notes');
    notes.focus();
    rerender(
      <>
        <ApprovalBar onApprove={noop} approvedBy="Dr. Meera Iyer" />
        <input aria-label="Notes" />
      </>,
    );
    expect(document.activeElement).toBe(notes);
  });

  it('keeps its controls when approvedBy is empty', () => {
    render(<ApprovalBar onApprove={noop} approvedBy="" />);
    expect(button('Approve')).toBeTruthy();
    expect(screen.queryByText(/Approved by/)).toBeNull();
  });

  it('takes its button words as props, so they can be translated or changed to "Sign"', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        onEdit={noop}
        onReject={noop}
        approveLabel="Sign"
        editLabel="Modifier"
        rejectLabel="Rejeter"
      />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Sign',
      'Modifier',
      'Rejeter',
    ]);
  });

  it('names each button with the thing it acts on when labelledBy is given', () => {
    render(
      <>
        <h3 id="summary-title">Discharge summary</h3>
        <ApprovalBar
          onApprove={noop}
          onReject={noop}
          labelledBy="summary-title"
        />
      </>,
    );
    expect(button('Approve Discharge summary')).toBeTruthy();
    expect(button('Reject Discharge summary')).toBeTruthy();
  });

  it('can hold Approve unavailable on its own (aria-disabled, focusable, fires nothing)', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <ApprovalBar onApprove={onApprove} onReject={onReject} approveDisabled />,
    );
    const approve = button('Approve');
    expect(approve.getAttribute('aria-disabled')).toBe('true');
    expect(approve.disabled).toBe(false);
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
    fireEvent.click(button('Reject'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('adds caller actions to the row', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        actions={<button type="button">Open the theatre record</button>}
      />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Approve',
      'Open the theatre record',
    ]);
  });

  it('offers Undo beside the approval record when it has an onUndo', () => {
    const onUndo = vi.fn();
    render(
      <ApprovalBar
        onApprove={noop}
        onUndo={onUndo}
        approvedBy="Dr. Meera Iyer"
        undoLabel="Annuler"
      />,
    );
    fireEvent.click(button('Annuler'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('shows a custom approval note in place of the default record', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        approvedBy="Dr. Meera Iyer"
        approvedNote="Signed by Dr. Meera Iyer — logged to the audit trail."
      />,
    );
    expect(
      screen.getByText('Signed by Dr. Meera Iyer — logged to the audit trail.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Approved by/)).toBeNull();
  });

  it('moves focus to Undo when the controls go, if it offers one', () => {
    const { rerender } = render(<ApprovalBar onApprove={noop} onUndo={noop} />);
    button('Approve').focus();
    rerender(
      <ApprovalBar
        onApprove={noop}
        onUndo={noop}
        approvedBy="Dr. Meera Iyer"
      />,
    );
    expect(document.activeElement).toBe(button('Undo'));
  });

  it('moves focus back to Approve after Undo, instead of dropping it to <body>', () => {
    const { rerender } = render(
      <ApprovalBar
        onApprove={noop}
        onUndo={noop}
        approvedBy="Dr. Meera Iyer"
      />,
    );
    button('Undo').focus();
    rerender(<ApprovalBar onApprove={noop} onUndo={noop} />);
    expect(document.activeElement).toBe(button('Approve'));
  });

  it('can leave the announcement to someone else (no second live region)', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        approvedBy="Dr. Meera Iyer"
        announce={false}
      />,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(/Approved by Dr. Meera Iyer/)).toBeTruthy();
  });

  it('lets the group label be translated and passes attributes through', () => {
    render(
      <ApprovalBar
        onApprove={noop}
        aria-label="Vérifier la sortie IA"
        className="mt-2"
      />,
    );
    const group = screen.getByRole('group', { name: 'Vérifier la sortie IA' });
    expect(group.classList.contains('mt-2')).toBe(true);
  });
});
