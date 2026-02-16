import type { Estimate, EstimateStatus } from '@/types/paintingEstimator';
import type { CreateEstimateInput, EstimateRepository } from '@/repositories/estimateRepository';
import {
  validateEstimateForPersistence,
  validateEstimateStatusTransition,
} from '@/domain/estimate/workflow';

export class EstimateService {
  constructor(private readonly repository: EstimateRepository) {}

  listEstimates(userId: string): Promise<Estimate[]> {
    return this.repository.listByUser(userId);
  }

  getEstimate(userId: string, estimateId: string): Promise<Estimate | null> {
    return this.repository.getById(userId, estimateId);
  }

  createEstimate(userId: string, input: CreateEstimateInput): Promise<Estimate> {
    return this.repository.create(userId, input);
  }

  async saveEstimate(userId: string, estimate: Estimate): Promise<Estimate> {
    const validation = validateEstimateForPersistence(estimate);
    if (!validation.isValid) {
      throw new Error(validation.issues[0].message);
    }

    const existing = await this.repository.getById(userId, estimate.id);
    if (!existing) {
      throw new Error('Estimate not found.');
    }

    const transitionValidation = validateEstimateStatusTransition(existing.status, estimate.status);
    if (!transitionValidation.isValid) {
      throw new Error(transitionValidation.issues[0].message);
    }

    return this.repository.update(userId, estimate);
  }

  async updateEstimateStatus(userId: string, estimateId: string, nextStatus: EstimateStatus): Promise<void> {
    const existing = await this.repository.getById(userId, estimateId);
    if (!existing) {
      throw new Error('Estimate not found.');
    }

    if (nextStatus === 'Sent' || nextStatus === 'Approved') {
      const readiness = validateEstimateForPersistence(existing);
      if (!readiness.isValid) {
        throw new Error(readiness.issues[0].message);
      }
    }

    const transitionValidation = validateEstimateStatusTransition(existing.status, nextStatus);
    if (!transitionValidation.isValid) {
      throw new Error(transitionValidation.issues[0].message);
    }

    await this.repository.updateStatus(userId, estimateId, nextStatus);
  }

  deleteEstimate(userId: string, estimateId: string): Promise<void> {
    return this.repository.delete(userId, estimateId);
  }

  duplicateEstimate(userId: string, estimateId: string): Promise<Estimate> {
    return this.repository.duplicate(userId, estimateId);
  }
}

