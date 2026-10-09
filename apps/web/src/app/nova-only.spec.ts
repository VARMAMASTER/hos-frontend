// @vitest-environment node
// The app shell is Nova only, as the modules are: the react/forbid-elements rule (eslint.config.mjs)
// covers apps/web/src/app and main.tsx. This runs the app's real ESLint config over planted fixtures,
// so the rule cannot silently stop applying here.
import { ESLint } from 'eslint';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const webDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const eslint = new ESLint({ cwd: webDir });

async function forbidden(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, {
    filePath: join(webDir, filePath),
  });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === 'react/forbid-elements')
    .map((message) => message.message);
}

const RAW = `export function Fixture() {
  return (
    <div>
      <span>Ramesh</span>
      <p>Ward 3</p>
      <h1>Doctor</h1>
      <button type="button">Admit</button>
    </div>
  );
}
`;

const NOVA = `import { Box, Button, Heading, Text } from '@hos/nova-ui';

export function Fixture() {
  return (
    <Box>
      <Text as="span">Ramesh</Text>
      <Heading level="h1">Doctor</Heading>
      <Button>Admit</Button>
    </Box>
  );
}
`;

describe('the app shell is Nova only (react/forbid-elements)', () => {
  it.each(['src/app/fixture.tsx', 'src/main.tsx'])(
    'refuses raw div, span, p, h1 and button in %s',
    async (path) => {
      const messages = await forbidden(RAW, path);
      expect(messages).toHaveLength(5);
      expect(messages.join('\n')).toMatch(/<Button>/);
      expect(messages.join('\n')).toMatch(/<Box>/);
    },
    60_000,
  );

  it('accepts the same screen built from Nova components', async () => {
    expect(await forbidden(NOVA, 'src/app/fixture.tsx')).toEqual([]);
  }, 60_000);

  it('still holds a module tab to the rule', async () => {
    const messages = await forbidden(
      RAW,
      'src/modules/doctor/tabs/queue/fixture.tsx',
    );
    // div, span, p and h1; a module may still use a raw button, as before.
    expect(messages).toHaveLength(4);
  }, 60_000);
});
