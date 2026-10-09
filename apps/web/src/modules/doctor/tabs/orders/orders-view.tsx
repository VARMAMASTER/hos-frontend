import { useState } from 'react';
import { EmptyState, Grid, Stack } from '@hos/nova-ui';
import {
  useDoctorQuery,
  type DoctorDataSource,
  type OrdersOverview,
  type OrderTemplate,
} from '../../data';
import {
  ActionFeedback,
  DoctorTab,
  useFeedback,
  type Feedback,
} from '../../ui';
import { NewOrderCard } from './new-order-card';
import { PrescriptionAssistant } from './prescription-assistant';
import { TemplatesCard } from './templates-card';
import type { OrdersWidgetProps } from './types';

// The prototype's Orders & Rx (03-doctor.html, data-panel="orders"): the order the doctor builds and
// sends, their saved templates, and the prescription assistant. AI suggestions never order or
// prescribe: every box ticked and every dose typed here is the doctor's.
export function OrdersWidget({
  patientId,
  compactMode,
  className,
}: OrdersWidgetProps) {
  const { query, source, reload } = useDoctorQuery((s) => s.getOrders());
  const feedback = useFeedback();
  const orders = query.status === 'ready' ? query.data : null;

  return (
    <DoctorTab
      patientId={patientId}
      compactMode={compactMode}
      className={className}
      title="Orders & Rx"
      description="Order labs and screening, reuse your templates, and write the prescription."
      query={query}
      errorMessage="Could not load orders and prescriptions."
      onRetry={reload}
    >
      {query.status === 'ready' ? (
        orders ? (
          <OrdersDesk
            // A new patient's chart starts a new order.
            key={orders.patient.token}
            orders={orders}
            source={source}
            feedback={feedback}
          />
        ) : (
          <EmptyState
            title="No chart is open to order for"
            description="Open a patient from My Queue. Orders and the prescription assistant are for the patient in your room."
          />
        )
      ) : null}
    </DoctorTab>
  );
}

interface OrdersDeskProps {
  orders: OrdersOverview;
  source: DoctorDataSource;
  feedback: Feedback;
}

function OrdersDesk({ orders, source, feedback }: OrdersDeskProps) {
  // Ticked from the start: only what the doctor already ordered.
  const [selected, setSelected] = useState<string[]>(() =>
    orders.items.filter((item) => item.ordered).map((item) => item.id),
  );
  const [admit, setAdmit] = useState(false);
  const [templates, setTemplates] = useState(orders.templates);

  async function send() {
    let summary = '';
    const ok = await feedback.attempt(async () => {
      const receipt = await source.sendOrder({ itemIds: selected, admit });
      summary = receipt.summary;
    });
    if (ok) {
      feedback.notify({
        title: 'Order sent to Lab & Pharmacy queues',
        detail: `${summary} for ${orders.patient.name} (${orders.patient.token})`,
      });
    }
  }

  function applyTemplate(template: OrderTemplate) {
    setSelected((current) =>
      [...current, ...template.itemIds].filter(
        (id, index, all) => all.indexOf(id) === index,
      ),
    );
    feedback.notify({
      title: `Template applied — ${template.name}`,
      detail: `Labs pre-filled for ${orders.patient.name} (${orders.patient.token}); the dose fields stay blank for you to type.`,
    });
  }

  async function saveTemplate(name: string, specialty: string) {
    const result: { saved?: OrderTemplate } = {};
    const ok = await feedback.attempt(async () => {
      result.saved = await source.saveTemplate({
        name,
        specialty,
        itemIds: selected,
      });
    });
    const { saved } = result;
    if (ok && saved) {
      setTemplates((current) => [...current, saved]);
      feedback.notify({
        title: 'Template saved to your library',
        detail: `${specialty} — available now under Saved templates.`,
      });
    }
    return ok;
  }

  return (
    <Stack gap="s6">
      <ActionFeedback {...feedback.props} />
      <Grid columns={2} gap="s6">
        <NewOrderCard
          orders={orders}
          selected={selected}
          onSelectedChange={setSelected}
          admit={admit}
          onAdmitChange={(on) => {
            setAdmit(on);
            if (!on) {
              feedback.notify({
                tone: 'info',
                title: 'Admission cleared',
                detail: `${orders.patient.name} will continue as OPD.`,
              });
            }
          }}
          onSend={send}
          feedback={feedback}
        />
        <TemplatesCard
          templates={templates}
          onUse={applyTemplate}
          onSave={saveTemplate}
        />
      </Grid>
      <PrescriptionAssistant
        orders={orders}
        source={source}
        feedback={feedback}
      />
    </Stack>
  );
}
