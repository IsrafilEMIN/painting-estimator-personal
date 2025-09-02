// src/utils/calculateEstimate.ts
import type { Room, DetailedBreakdownItem, Pricing, PaintType } from '@/types/paintingEstimator';
import { DEFAULT_PRICING } from '@/constants/pricing';

export const calculateEstimate = (rooms: Room[], pricing: Pricing) => {
  let subtotal = 0;
  const breakdown: DetailedBreakdownItem[] = [];
  const paintUsage: Record<string, number> = {};
  let totalPrimerSqFt = 0;
  let asbestosTest = false;

  rooms.forEach(room => {
    const height = Number(room.height) || 0;
    const basePrepHours = pricing.BASE_PREP_HOURS_FIXED;
    let baseLabor = basePrepHours * pricing.laborRate;
    let baseMaterial = baseLabor * pricing.SUPPLIES_PERCENTAGE;
    baseLabor *= pricing.PROFIT_MARKUP;
    baseMaterial *= pricing.PROFIT_MARKUP;
    const baseTotal = baseLabor + baseMaterial;
    let roomTotal = baseTotal;

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
      let additiveMap;
      if (service.type === 'doorPainting') {
        additiveMap = pricing.INTERIOR_DOOR_MATERIAL_ADDITIVES;
      } else if (['cabinetDoors', 'cabinetDrawers', 'vanityDoors', 'vanityDrawers'].includes(service.type)) {
        additiveMap = pricing.CABINET_MATERIAL_ADDITIVES;
      } else if (['fireplaceMantel'].includes(service.type)) {
        additiveMap = pricing.MANTEL_MATERIAL_ADDITIVES;
      } else {
        additiveMap = {}; // Or handle other types
      }
      const matAdd = additiveMap[service.material || ''] || 0;

      let sqFt = 0;
      let laborHours = 0;
      let materialCost = 0;
      let primerSqFt = 0;

      if (!service.type) {
        servicesBreakdown.push({
          serviceId: service.id,
          serviceType: 'unknown',
          laborCost: 0,
          materialCost: 0,
          total: 0,
        });
        return;
      }

      // Safeguard production rate
      let rate = pricing.PRODUCTION_RATES[service.type];
      if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
        rate = DEFAULT_PRICING.PRODUCTION_RATES[service.type] || 100; // Safe fallback
      }

      switch (service.type) {
        case 'wallPainting':
          sqFt = Number(service.surfaceArea) || 0;
          if (service.hasStairway) sqFt += stairwaySqFtNum;
          laborHours = sqFt / rate;
          if (service.hasStairway && service.hasRisers) laborHours *= (1 + pricing.STAIRWELL_COMPLEXITY_ADDITIVE);
          if (service.hasStairway && service.hasRailings) materialCost += pricing.COST_RAILINGS_SPINDLES;
          break;
        case 'ceilingPainting':
          sqFt = Number(service.surfaceArea) || 0;
          laborHours = sqFt / rate;
          break;
        case 'popcornRemoval':
          sqFt = Number(service.surfaceArea) || 0;
          rate = service.hasAsbestos ? pricing.PRODUCTION_RATES.popcornRemovalAsbestos : pricing.PRODUCTION_RATES.popcornRemoval;
          laborHours = sqFt / rate;
          materialCost += sqFt * pricing.COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT;
          if (service.asbestosTest) {
            asbestosTest = true;
          }
          break;
        case 'crownMolding':
          const lnFtCrown = lnFtNum;
          laborHours = lnFtCrown / rate;
          if (service.sameAsWallCeiling) laborHours *= 0.8;
          sqFt = lnFtCrown * pricing.ADDITIONAL_PAINT_USAGE.crownMolding;
          break;
        case 'trims':
          const trimLnFt = lnFtNum;
          laborHours = trimLnFt / rate;
          if (service.hasCarpet) laborHours *= 1.2;
          sqFt = trimLnFt * pricing.ADDITIONAL_PAINT_USAGE.trims;
          break;
        case 'fireplaceMantel':
          laborHours = quantityNum / rate;
          laborHours *= (1 + matAdd);
          sqFt = quantityNum * pricing.ADDITIONAL_PAINT_USAGE.fireplaceMantel;
          break;
        default:
          const paintUsageAdd = pricing.ADDITIONAL_PAINT_USAGE[service.type] ?? 0;
          laborHours = rate > 0 ? quantityNum / rate : 0;
          laborHours *= (1 + matAdd);
          sqFt = quantityNum * paintUsageAdd;
          break;
      }

      const cumulativeAdd = prepAdd + textureAdd; // New: Sum prep and texture to avoid compounding
      laborHours *= (1 + cumulativeAdd); // New: Apply single cumulative multiplier

      let highCeilAdd = 0;
      let scaffoldingKey = '';
      if (height > 14) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['14+'];
        scaffoldingKey = '14+';
      } else if (height > 12) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['12'];
        scaffoldingKey = '12';
      } else if (height > 10) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['10'];
        scaffoldingKey = '10';
      }
      laborHours *= (1 + highCeilAdd);
      if (highCeilAdd > 0) {
        materialCost += pricing.SCAFFOLDING_COST_TIERS[scaffoldingKey] ?? 0;
      }

      if (coats > 2) laborHours *= (1 + (coats - 2) * pricing.EXTRA_COAT_ADDITIVE);

      if (primerTypeSafe === 'spot') primerSqFt = sqFt * 0.2;
      else if (primerTypeSafe === 'full') primerSqFt = sqFt * primerCoats;
      totalPrimerSqFt += primerSqFt;

      let paintSqFt = sqFt * coats;
      if (service.type === 'popcornRemoval') paintSqFt = 0;

      if (paintSqFt > 0) {
        const key = `${paintTypeSafe}${service.moldResistant ? '_mold' : ''}`;
        paintUsage[key] = (paintUsage[key] || 0) + paintSqFt;
      }

      if (service.useSpray) laborHours *= 0.8;
      if (service.useSpray) materialCost *= 1 + pricing.sprayUpcharge;

      let laborCost = laborHours * pricing.laborRate;
      materialCost += laborCost * pricing.SUPPLIES_PERCENTAGE;

      laborCost *= pricing.PROFIT_MARKUP;
      materialCost *= pricing.PROFIT_MARKUP;

      // NaN check for service costs
      const safeLaborCost = isNaN(laborCost) ? 0 : laborCost;
      const safeMaterialCost = isNaN(materialCost) ? 0 : materialCost;
      const serviceTotal = safeLaborCost + safeMaterialCost;

      servicesBreakdown.push({
        serviceId: service.id,
        serviceType: service.type,
        laborCost: safeLaborCost,
        materialCost: safeMaterialCost,
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
      baseTotal,
      roomTotal,
      services: servicesBreakdown,
    });
  });

  const asbestosCost = asbestosTest ? pricing.COST_ASBESTOS_TEST : 0;

  // Safeguard globals
  let paintCoverage = pricing.paintCoverage;
  if (typeof paintCoverage !== 'number' || isNaN(paintCoverage) || paintCoverage <= 0) {
    paintCoverage = DEFAULT_PRICING.paintCoverage;
  }
  let wasteFactor = pricing.WASTE_FACTOR;
  if (typeof wasteFactor !== 'number' || isNaN(wasteFactor) || wasteFactor <= 0) {
    wasteFactor = DEFAULT_PRICING.WASTE_FACTOR;
  }

  let totalPaintCost = 0;
  Object.entries(paintUsage).forEach(([key, sqFt]) => {
    const isMold = key.endsWith('_mold');
    const type = isMold ? key.slice(0, -5) : key;
    let costPerGal = pricing.paintCosts[type as PaintType];
    if (typeof costPerGal !== 'number' || isNaN(costPerGal)) {
      costPerGal = DEFAULT_PRICING.paintCosts[type as PaintType] || 0;
    }
    if (isMold) {
      costPerGal += pricing.moldResistantUpcharge;
    }
    const gallons = (sqFt / paintCoverage) * wasteFactor;
    const cost = gallons * costPerGal;
    totalPaintCost += isNaN(cost) ? 0 : cost;
  });
  totalPaintCost *= pricing.PROFIT_MARKUP;

  const primerGallons = (totalPrimerSqFt / paintCoverage) * wasteFactor;
  let primerCost = pricing.primerCost;
  if (typeof primerCost !== 'number' || isNaN(primerCost)) {
    primerCost = DEFAULT_PRICING.primerCost;
  }
  let totalPrimerCost = isNaN(primerGallons * primerCost) ? 0 : primerGallons * primerCost;
  totalPrimerCost *= pricing.PROFIT_MARKUP;

  subtotal += totalPaintCost + totalPrimerCost + asbestosCost;
  subtotal = Math.max(subtotal, pricing.MIN_JOB_FEE);

  let taxAmount = subtotal * pricing.TAX_RATE;
  let total = subtotal + taxAmount;

  let discountPercentage = 0;
  if (typeof pricing.DISCOUNT_PERCENTAGE === 'number' && !isNaN(pricing.DISCOUNT_PERCENTAGE) && pricing.DISCOUNT_PERCENTAGE > 0) {
    discountPercentage = pricing.DISCOUNT_PERCENTAGE;
  }
  const discountAmount = total * (discountPercentage / 100);
  const adjustedTotal = total - discountAmount;    

  if (isNaN(subtotal)) subtotal = pricing.MIN_JOB_FEE;
  if (isNaN(taxAmount)) taxAmount = pricing.MIN_JOB_FEE * pricing.TAX_RATE;
  if (isNaN(total)) total = subtotal + taxAmount;

  return { total, breakdown, subtotal, tax: taxAmount, paintCost: totalPaintCost, primerCost: totalPrimerCost, asbestosCost, discountAmount, adjustedTotal };
};