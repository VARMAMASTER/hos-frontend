import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AiDraftBlock, type AiDraftBlockProps } from './ai-draft-block';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// What a screen reader reads: the text, minus anything hidden from assistive technology.
function assistiveText(node: Node): string {
  if (node instanceof Text) return node.data;
  if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') {
    return '';
  }
  return Array.from(node.childNodes).map(assistiveText).join('');
}

const TITLE = 'Discharge summary';

function block() {
  return screen.getByRole('group', { name: TITLE });
}

function button(name: string | RegExp) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

function status() {
  const regions = block().querySelectorAll('[role="status"]');
  expect(regions).toHaveLength(1);
  return regions[0] as HTMLElement;
}

const statusText = () => assistiveText(status()).replace(/\s+/g, ' ').trim();

function Draft(props: Partial<AiDraftBlockProps>) {
  return (
    <AiDraftBlock title={TITLE} approverName="Dr. Meera Iyer" {...props}>
      {props.children ?? (
        <p>
          Admitted with a chest infection, treated with IV antibiotics. Fever
          settled within 48 hours.
        </p>
      )}
    </AiDraftBlock>
  );
}

describe('AiDraftBlock: anatomy', () => {
  it('is the AI block: a group named by its title, with the spark, the AI badge, the status and the body', () => {
    render(<Draft source={<p>Source: IPD chart</p>} />);
    const group = block();
    expect(group.classList.contains('nova-ai-block')).toBe(true);
    expect(group.querySelector('.nova-ai-spark')?.textContent).toBe('✦');
    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeTruthy();
    expect(screen.getByText('AI draft')).toBeTruthy();
    expect(screen.getByText(/Admitted with a chest infection/)).toBeTruthy();
    expect(screen.getByText('Source: IPD chart')).toBeTruthy();
  });

  it('is pending by default, and says so in words: "Draft — awaiting approval"', () => {
    render(<Draft />);
    expect(block().dataset['status']).toBe('pending');
    expect(statusText()).toBe('Draft — awaiting approval');
    expect(status().dataset['tone']).toBe('ai');
  });

  it('names every button with the block title', () => {
    render(<Draft onEdit={() => undefined} />);
    expect(button('Approve Discharge summary')).toBeTruthy();
    expect(button('Edit Discharge summary')).toBeTruthy();
    expect(button('Reject Discharge summary')).toBeTruthy();
  });

  it('puts Approve first and focuses nothing on its own: Reject is never the default focus', () => {
    render(<Draft />);
    const names = screen.getAllByRole('button').map((b) => b.textContent);
    expect(names).toEqual(['Approve', 'Reject']);
    expect(document.activeElement).toBe(document.body);
    expect(button(/^Reject/).hasAttribute('autofocus')).toBe(false);
  });

  it('puts the caller language on the content, not on the fixed labels', () => {
    render(
      <Draft contentLang="te">
        <p>రెండు వారాలుగా అలసట</p>
      </Draft>,
    );
    expect(
      screen
        .getByText('రెండు వారాలుగా అలసట')
        .parentElement?.getAttribute('lang'),
    ).toBe('te');
    expect(block().getAttribute('lang')).toBeNull();
  });

  it('adds badges (a tier chip) to the header, after the status, outside the live region', () => {
    render(<Draft badges={<span data-testid="tier">Tier: green</span>} />);
    const tier = screen.getByTestId('tier');
    expect(block().querySelector('h3')?.parentElement?.contains(tier)).toBe(
      true,
    );
    expect(status().contains(tier)).toBe(false);
    expect(
      status().compareDocumentPosition(tier) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('adds caller actions to the actions row', () => {
    render(
      <Draft
        actions={
          <button type="button" className="x">
            Open the theatre record
          </button>
        }
      />,
    );
    expect(button('Open the theatre record')).toBeTruthy();
  });
});

describe('AiDraftBlock: approve and undo', () => {
  it('approves: reports who and when, flips the chip, settles the block green and records it', () => {
    const onApprove = vi.fn();
    render(<Draft onApprove={onApprove} />);
    fireEvent.click(button('Approve Discharge summary'));
    expect(onApprove).toHaveBeenCalledTimes(1);
    const [approval] = onApprove.mock.calls[0] ?? [];
    expect(approval.approver).toBe('Dr. Meera Iyer');
    expect(approval.at).toBeInstanceOf(Date);
    expect(block().dataset['status']).toBe('approved');
    expect(block().dataset['approved']).toBe('true');
    expect(statusText()).toBe('Approved · Dr. Meera Iyer · just now');
    expect(status().dataset['tone']).toBe('good');
    expect(status().textContent).toContain('✓');
    expect(
      assistiveText(screen.getByText(/logged to the audit trail/)).trim(),
    ).toBe('Approved by Dr. Meera Iyer — logged to the audit trail.');
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
  });

  it('keeps one live region for the status, so the change is announced, not re-mounted', () => {
    render(<Draft />);
    const before = status();
    fireEvent.click(button('Approve Discharge summary'));
    expect(status()).toBe(before);
  });

  it('keeps the provenance once approved: the badge says AI-assisted', () => {
    render(<Draft />);
    fireEvent.click(button('Approve Discharge summary'));
    expect(screen.getByText('AI-assisted')).toBeTruthy();
  });

  it('moves focus to Undo after approving', () => {
    render(<Draft />);
    button('Approve Discharge summary').focus();
    fireEvent.click(button('Approve Discharge summary'));
    expect(document.activeElement).toBe(button('Undo Discharge summary'));
  });

  it('undoes: the draft is pending again, says the approval was withdrawn, and focus returns to Approve', () => {
    const onUndo = vi.fn();
    render(<Draft onUndo={onUndo} />);
    button('Approve Discharge summary').focus();
    fireEvent.click(button('Approve Discharge summary'));
    fireEvent.click(button('Undo Discharge summary'));
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(block().dataset['status']).toBe('undone');
    expect(block().dataset['approved']).toBeUndefined();
    expect(statusText()).toBe('Draft — awaiting approval');
    expect(screen.getByText(/Approval withdrawn/)).toBeTruthy();
    expect(document.activeElement).toBe(button('Approve Discharge summary'));
  });

  it('can be approved again after an undo', () => {
    const onApprove = vi.fn();
    render(<Draft onApprove={onApprove} />);
    fireEvent.click(button('Approve Discharge summary'));
    fireEvent.click(button('Undo Discharge summary'));
    fireEvent.click(button('Approve Discharge summary'));
    expect(onApprove).toHaveBeenCalledTimes(2);
    expect(block().dataset['status']).toBe('approved');
  });

  it('can refuse an undo (undoable=false)', () => {
    render(<Draft undoable={false} />);
    fireEvent.click(button('Approve Discharge summary'));
    expect(screen.queryByRole('button', { name: /^Undo/ })).toBeNull();
  });

  it('records the signatory rather than the person at the screen', () => {
    const onApprove = vi.fn();
    render(
      <Draft
        approverName="Mary Grace"
        signatory="Dr. P. Anil Kumar"
        onApprove={onApprove}
      />,
    );
    fireEvent.click(button('Approve Discharge summary'));
    expect(onApprove.mock.calls[0]?.[0].approver).toBe('Dr. P. Anil Kumar');
    expect(statusText()).toBe('Approved · Dr. P. Anil Kumar · just now');
  });

  it('takes a verb: "Sign" on the button, "Signed" on the record', () => {
    render(<Draft verb="Sign" />);
    fireEvent.click(button('Sign Discharge summary'));
    expect(statusText()).toBe('Signed · Dr. Meera Iyer · just now');
    expect(screen.getByText(/logged to the audit trail/).textContent).toBe(
      'Signed by Dr. Meera Iyer — logged to the audit trail.',
    );
  });

  it('takes the past tense of a verb it does not know', () => {
    render(<Draft verb="Countersign" approvedVerb="Countersigned" />);
    fireEvent.click(button('Countersign Discharge summary'));
    expect(statusText()).toBe('Countersigned · Dr. Meera Iyer · just now');
  });

  it('leaves time formatting to the caller', () => {
    const formatTime = vi.fn(() => '10:52 AM');
    render(<Draft formatTime={formatTime} />);
    fireEvent.click(button('Approve Discharge summary'));
    expect(formatTime).toHaveBeenCalledWith(expect.any(Date));
    expect(statusText()).toBe('Approved · Dr. Meera Iyer · 10:52 AM');
  });

  it('shows a stored approval: approvedBy and approvedAt as a string', () => {
    render(
      <Draft
        status="approved"
        approvedBy="Dr. Sunitha Rao"
        approvedAt="14 Oct, 09:12"
      />,
    );
    expect(statusText()).toBe('Approved · Dr. Sunitha Rao · 14 Oct, 09:12');
  });

  it('formats a stored Date with formatTime', () => {
    render(
      <Draft
        status="approved"
        approvedBy="Dr. Sunitha Rao"
        approvedAt={new Date(2026, 9, 14, 9, 12)}
        formatTime={(at: Date) => `${at.getHours()}:${at.getMinutes()}`}
      />,
    );
    expect(statusText()).toBe('Approved · Dr. Sunitha Rao · 9:12');
  });
});

describe('AiDraftBlock: controlled', () => {
  it('reports the change and waits for the caller to make it', () => {
    const onStatusChange = vi.fn();
    const { rerender } = render(
      <Draft status="pending" onStatusChange={onStatusChange} />,
    );
    button('Approve Discharge summary').focus();
    fireEvent.click(button('Approve Discharge summary'));
    expect(onStatusChange).toHaveBeenCalledWith('approved');
    expect(block().dataset['status']).toBe('pending');
    rerender(
      <Draft
        status="approved"
        approvedBy="Dr. Meera Iyer"
        onStatusChange={onStatusChange}
      />,
    );
    expect(statusText()).toBe('Approved · Dr. Meera Iyer · just now');
    expect(document.activeElement).toBe(button('Undo Discharge summary'));
  });
});

describe('AiDraftBlock: reject', () => {
  it('asks for a reason first, focusing the reason field (not a destructive button)', () => {
    render(<Draft />);
    fireEvent.click(button('Reject Discharge summary'));
    const field = screen.getByRole('textbox', {
      name: 'Why are you rejecting this draft?',
    });
    expect(document.activeElement).toBe(field);
    expect(field.hasAttribute('required')).toBe(true);
  });

  it('will not reject without a reason', () => {
    const onReject = vi.fn();
    render(<Draft onReject={onReject} />);
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.click(button('Reject draft Discharge summary'));
    expect(onReject).not.toHaveBeenCalled();
    const field = screen.getByRole('textbox');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('Give a reason to reject this draft.'),
    ).toBeTruthy();
    expect(document.activeElement).toBe(field);
  });

  it('rejects with the reason, says so, and focuses Undo', () => {
    const onReject = vi.fn();
    render(<Draft onReject={onReject} />);
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  Wrong discharge date  ' },
    });
    fireEvent.click(button('Reject draft Discharge summary'));
    expect(onReject).toHaveBeenCalledWith('Wrong discharge date');
    expect(block().dataset['status']).toBe('rejected');
    expect(statusText()).toBe('Rejected');
    expect(status().dataset['tone']).toBe('crit');
    expect(
      screen.getByText(/Wrong discharge date/).closest('p')?.textContent,
    ).toBe('Rejected by Dr. Meera Iyer — Wrong discharge date');
    expect(document.activeElement).toBe(button('Undo Discharge summary'));
  });

  it('submits the reason with Enter and cancels with Escape, returning focus to Reject', () => {
    const onReject = vi.fn();
    render(<Draft onReject={onReject} />);
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.activeElement).toBe(button('Reject Discharge summary'));
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Duplicate' },
    });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onReject).toHaveBeenCalledWith('Duplicate');
  });

  it('cancels from the Cancel button too', () => {
    render(<Draft />);
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.click(button('Cancel Discharge summary'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.activeElement).toBe(button('Reject Discharge summary'));
  });

  it('undoes a rejection back to a pending draft, focusing Approve', () => {
    render(<Draft />);
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Duplicate' },
    });
    fireEvent.click(button('Reject draft Discharge summary'));
    fireEvent.click(button('Undo Discharge summary'));
    expect(block().dataset['status']).toBe('pending');
    expect(document.activeElement).toBe(button('Approve Discharge summary'));
  });

  it('can leave Reject out (rejectable=false)', () => {
    render(<Draft rejectable={false} />);
    expect(screen.queryByRole('button', { name: /^Reject/ })).toBeNull();
  });
});

