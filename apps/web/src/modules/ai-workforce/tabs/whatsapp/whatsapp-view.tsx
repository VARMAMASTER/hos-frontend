import { Card } from '@hos/nova-ui';
import type { WhatsappWidgetProps } from './types';

export function WhatsappWidget({
  patientId,
  compactMode,
  className,
}: WhatsappWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">WhatsApp Assistant</h3>
        <p className="text-body text-ink-2">Curated workflow for WhatsApp Assistant.</p>
      </div>
    </Card>
  );
}
