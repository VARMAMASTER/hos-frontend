import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cx } from '../../primitives/cx';
import { useControllableState } from '../../primitives/use-controllable-state';
import { VisuallyHidden } from '../../primitives/visually-hidden';
import {
  ActivityFeed,
  type ActivityFeedItem,
} from '../activity-feed/activity-feed';
import { Chip, type ChipTone } from '../chip/chip';
import { Select } from '../select/select';

// How a person resolved what the AI did. Nothing an AI drafts is final until a person says so.
export type AiResolutionState =
  | 'approved'
  | 'pending'
  | 'escalated'
  | 'rejected';

export const AI_RESOLUTION_STATES: readonly AiResolutionState[] = [
  'approved',
  'pending',
  'escalated',
  'rejected',
];

export interface AiAction {
  id: string;
  // The AI worker that acted: "WhatsApp Assistant".
  agent: string;
  // What it did, in the caller's words and language.
  body: ReactNode;
  // A string ("09:42 AM") or a <time> element.
  time: ReactNode;
  resolution: AiResolutionState;
  // The chip's words, naming who and how fast: "Confirmed by Swapna", "Approved in 40s". Defaults to
  // the state's own word.
  resolutionLabel?: string;
  // The language of the body (te, hi, en).
  lang?: string;
}

export interface AiActionFeedLabels {
  agentFilter: string;
  allAgents: string;
  resolutionFilter: string;
  allResolutions: string;
  resolution: Record<AiResolutionState, string>;
  empty: string;
  // The polite announcement for a new entry. Agent and resolution only, never the body.
  newAction: (agent: string, resolution: string) => string;
}

export const AI_ACTION_FEED_LABELS: Readonly<AiActionFeedLabels> = {
  agentFilter: 'Agent',
  allAgents: 'All agents',
  resolutionFilter: 'Resolution',
  allResolutions: 'All resolutions',
  resolution: {
    approved: 'Approved',
    pending: 'Draft — awaiting approval',
    escalated: 'Escalated',
    rejected: 'Rejected',
  },
  empty: 'No AI actions match these filters',
  newAction: (agent, resolution) => `New AI action: ${agent}, ${resolution}`,
};

export interface AiActionFeedProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // Newest first, as they should read.
  actions: readonly AiAction[];
  // null is every agent. Controlled when given.
  agentFilter?: string | null;
  defaultAgentFilter?: string | null;
  onAgentFilterChange?: (agent: string | null) => void;
  resolutionFilter?: AiResolutionState | null;
  defaultResolutionFilter?: AiResolutionState | null;
  onResolutionFilterChange?: (resolution: AiResolutionState | null) => void;
  // The two filter selects. On by default.
  showFilters?: boolean;
  labels?: Partial<Omit<AiActionFeedLabels, 'resolution'>> & {
    resolution?: Partial<Record<AiResolutionState, string>>;
  };
}

const tones: Record<AiResolutionState, ChipTone> = {
  approved: 'good',
  pending: 'ai',
  escalated: 'warn',
  rejected: 'crit',
};

const glyph = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

// A shape per resolution, so the chip reads in greyscale too: a tick, a clock, an upward arrow, a
// cross. The chip's words carry the meaning.
function ResolutionIcon({ state }: { state: AiResolutionState }) {
  if (state === 'approved') {
    return (
      <svg {...glyph}>
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    );
  }
  if (state === 'pending') {
    return (
      <svg {...glyph}>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6v4l2.5 2" />
      </svg>
    );
  }
  if (state === 'escalated') {
    return (
      <svg {...glyph}>
        <path d="M10 16V4M5 9l5-5 5 5" />
      </svg>
    );
  }
  return (
    <svg {...glyph}>
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </svg>
  );
}

const EMPTY = '';

