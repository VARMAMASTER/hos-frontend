import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TabPage } from './tab-page';
import { TabHeader } from './tab-header';
import { TabContent } from './tab-content';
import { TabToolbar } from './tab-toolbar';
import { TabKPIStrip } from './tab-kpi-strip';
import { computed } from '../../test/token-css';

afterEach(() => cleanup());

// A resolved var() chain comes back bracketed: (#FFFFFF).
const background = (element: Element) =>
  computed(element, 'background-color').replace(/^\(+|\)+$/g, '');

describe('TabPage and Tab Layout Templates', () => {
  it('renders TabPage with TabHeader and TabContent without raw HTML errors', () => {
    render(
      <TabPage patientId="PT-99" compactMode={false}>
        <TabHeader
          title="Live Queue"
          description="Real-time OPD triage."
          actions={<button type="button">Action</button>}
        />
        <TabContent>
          <div>Content Item</div>
        </TabContent>
      </TabPage>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Live Queue' }),
    ).toBeTruthy();
    expect(screen.getByText('Real-time OPD triage.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
    expect(screen.getByText('Content Item')).toBeTruthy();

    const root = screen
      .getByRole('heading', { level: 2 })
      .closest('[data-patient-id]');
    expect(root?.getAttribute('data-patient-id')).toBe('PT-99');
  });

  it('renders TabToolbar with search and action slots', () => {
    render(
      <TabToolbar
        search={<input aria-label="Search patients" />}
        actions={<button type="button">Filter</button>}
      />,
    );
    expect(
      screen.getByRole('textbox', { name: 'Search patients' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeTruthy();
  });

  it('renders TabKPIStrip with responsive columns', () => {
    render(
      <TabKPIStrip columns={4}>
        <div>KPI 1</div>
        <div>KPI 2</div>
      </TabKPIStrip>,
    );
    expect(screen.getByText('KPI 1')).toBeTruthy();
    expect(screen.getByText('KPI 2')).toBeTruthy();
  });

  it('handles loading state with accessible status indicator', () => {
    render(
      <TabPage loading>
        <div>Should not be visible directly</div>
      </TabPage>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('Should not be visible directly')).toBeNull();
  });

  // jsdom computes no stylesheet, so the colour is resolved from the compiled token layer
  // (test/token-css.ts). An undefined colour class has no background and the panel draws nothing.
  it('draws the toolbar panel on a real token colour (the prototype --panel-2)', () => {
    const { container } = render(
      <TabToolbar actions={<button type="button">Filter</button>} />,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(background(panel)).toBe('#F8F7FD');
  });

  it('draws each loading placeholder block in a token colour that differs from the page', () => {
    render(
      <TabPage loading>
        <div>Hidden</div>
      </TabPage>,
    );
    const page = screen.getByRole('status');
    const pageColour = background(page);
    const blocks = [...page.querySelectorAll('.motion-safe\\:animate-pulse')];
    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      const colour = background(block);
      expect(colour).toMatch(/^#[0-9A-F]{6}$/);
      expect(colour).not.toBe(pageColour);
    }
  });

  it('renders error state with message when error is passed', () => {
    render(
      <TabPage error="Failed to load queue data">
        <div>Content</div>
      </TabPage>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Failed to load queue data')).toBeTruthy();
  });
});
