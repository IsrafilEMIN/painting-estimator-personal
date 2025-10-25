// src/types/paintingEstimator.ts
export type ServiceType = 'wallPainting' | 'ceilingPainting' | 'popcornRemoval' | 'trims' | 'additional';

export type PrepCondition = 'good' | 'fair' | 'poor';

export type PaintType = 'standard' | 'better' | 'premium';

export interface Service {
  id: number;
  type: ServiceType;
  coats: number;
  primerCoats: number;
  paintType: PaintType;
  useSpray?: boolean;
  texture?: number;
  surfaceArea?: number | string;
  lnFt?: number;
  hasCarpet?: boolean;
  quantity?: number;
  cost?: number;
  name?: string;
  asbestos?: boolean;
  asbestosTest?: boolean;
  hasAsbestos?: boolean; 
  useCustomSqFt?: boolean;
  customSqFt?: number;
  prepCondition?: PrepCondition;
}

export interface Room {
  id: number;
  name: string;
  height: number;
  prepHours: number;
  services: Service[];
}

export interface DetailedBreakdownItem {
  roomId: number;
  roomName: string;
  roomTotal: number;
  services: Array<{
    serviceId: number;
    serviceType: string;
    name?: string;
    total: number;
  }>;
}

export interface Pricing {
  laborRate: number;
  paintCoverage: number;
  paintCosts: Record<PaintType, number>;
  primerCost: number;
  sprayUpcharge: number;
  PROFIT_MARKUP: number;
  TAX_RATE: number;
  PRODUCTION_RATES: Record<ServiceType, number> & { popcornRemovalAsbestos: number };
  ADDITIONAL_PAINT_USAGE: Record<ServiceType, number>;
  HIGH_CEILING_TIERS: Record<string, number>;
  WASTE_FACTOR: number;
  COST_ASBESTOS_TEST: number;
  MIN_JOB_FEE: number;
  DISCOUNT_PERCENTAGE: number;
}