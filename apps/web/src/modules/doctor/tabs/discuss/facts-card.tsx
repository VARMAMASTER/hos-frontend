import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@hos/nova-ui';
import type { DiscussOverview } from '../../data';
import { Prose } from '../../ui';

// The prototype's "what her record actually contains": the nine values the discussion turns on, with
// who produced each and when. The decisive value is first, because on a phone the last column falls
// off the edge.
export function FactsCard({ discussion }: { discussion: DiscussOverview }) {
  return (
    <Card>
      <CardHeader
        title={discussion.headline}
        description={discussion.summary}
        actions={<Chip>{discussion.counts}</Chip>}
      />
      <CardBody>
        <Table caption="What her record contains" density="compact">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Value now</TableHeaderCell>
              <TableHeaderCell>What it was before</TableHeaderCell>
              <TableHeaderCell>Who produced it</TableHeaderCell>
              <TableHeaderCell>When</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discussion.facts.map((fact) => (
              <TableRow key={fact.id}>
                <TableCell>
                  <Prose text={fact.value} />
                </TableCell>
                <TableCell>
                  <Text size="sm" font="mono">
                    {fact.before}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text as="span" size="sm">
                    {fact.who}
                  </Text>
                  {fact.viaAbha ? (
                    <Chip tone="info" className="ml-s2">
                      via ABHA
                    </Chip>
                  ) : null}
                </TableCell>
                <TableCell mono>{fact.when}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
