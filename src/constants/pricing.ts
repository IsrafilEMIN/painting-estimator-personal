// src/constants/pricing.ts
import type { Pricing } from '@/types/paintingEstimator';

export const DEFAULT_PRICING: Pricing = {
  laborRate: 60.0,
  overheadRate: 0.15,
  profitMarginRate: 0.2,
  materialRates: {
    wallPainting: 0.55,
    ceilingPainting: 0.5,
    trims: 0.3,
  },
  productionRates: {
    wallPainting: 150,
    ceilingPainting: 160,
    trims: 70,
  },
};
