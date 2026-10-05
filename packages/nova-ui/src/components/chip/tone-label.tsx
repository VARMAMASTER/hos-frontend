import { AiBadge } from '../ai-badge/ai-badge';
import { Chip, TONE_WORDS, type ChipTone } from './chip';

export interface ToneLabelProps {
  tone: ChipTone;
  className?: string;
}

// The visible word for a tone, as a chip: what lets an event history or a feed survive colour
// blindness and greyscale print. AI is the AI badge (the spark and the word), so it is told apart
// from every status by shape and label as well as colour. Neutral renders nothing.
export function ToneLabel({ tone, className }: ToneLabelProps) {
  const word = TONE_WORDS[tone];
  if (word === null) return null;
  if (tone === 'ai') return <AiBadge label={word} className={className} />;
  return (
    <Chip tone={tone} className={className}>
      {word}
    </Chip>
  );
}
