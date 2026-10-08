import { Card } from '@hos/nova-ui';
import type { DocumentsWidgetProps } from './types';

export function DocumentsWidget({
  patientId,
  compactMode,
  className,
}: DocumentsWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Documents</h3>
        <p className="text-body text-ink-2">Curated workflow for Documents.</p>
      </div>
    </Card>
  );
}
