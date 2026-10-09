import type { ReactNode } from 'react';
import { Card, CardBody, CardFooter, CardHeader, Text, cx } from '@hos/nova-ui';

export interface SectionProps {
  // The card's heading, and the name of its region.
  title: string;
  description?: ReactNode;
  // Controls and chips in the header's right corner.
  actions?: ReactNode;
  // A line under the body ("Every point is a result already in her record").
  footnote?: ReactNode;
  // A strip of colour on the left edge for a section that needs attention. Never the only cue: the
  // title and its words say why.
  attention?: boolean;
  className?: string;
  children?: ReactNode;
}

// One card of a Patient record tab (the prototype's .card with .card-h and .card-b): a titled
// region, so a screen reader can jump between sections by name.
export function Section({
  title,
  description,
  actions,
  footnote,
  attention = false,
  className,
  children,
}: SectionProps) {
  return (
    <Card
      role="region"
      aria-label={title}
      className={cx(attention && 'border-l-rail border-l-crit', className)}
    >
      <CardHeader
        title={title}
        headingLevel={3}
        description={description}
        actions={actions}
      />
      <CardBody>{children}</CardBody>
      {footnote ? (
        <CardFooter>
          <Text as="span" size="sm" tone="muted">
            {footnote}
          </Text>
        </CardFooter>
      ) : null}
    </Card>
  );
}
