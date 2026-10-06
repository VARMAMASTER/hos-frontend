// Where the highlight is used: a second accent beside the brand, modest and deliberate. Each use
// reaches it through a token utility (nova-highlight-*) or a highlight colour utility, and none
// carries state by colour alone: a marker glyph, a word, a shape or an ARIA state says the same.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { Avatar } from './avatar/avatar';
import { Banner } from './banner/banner';
import { ButtonGroup, ButtonGroupItem } from './button-group/button-group';
import { ChoiceCard } from './choice-card/choice-card';
import { Chip } from './chip/chip';
import { DataTable } from './data-table/data-table';
import { KpiTile } from './kpi-tile/kpi-tile';
import { StatGauge } from './stat-gauge/stat-gauge';
import { Tab, TabList, TabPanel, Tabs } from './tabs/tabs';
import { Tag } from './tag/tag';
import { Timeline } from './timeline/timeline';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const classesOf = (element: Element | null) =>
  Array.from(element?.classList ?? []);

describe('StatGauge', () => {
  // The prototype's .sb-bar fill, extended: brand into highlight on a light or dark panel.
  it('fills its bar brand into highlight', () => {
    render(<StatGauge label="Beds occupied" value={42} max={60} />);
    const fill = screen.getByRole('meter').firstElementChild;
    expect(classesOf(fill)).toContain('nova-highlight-grad');
    expect(classesOf(fill)).not.toContain('nova-bar-grad');
  });
});

describe('Tabs', () => {
  it('underlines the active tab with the highlight gradient, and only the active tab', () => {
    render(
      <Tabs defaultValue="claims">
        <TabList aria-label="Admission">
          <Tab value="overview">Overview</Tab>
          <Tab value="claims">Claims</Tab>
        </TabList>
        <TabPanel value="overview">Overview panel</TabPanel>
        <TabPanel value="claims">Claims panel</TabPanel>
      </Tabs>,
    );
    const active = screen.getByRole('tab', { name: 'Claims' });
    const indicator = active.querySelector('[data-slot="indicator"]');
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    expect(classesOf(indicator)).toContain('nova-highlight-grad');
    expect(
      screen
        .getByRole('tab', { name: 'Overview' })
        .querySelector('[data-slot="indicator"]'),
    ).toBeNull();
    // The state is still the raised chip and aria-selected, not the colour of the underline.
    expect(active.getAttribute('aria-selected')).toBe('true');
  });
});

describe('KpiTile', () => {
  it('takes a highlight edge and a gradient figure when highlighted', () => {
    render(
      <KpiTile
        highlight
        label="Collections today"
        value="₹4.2L"
        data-testid="tile"
      />,
    );
    const tile = screen.getByTestId('tile');
    expect(tile.dataset['highlight']).toBe('true');
    expect(classesOf(tile)).toContain(
      '[--nova-data-edge:var(--nova-gradient-highlight-edge)]',
    );
    expect(classesOf(tile)).not.toContain(
      '[--nova-data-edge:var(--nova-gradient-edge-kpi)]',
    );
    expect(classesOf(screen.getByText('₹4.2L'))).toContain(
      'nova-highlight-text',
    );
  });

  it('keeps the plain KPI edge and ink figure otherwise', () => {
    render(<KpiTile label="Beds free" value="14" data-testid="tile" />);
    expect(screen.getByTestId('tile').dataset['highlight']).toBeUndefined();
    expect(
      screen.getByTestId('tile').querySelector('.nova-highlight-text'),
    ).toBeNull();
  });
});

