import { useState } from 'react';
import {
  AiMark,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hos/nova-ui';
import type { NoteRow } from '../../data';

interface NotesQueueProps {
  rows: NoteRow[];
  // The note currently open below the table.
  openId: string | null;
  onOpen: (noteId: string) => void;
}

const awaiting = (row: NoteRow) =>
  row.state === 'ready' || row.state === 'blocked';

// What the draft column says about a note: an AI draft (with the AI mark), a blocked one (with a warning
// mark), or how the doctor settled it. Words and a mark, never colour alone.
function DraftState({ row }: { row: NoteRow }) {
  if (row.state === 'filed') {
    return (
      <Chip tone="good" icon="✓">
        Filed
      </Chip>
    );
  }
  if (row.state === 'rejected') {
    return (
      <Chip tone="crit" icon="✕">
        Rejected
      </Chip>
    );
  }
  if (row.state === 'blocked') {
    return (
      <Chip tone="warn" icon="⚠">
        {row.draftLabel}
      </Chip>
    );
  }
  return (
    <Chip tone="ai" icon={<AiMark />}>
      {row.draftLabel}
    </Chip>
  );
}

// The prototype's "Awaiting your signature" (#notesQueue): the action sits in the first cell with the
// patient it belongs to, so it is never off-screen on a phone.
export function NotesQueue({ rows, openId, onOpen }: NotesQueueProps) {
  const [explained, setExplained] = useState(false);
  const waiting = rows.filter(awaiting).length;
  return (
    <Card>
      <CardHeader
        title="Awaiting your signature"
        description="Nothing here is filed, sent or billed until you sign it"
        actions={<Chip tone="warn">{waiting} awaiting</Chip>}
      />
      <CardBody>
        <Stack gap="s4">
          <Table caption="Notes awaiting your signature">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Draft</TableHeaderCell>
                <TableHeaderCell>Seen for</TableHeaderCell>
                <TableHeaderCell>What you usually change</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Stack gap="s1" align="start">
                      <Text as="span" weight="semibold">
                        {row.patient.name}
                      </Text>
                      <Text as="span" size="xs" font="mono" tone="muted">
                        {[row.patient.token, row.patient.ageSex, row.where]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      {row.state === 'ready' ? (
                        <Button
                          size="sm"
                          variant={openId === row.id ? 'ghost' : 'primary'}
                          aria-label={`Open the note — ${row.patient.name}`}
                          aria-disabled={openId === row.id || undefined}
                          onClick={() => {
                            if (openId !== row.id) onOpen(row.id);
                          }}
                        >
                          {openId === row.id ? '✓ Open below' : 'Open the note'}
                        </Button>
                      ) : null}
                      {row.state === 'blocked' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-expanded={explained}
                          onClick={() => setExplained(!explained)}
                        >
                          Why is it blocked?
                        </Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <DraftState row={row} />
                  </TableCell>
                  <TableCell>{row.seenFor}</TableCell>
                  <TableCell>
                    <Text size="xs" tone="muted">
                      {row.usuallyChange}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {explained ? (
            <Banner tone="warn" title="Her plan is still open">
              Three lenses reviewed her record and disagree — Case Discussion
              has the five questions. A note cannot be signed until the plan has
              been spoken.
            </Banner>
          ) : null}
        </Stack>
      </CardBody>
    </Card>
  );
}
