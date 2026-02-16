import type { Pricing } from '@/types/paintingEstimator';
import type { PricingRepository } from '@/repositories/pricingRepository';
import { DEFAULT_PRICING } from '../../constants/pricing';

const toPositive = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const toRate = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
};

const sanitizePricing = (data: unknown): Pricing => {
  const input = (typeof data === 'object' && data !== null ? data : {}) as Partial<Pricing>;
  const materialRates = (input.materialRates ?? {}) as Partial<Pricing['materialRates']>;
  const productionRates = (input.productionRates ?? {}) as Partial<Pricing['productionRates']>;

  return {
    laborRate: toPositive(input.laborRate, DEFAULT_PRICING.laborRate),
    overheadRate: toRate(input.overheadRate, DEFAULT_PRICING.overheadRate),
    profitMarginRate: toRate(input.profitMarginRate, DEFAULT_PRICING.profitMarginRate),
    materialRates: {
      wallPainting: toRate(materialRates.wallPainting, DEFAULT_PRICING.materialRates.wallPainting),
      ceilingPainting: toRate(materialRates.ceilingPainting, DEFAULT_PRICING.materialRates.ceilingPainting),
      trims: toRate(materialRates.trims, DEFAULT_PRICING.materialRates.trims),
    },
    productionRates: {
      wallPainting: toPositive(productionRates.wallPainting, DEFAULT_PRICING.productionRates.wallPainting),
      ceilingPainting: toPositive(productionRates.ceilingPainting, DEFAULT_PRICING.productionRates.ceilingPainting),
      trims: toPositive(productionRates.trims, DEFAULT_PRICING.productionRates.trims),
    },
  };
};

export class PricingService {
  constructor(private readonly repository: PricingRepository) {}

  async loadPricing(userId: string): Promise<Pricing> {
    const pricing = await this.repository.getByUser(userId);
    const merged = pricing ? { ...DEFAULT_PRICING, ...pricing } : DEFAULT_PRICING;
    return sanitizePricing(merged);
  }

  async savePricing(userId: string, pricing: Pricing): Promise<Pricing> {
    const sanitized = sanitizePricing(pricing);
    await this.repository.saveByUser(userId, sanitized);
    return sanitized;
  }

  defaultPricing(): Pricing {
    return sanitizePricing(DEFAULT_PRICING);
  }
}
