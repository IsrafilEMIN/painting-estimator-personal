// src/types/paintingEstimator.ts
export type ServiceType = 'wallPainting' | 'ceilingPainting' | 'popcornRemoval' | 'crownMolding' | 'trims' | 'doorPainting' | 'vanityDoors' | 'vanityDrawers' | 'cabinetDoors' | 'cabinetDrawers' | 'fireplaceMantel';

export type PrepCondition = 'good' | 'fair' | 'poor';

export type Texture = 'smooth' | 'light' | 'heavy';

export type PrimerType = 'none' | 'spot' | 'full';

export type PaintType = 'benjaminMooreAura' | 'sherwinWilliamsEmerald' | 'benjaminMooreRegal' | 'sherwinWilliamsDuration' | 'behrPremiumPlus' | 'sherwinWilliamsSuperPaint' | 'sherwinWilliamsCashmere' | 'sherwinWilliamsProMar200' | 'sherwinWilliamsCaptivate' | 'sherwinWilliamsHarmony' | 'benjaminMooreBen' | 'benjaminMooreAdvance' | 'benjaminMooreUltraSpec' | 'benjaminMooreScuffX' | 'behrUltra' | 'behrMarquee' | 'behrDynasty';

export interface Service {
  id: number;
  type: ServiceType;
  prepCondition: PrepCondition;
  coats: number;
  primerType: PrimerType;
  primerCoats: number;
  paintType: PaintType;
  useSpray?: boolean;
  texture?: Texture;
  hasStairway?: boolean;
  stairwaySqFt?: number;
  hasRisers?: boolean;
  hasRailings?: boolean;
  lnFt?: number;
  hasCarpet?: boolean;
  sameAsWallCeiling?: boolean;
  quantity?: number;
  material?: string;
  asbestos?: boolean;
  asbestosTest?: boolean;
  useCustomSqFt?: boolean; // New: Flag for custom ceiling sqFt (ceilingPainting only)
  customSqFt?: number;     // New: Custom sqFt value if useCustomSqFt is true
  moldResistant?: boolean;
}

export interface Room {
  id: number;
  name: string;
  length: number;
  width: number;
  height: number;
  services: Service[];
}

export interface DetailedBreakdownItem {
  roomId: number;
  roomName: string;
  baseLabor: number;
  baseMaterial: number;
  baseTotal: number;
  roomTotal: number;
  services: Array<{
    serviceId: number;
    serviceType: string;
    material?: string;
    laborCost: number;
    materialCost: number;
    total: number;
  }>;
}

export interface Pricing {
  laborRate: number;
  paintCoverage: number;
  paintCosts: Record<PaintType, number>;
  primerCost: number;
  sprayUpcharge: number;
  moldResistantUpcharge: number;
  PROFIT_MARKUP: number;
  TAX_RATE: number;
  SUPPLIES_PERCENTAGE: number;
  PRODUCTION_RATES: Record<ServiceType, number> & { popcornRemovalAsbestos: number };
  ADDITIONAL_PAINT_USAGE: Record<ServiceType, number>;
  COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT: number;
  BASE_PREP_HOURS_FIXED: number;
  PREP_HOURS_PER_FLOOR_SQFT: number;
  PREP_HOURS_PER_PERIMETER_LFT: number;
  PREP_CONDITION_ADDITIVES: Record<PrepCondition, number>;
  TEXTURE_ADDITIVES: Record<Texture, number>;
  EXTRA_COAT_ADDITIVE: number;
  HIGH_CEILING_TIERS: Record<string, number>;
  WASTE_FACTOR: number;
  INTERIOR_DOOR_MATERIAL_ADDITIVES: Record<string, number>;
  CABINET_MATERIAL_ADDITIVES: Record<string, number>;
  MANTEL_MATERIAL_ADDITIVES: Record<string, number>;
  STAIRWELL_COMPLEXITY_ADDITIVE: number;
  COST_ASBESTOS_TEST: number;
  COST_RAILINGS_SPINDLES: number;
  SCAFFOLDING_COST_TIERS: Record<string, number>;
  MIN_JOB_FEE: number;
  ASBESTOS_ADDITIONAL_PER_SQFT: number;
}