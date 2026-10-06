import { StrictMode, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  type RenderResult,
} from '@testing-library/react';
import { OtpInput, type OtpInputProps } from './otp-input';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

const input = () => screen.getByLabelText('Verification code');
const type = (value: string) =>
  fireEvent.change(input(), { target: { value } });
const paste = (text: string) =>
  fireEvent.paste(input(), { clipboardData: { getData: () => text } });
const boxes = (view: RenderResult) =>
  [...view.container.querySelectorAll('[data-otp-box]')].map(
    (box) => box.textContent,
  );

function setup(props: Partial<OtpInputProps> = {}) {
  return render(<OtpInput label="Verification code" {...props} />);
}

describe('OtpInput semantics', () => {
  it('is one real input with a label, numeric keyboard and one-time-code autofill', () => {
    setup();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    const field = input();
    expect(field.tagName).toBe('INPUT');
    expect(field.getAttribute('inputmode')).toBe('numeric');
    expect(field.getAttribute('autocomplete')).toBe('one-time-code');
    expect(field.getAttribute('maxlength')).toBe('6');
  });

  it('has a default label when none is given', () => {
    render(<OtpInput />);
    expect(screen.getByLabelText('One-time code')).toBeTruthy();
  });

  it('draws six boxes, hidden from assistive tech (the input is what they use)', () => {
    const view = setup();
    const all = view.container.querySelectorAll('[data-otp-box]');
    expect(all).toHaveLength(6);
    expect(all[0]?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('takes a different length', () => {
    const view = setup({ length: 4 });
    expect(view.container.querySelectorAll('[data-otp-box]')).toHaveLength(4);
    expect(input().getAttribute('maxlength')).toBe('4');
  });

  it('describes the field with its hint', () => {
    setup({ hint: 'Sent to +91 98xxx xx210' });
    const hint = screen.getByText('Sent to +91 98xxx xx210');
    expect(input().getAttribute('aria-describedby')).toContain(hint.id);
  });

  it('passes name, autoFocus and disabled to the input', () => {
    setup({ name: 'otp', disabled: true });
    expect(input().getAttribute('name')).toBe('otp');
    expect((input() as HTMLInputElement).disabled).toBe(true);
  });
});

describe('OtpInput entry', () => {
  it('shows typed digits in the boxes', () => {
    const view = setup();
    type('48');
    expect(boxes(view)).toEqual(['4', '8', '', '', '', '']);
  });

  it('rejects a non-digit', () => {
    const view = setup();
    type('48');
    type('48x');
    expect((input() as HTMLInputElement).value).toBe('48');
    expect(boxes(view)).toEqual(['4', '8', '', '', '', '']);
  });

  it('marks the next box to fill as active while focused', () => {
    const view = setup();
    type('48');
    fireEvent.focus(input());
    const active = [...view.container.querySelectorAll('[data-otp-box]')].map(
      (box) => box.getAttribute('data-active'),
    );
    expect(active).toEqual([null, null, 'true', null, null, null]);
    expect(
      view.container.querySelectorAll('[data-otp-box]')[2]?.className,
    ).toContain('border-primary');
  });

  it('keeps the last box active once the code is full', () => {
    const view = setup();
    type('123456');
    fireEvent.focus(input());
    expect(
      view.container
        .querySelectorAll('[data-otp-box]')[5]
        ?.getAttribute('data-active'),
    ).toBe('true');
  });

  it('shows no active box while the input is not focused', () => {
    const view = setup();
    expect(view.container.querySelector('[data-active]')).toBeNull();
  });
});

describe('OtpInput paste', () => {
  it('fills every box from a pasted 6-digit code', () => {
    const view = setup();
    paste('482913');
    expect(boxes(view)).toEqual(['4', '8', '2', '9', '1', '3']);
  });

  it('accepts a code with a space or hyphen in the middle', () => {
    const view = setup();
    paste('482 913');
    expect(boxes(view)).toEqual(['4', '8', '2', '9', '1', '3']);
    paste('111-222');
    expect(boxes(view)).toEqual(['1', '1', '1', '2', '2', '2']);
  });

  it('rejects a paste that has anything but digits in it', () => {
    const view = setup();
    type('12');
    paste('48a913');
    expect(boxes(view)).toEqual(['1', '2', '', '', '', '']);
    paste('<b>1</b>');
    expect(boxes(view)).toEqual(['1', '2', '', '', '', '']);
  });

  it('trims a paste longer than the code', () => {
    const view = setup();
    paste('12345678');
    expect(boxes(view)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('does nothing for an empty clipboard', () => {
    const view = setup();
    paste('');
    expect(boxes(view)).toEqual(['', '', '', '', '', '']);
  });
});

describe('OtpInput onComplete', () => {
  it('fires once, with the code, when the last digit arrives', () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    type('4');
    type('48291');
    expect(onComplete).not.toHaveBeenCalled();
    type('482913');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('fires once for a paste', () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    paste('482913');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('does not fire again while the code stays complete', () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    type('482913');
    type('482913');
    paste('482913');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('fires again after the code is cleared and refilled', () => {
    const onComplete = vi.fn();
    setup({ onComplete });
    type('482913');
    type('48291');
    type('482915');
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenLastCalledWith('482915');
  });

  it('fires once under StrictMode', () => {
    const onComplete = vi.fn();
    render(
      <StrictMode>
        <OtpInput label="Verification code" onComplete={onComplete} />
      </StrictMode>,
    );
    paste('482913');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('reports every change through onChange, digits only', () => {
    const onChange = vi.fn();
    setup({ onChange });
    type('4');
    type('4x');
    type('48');
    expect(onChange.mock.calls).toEqual([['4'], ['48']]);
  });
});

describe('OtpInput controlled', () => {
  function Controlled({ onComplete }: { onComplete: (code: string) => void }) {
    const [value, setValue] = useState('');
    return (
      <>
        <OtpInput
          label="Verification code"
          value={value}
          onChange={setValue}
          onComplete={onComplete}
        />
        <button type="button" onClick={() => setValue('')}>
          Clear
        </button>
      </>
    );
  }

  it('follows the value the parent holds', () => {
    const onComplete = vi.fn();
    const view = render(<Controlled onComplete={onComplete} />);
    paste('482913');
    expect(boxes(view)).toEqual(['4', '8', '2', '9', '1', '3']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(boxes(view)).toEqual(['', '', '', '', '', '']);
    paste('111111');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});

describe('OtpInput error', () => {
  it('announces the error, wires it to the input, and marks the field invalid', () => {
    setup({ error: 'That code is not right. Try again.' });
    const message = screen.getByRole('alert');
    expect(message.textContent).toBe('That code is not right. Try again.');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toContain(message.id);
  });

  it('has no alert and is not invalid without an error', () => {
    setup();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the error as a crit edge on the boxes, and as text', () => {
    const view = setup({ error: 'Wrong code' });
    const box = view.container.querySelector('[data-otp-box]');
    expect(box?.className).toContain('border-crit');
    expect(screen.getByRole('alert').className).toContain('text-crit');
  });

  describe('shake', () => {
    const animate = vi.fn();
    beforeEach(() => {
      animate.mockReset();
      Object.defineProperty(Element.prototype, 'animate', {
        configurable: true,
        value: animate,
      });
    });
    const reduced = (matches: boolean) =>
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
          matches: matches && query.includes('reduce'),
          media: query,
        })),
      );

    it('shakes when an error appears', () => {
      reduced(false);
      const view = setup();
      expect(animate).not.toHaveBeenCalled();
      view.rerender(<OtpInput label="Verification code" error="Wrong" />);
      expect(animate).toHaveBeenCalledTimes(1);
    });

    it('shakes again for a new error', () => {
      reduced(false);
      const view = setup({ error: 'Wrong' });
      animate.mockClear();
      view.rerender(<OtpInput label="Verification code" error="Wrong again" />);
      expect(animate).toHaveBeenCalledTimes(1);
    });

    it('does not shake under prefers-reduced-motion, but still shows the error', () => {
      reduced(true);
      const view = setup();
      view.rerender(<OtpInput label="Verification code" error="Wrong" />);
      expect(animate).not.toHaveBeenCalled();
      expect(screen.getByRole('alert').textContent).toBe('Wrong');
    });
  });
});

describe('OtpInput look', () => {
  it('draws digits at title3, weight 600, with no shadow and no weight 500', () => {
    const view = setup();
    const box = view.container.querySelector('[data-otp-box]');
    expect(box?.className).toContain('text-title3');
    expect(box?.className).toContain('font-semibold');
    expect(view.container.innerHTML).not.toMatch(/shadow|font-medium/);
  });

  it('puts className on the root and other attributes on the input', () => {
    const view = render(
      <OtpInput className="mx-auto" data-testid="otp" required />,
    );
    expect(view.container.firstElementChild?.className).toContain('mx-auto');
    expect(screen.getByTestId('otp').tagName).toBe('INPUT');
    expect((screen.getByTestId('otp') as HTMLInputElement).required).toBe(true);
  });
});