describe('Chip and Tag', () => {
  it('a highlight chip is the soft wash with deep ink and a marker glyph, so it is never colour alone', () => {
    render(<Chip tone="highlight">New</Chip>);
    const chip = screen.getByText('New');
    expect(chip.dataset['tone']).toBe('highlight');
    expect(classesOf(chip)).toEqual(
      expect.arrayContaining(['nova-highlight-wash', 'text-highlight-deep']),
    );
    const mark = chip.querySelector('[data-slot="highlight-mark"]');
    expect(mark).not.toBeNull();
    expect(mark?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("a highlight chip's own icon replaces the marker", () => {
    render(
      <Chip tone="highlight" icon={<svg data-testid="own" />}>
        Featured
      </Chip>,
    );
    const chip = screen.getByText('Featured');
    expect(within(chip).getByTestId('own')).toBeTruthy();
    expect(chip.querySelector('[data-slot="highlight-mark"]')).toBeNull();
  });

  it.each([
    ['solid', ['nova-highlight-wash', 'text-highlight-deep']],
    ['outline', ['border', 'border-highlight', 'text-highlight-deep']],
  ] as const)(
    'a %s highlight tag carries the marker glyph',
    (variant, classes) => {
      render(
        <Tag variant={variant} tone="highlight">
          Beta
        </Tag>,
      );
      const tag = screen.getByText('Beta');
      expect(classesOf(tag)).toEqual(expect.arrayContaining([...classes]));
      expect(tag.querySelector('[data-slot="highlight-mark"]')).not.toBeNull();
    },
  );
});

describe('Banner', () => {
  it('a highlight announcement waits its turn, on the wash, with the highlight edge and its own glyph', () => {
    render(<Banner tone="highlight" title="New in this release" />);
    const banner = screen.getByRole('status');
    expect(banner.dataset['tone']).toBe('highlight');
    expect(classesOf(banner)).toEqual(
      expect.arrayContaining([
        'nova-highlight-wash',
        'text-highlight-deep',
        'nova-highlight-edge',
        'relative',
      ]),
    );
    expect(banner.querySelector('[data-slot="highlight-mark"]')).not.toBeNull();
  });
});

describe('ChoiceCard', () => {
  // The edge rides on the tint overlay, which fades in when the card is chosen; the radio dot or
  // tick says the same without colour.
  it('fades a highlight edge in with the chosen tint', () => {
    const { container } = render(
      <ChoiceCard name="admission" value="planned" title="Planned" />,
    );
    const tint = container.querySelector('[data-slot="tint"]');
    expect(classesOf(tint)).toEqual(
      expect.arrayContaining([
        'nova-highlight-edge',
        'opacity-0',
        'group-has-checked:opacity-100',
      ]),
    );
  });
});

describe('ButtonGroup', () => {
  it('rings the selected segment with the highlight edge, and hovers an unselected one to the highlight', () => {
    render(
      <ButtonGroup aria-label="View" defaultValue="day">
        <ButtonGroupItem value="day">Day</ButtonGroupItem>
        <ButtonGroupItem value="week">Week</ButtonGroupItem>
      </ButtonGroup>,
    );
    // No layout here, so the segment fills itself and carries the edge.
    expect(classesOf(screen.getByRole('radio', { name: 'Day' }))).toEqual(
      expect.arrayContaining(['relative', 'nova-highlight-edge']),
    );
    const week = classesOf(screen.getByRole('radio', { name: 'Week' }));
    expect(week).not.toContain('nova-highlight-edge');
    expect(week).toContain('hover:border-highlight-hover');
  });

  it('hands the edge to the sliding indicator once it is drawn', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(60);
    const { container } = render(
      <ButtonGroup aria-label="View" defaultValue="day">
        <ButtonGroupItem value="day">Day</ButtonGroupItem>
        <ButtonGroupItem value="week">Week</ButtonGroupItem>
      </ButtonGroup>,
    );
    const indicator = container.querySelector('[data-slot="indicator"]');
    expect(classesOf(indicator)).toContain('nova-highlight-edge');
    expect(classesOf(screen.getByRole('radio', { name: 'Day' }))).not.toContain(
      'nova-highlight-edge',
    );
  });

  it('rings a pressed toggle in a multiple group, beside its tick', () => {
    render(
      <ButtonGroup aria-label="Filters" type="multiple" defaultValue={['icu']}>
        <ButtonGroupItem value="icu">ICU</ButtonGroupItem>
        <ButtonGroupItem value="ward">Ward</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(classesOf(screen.getByRole('button', { name: 'ICU' }))).toContain(
      'nova-highlight-edge',
    );
    expect(
      classesOf(screen.getByRole('button', { name: 'Ward' })),
    ).not.toContain('nova-highlight-edge');
  });
});

describe('DataTable', () => {
  interface Row {
    id: string;
    name: string;
  }
  const rows: Row[] = [
    { id: 'a', name: 'Ramesh' },
    { id: 'b', name: 'Asha' },
  ];
  const renderTable = () =>
    render(
      <DataTable<Row>
        caption="Patients"
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        selectable
        columns={[
          {
            id: 'name',
            header: 'Name',
            accessor: (row) => row.name,
            sortable: true,
          },
        ]}
      />,
    );

  it('marks a selected row with the highlight rail on its first cell, beside the checked box', () => {
    renderTable();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Ramesh' }));
    const [first, second] = screen
      .getAllByRole('row')
      .filter((row) => row.hasAttribute('data-row'));
    expect(first?.getAttribute('aria-selected')).toBe('true');
    expect(classesOf(first?.firstElementChild ?? null)).toContain(
      'nova-highlight-rail',
    );
    expect(classesOf(second?.firstElementChild ?? null)).not.toContain(
      'nova-highlight-rail',
    );
  });

  it('marks the sorted column header with a highlight underline and a deep-ink arrow', () => {
    renderTable();
    const header = () => screen.getByRole('button', { name: /Name/ });
    expect(header().querySelector('[data-slot="sort-marker"]')).toBeNull();
    fireEvent.click(header());
    const marker = header().querySelector('[data-slot="sort-marker"]');
    expect(classesOf(marker)).toContain('nova-highlight-grad');
    expect(marker?.getAttribute('aria-hidden')).toBe('true');
    expect(classesOf(header().querySelector('[data-sort="asc"]'))).toContain(
      'text-highlight-deep',
    );
  });
});

describe('Timeline', () => {
  it('draws a milestone node in the highlight, with its own glyph and the word "Milestone"', () => {
    render(
      <Timeline
        items={[
          { id: 'm', title: 'Discharged home', milestone: true },
          { id: 'n', title: 'Vitals recorded' },
        ]}
      />,
    );
    const [milestone, plain] = screen.getAllByRole('listitem');
    const node = milestone?.querySelector('[data-marker]');
    expect((node as HTMLElement | null)?.dataset['milestone']).toBe('true');
    expect(classesOf(node ?? null)).toEqual(
      expect.arrayContaining([
        'border-highlight',
        'bg-highlight-soft',
        'text-highlight-deep',
      ]),
    );
    expect(node?.querySelector('[data-slot="highlight-mark"]')).not.toBeNull();
    expect(
      within(milestone as HTMLElement).getByText('Milestone'),
    ).toBeTruthy();
    expect(
      (plain?.querySelector('[data-marker]') as HTMLElement | null)?.dataset[
        'milestone'
      ],
    ).toBeUndefined();
  });
});

describe('Avatar', () => {
  it('rings a highlighted avatar and says why, when told', () => {
    render(
      <Avatar
        name="Asha Rao"
        highlight
        highlightLabel="On call"
        data-testid="a"
      />,
    );
    expect(classesOf(screen.getByTestId('a'))).toContain('nova-highlight-ring');
    expect(screen.getByText('On call')).toBeTruthy();
  });

  it('draws no ring by default', () => {
    render(<Avatar name="Asha Rao" data-testid="a" />);
    expect(classesOf(screen.getByTestId('a'))).not.toContain(
      'nova-highlight-ring',
    );
  });
});
