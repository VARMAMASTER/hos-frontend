import { Card } from '@hos/nova-ui';
import type { ComposerWidgetProps } from './types';

export function ComposerWidget({
  patientId,
  compactMode,
  className,
}: ComposerWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Bill Composer</h3>
        <p className="text-body text-ink-2">Curated workflow for Bill Composer.</p>
      </div>
    </Card>
  );
}
