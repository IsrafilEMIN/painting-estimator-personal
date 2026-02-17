import type { Lead, LeadStage, NewLeadInput } from '@/types/paintingEstimator';
import type { LeadRepository } from '@/repositories/leadRepository';
import { validateLeadStageTransition } from '@/domain/lead/workflow';

export class LeadService {
  constructor(private readonly repository: LeadRepository) {}

  listLeads(userId: string): Promise<Lead[]> {
    return this.repository.listByUser(userId);
  }

  getLead(userId: string, leadId: string): Promise<Lead | null> {
    return this.repository.getById(userId, leadId);
  }

  createLead(userId: string, input: NewLeadInput): Promise<Lead> {
    return this.repository.create(userId, input);
  }

  async updateLeadStage(userId: string, leadId: string, nextStage: LeadStage): Promise<void> {
    const existing = await this.repository.getById(userId, leadId);
    if (!existing) {
      throw new Error('Lead not found.');
    }

    const transitionValidation = validateLeadStageTransition(existing.stage, nextStage);
    if (!transitionValidation.isValid) {
      throw new Error(transitionValidation.issues[0].message);
    }

    await this.repository.updateStage(userId, leadId, nextStage);
  }

  async markLeadConverted(userId: string, leadId: string, customerId: string): Promise<void> {
    const existing = await this.repository.getById(userId, leadId);
    if (!existing) {
      throw new Error('Lead not found.');
    }

    const transitionValidation = validateLeadStageTransition(existing.stage, 'Won');
    if (!transitionValidation.isValid) {
      throw new Error(transitionValidation.issues[0].message);
    }

    await this.repository.markConverted(userId, leadId, customerId);
  }
}
