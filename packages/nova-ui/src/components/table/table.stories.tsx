import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip, type ChipTone } from '../chip/chip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from './table';

const meta = {
  title: 'Components/Table',
  component: Table,
  args: { caption: 'Lab results, 14 Oct' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const flagTones: Record<string, ChipTone> = {
  Normal: 'good',
  High: 'warn',
  Low: 'warn',
  Critical: 'crit',
};

const results = [
  {
    test: 'Haemoglobin',
    value: '13.4',
    unit: 'g/dL',
    range: '12.0 – 15.5',
    flag: 'Normal',
  },
  {
    test: 'White cell count',
    value: '14.2',
    unit: '×10⁹/L',
    range: '4.0 – 11.0',
    flag: 'High',
  },
  {
    test: 'Platelets',
    value: '262',
    unit: '×10⁹/L',
    range: '150 – 400',
    flag: 'Normal',
  },
  {
    test: 'Potassium',
    value: '6.1',
    unit: 'mmol/L',
    range: '3.5 – 5.1',
    flag: 'Critical',
  },
  {
    test: 'Ferritin',
    value: '8',
    unit: 'ng/mL',
    range: '15 – 150',
    flag: 'Low',
  },
];

// Every flag carries its text, so an abnormal result never relies on colour alone.
export const LabResults: Story = {
  render: (args) => (
    <Table {...args}>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Test</TableHeaderCell>
          <TableHeaderCell numeric>Result</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell numeric>Reference range</TableHeaderCell>
          <TableHeaderCell>Flag</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {results.map((row) => (
          <TableRow key={row.test}>
            <TableHeaderCell scope="row">{row.test}</TableHeaderCell>
            <TableCell numeric>{row.value}</TableCell>
            <TableCell>{row.unit}</TableCell>
            <TableCell numeric>{row.range}</TableCell>
            <TableCell>
              <Chip tone={flagTones[row.flag]}>{row.flag}</Chip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// A narrow container: the table scrolls inside its frame, and the frame takes a keyboard tab stop
// so the scroll is reachable without a mouse. The page itself never grows wider.
export const ScrollsInsideItsFrame: Story = {
  args: { caption: 'Vitals, last 12 hours' },
  render: (args) => (
    <div className="max-w-md">
      <Table {...args}>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell numeric>Pulse</TableHeaderCell>
            <TableHeaderCell numeric>BP</TableHeaderCell>
            <TableHeaderCell numeric>Temp</TableHeaderCell>
            <TableHeaderCell numeric>SpO₂</TableHeaderCell>
            <TableHeaderCell numeric>Resp. rate</TableHeaderCell>
            <TableHeaderCell>Recorded by</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {['06:00', '09:00', '12:00', '15:00', '18:00'].map((time, index) => (
            <TableRow key={time}>
              <TableHeaderCell scope="row">{time}</TableHeaderCell>
              <TableCell numeric>{78 + index}</TableCell>
              <TableCell numeric>{118 + index}/76</TableCell>
              <TableCell numeric>{(36.8 + index / 10).toFixed(1)}</TableCell>
              <TableCell numeric>{97 - (index % 2)}%</TableCell>
              <TableCell numeric>{16 + (index % 3)}</TableCell>
              <TableCell className="whitespace-nowrap">Nurse on duty</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
