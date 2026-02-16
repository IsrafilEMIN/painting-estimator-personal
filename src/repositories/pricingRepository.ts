import type { Pricing } from '@/types/paintingEstimator';

export interface PricingRepository {
  getByUser(userId: string): Promise<Pricing | undefined>;
  saveByUser(userId: string, pricing: Pricing): Promise<void>;
}

