// src/utils/calculateEstimate.ts
import type {
  InteriorWall,
  InteriorCeiling,
  PopcornRemoval,
  TrimItem,
  AdditionalItem,
  PricingConfig,
  PaintQuality,
  DetailedBreakdownItem, // Make sure to export this type from your types file
} from '@/types/paintingEstimator';

export const calculateEstimate = (
  walls: InteriorWall[],
  ceilings: InteriorCeiling[],
  popcorns: PopcornRemoval[],
  trims: TrimItem[],
  additional: AdditionalItem[],
  paintQuality: PaintQuality,
  pricing: PricingConfig
): { total: number; breakdown: DetailedBreakdownItem[] } => {
  const breakdown: DetailedBreakdownItem[] = [];
  const effectivePaintQuality = paintQuality || 'good';
  const paintCostPerGallon = pricing.PAINT_COST_PER_GALLON[effectivePaintQuality];

  const calculateArea = (length: number | string, width: number | string) => Number(length) * Number(width);

  // --- Walls ---
  walls.forEach((wall, index) => {
    const area = 2 * (Number(wall.length) + Number(wall.width)) * Number(wall.ceilingHeight);
    const textureMultiplier = pricing.TEXTURE_MULTIPLIERS[wall.texture];
    const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[wall.prepCondition];
    const highCeilingMultiplier = Number(wall.ceilingHeight) > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1;
    const coatsMultiplier = wall.coats > 2 ? (wall.coats - 2) * pricing.EXTRA_COAT_MULTIPLIER + 1 : 1;

    const laborHours = (area / pricing.PRODUCTION_RATES.walls) * textureMultiplier * prepMultiplier * highCeilingMultiplier * coatsMultiplier;
    const rawLaborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;

    const paintUsed = (area * wall.coats) / pricing.COVERAGE_PER_GALLON;
    const paintCost = paintUsed * paintCostPerGallon;
    const suppliesCost = paintCost * pricing.SUPPLIES_PERCENTAGE;
    const rawMaterialCost = paintCost + suppliesCost;

    breakdown.push({
      id: `Wall ${index + 1} (${wall.length}' x ${wall.width}')`,
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: rawMaterialCost * pricing.PROFIT_MARKUP,
      totalPrice: (rawLaborCost + rawMaterialCost) * pricing.PROFIT_MARKUP,
    });

    if (wall.paintStairwell) {
      breakdown.push({
        id: 'Stairwell Addition',
        laborCost: pricing.COST_STAIRWELL * pricing.PROFIT_MARKUP,
        materialCost: 0,
        totalPrice: pricing.COST_STAIRWELL * pricing.PROFIT_MARKUP,
      });
    }
  });

  // --- Ceilings ---
  ceilings.forEach((ceiling, index) => {
    const area = calculateArea(ceiling.length, ceiling.width);
    const textureMultiplier = pricing.TEXTURE_MULTIPLIERS[ceiling.texture];
    const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[ceiling.prepCondition];
    const highCeilingMultiplier = Number(ceiling.ceilingHeight) > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1;
    const coatsMultiplier = ceiling.coats > 2 ? (ceiling.coats - 2) * pricing.EXTRA_COAT_MULTIPLIER + 1 : 1;

    const laborHours = (area / pricing.PRODUCTION_RATES.ceilings) * textureMultiplier * prepMultiplier * highCeilingMultiplier * coatsMultiplier;
    const rawLaborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;

    const paintUsed = (area * ceiling.coats) / pricing.COVERAGE_PER_GALLON;
    const paintCostForThis = paintUsed * (paintCostPerGallon + (ceiling.useMoldResistantPaint ? 15 : 0));
    const suppliesCost = paintCostForThis * pricing.SUPPLIES_PERCENTAGE;
    const rawMaterialCost = paintCostForThis + suppliesCost;

    breakdown.push({
      id: `Ceiling ${index + 1} (${ceiling.length}' x ${ceiling.width}')`,
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: rawMaterialCost * pricing.PROFIT_MARKUP,
      totalPrice: (rawLaborCost + rawMaterialCost) * pricing.PROFIT_MARKUP,
    });

    if (ceiling.paintCrownMolding) {
      breakdown.push({
        id: 'Crown Molding Addition',
        laborCost: pricing.COST_CROWN_MOLDING * pricing.PROFIT_MARKUP,
        materialCost: 0,
        totalPrice: pricing.COST_CROWN_MOLDING * pricing.PROFIT_MARKUP,
      });
    }
    if (ceiling.paintFireplaceMantel) {
        breakdown.push({
          id: 'Fireplace Mantel Addition',
          laborCost: pricing.COST_FIREPLACE_MANTEL * pricing.PROFIT_MARKUP,
          materialCost: 0,
          totalPrice: pricing.COST_FIREPLACE_MANTEL * pricing.PROFIT_MARKUP,
        });
      }
  });

  // --- Popcorn Removal ---
  popcorns.forEach((popcorn, index) => {
    const area = calculateArea(popcorn.length, popcorn.width);
    const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[popcorn.prepCondition];
    const laborHours = (area / pricing.PRODUCTION_RATES.popcornRemoval) * prepMultiplier;
    const rawLaborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;

    breakdown.push({
      id: `Popcorn Removal ${index + 1} (${popcorn.length}' x ${popcorn.width}')`,
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: 0,
      totalPrice: rawLaborCost * pricing.PROFIT_MARKUP,
    });
  });

  // --- Trims ---
  trims.forEach((trim, index) => {
    const lnFt = Number(trim.lnFt);
    const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[trim.prepCondition];
    const coatsMultiplier = trim.coats > 2 ? (trim.coats - 2) * pricing.EXTRA_COAT_MULTIPLIER + 1 : 1;
    const trimRate = trim.hasCarpet ? 30 : pricing.PRODUCTION_RATES.trim;

    const laborHours = (lnFt / trimRate) * prepMultiplier * coatsMultiplier;
    const rawLaborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;
    
    const paintUsedGallons = (lnFt * pricing.ADDITIONAL_PAINT_USAGE.trim * trim.coats) / pricing.COVERAGE_PER_GALLON;
    const paintCost = paintUsedGallons * paintCostPerGallon;
    const suppliesCost = paintCost * pricing.SUPPLIES_PERCENTAGE;
    const rawMaterialCost = paintCost + suppliesCost;

    breakdown.push({
      id: `Trim ${index + 1} (${trim.lnFt} ln ft)`,
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: rawMaterialCost * pricing.PROFIT_MARKUP,
      totalPrice: (rawLaborCost + rawMaterialCost) * pricing.PROFIT_MARKUP,
    });
  });

  // --- Additional Items ---
  additional.forEach((item) => {
    // --- FIX START ---
    // Add this guard clause to skip items with no type.
    if (!item.type) {
      return;
    }
    // --- FIX END ---

    const quantity = Number(item.quantity);
    const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[item.prepCondition];
    const coatsMultiplier = item.coats > 2 ? (item.coats - 2) * pricing.EXTRA_COAT_MULTIPLIER + 1 : 1;
    let materialMultiplier = 1;

    if (['interiorDoor', 'closetDoor', 'vanityDoor'].includes(item.type) && item.material) {
      materialMultiplier = pricing.INTERIOR_DOOR_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.INTERIOR_DOOR_MATERIAL_MULTIPLIERS] || 1;
    } else if (['cabinetDoor', 'cabinetDrawer', 'vanityDrawer'].includes(item.type) && item.material) {
      materialMultiplier = pricing.CABINET_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.CABINET_MATERIAL_MULTIPLIERS] || 1;
    }

    // With the guard clause, TypeScript now knows item.type is a valid key here.
    const laborHours = (quantity / pricing.PRODUCTION_RATES[item.type]) * prepMultiplier * coatsMultiplier * materialMultiplier;
    const rawLaborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;

    // This line is also now safe.
    const paintUsedGallons = (quantity * pricing.ADDITIONAL_PAINT_USAGE[item.type] * item.coats) / pricing.COVERAGE_PER_GALLON;
    const paintCost = paintUsedGallons * paintCostPerGallon;
    const suppliesCost = paintCost * pricing.SUPPLIES_PERCENTAGE;
    const rawMaterialCost = paintCost + suppliesCost;

    breakdown.push({
      id: `${item.id || item.type} (Qty: ${item.quantity})`,
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: rawMaterialCost * pricing.PROFIT_MARKUP,
      totalPrice: (rawLaborCost + rawMaterialCost) * pricing.PROFIT_MARKUP,
    });
  });

  // --- Prep Hours ---
  if (walls.length > 0 || ceilings.length > 0 || popcorns.length > 0) {
    const totalFloorSqFt = [...walls, ...ceilings, ...popcorns].reduce((sum, item) => sum + calculateArea(item.length, item.width), 0);
    const totalPerimeterLft = walls.reduce((sum, wall) => sum + (Number(wall.length) + Number(wall.width)) * 2, 0);
    const prepHours = pricing.BASE_PREP_HOURS_FIXED + totalFloorSqFt * pricing.PREP_HOURS_PER_FLOOR_SQFT + totalPerimeterLft * pricing.PREP_HOURS_PER_PERIMETER_LFT;
    const rawLaborCost = prepHours * pricing.PAINTER_BURDENED_HOURLY_COST;

    breakdown.push({
      id: 'General Site Preparation',
      laborCost: rawLaborCost * pricing.PROFIT_MARKUP,
      materialCost: 0,
      totalPrice: rawLaborCost * pricing.PROFIT_MARKUP,
    });
  }

  // --- Totals ---
  const subtotal = breakdown.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * pricing.TAX_RATE;

  if (tax > 0) {
    breakdown.push({
      id: 'Tax',
      laborCost: 0,
      materialCost: tax,
      totalPrice: tax,
    });
  }
  
  const total = subtotal + tax;

  return { total, breakdown };
};