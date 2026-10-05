import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Card, CardBody, CardHeader } from './card';

afterEach(() => cleanup());

describe('Card', () => {
  it('renders its title as an h2 by default, with description, actions and body', () => {
    render(
      <Card>
        <CardHeader
          title="Claims in flight"
          description="Every scheme's own clock"
          actions={<button type="button">File</button>}
        />
        <CardBody>3 claims</CardBody>
      </Card>,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Claims in flight' }),
    ).toBeTruthy();
    expect(screen.getByText("Every scheme's own clock")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'File' })).toBeTruthy();
    expect(screen.getByText('3 claims')).toBeTruthy();
  });

  it('renders the title at the requested heading level', () => {
    render(<CardHeader title="Nested" headingLevel={3} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Nested' }),
    ).toBeTruthy();
  });
});
