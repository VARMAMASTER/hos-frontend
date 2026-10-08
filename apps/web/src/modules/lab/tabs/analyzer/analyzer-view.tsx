import { Card } from '@hos/nova-ui';
import type { AnalyzerWidgetProps } from './types';

export function AnalyzerWidget({
  patientId,
  compactMode,
  className,
}: AnalyzerWidgetProps) {
  return (
    <Card
      className={className}
      data-patient-id={patientId}
      data-compact={compactMode ? 'true' : undefined}
    >
      <div className="p-s4">
        <h3 className="text-h3 font-semibold mb-s2">Analyser Interface</h3>
        <p className="text-body text-ink-2">Curated workflow for Analyser Interface.</p>
      </div>
    </Card>
  );
}
