import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { isSafeHref, SafeMarkdown } from './safe-markdown';

afterEach(() => cleanup());

// Built, not written out, so the linter's no-script-url does not flag the probes themselves.
const SCRIPT = ['java', 'script:'].join('');

function md(text: string, partial = false) {
  const { container } = render(<SafeMarkdown text={text} partial={partial} />);
  return container.firstElementChild as HTMLElement;
}

describe('SafeMarkdown', () => {
  it('renders plain text as a paragraph', () => {
    const root = md('Ramesh is stable.');
    expect(root.querySelector('p')?.textContent).toBe('Ramesh is stable.');
  });

  it('renders **bold** as <strong> and *italics* and _italics_ as <em>', () => {
    const root = md('HbA1c is **8.4%** and *rising*, _recheck_ soon');
    expect(root.querySelector('strong')?.textContent).toBe('8.4%');
    expect([...root.querySelectorAll('em')].map((e) => e.textContent)).toEqual([
      'rising',
      'recheck',
    ]);
  });

  it('nests italics inside bold', () => {
    const root = md('**eGFR *44* today**');
    expect(root.querySelector('strong em')?.textContent).toBe('44');
  });

  it('leaves arithmetic and snake_case alone', () => {
    const root = md('2 * 3 * 4 and drug_code_12');
    expect(root.querySelector('em')).toBeNull();
    expect(root.textContent).toBe('2 * 3 * 4 and drug_code_12');
  });

  it('turns single newlines into line breaks and blank lines into paragraphs', () => {
    const root = md('Line one\nLine two\n\nNext paragraph');
    const paragraphs = root.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.querySelectorAll('br')).toHaveLength(1);
    expect(paragraphs[1]?.textContent).toBe('Next paragraph');
  });

  it('renders - and * bullets as an unordered list', () => {
    const root = md('Allergies:\n- Penicillin\n* Sulfa');
    const items = [...root.querySelectorAll('ul > li')].map(
      (li) => li.textContent,
    );
    expect(items).toEqual(['Penicillin', 'Sulfa']);
    expect(root.querySelector('p')?.textContent).toBe('Allergies:');
  });

  it('renders numbered lines as an ordered list that keeps its start number', () => {
    const root = md('3. Recheck potassium\n4. Review **eGFR**');
    const list = root.querySelector('ol');
    expect(list?.getAttribute('start')).toBe('3');
    expect(list?.querySelectorAll('li')).toHaveLength(2);
    expect(list?.querySelector('strong')?.textContent).toBe('eGFR');
  });

  it('renders http, https and mailto links', () => {
    render(
      <SafeMarkdown text="See [the guideline](https://example.org/ckd) or [mail](mailto:ward@example.org)" />,
    );
    const guideline = screen.getByRole('link', { name: 'the guideline' });
    expect(guideline.getAttribute('href')).toBe('https://example.org/ckd');
    // A link out of a patient screen never carries the screen's address with it.
    expect(guideline.getAttribute('rel')).toContain('noreferrer');
    expect(
      screen.getByRole('link', { name: 'mail' }).getAttribute('href'),
    ).toBe('mailto:ward@example.org');
  });

  it('drops a link with any other scheme, keeping only its text', () => {
    for (const href of [
      `${SCRIPT}alert(1)`,
      `${SCRIPT.toUpperCase()}alert(1)`,
      'data:text/html,hi',
      'vbscript:x',
      '/relative/path',
      'file:///etc/passwd',
    ]) {
      cleanup();
      const root = md(`[click](${href})`);
      expect(root.querySelector('a'), href).toBeNull();
      expect(root.textContent, href).toBe('click');
    }
  });

  it('never passes raw HTML through: tags show as text', () => {
    const root = md(
      '<img src=x onerror=alert(1)><b>bold</b><script>x</script>',
    );
    expect(root.querySelector('img, b, script')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('shows an unclosed ** literally once the text is final', () => {
    const root = md('a **b');
    expect(root.querySelector('strong')).toBeNull();
    expect(root.textContent).toBe('a **b');
  });

  it('bolds an unclosed ** while the text is still streaming', () => {
    const root = md('a **Laksh', true);
    expect(root.querySelector('strong')?.textContent).toBe('Laksh');
  });

  it('puts the lang attribute on its block', () => {
    const { container } = render(
      <SafeMarkdown text="రక్తపోటు సాధారణంగా ఉంది" lang="te" />,
    );
    expect(container.firstElementChild?.getAttribute('lang')).toBe('te');
  });

  it('appends a tail node inline at the end of the last block', () => {
    const { container } = render(
      <SafeMarkdown text={'One\n- two'} tail={<span data-tail="" />} />,
    );
    expect(container.querySelector('li [data-tail]')).not.toBeNull();
  });
});

describe('isSafeHref', () => {
  it('allows only http, https and mailto', () => {
    expect(isSafeHref('https://example.org')).toBe(true);
    expect(isSafeHref('http://example.org')).toBe(true);
    expect(isSafeHref('mailto:a@example.org')).toBe(true);
    expect(isSafeHref(`${SCRIPT}alert(1)`)).toBe(false);
    expect(isSafeHref(' javascript:alert(1)')).toBe(false);
    expect(isSafeHref('java\tscript:alert(1)')).toBe(false);
    expect(isSafeHref('tel:123')).toBe(false);
    expect(isSafeHref('')).toBe(false);
  });
});
