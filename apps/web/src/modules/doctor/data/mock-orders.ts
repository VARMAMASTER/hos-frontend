import { chartIsOpen, copy, type MockState } from './mock-util';
import { seedOrderItems, seedOrders, seedOrderTemplates } from './seed-orders';
import type { DoctorDataSource } from './source';

type OrdersMethods = Pick<
  DoctorDataSource,
  | 'getOrders'
  | 'sendOrder'
  | 'saveTemplate'
  | 'recordDose'
  | 'queuePrint'
  | 'prepareVoiceNote'
>;

export function ordersMethods(state: MockState): OrdersMethods {
  const items = seedOrderItems();
  const templates = seedOrderTemplates();
  // What the doctor has done here is held in this closure and nowhere else: the mock sends nothing
  // to a lab, a pharmacy or a patient.
  const sentOrders: string[][] = [];
  const doses = new Map<string, string>();

  return {
    async getOrders() {
      if (!chartIsOpen(state)) return null;
      return copy({ ...seedOrders(), items, templates });
    },
    async sendOrder({ itemIds, admit }) {
      if (itemIds.length === 0) {
        throw new Error('Choose at least one item to order.');
      }
      const chosen = itemIds.map((id) => items.find((item) => item.id === id));
      if (chosen.some((item) => item === undefined)) {
        throw new Error('One of those items is not on the order list.');
      }
      sentOrders.push([...itemIds]);
      return {
        summary: chosen.map((item) => item?.name).join(' + '),
        admitFlagged: admit,
      };
    },
    async saveTemplate({ name, specialty, itemIds }) {
      if (name.trim() === '') throw new Error('Give the template a name.');
      const chosen = itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item) => item !== undefined);
      const saved = {
        id: `custom-${templates.length + 1}`,
        name: name.trim(),
        labs: chosen.map((item) => item.name).join(', ') || 'No labs',
        rx: 'No Rx lines',
        doseNote: 'dose fields blank',
        uses: 0,
        specialty,
        itemIds: [...itemIds],
      };
      templates.push(saved);
      return copy(saved);
    },
    async recordDose(drug, dose) {
      if (dose.trim() === '') {
        throw new Error('Type the dose yourself — HOS does not fill it.');
      }
      doses.set(drug, dose.trim());
    },
    async queuePrint() {
      // Queued for the print room; nothing is sent to the patient.
    },
    async prepareVoiceNote() {
      // Prepared as a draft; it goes out only with a prescription the doctor approves.
    },
  };
}
