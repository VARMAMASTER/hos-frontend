import {
  Box,
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
import type { ReferralOut } from '../../data';
import { Prose } from '../../ui';

interface ReferralsOutProps {
  rows: ReferralOut[];
  note: string;
}

// The prototype's "Referrals out — last 30 days": who the doctor sent, and whether anything came
// back. The reply is a word and a mark, so an open referral is not only a colour. HOS will not chase
// a consultant on the doctor's behalf; it keeps saying that no reply has arrived.
export function ReferralsOutCard({ rows, note }: ReferralsOutProps) {
  const open = rows.filter((row) => row.reply.state === 'none').length;
  return (
    <Card>
      <CardHeader
        title="Referrals out — last 30 days"
        description="Who you sent, and whether anything came back"
        actions={
          open > 0 ? (
            <Chip tone="warn" icon="⚠">
              {open} with no reply
            </Chip>
          ) : undefined
        }
      />
      <CardBody>
        <Stack gap="s4">
          <Table caption="Referrals out — last 30 days">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Reply</TableHeaderCell>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>To</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.reply.state === 'none' ? (
                      <Chip tone="crit" icon="⚠">
                        {row.reply.text}
                      </Chip>
                    ) : (
                      <Chip tone="good" icon="✓">
                        {row.reply.text}
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Text as="span" weight="semibold">
                      {row.patient}
                    </Text>
                    {row.patientNote ? (
                      <Text as="span" size="xs" font="mono" tone="muted">
                        {' '}
                        {row.patientNote}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.to}</TableCell>
                  <TableCell mono>{row.sent}</TableCell>
                  <TableCell>
                    <Text size="xs" tone="muted">
                      {row.reason}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box className="text-caption text-ink-2">
            <Prose text={note} />
          </Box>
        </Stack>
      </CardBody>
    </Card>
  );
}
