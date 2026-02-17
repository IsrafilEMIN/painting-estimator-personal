import type { Lead, LeadSource, LeadStage, NewLeadInput } from '@/types/paintingEstimator';
import type { LeadRepository } from '@/repositories/leadRepository';
import type { Firestore } from 'firebase/firestore';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { convertFirestoreTimestamps } from '@/repositories/firestore/firestoreDataUtils';

const LEAD_SOURCES: readonly LeadSource[] = [
  'Referral',
  'Website',
  'Phone',
  'Partner',
  'RepeatCustomer',
  'Other',
];

const LEAD_STAGES: readonly LeadStage[] = [
  'Intake',
  'Qualified',
  'Nurturing',
  'OfferDraft',
  'OfferSent',
  'Negotiation',
  'Won',
  'Lost',
];

const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asDate = (value: unknown): Date | undefined => (value instanceof Date ? value : undefined);

const clampConfidence = (value: number): number => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

const toLeadSource = (value: unknown): LeadSource => {
  if (typeof value === 'string' && LEAD_SOURCES.includes(value as LeadSource)) {
    return value as LeadSource;
  }
  return 'Other';
};

const toLeadStage = (value: unknown): LeadStage => {
  if (typeof value === 'string' && LEAD_STAGES.includes(value as LeadStage)) {
    return value as LeadStage;
  }
  return 'Intake';
};

export class FirestoreLeadRepository implements LeadRepository {
  constructor(private readonly firestore: Firestore) {}

  private leadsCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/leads`);
  }

  private toLead(id: string, rawData: Record<string, unknown>): Lead {
    const data = convertFirestoreTimestamps(rawData) as Record<string, unknown>;
    const createdAt = asDate(data.createdAt) ?? new Date();
    const updatedAt = asDate(data.updatedAt) ?? createdAt;

    return {
      id,
      name: asText(data.name, 'Unnamed Lead'),
      email: asText(data.email),
      phone: asText(data.phone),
      source: toLeadSource(data.source),
      stage: toLeadStage(data.stage),
      projectAddress: asText(data.projectAddress),
      scopeSummary: asText(data.scopeSummary),
      expectedValue: asNumber(data.expectedValue),
      confidence: clampConfidence(asNumber(data.confidence)),
      assignedPainter: asText(data.assignedPainter) || undefined,
      nextAction: asText(data.nextAction) || undefined,
      nextActionDate: asDate(data.nextActionDate),
      notes: asText(data.notes) || undefined,
      customerId: asText(data.customerId) || undefined,
      createdAt,
      updatedAt,
    };
  }

  async listByUser(userId: string): Promise<Lead[]> {
    const leadsColRef = this.leadsCollection(userId);
    const q = query(leadsColRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const leads: Lead[] = [];
    querySnapshot.forEach((snapshot) => {
      leads.push(this.toLead(snapshot.id, snapshot.data() as Record<string, unknown>));
    });

    return leads;
  }

  async getById(userId: string, leadId: string): Promise<Lead | null> {
    const leadRef = doc(this.firestore, `users/${userId}/leads`, leadId);
    const leadSnap = await getDoc(leadRef);
    if (!leadSnap.exists()) {
      return null;
    }

    return this.toLead(leadSnap.id, leadSnap.data() as Record<string, unknown>);
  }

  async create(userId: string, input: NewLeadInput): Promise<Lead> {
    const leadsColRef = this.leadsCollection(userId);
    const now = Timestamp.now();

    const payload: Record<string, unknown> = {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      source: input.source,
      stage: input.stage ?? 'Intake',
      projectAddress: input.projectAddress.trim(),
      scopeSummary: input.scopeSummary.trim(),
      expectedValue: Math.max(0, input.expectedValue),
      confidence: clampConfidence(input.confidence),
      createdAt: now,
      updatedAt: now,
    };

    if (input.assignedPainter?.trim()) {
      payload.assignedPainter = input.assignedPainter.trim();
    }
    if (input.nextAction?.trim()) {
      payload.nextAction = input.nextAction.trim();
    }
    if (input.nextActionDate) {
      payload.nextActionDate = Timestamp.fromDate(input.nextActionDate);
    }
    if (input.notes?.trim()) {
      payload.notes = input.notes.trim();
    }

    const leadRef = await addDoc(leadsColRef, payload);

    return {
      id: leadRef.id,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      source: input.source,
      stage: input.stage ?? 'Intake',
      projectAddress: input.projectAddress.trim(),
      scopeSummary: input.scopeSummary.trim(),
      expectedValue: Math.max(0, input.expectedValue),
      confidence: clampConfidence(input.confidence),
      assignedPainter: input.assignedPainter?.trim() || undefined,
      nextAction: input.nextAction?.trim() || undefined,
      nextActionDate: input.nextActionDate,
      notes: input.notes?.trim() || undefined,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  async updateStage(userId: string, leadId: string, nextStage: LeadStage): Promise<void> {
    const leadRef = doc(this.firestore, `users/${userId}/leads`, leadId);
    await setDoc(
      leadRef,
      {
        stage: nextStage,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async markConverted(userId: string, leadId: string, customerId: string): Promise<void> {
    const leadRef = doc(this.firestore, `users/${userId}/leads`, leadId);
    await setDoc(
      leadRef,
      {
        customerId,
        stage: 'Won',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
