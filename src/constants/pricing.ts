// src/constants/pricing.ts
import type { Pricing } from '@/types/paintingEstimator';

export const DEFAULT_PRICING: Pricing = {
  laborRate: 60.00,
  paintCoverage: 350,
  paintCosts: {
    standard: 50,
    better: 75,
    premium: 100,
},
  primerCost: 40,
  sprayUpcharge: 0.25,
  PROFIT_MARKUP: 2.0,
  TAX_RATE: 0.13,
  PRODUCTION_RATES: {
    wallPainting: 150,
    ceilingPainting: 150,
    popcornRemoval: 35,
    popcornRemovalAsbestos: 10,
    trims: 70,
    additional: 0,
  },
  ADDITIONAL_PAINT_USAGE: {
    wallPainting: 0,
    ceilingPainting: 0,
    popcornRemoval: 0,
    trims: 0.2,
    additional: 0,
  },
  HIGH_CEILING_TIERS: { '10': 0.1, '12': 0.2, '14+': 0.4 },
  WASTE_FACTOR: 1.1,
  COST_ASBESTOS_TEST: 500.00,
  MIN_JOB_FEE: 550.00,
  DISCOUNT_PERCENTAGE: 10,
  drywallCompoundCost: 20,
};