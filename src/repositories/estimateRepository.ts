import type { Estimate, EstimateStatus } from '@/types/paintingEstimator';

export interface CreateEstimateInput {
  customerId: string;
  customerName: string;
  projectAddress: string;
}

export interface EstimateRepository {
  listByUser(userId: string): Promise<Estimate[]>;
  getById(userId: string, estimateId: string): Promise<Estimate | null>;
  create(userId: string, input: CreateEstimateInput): Promise<Estimate>;
  update(userId: string, estimate: Estimate): Promise<Estimate>;
  updateStatus(userId: string, estimateId: string, nextStatus: EstimateStatus): Promise<void>;
  delete(userId: string, estimateId: string): Promise<void>;
  duplicate(userId: string, estimateId: string): Promise<Estimate>;
}

