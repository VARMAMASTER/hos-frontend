import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  type ChipTone,
} from '@hos/nova-ui';
import type {
  CallCampaign,
  CallLogEntry,
  CallOutcomeTone,
  CallQueueEntry,
} from '../../data';

export interface CampaignsTableProps {
  campaigns: CallCampaign[];
  note: string;
  // Switches a campaign on or off.
  onToggle: (campaign: CallCampaign, running: boolean) => void;
}

// The prototype's "Outbound campaigns": what the agent dialled without anyone at the front desk
// lifting a handset, each with a switch a person can turn off.
export function CampaignsTable({
  campaigns,
  note,
  onToggle,
}: CampaignsTableProps) {
  return (
    <Card>
      <CardHeader
        title="Outbound campaigns"
        description="Autonomous — these dialled without anyone at the front desk lifting a handset"
      />
      <CardBody>
        <Stack gap="s4">
          <Table caption="Outbound campaigns">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell align="right">Called</TableHeaderCell>
                <TableHeaderCell>Outcome</TableHeaderCell>
                <TableHeaderCell>Language mix</TableHeaderCell>
                <TableHeaderCell align="right">Minutes</TableHeaderCell>
                <TableHeaderCell align="right">Cost</TableHeaderCell>
                <TableHeaderCell>Running</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Stack gap="none">
                      <Text as="span" weight="semibold">
                        {campaign.name}
                      </Text>
                      <Text as="span" size="xs" tone="muted">
                        {campaign.detail}
                      </Text>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{campaign.called}</TableCell>
                  <TableCell>
                    <Text as="span" size="sm" tone="muted">
                      {campaign.outcome}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text as="span" size="sm" tone="muted">
                      {campaign.languages}
                    </Text>
                  </TableCell>
                  <TableCell align="right">
                    <Text as="span" font="mono">
                      {campaign.minutes}
                    </Text>
                  </TableCell>
                  <TableCell align="right">
                    <Text as="span" font="mono">
                      {campaign.cost}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={campaign.running}
                      onCheckedChange={(on) => onToggle(campaign, on)}
                      label={
                        <>
                          <Text as="span" className="sr-only">
                            {campaign.name}
                          </Text>{' '}
                          {campaign.running ? 'running' : 'paused'}
                        </>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Text size="sm" tone="muted">
            {note}
          </Text>
        </Stack>
      </CardBody>
    </Card>
  );
}

export interface CallQueueProps {
  queue: CallQueueEntry[];
  queuing: string | null;
  onCall: (entry: CallQueueEntry) => void;
}

const LANGUAGE_TONE: Record<CallQueueEntry['languageCode'], ChipTone> = {
  te: 'info',
  hi: 'info',
  en: 'neutral',
};

// "Next in the call queue": the patients the agent would ring, in the language on their record. A
// number on do-not-call is shown, and blocked.
export function CallQueue({ queue, queuing, onCall }: CallQueueProps) {
  return (
    <Card>
      <CardHeader
        title="Next in the call queue"
        description="Language comes from the patient record"
      />
      <CardBody>
        <Stack as="ul" gap="s4" aria-label="Next in the call queue">
          {queue.map((entry) => (
            <li key={entry.id}>
              <Stack
                direction="horizontal"
                align="center"
                justify="between"
                gap="s3"
                wrap
              >
                <Stack gap="none" className="min-w-0 flex-1">
                  <Text as="span" weight="semibold">
                    {entry.patientName}
                    <Text as="span" size="xs" tone="muted">
                      {` · ${entry.ageSex}`}
                    </Text>
                  </Text>
                  <Text as="span" size="sm" tone="muted">
                    {entry.why}
                  </Text>
                </Stack>
                {entry.doNotCall ? (
                  <>
                    <Chip tone="crit" icon="✕">
                      Do not call
                    </Chip>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      aria-label={`Blocked — ${entry.patientName} is on do-not-call`}
                    >
                      Blocked
                    </Button>
                  </>
                ) : (
                  <>
                    <Chip tone={LANGUAGE_TONE[entry.languageCode]}>
                      <Text as="span" lang={entry.languageCode}>
                        {entry.language}
                      </Text>
                    </Chip>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={queuing === entry.id}
                      aria-label={`Call ${entry.patientName} now`}
                      onClick={() => onCall(entry)}
                    >
                      Call now
                    </Button>
                  </>
                )}
              </Stack>
            </li>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
}

const OUTCOME_ICON: Record<CallOutcomeTone, string | undefined> = {
  good: '✓',
  warn: '!',
  crit: '⚠',
  neutral: undefined,
};

// The call log: no answer, wrong numbers and do-not-call are outcomes, not omissions.
export function CallLog({ log }: { log: CallLogEntry[] }) {
  return (
    <Card>
      <CardHeader
        title="Call log — the failures too"
        description="Last 10 of today's 41 · no answer, wrong numbers and do-not-call are outcomes, not omissions"
      />
      <CardBody>
        <Table caption="Call log — the failures too">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Outcome</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell>Direction</TableHeaderCell>
              <TableHeaderCell>Patient / number</TableHeaderCell>
              <TableHeaderCell>What it was about</TableHeaderCell>
              <TableHeaderCell>Lang</TableHeaderCell>
              <TableHeaderCell align="right">Duration</TableHeaderCell>
              <TableHeaderCell align="right">Cost</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {log.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Chip
                    tone={entry.outcomeTone}
                    icon={OUTCOME_ICON[entry.outcomeTone]}
                  >
                    {entry.outcome}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Text as="span" font="mono" size="sm">
                    {entry.time}
                  </Text>
                </TableCell>
                <TableCell>{entry.direction}</TableCell>
                <TableCell>
                  <Text as="span">{entry.who}</Text>
                  <Text as="span" size="xs" tone="muted">
                    {` · ${entry.whoDetail}`}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text as="span" size="sm" tone="muted">
                    {entry.about}
                  </Text>
                </TableCell>
                <TableCell>{entry.language}</TableCell>
                <TableCell align="right">
                  <Text as="span" font="mono">
                    {entry.duration}
                  </Text>
                </TableCell>
                <TableCell align="right">
                  <Text as="span" font="mono">
                    {entry.cost}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
