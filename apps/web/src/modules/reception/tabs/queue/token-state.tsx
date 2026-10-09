import { Chip, type ChipTone } from '@hos/nova-ui';
import type { TokenState } from '../../data';

// A token's state as a word and a glyph (never colour alone): a clock while waiting, an arrow when
// called to the room, a filled dot with the doctor, a tick once seen.
const STATES: Record<
  TokenState,
  { label: string; icon: string; tone: ChipTone }
> = {
  waiting: { label: 'Waiting', icon: '◷', tone: 'neutral' },
  called: { label: 'Called', icon: '➜', tone: 'info' },
  'in-consultation': { label: 'In consultation', icon: '●', tone: 'good' },
  done: { label: 'Done', icon: '✓', tone: 'neutral' },
};

export interface TokenStateChipProps {
  state: TokenState;
  // Minutes in the hall, said after "Waiting".
  waitingMinutes?: number;
}

export function TokenStateChip({ state, waitingMinutes }: TokenStateChipProps) {
  const { label, icon, tone } = STATES[state];
  return (
    <Chip tone={tone} icon={icon} data-token-state={state}>
      {state === 'waiting' && waitingMinutes !== undefined
        ? `${label} · ${waitingMinutes} min`
        : label}
    </Chip>
  );
}
