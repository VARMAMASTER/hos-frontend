import { Card } from '@hos/nova-ui';
import type { NotesWidgetProps } from './types';

export function NotesWidget({
  patientId,
  compactMode,
  className,
}: NotesWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Progress Notes</h3>
        <p className="text-body text-ink-2">Curated workflow for Progress Notes.</p>
      </div>
    </Card>
  );
}
