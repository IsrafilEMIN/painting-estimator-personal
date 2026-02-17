import type { Lead, LeadStage, NewLeadInput } from '@/types/paintingEstimator';

export interface LeadRepository {
  listByUser(userId: string): Promise<Lead[]>;
  getById(userId: string, leadId: string): Promise<Lead | null>;
  create(userId: string, input: NewLeadInput): Promise<Lead>;
  updateStage(userId: string, leadId: string, nextStage: LeadStage): Promise<void>;
  markConverted(userId: string, leadId: string, customerId: string): Promise<void>;
}
