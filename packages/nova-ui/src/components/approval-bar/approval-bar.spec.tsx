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

  it('while busy, disables every button, announces it with aria-busy and fires nothing', () => {
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
      expect(control.disabled).toBe(true);
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

  it('keeps its controls when approvedBy is empty', () => {
    render(<ApprovalBar onApprove={noop} approvedBy="" />);
    expect(button('Approve')).toBeTruthy();
    expect(screen.queryByText(/Approved by/)).toBeNull();
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