// "Everything your AI did today": the prototype's overview feed (10-ai-workforce.html). Built on
// ActivityFeed, so it is the same opaque data list: each row is an AI row (the spark marker and the AI
// badge), the time, the agent in the AI ink, the human-resolution chip ("Confirmed by Swapna", "Draft
// — awaiting approval", "Escalated", "Rejected"), and the body. Filters by agent and by resolution,
// and announces new entries politely by agent and resolution, never their content.
export function AiActionFeed({
  actions,
  agentFilter,
  defaultAgentFilter = null,
  onAgentFilterChange,
  resolutionFilter,
  defaultResolutionFilter = null,
  onResolutionFilterChange,
  showFilters = true,
  labels,
  className,
  ...rest
}: AiActionFeedProps) {
  const words = {
    ...AI_ACTION_FEED_LABELS,
    ...labels,
    resolution: { ...AI_ACTION_FEED_LABELS.resolution, ...labels?.resolution },
  };
  const [agent, setAgent] = useControllableState<string | null>({
    value: agentFilter,
    defaultValue: defaultAgentFilter,
    onChange: onAgentFilterChange,
  });
  const [resolution, setResolution] =
    useControllableState<AiResolutionState | null>({
      value: resolutionFilter,
      defaultValue: defaultResolutionFilter,
      onChange: onResolutionFilterChange,
    });

  const chipText = (action: AiAction) =>
    action.resolutionLabel ?? words.resolution[action.resolution];
  const matches = (action: AiAction) =>
    (agent === null || action.agent === agent) &&
    (resolution === null || action.resolution === resolution);

  const agents = useMemo(
    () =>
      [...new Set(actions.map((action) => action.agent))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [actions],
  );

  // New entries are the ids not seen before; the first render only takes note of what is there.
  const seen = useRef<Set<string> | null>(null);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(actions.map((action) => action.id));
      return;
    }
    const known = seen.current;
    const fresh = actions.filter((action) => !known.has(action.id));
    for (const action of fresh) known.add(action.id);
    const heard = fresh.filter(matches);
    if (heard.length > 0) {
      setAnnouncement(
        heard
          .map((action) => words.newAction(action.agent, chipText(action)))
          .join('; '),
      );
    }
    // Only a change of the list is news; a change of filter is not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);

  const items: ActivityFeedItem[] = actions.filter(matches).map((action) => ({
    id: action.id,
    time: action.time,
    tone: 'ai',
    title: (
      <>
        <span
          data-agent=""
          className="font-display text-label font-semibold text-ai-deep"
        >
          {action.agent}
        </span>
        <Chip
          tone={tones[action.resolution]}
          data-resolution={action.resolution}
          icon={<ResolutionIcon state={action.resolution} />}
        >
          {chipText(action)}
        </Chip>
      </>
    ),
    detail: (
      <span lang={action.lang} className="font-normal">
        {action.body}
      </span>
    ),
  }));

  return (
    <div className={cx('flex flex-col gap-s5', className)} {...rest}>
      {showFilters ? (
        <div className="flex flex-wrap items-end gap-s5">
          <Select
            label={words.agentFilter}
            className="min-w-(--nova-ai-column-min-w)"
            value={agent ?? EMPTY}
            onChange={(event) => setAgent(event.target.value || null)}
            options={[
              { value: EMPTY, label: words.allAgents },
              ...agents.map((name) => ({ value: name, label: name })),
            ]}
          />
          <Select
            label={words.resolutionFilter}
            className="min-w-(--nova-ai-column-min-w)"
            value={resolution ?? EMPTY}
            onChange={(event) =>
              setResolution(
                (event.target.value as AiResolutionState | '') || null,
              )
            }
            options={[
              { value: EMPTY, label: words.allResolutions },
              ...AI_RESOLUTION_STATES.map((state) => ({
                value: state,
                label: words.resolution[state],
              })),
            ]}
          />
        </div>
      ) : null}
      <ActivityFeed
        data-ai-action-feed=""
        items={items}
        emptyMessage={words.empty}
      />
      <VisuallyHidden role="status" data-feed-live="">
        {announcement}
      </VisuallyHidden>
    </div>
  );
}
