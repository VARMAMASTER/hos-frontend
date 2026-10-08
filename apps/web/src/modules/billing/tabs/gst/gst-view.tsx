import { Card } from '@hos/nova-ui';
import type { GstWidgetProps } from './types';

export function GstWidget({
  patientId,
  compactMode,
  className,
}: GstWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">GST Invoices</h3>
        <p className="text-body text-ink-2">Curated workflow for GST Invoices.</p>
      </div>
    </Card>
  );
}
