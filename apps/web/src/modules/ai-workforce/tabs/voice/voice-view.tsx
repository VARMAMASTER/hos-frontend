import { Card } from '@hos/nova-ui';
import type { VoiceWidgetProps } from './types';

export function VoiceWidget({
  patientId,
  compactMode,
  className,
}: VoiceWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Voice Assistant</h3>
        <p className="text-body text-ink-2">Curated workflow for Voice Assistant.</p>
      </div>
    </Card>
  );
}
