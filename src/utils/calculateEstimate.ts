// src/utils/calculateEstimate.ts (or wherever this is defined; adjust path if needed)
import type { Room, Service, DetailedBreakdownItem, Pricing, PaintType } from '@/types/paintingEstimator';

export const calculateEstimate = (rooms: Room[], pricing: Pricing) => {
  let subtotal = 0;
  const breakdown: DetailedBreakdownItem[] = [];
  const paintUsage: Record<PaintType, number> = {
    standard: 0,
    benjaminMooreAura: 0,
    sherwinWilliamsEmerald: 0,
    moldResistant: 0,
    benjaminMooreRegal: 0,
    sherwinWilliamsDuration: 0,
    behrPremiumPlus: 0,
  };
  let totalPrimerSqFt = 0;

  rooms.forEach(room => {
    const floorSqFt = room.length * room.width;
    const perimeter = 2 * (room.length + room.width);
    const basePrepHours = pricing.BASE_PREP_HOURS_FIXED + floorSqFt * pricing.PREP_HOURS_PER_FLOOR_SQFT + perimeter * pricing.PREP_HOURS_PER_PERIMETER_LFT;
    const baseLabor = basePrepHours * pricing.laborRate;
    const baseMaterial = baseLabor * pricing.SUPPLIES_PERCENTAGE;
    let roomTotal = baseLabor + baseMaterial;

    const servicesBreakdown: DetailedBreakdownItem['services'] = [];

    room.services.forEach(service => {
      const coats = Number(service.coats) || 2;
      const primerCoats = Number(service.primerCoats) || 1;
      const quantityNum = Number(service.quantity) || 0;
      const lnFtNum = Number(service.lnFt) || 0;
      const stairwaySqFtNum = Number(service.stairwaySqFt) || 0;

      const prepAdd = pricing.PREP_CONDITION_ADDITIVES[service.prepCondition] || 0;
      const textureAdd = pricing.TEXTURE_ADDITIVES[service.texture || 'smooth'] || 0;
      const paintTypeSafe = service.paintType || 'standard';
      const primerTypeSafe = service.primerType || 'none';
      const matAdd = pricing.INTERIOR_DOOR_MATERIAL_ADDITIVES[service.material || ''] ||
                     pricing.CABINET_MATERIAL_ADDITIVES[service.material || ''] || 0;

      let sqFt = 0;
      let laborHours = 0;
      let materialCost = 0;
      let primerSqFt = 0;

      switch (service.type) {
        case 'wallPainting':
          sqFt = perimeter * room.height;
          if (service.hasStairway) sqFt += stairwaySqFtNum;
          laborHours = sqFt / pricing.PRODUCTION_RATES.wallPainting;
          if (service.hasStairway && service.hasRisers) laborHours *= (1 + pricing.STAIRWELL_COMPLEXITY_ADDITIVE);
          if (service.hasStairway && service.hasRailings) materialCost += pricing.COST_RAILINGS_SPINDLES;
          break;
        case 'ceilingPainting':
          sqFt = floorSqFt;
          laborHours = sqFt / pricing.PRODUCTION_RATES.ceilingPainting;
          break;
        case 'popcornRemoval':
          sqFt = floorSqFt;
          laborHours = sqFt / pricing.PRODUCTION_RATES.popcornRemoval;
          materialCost += sqFt * pricing.COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT;
          if (service.asbestos) materialCost += pricing.COST_ASBESTOS_TEST;
          break;
        case 'crownMolding':
          const lnFtCrown = lnFtNum > 0 ? lnFtNum : perimeter;
          laborHours = lnFtCrown / pricing.PRODUCTION_RATES.crownMolding;
          if (service.sameAsWallCeiling) laborHours *= 0.8;
          sqFt = lnFtCrown * pricing.ADDITIONAL_PAINT_USAGE.crownMolding;
          break;
        case 'trims':
          const trimLnFt = lnFtNum > 0 ? lnFtNum : perimeter;
          laborHours = trimLnFt / pricing.PRODUCTION_RATES.trims;
          if (service.hasCarpet) laborHours *= 1.2;
          sqFt = trimLnFt * pricing.ADDITIONAL_PAINT_USAGE.trims;
          break;
        case 'fireplaceMantel':
          laborHours = quantityNum / pricing.PRODUCTION_RATES.fireplaceMantel;
          sqFt = quantityNum * pricing.ADDITIONAL_PAINT_USAGE.fireplaceMantel;
          materialCost += quantityNum * pricing.COST_FIREPLACE_MANTEL;
          break;
        default:
          sqFt = quantityNum * pricing.ADDITIONAL_PAINT_USAGE[service.type];
          laborHours = quantityNum / pricing.PRODUCTION_RATES[service.type];
          laborHours *= (1 + matAdd);
          break;
      }

      laborHours *= (1 + prepAdd);
      laborHours *= (1 + textureAdd);

      let highCeilAdd = 0;
      let scaffoldingKey = '';
      if (room.height > 14) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['14+'];
        scaffoldingKey = '14+';
      } else if (room.height > 12) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['12'];
        scaffoldingKey = '12';
      } else if (room.height > 10) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['10'];
        scaffoldingKey = '10';
      }
      laborHours *= (1 + highCeilAdd);
      if (highCeilAdd > 0) {
        materialCost += pricing.SCAFFOLDING_COST_TIERS[scaffoldingKey];
      }

      if (coats > 2) laborHours *= (1 + (coats - 2) * pricing.EXTRA_COAT_ADDITIVE);

      if (primerTypeSafe === 'spot') primerSqFt = sqFt * 0.2;
      else if (primerTypeSafe === 'full') primerSqFt = sqFt * primerCoats;
      totalPrimerSqFt += primerSqFt;

      const paintSqFt = sqFt * coats;
      paintUsage[paintTypeSafe] += paintSqFt;

      if (service.useSpray) laborHours *= (1 + pricing.sprayUpcharge / 100);

      const laborCost = laborHours * pricing.laborRate;
      materialCost += laborCost * pricing.SUPPLIES_PERCENTAGE;

      const serviceTotal = laborCost + materialCost;
      servicesBreakdown.push({
        serviceId: service.id,
        serviceType: service.type,
        laborCost,
        materialCost,
        total: serviceTotal,
      });
      roomTotal += serviceTotal;
    });

    subtotal += roomTotal;
    breakdown.push({
      roomId: room.id,
      roomName: room.name,
      baseLabor,
      baseMaterial,
      services: servicesBreakdown,
      roomTotal,
    });
  });

  let totalPaintCost = 0;
  Object.entries(paintUsage).forEach(([type, sqFt]) => {
    const gallons = (sqFt / pricing.paintCoverage) * pricing.WASTE_FACTOR;
    totalPaintCost += gallons * pricing.paintCosts[type as PaintType];
  });

  const primerGallons = (totalPrimerSqFt / pricing.paintCoverage) * pricing.WASTE_FACTOR;
  const totalPrimerCost = primerGallons * pricing.primerCost;

  subtotal += totalPaintCost + totalPrimerCost;
  subtotal *= pricing.PROFIT_MARKUP;

  const taxAmount = subtotal * pricing.TAX_RATE;
  let total = subtotal + taxAmount;
  total = Math.max(total, pricing.MIN_JOB_FEE);

  return { total, breakdown, subtotal, tax: taxAmount };
};