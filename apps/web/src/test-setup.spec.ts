import { getConfig } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Module tabs load their data asynchronously and render a lot, so under a full workspace run an
// update can take well over a second. Testing Library's default wait (1s) then fails a test that is
// correct; the shared setup gives every module spec the same, realistic wait instead.
describe('the web app test setup', () => {
  it('waits up to 5 seconds for the screen to update', () => {
    expect(getConfig().asyncUtilTimeout).toBeGreaterThanOrEqual(5000);
  });
});
