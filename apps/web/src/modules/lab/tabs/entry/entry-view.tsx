import { Card } from '@hos/nova-ui';
import type { EntryWidgetProps } from './types';

export function EntryWidget({
  patientId,
  compactMode,
  className,
}: EntryWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Result Entry</h3>
        <p className="text-body text-ink-2">Curated workflow for Result Entry.</p>
      </div>
    </Card>
  );
}
