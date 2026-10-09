import type { ReceptionDataSource } from './source';
import type { Appointment, ScheduleEntry, WhatsAppConversation } from './types';
import {
  ABHA_SAMPLE,
  DOCTORS,
  FIRST_TOKEN,
  PHONE_DIRECTORY,
  seedAppointments,
  seedQueue,
  seedReferrals,
  seedRegistration,
  seedSchedule,
} from './seed-front-desk';
import { fanOutRecords, seedAdmission } from './seed-admission';
import { missedCallConversation, seedAiCalling, seedWhatsApp } from './seed-ai';

// The in-memory ReceptionDataSource: invented sample data (seed-*.ts), held in this closure and
// nowhere else. It makes no network call, writes nothing to browser storage and logs nothing.
// Errors say what failed, never whose record it was. Each call to the factory starts fresh.

// Results are copies, so a caller editing what it got back cannot change the source's state.
function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function nowLabel(): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date())
    .toUpperCase();
}

export function createMockReceptionSource(): ReceptionDataSource {
  let tokenSeq = FIRST_TOKEN;
  const nextToken = () => `T-${tokenSeq++}`;

  const queue = seedQueue();
  const appointments = seedAppointments();
  const booked: Appointment[] = [];
  const schedule = seedSchedule();
  const registration = seedRegistration();
  const admission = seedAdmission();
  const referrals = seedReferrals();
  const whatsapp = seedWhatsApp();
  const calling = seedAiCalling();
  let missedCalls = 1;

  const doctor = (id: string) => {
    const found = DOCTORS.find((entry) => entry.id === id);
    if (!found) throw new Error('That doctor is not on this session.');
    return found;
  };

  const scheduleEntry = (id: string): ScheduleEntry => {
    const found = schedule.entries.find((entry) => entry.id === id);
    if (!found) throw new Error('That slot is not on the day schedule.');
    return found;
  };

  const conversation = (id: string): WhatsAppConversation => {
    const found = whatsapp.conversations.find((entry) => entry.id === id);
    if (!found) throw new Error('That conversation was not found.');
    return found;
  };

  return {
    async getQueue() {
      return copy(queue);
    },

    async callNext() {
      const waiting = queue.tokens.find((token) => token.state === 'waiting');
      if (!waiting) throw new Error('No one is waiting.');
      for (const token of queue.tokens) {
        if (token.state === 'in-consultation' || token.state === 'called') {
          token.state = 'done';
        }
      }
      waiting.state = 'called';
      waiting.waitingMinutes = undefined;
      waiting.at = nowLabel();
      return copy(queue);
    },

    async getAppointments() {
      return copy(appointments);
    },

    async bookAppointment(request) {
      if (!request.patientName.trim() || digitsOf(request.phone).length < 10) {
        throw new Error('A booking needs a name and a 10-digit mobile number.');
      }
      const slot = appointments.slots.find(
        (entry) =>
          entry.id === request.slotId && entry.doctorId === request.doctorId,
      );
      if (!slot || slot.status !== 'free') {
        throw new Error('That slot is no longer free. Pick another one.');
      }
      slot.status = 'taken';
      const freeKpi = appointments.kpis.find((kpi) => kpi.id === 'free-slots');
      if (freeKpi) {
        freeKpi.value = String(
          appointments.slots.filter((entry) => entry.status === 'free').length,
        );
      }
      if (request.payment === 'upi') {
        const prepaid = appointments.kpis.find((kpi) => kpi.id === 'prepaid');
        if (prepaid) prepaid.value = String(Number(prepaid.value) + 1);
      }
      const appointment: Appointment = {
        id: `appt-${booked.length + 1}`,
        token: nextToken(),
        patientName: request.patientName.trim(),
        doctorId: request.doctorId,
        doctorName: doctor(request.doctorId).name,
        slotId: slot.id,
        slotLabel: `${appointments.slotsDate} · ${slot.label}`,
        channel: request.channel,
        payment: request.payment,
      };
      booked.push(appointment);
      return copy(appointment);
    },

    async approveFollowUp(draftId) {
      const draft = appointments.followUp;
      if (!draft || draft.id !== draftId) {
        throw new Error('That follow-up draft is no longer open.');
      }
      appointments.followUp = null;
      const appointment: Appointment = {
        id: `appt-${booked.length + 1}`,
        token: nextToken(),
        patientName: draft.patientName,
        doctorId: 'dr-anil',
        doctorName: doctor('dr-anil').name,
        slotId: 'dr-anil-2026-07-27-10:30',
        slotLabel: draft.proposed.title,
        channel: 'Phone',
        payment: 'counter',
      };
      booked.push(appointment);
      return copy(appointment);
    },

    async approveReminderPlan(planId) {
      if (appointments.reminderPlan?.id !== planId) {
        throw new Error('That reminder plan is no longer open.');
      }
    },

    async getSchedule() {
      return copy(schedule);
    },

    async bookScheduleSlot({ entryId, patientName, reason }) {
      const entry = scheduleEntry(entryId);
      if (entry.kind !== 'free') {
        throw new Error('That slot is no longer free. Pick another one.');
      }
      if (!patientName.trim()) throw new Error('A booking needs a name.');
      const index = schedule.entries.indexOf(entry);
      schedule.entries[index] = {
        kind: 'booked',
        id: entry.id,
        doctorId: entry.doctorId,
        time: entry.time,
        token: nextToken(),
        patientName: patientName.trim(),
        reason: reason.trim() || 'New consult',
      };
      return copy(schedule);
    },

    async rescheduleEntry(entryId, toEntryId) {
      const from = scheduleEntry(entryId);
      const to = scheduleEntry(toEntryId);
      if (from.kind !== 'booked') throw new Error('Nothing is booked there.');
      if (to.kind !== 'free') {
        throw new Error('That slot is no longer free. Pick another one.');
      }
      const fromIndex = schedule.entries.indexOf(from);
      const toIndex = schedule.entries.indexOf(to);
      schedule.entries[toIndex] = {
        ...from,
        id: to.id,
        doctorId: to.doctorId,
        time: to.time,
      };
      schedule.entries[fromIndex] = {
        kind: 'free',
        id: from.id,
        doctorId: from.doctorId,
        time: from.time,
      };
      return copy(schedule);
    },

    async getRegistration() {
      return copy(registration);
    },

    async lookupPhone(phone) {
      const digits = digitsOf(phone);
      const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      const hit = PHONE_DIRECTORY[digits];
      if (hit) return { kind: 'existing', phone: formatted, ...hit };
      return {
        kind: 'new',
        phone: formatted,
        checkedAgainst: '4,812 patients on phone, name and ABHA',
      };
    },

    async fetchAbhaProfile(abha, consent) {
      // ABDM is consent-first: no consent, no data.
      if (!consent) {
        throw new Error('ABHA records are fetched only with consent.');
      }
      if (!abha.trim()) throw new Error('Enter an ABHA number or address.');
      return copy({ ...ABHA_SAMPLE, abha: abha.trim() });
    },

    async registerPatient(draft) {
      if (!draft.name.trim() || digitsOf(draft.phone).length < 10) {
        throw new Error('Registration needs a name and a 10-digit mobile.');
      }
      const registered = {
        id: `reg-${tokenSeq}`,
        name: draft.name.trim(),
        ageSex: draft.ageSex.replace(/\s*\/\s*/, '').toUpperCase(),
        department: draft.department,
        at: nowLabel(),
        token: nextToken(),
        // An ABHA number is kept only when the patient opted in.
        abhaLinked: draft.abhaConsent && draft.abhaNumber.trim() !== '',
      };
      registration.recent.unshift(registered);
      return copy(registered);
    },

    async getAdmission() {
      return copy(admission);
    },

    async approveEstimate(requestId) {
      if (admission.request?.id !== requestId) {
        throw new Error('That estimate is no longer open.');
      }
    },

    async admit({ requestId, payer, wardId, bedId, consentIds }) {
      const request = admission.request;
      if (!request || request.id !== requestId) {
        throw new Error('That admission is no longer open.');
      }
      const missing = request.consents.filter(
        (consent) => !consentIds.includes(consent.id),
      );
      if (missing.length > 0) {
        throw new Error(
          `Cannot admit yet — ${missing.length} consent${missing.length === 1 ? '' : 's'} missing.`,
        );
      }
      const ward = request.bed.wards.find((entry) => entry.id === wardId);
      if (!ward?.available)
        throw new Error('That ward has no bed to allocate.');
      const payerOption = request.payers.find((entry) => entry.id === payer);
      if (!payerOption) throw new Error('Choose who pays.');
      const freeBeds = admission.kpis.find((kpi) => kpi.id === 'free-beds');
      if (freeBeds) freeBeds.value = String(Number(freeBeds.value) - 1);
      return {
        summary: `Admitted 10:47 AM — 6 records created, 24 fields, none re-typed. The next person to touch this patient is the ward nurse at the 11:00 AM round, and her chart is already filled in.`,
        records: fanOutRecords(payerOption, bedId),
        freeBeds: freeBeds?.value ?? '',
      };
    },

    async getReferrals() {
      return copy(referrals);
    },

    async acceptReferral(referralId) {
      const referral = referrals.referrals.find(
        (entry) => entry.id === referralId,
      );
      if (!referral) throw new Error('That referral was not found.');
      referral.status = 'accepted';
      return copy(referral);
    },

    async sendReferralReply(draftId, message) {
      if (referrals.replyDraft?.id !== draftId) {
        throw new Error('That reply is no longer open.');
      }
      if (!message.trim()) throw new Error('The reply is empty.');
      referrals.replyDraft = null;
    },

    async getWhatsApp() {
      return copy(whatsapp);
    },

    async sendWhatsAppReply(conversationId, message) {
      const thread = conversation(conversationId);
      if (!thread.draft) throw new Error('There is no draft to send.');
      if (!message.trim()) throw new Error('The reply is empty.');
      const sent = {
        id: `${thread.id}-${thread.messages.length + 1}`,
        direction: 'out' as const,
        ai: true,
        text: message.trim(),
        time: nowLabel(),
      };
      thread.messages.push(sent);
      thread.draft = null;
      thread.topic = 'Reply sent';
      return copy(sent);
    },

    async recoverMissedCall() {
      if (missedCalls === 0) return null;
      missedCalls -= 1;
      const thread = missedCallConversation(
        `wa-missed-${whatsapp.conversations.length + 1}`,
      );
      whatsapp.conversations.unshift(thread);
      return copy(thread);
    },

    async getAiCalling() {
      return copy(calling);
    },

    async approveRecallList(draftId) {
      if (calling.recallDraft.id !== draftId) {
        throw new Error('That recall list is no longer open.');
      }
    },

    async sendCallFollowUp(callId, message) {
      const call = calling.calls.find((entry) => entry.id === callId);
      if (!call?.followUp) throw new Error('There is no follow-up to send.');
      if (!message.trim()) throw new Error('The message is empty.');
      call.followUp = null;
    },

    async setCampaignRunning(campaignId, running) {
      const campaign = calling.campaigns.find(
        (entry) => entry.id === campaignId,
      );
      if (!campaign) throw new Error('That campaign was not found.');
      campaign.running = running;
    },

    async queueCall(entryId) {
      const entry = calling.queue.find((item) => item.id === entryId);
      if (!entry) throw new Error('That call is not in the queue.');
      if (entry.doNotCall) throw new Error('This number is on do-not-call.');
    },

    async confirmDoNotCall(requestId) {
      const request = calling.consent.request;
      if (!request || request.id !== requestId) {
        throw new Error('That request is no longer open.');
      }
      if (!request.confirmed) {
        request.confirmed = true;
        calling.consent.doNotCallCount += 1;
      }
      return calling.consent.doNotCallCount;
    },
  };
}
