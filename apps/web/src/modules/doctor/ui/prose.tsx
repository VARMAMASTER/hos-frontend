import { SafeMarkdown } from '@hos/nova-ui';

export interface ProseProps {
  // Lines separated by a newline are separate paragraphs; **bold** marks the values that matter.
  text: string;
  lang?: string;
  className?: string;
}

// Text from the data layer, rendered safely (Nova's SafeMarkdown: bold and emphasis only, no HTML).
export function Prose({ text, lang, className }: ProseProps) {
  return (
    <SafeMarkdown
      text={text.split('\n').join('\n\n')}
      lang={lang}
      className={className}
    />
  );
}