describe('AiDraftBlock: generating and blocked', () => {
  it('while generating says "Working…", is busy, and holds Approve unavailable', () => {
    const onApprove = vi.fn();
    render(<Draft status="generating" onApprove={onApprove} />);
    expect(statusText()).toBe('Working…');
    expect(block().getAttribute('aria-busy')).toBe('true');
    const approve = button('Approve Discharge summary');
    expect(approve.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(approve);
    expect(onApprove).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Reject/ })).toBeNull();
  });

  it('shows generation progress as a progress bar', () => {
    render(<Draft status="generating" progress={40} />);
    const bar = screen.getByRole('progressbar', { name: 'Drafting progress' });
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('spins its working icon only when motion is welcome', () => {
    render(<Draft status="generating" />);
    const spinner = status().querySelector('svg');
    expect(spinner?.getAttribute('class')).toContain(
      'motion-safe:animate-spin',
    );
    expect(spinner?.getAttribute('class')).not.toMatch(/(^|\s)animate-spin/);
  });

  it('when blocked says why, offers no Approve, and keeps the unblocking action', () => {
    const onApprove = vi.fn();
    render(
      <Draft
        status="blocked"
        onApprove={onApprove}
        blockedReason="No plan dictated yet. The note cannot be signed until it is."
        actions={<button type="button">Dictate the plan</button>}
      />,
    );
    expect(statusText()).toBe('Blocked');
    expect(status().dataset['tone']).toBe('warn');
    expect(screen.getByText(/No plan dictated yet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
    expect(button('Dictate the plan')).toBeTruthy();
  });
});

describe('AiDraftBlock: delegated signature, witness and gate', () => {
  it('for-signature: names the signatory, and offers no Sign button to anyone else', () => {
    render(
      <Draft
        status="for-signature"
        approverName="Mary Grace"
        signatory="Dr. P. Anil Kumar"
      />,
    );
    expect(statusText()).toBe("For Dr. P. Anil Kumar's signature");
    expect(screen.queryByRole('button', { name: /^Sign/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
    expect(
      screen.getByText('Only Dr. P. Anil Kumar can sign this.'),
    ).toBeTruthy();
  });

  it('for-signature: the signatory signs', () => {
    const onApprove = vi.fn();
    render(
      <Draft
        defaultStatus="for-signature"
        approverName="Dr. P. Anil Kumar"
        signatory="Dr. P. Anil Kumar"
        onApprove={onApprove}
      />,
    );
    fireEvent.click(button('Sign Discharge summary'));
    expect(onApprove.mock.calls[0]?.[0].approver).toBe('Dr. P. Anil Kumar');
    expect(statusText()).toBe('Signed · Dr. P. Anil Kumar · just now');
  });

  it('witness: shows the first signature and completes on the second', () => {
    const onApprove = vi.fn();
    render(
      <Draft
        defaultStatus="witness"
        firstSignature="Mary Grace"
        approverName="Sister Vasavi"
        signatory="Sister Vasavi"
        onApprove={onApprove}
      />,
    );
    expect(statusText()).toBe('Awaiting a second signature');
    expect(
      screen.getByText(
        'Signed by Mary Grace. A second signature completes it.',
      ),
    ).toBeTruthy();
    fireEvent.click(button('Witness Discharge summary'));
    expect(onApprove.mock.calls[0]?.[0].approver).toBe('Sister Vasavi');
    expect(statusText()).toBe('Witnessed · Sister Vasavi · just now');
  });

  it('witness: the first signatory cannot witness their own entry', () => {
    render(
      <Draft
        status="witness"
        firstSignature="Mary Grace"
        approverName="Mary Grace"
      />,
    );
    expect(screen.queryByRole('button', { name: /^Witness/ })).toBeNull();
    expect(
      screen.getByText(/You signed first\. A second person must witness it\./),
    ).toBeTruthy();
  });

  it('gated: says which authority it needs and offers no Authorise button without it', () => {
    render(
      <Draft
        status="gated"
        gateLabel="Needs pharmacist sign-off"
        gateReason="Above counter authority of ₹500. Nothing is applied until it is authorised."
        approverName="Ravi Teja"
      />,
    );
    expect(statusText()).toBe('Needs pharmacist sign-off');
    expect(status().dataset['tone']).toBe('warn');
    expect(screen.getByText(/Above counter authority/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Authorise/ })).toBeNull();
  });

  it('gated: the person with authority authorises', () => {
    render(
      <Draft
        defaultStatus="gated"
        gateLabel="Needs owner sign-off"
        signatory="Dr. G. Prakash"
        approverName="Dr. G. Prakash"
      />,
    );
    fireEvent.click(button('Authorise Discharge summary'));
    expect(statusText()).toBe('Authorised · Dr. G. Prakash · just now');
  });

  it('lets the caller decide who may approve (canApprove)', () => {
    render(<Draft status="pending" canApprove={false} />);
    expect(screen.queryByRole('button', { name: /^Approve/ })).toBeNull();
  });
});

describe('AiDraftBlock: words and health data', () => {
  it('takes every fixed label as a prop', () => {
    render(
      <Draft
        labels={{
          pending: 'ड्राफ्ट — मंज़ूरी बाकी',
          badge: 'AI ड्राफ्ट',
          reject: 'अस्वीकार',
        }}
        verb="मंज़ूर"
      />,
    );
    expect(statusText()).toBe('ड्राफ्ट — मंज़ूरी बाकी');
    expect(screen.getByText('AI ड्राफ्ट')).toBeTruthy();
    expect(button('मंज़ूर Discharge summary')).toBeTruthy();
    expect(button('अस्वीकार Discharge summary')).toBeTruthy();
  });

  it('writes nothing to the console while approving, rejecting or undoing patient content', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    render(
      <Draft>
        <p>Ramesh, 54, admitted with chest pain.</p>
      </Draft>,
    );
    fireEvent.click(button('Approve Discharge summary'));
    fireEvent.click(button('Undo Discharge summary'));
    fireEvent.click(button('Reject Discharge summary'));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Ramesh is a different patient' },
    });
    fireEvent.click(button('Reject draft Discharge summary'));
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('keeps nothing in browser storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<Draft />);
    fireEvent.click(button('Approve Discharge summary'));
    expect(setItem).not.toHaveBeenCalled();
  });
});
