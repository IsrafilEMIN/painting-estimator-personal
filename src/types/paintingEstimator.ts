// src/types/paintingEstimator.ts
export type ServiceType = 'wallPainting' | 'ceilingPainting' | 'popcornRemoval' | 'crownMolding' | 'trims' | 'doorPainting' | 'vanityDoors' | 'vanityDrawers' | 'cabinetDoors' | 'cabinetDrawers' | 'fireplaceMantel';

export type PrepCondition = 'good' | 'fair' | 'poor';

export type Texture = 'smooth' | 'light' | 'heavy';

export type PrimerType = 'none' | 'spot' | 'full';

export type PaintType = 'behrDynastyMatte' | 'behrDynastyEggshell' | 'behrDynastySatin' | 'behrDynastySemiGloss' | 'behrMarqueeMatte' | 'behrMarqueeEggshell' | 'behrMarqueeSatin' | 'behrMarqueeSemiGloss' | 'behrPremiumPlusFlat' | 'behrPremiumPlusEggshell' | 'behrPremiumPlusSatin' | 'behrPremiumPlusSemiGloss' | 'behrPremiumPlusHiGloss' | 'behrUltraFlat' | 'behrUltraEggshell' | 'behrUltraSatin' | 'behrUltraSemiGloss' | 'benjaminMooreAdvanceSatin' | 'benjaminMooreAdvanceSemiGloss' | 'benjaminMooreAdvanceHighGloss' | 'benjaminMooreAuraMatte' | 'benjaminMooreAuraEggshell' | 'benjaminMooreAuraSatin' | 'benjaminMooreAuraSemiGloss' | 'benjaminMooreBenFlat' | 'benjaminMooreBenEggshell' | 'benjaminMooreBenSemiGloss' | 'benjaminMooreRegalFlat' | 'benjaminMooreRegalMatte' | 'benjaminMooreRegalEggshell' | 'benjaminMooreRegalPearl' | 'benjaminMooreRegalSemiGloss' | 'benjaminMooreScuffXMatte' | 'benjaminMooreScuffXEggshell' | 'benjaminMooreScuffXPearl' | 'benjaminMooreScuffXSemiGloss' | 'benjaminMooreUltraSpecFlat' | 'benjaminMooreUltraSpecLowSheenEggshell' | 'benjaminMooreUltraSpecEggshell' | 'benjaminMooreUltraSpecSatinPearl' | 'benjaminMooreUltraSpecSemiGloss' | 'sherwinWilliamsCaptivateFlat' | 'sherwinWilliamsCaptivateSatin' | 'sherwinWilliamsCaptivateSemiGloss' | 'sherwinWilliamsCashmereFlat' | 'sherwinWilliamsCashmereEggshell' | 'sherwinWilliamsCashmereLowLustre' | 'sherwinWilliamsCashmereMediumLustre' | 'sherwinWilliamsCashmerePearl' | 'sherwinWilliamsDurationMatte' | 'sherwinWilliamsDurationSatin' | 'sherwinWilliamsDurationSemiGloss' | 'sherwinWilliamsEmeraldFlat' | 'sherwinWilliamsEmeraldMatte' | 'sherwinWilliamsEmeraldSatin' | 'sherwinWilliamsEmeraldSemiGloss' | 'sherwinWilliamsHarmonyFlat' | 'sherwinWilliamsHarmonyEggshell' | 'sherwinWilliamsHarmonySemiGloss' | 'sherwinWilliamsProMar200Flat' | 'sherwinWilliamsProMar200Eggshell' | 'sherwinWilliamsProMar200LowSheenEggshell' | 'sherwinWilliamsProMar200LowGlossEggshell' | 'sherwinWilliamsProMar200SemiGloss' | 'sherwinWilliamsProMar200Gloss' | 'sherwinWilliamsProMar400Flat' | 'sherwinWilliamsProMar400Eggshell' | 'sherwinWilliamsProMar400LowSheen' | 'sherwinWilliamsProMar400SemiGloss' | 'sherwinWilliamsProMar400Gloss' | 'sherwinWilliamsSuperPaintFlat' | 'sherwinWilliamsSuperPaintSatin' | 'sherwinWilliamsSuperPaintVelvet' | 'sherwinWilliamsSuperPaintSemiGloss';

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
  surfaceArea?: number | string;
  hasRisers?: boolean;
  hasRailings?: boolean;
  lnFt?: number;
  hasCarpet?: boolean;
  sameAsAsWallCeiling?: boolean;
  quantity?: number;
  material?: string;
  asbestos?: boolean;
  asbestosTest?: boolean;
  hasAsbestos?: boolean; 
  useCustomSqFt?: boolean;
  customSqFt?: number;
  moldResistant?: boolean;
  sameAsWallCeiling?: boolean;
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
    adjustedSubtotal?: number;
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
  DISCOUNT_PERCENTAGE: number;
}