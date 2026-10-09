import { useState } from 'react';
import {
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Stack,
  Switch,
  Text,
  type ChipTone,
} from '@hos/nova-ui';
import type { FactTone, OrderItem, OrdersOverview } from '../../data';
import type { Feedback } from '../../ui';

// A fact of the record as a word and a mark, never colour alone.
const FACTS: Record<FactTone, { icon: string; tone: ChipTone }> = {
  good: { icon: '✓', tone: 'good' },
  warn: { icon: '◔', tone: 'warn' },
  crit: { icon: '⚠', tone: 'crit' },
  neutral: { icon: '○', tone: 'neutral' },
};

interface NewOrderCardProps {
  orders: OrdersOverview;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  admit: boolean;
  onAdmitChange: (admit: boolean) => void;
  // Sends the order the doctor chose; resolves once it has gone (or been refused).
  onSend: () => Promise<void>;
  feedback: Feedback;
}

function ItemGroup({
  legend,
  items,
  selected,
  onToggle,
}: {
  legend: string;
  items: OrderItem[];
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-s3 text-label font-bold uppercase tracking-label text-ink-2">
        {legend}
      </legend>
      <Stack gap="s1">
        {items.map((item) => (
          <Checkbox
            key={item.id}
            checked={selected.includes(item.id)}
            onChange={(event) => onToggle(item.id, event.target.checked)}
            label={
              <>
                {item.name}
                {item.fact ? (
                  <Chip
                    tone={FACTS[item.fact.tone].tone}
                    icon={FACTS[item.fact.tone].icon}
                    className="ml-s2"
                  >
                    {item.fact.text}
                  </Chip>
                ) : null}
              </>
            }
          />
        ))}
      </Stack>
    </fieldset>
  );
}

// The prototype's "New order" (03-doctor.html, .orders-grid): the doctor ticks what to order. The
// chips beside an item state what the record holds (last done, never done) and nothing is ticked
// that the doctor did not already order: surfacing a gap is AMBER, ticking the box is theirs.
export function NewOrderCard({
  orders,
  selected,
  onSelectedChange,
  admit,
  onAdmitChange,
  onSend,
}: NewOrderCardProps) {
  const [sending, setSending] = useState(false);
  const toggle = (id: string, on: boolean) =>
    onSelectedChange(
      on
        ? [...selected, id].filter(
            (value, index, all) => all.indexOf(value) === index,
          )
        : selected.filter((value) => value !== id),
    );

  return (
    <Card role="region" aria-label="New order">
      <CardHeader
        title={`New order — ${orders.patient.name}`}
        description={`Token ${orders.patient.token} · sends directly to Lab & Pharmacy queues`}
      />
      <CardBody>
        <Stack gap="s6">
          <ItemGroup
            legend="Lab"
            items={orders.items.filter((item) => item.group === 'lab')}
            selected={selected}
            onToggle={toggle}
          />
          <ItemGroup
            legend="Imaging & screening"
            items={orders.items.filter((item) => item.group === 'imaging')}
            selected={selected}
            onToggle={toggle}
          />
          <Stack gap="s3">
            <Text size="xs" weight="bold" tone="muted">
              ADMISSION
            </Text>
            <Switch
              label="Admit to ward"
              checked={admit}
              onCheckedChange={onAdmitChange}
            />
            {admit ? (
              <Banner tone="warn" title="Admission flagged">
                A bed request is queued to IPD when you send the order — confirm
                the ward then.
              </Banner>
            ) : null}
          </Stack>
          <Button
            fullWidth
            loading={sending}
            onClick={() => {
              setSending(true);
              void onSend().finally(() => setSending(false));
            }}
          >
            Send order — Lab &amp; Pharmacy
          </Button>
        </Stack>
      </CardBody>
    </Card>
  );
}
