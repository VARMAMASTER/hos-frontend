import {
  Box,
  Chip,
  FilterChip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  type ChipTone,
} from '@hos/nova-ui';
import type { CodeConfidence, IcdProposal } from '../../data';

// How sure the coder is, in words and a mark (never colour alone).
const CONFIDENCE: Record<
  CodeConfidence,
  { label: string; icon: string; tone: ChipTone }
> = {
  high: { label: 'High', icon: '●', tone: 'good' },
  'needs-you': { label: 'Needs you', icon: '◔', tone: 'warn' },
  low: { label: 'Low', icon: '⚠', tone: 'crit' },
  yours: { label: 'Yours', icon: '✎', tone: 'info' },
};

interface CodeTableProps {
  codes: IcdProposal[];
  confirmed: string[];
  filed: string[];
  onToggle: (code: string, on: boolean) => void;
}

// The prototype's #codeTable. The code and the doctor's call on it live in the same first cell, so
// the decisive value and the action on it travel together and are both visible without scrolling.
// Nothing is confirmed for the doctor: every code starts unconfirmed.
export function CodeTable({
  codes,
  confirmed,
  filed,
  onToggle,
}: CodeTableProps) {
  return (
    <Table caption="ICD-10 codes proposed from your note">
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code &amp; your call</TableHeaderCell>
          <TableHeaderCell>Term</TableHeaderCell>
          <TableHeaderCell>Where in the note it came from</TableHeaderCell>
          <TableHeaderCell>Confidence</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {codes.map((item) => {
          const level = CONFIDENCE[item.confidence];
          return (
            <TableRow key={item.code}>
              <TableCell>
                <Text as="span" font="mono" weight="bold">
                  {item.code}
                </Text>
                <Box className="mt-s2">
                  {filed.includes(item.code) ? (
                    <Chip tone="good" icon="✓">
                      Filed
                    </Chip>
                  ) : (
                    <FilterChip
                      aria-label={`Confirm ${item.code}`}
                      pressed={confirmed.includes(item.code)}
                      onPressedChange={(on) => onToggle(item.code, on)}
                    >
                      Confirm
                    </FilterChip>
                  )}
                </Box>
              </TableCell>
              <TableCell>{item.term}</TableCell>
              <TableCell>
                <Text size="xs" tone="muted">
                  {item.origin}
                </Text>
              </TableCell>
              <TableCell>
                <Chip tone={level.tone} icon={level.icon}>
                  {level.label}
                </Chip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
