import { Box, Stack, Text } from '@hos/nova-ui';
import { Prose } from './prose';

// The note at the foot of an AI card (the prototype's .tier-note): where the AI got it, and where
// its line is drawn. ✦ marks it as AI, and the words say what it is.
export function TierNote({ text }: { text: string }) {
  return (
    <Stack
      direction="horizontal"
      align="start"
      gap="s3"
      className="mt-s5 border-t border-border pt-s4"
    >
      <Text as="span" aria-hidden="true" tone="muted">
        ✦
      </Text>
      <Box className="min-w-0 text-caption text-ink-2">
        <Prose text={text} />
      </Box>
    </Stack>
  );
}
