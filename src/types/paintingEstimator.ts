// src/types/paintingEstimator.ts
export interface InteriorWall {
  id: number;
  length: number | string;
  width: number | string;
  ceilingHeight: number | string;
  texture: 'smooth' | 'light' | 'heavy';
  coats: number;
  prepCondition: 'good' | 'fair' | 'poor';
  paintStairwell?: boolean;
}

export interface InteriorCeiling {
  id: number;
  length: number | string;
  width: number | string;
  ceilingHeight: number | string;
  texture: 'smooth' | 'light' | 'heavy';
  coats: number;
  prepCondition: 'good' | 'fair' | 'poor';
  useMoldResistantPaint?: boolean;
  paintCrownMolding?: boolean;
  paintFireplaceMantel?: boolean;
}

export interface PopcornRemoval {
  id: number;
  length: number | string;
  width: number | string;
  ceilingHeight: number | string;
  prepCondition: 'good' | 'fair' | 'poor';
}

export interface TrimItem {
  id: number;
  lnFt: number | string;
  coats: number;
  prepCondition: 'good' | 'fair' | 'poor';
  hasCarpet: boolean;
}

export interface AdditionalItem {
  id: number;
  type: 'interiorDoor' | 'closetDoor' | 'vanityDoor' | 'vanityDrawer' | 'cabinetDoor' | 'cabinetDrawer' | '';
  quantity: number | string;
  material?: string;
  prepCondition: 'good' | 'fair' | 'poor';
  coats: number;
}

export interface DetailedBreakdownItem {
  id: string;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

export type PaintQuality = 'good' | 'better' | 'best' | '';

export interface SelectableCardProps { label: string; selected: boolean; onClick: () => void; children?: React.ReactNode; }
export interface WallModalProps { wall: InteriorWall | null; onSave: (wallData: InteriorWall) => void; onClose: () => void; }
export interface CeilingModalProps { ceiling: InteriorCeiling | null; onSave: (ceilingData: InteriorCeiling) => void; onClose: () => void; }
export interface PopcornModalProps { popcorn: PopcornRemoval | null; onSave: (popcornData: PopcornRemoval) => void; onClose: () => void; }
export interface TrimModalProps { trim: TrimItem | null; onSave: (trimData: TrimItem) => void; onClose: () => void; }
export interface AdditionalModalProps { item: AdditionalItem | null; onSave: (itemData: AdditionalItem) => void; onClose: () => void; }

export interface PricingConfig {
  PROFIT_MARKUP: number;
  TAX_RATE: number;
  PAINTER_BURDENED_HOURLY_COST: number;
  PAINT_COST_PER_GALLON: { good: number; better: number; best: number };
  SUPPLIES_PERCENTAGE: number;
  PRODUCTION_RATES: {
    walls: number;
    ceilings: number;
    trim: number;
    popcornRemoval: number;
    interiorDoor: number;
    closetDoor: number;
    vanityDoor: number;
    vanityDrawer: number;
    cabinetDoor: number;
    cabinetDrawer: number;
  };
  ADDITIONAL_PAINT_USAGE: {
    trim: number;
    interiorDoor: number;
    closetDoor: number;
    vanityDoor: number;
    vanityDrawer: number;
    cabinetDoor: number;
    cabinetDrawer: number;
  };
  BASE_PREP_HOURS_FIXED: number;
  PREP_HOURS_PER_FLOOR_SQFT: number;
  PREP_HOURS_PER_PERIMETER_LFT: number;
  COST_MOLD_RESISTANT_PAINT_UPCHARGE: number;
  COST_CROWN_MOLDING: number;
  COST_FIREPLACE_MANTEL: number;
  COST_STAIRWELL: number;
  PREP_CONDITION_MULTIPLIERS: { good: number; fair: number; poor: number };
  TEXTURE_MULTIPLIERS: { smooth: number; light: number; heavy: number };
  EXTRA_COAT_MULTIPLIER: number;
  HIGH_CEILING_MULTIPLIER: number;
  COVERAGE_PER_GALLON: number;
  PRIMER_COST_PER_GALLON: number;
  INTERIOR_DOOR_MATERIAL_MULTIPLIERS: { Wood: number; MDF: number; Metal: number };
  CABINET_MATERIAL_MULTIPLIERS: { Wood: number; Laminate: number; Metal: number };
}