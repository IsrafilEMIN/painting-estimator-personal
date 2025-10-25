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
    const basePrepHours = Number(room.prepHours) || 0;
    let roomTotal = 0;
    const servicesBreakdown: DetailedBreakdownItem['services'] = [];

    if (basePrepHours > 0) {
      const prepLabor = basePrepHours * pricing.laborRate * pricing.PROFIT_MARKUP;
      servicesBreakdown.push({
        serviceId: -1,
        serviceType: 'prep',
        name: 'Room Preparation',
        total: prepLabor,
      });
      roomTotal += prepLabor;
    }

    room.services.forEach(service => {
      const coats = Number(service.coats) || 0;
      const primerCoats = Number(service.primerCoats) || 0;
      const quantityNum = Number(service.quantity) || 0;
      const lnFtNum = Number(service.lnFt) || 0;
      const textureMultiplier = Number(service.texture) || 0;
      const paintTypeSafe = service.paintType || 'standard';

      let sqFt = 0;
      let laborHours = 0;
      let primerSqFt = 0;

      if (!service.type) {
        servicesBreakdown.push({
          serviceId: service.id,
          serviceType: 'unknown',
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
          laborHours = (sqFt / rate) * coats;
          break;
        case 'ceilingPainting':
          sqFt = Number(service.surfaceArea) || 0;
          laborHours = (sqFt / rate) * coats;
          break;
        case 'popcornRemoval':
          sqFt = Number(service.surfaceArea) || 0;
          rate = service.hasAsbestos ? pricing.PRODUCTION_RATES.popcornRemovalAsbestos : pricing.PRODUCTION_RATES.popcornRemoval;
          laborHours = sqFt / rate;
          if (service.asbestosTest) {
            asbestosTest = true;
          }
          break;
        case 'trims':
          const trimLnFt = lnFtNum;
          laborHours = (trimLnFt / rate) * coats;
          if (service.hasCarpet) laborHours *= 1.2;
          sqFt = trimLnFt * pricing.ADDITIONAL_PAINT_USAGE.trims;
          break;
        case 'additional':
          const serviceTotal = (service.cost || 0) * quantityNum;
          servicesBreakdown.push({
            serviceId: service.id,
            serviceType: service.type,
            name: service.name,
            total: serviceTotal,
          });
          roomTotal += serviceTotal;
          return;
        default:
          break;
      }

      laborHours *= (1 + textureMultiplier);
      sqFt *= (1 + textureMultiplier);

      let highCeilAdd = 0;
      if (height > 14) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['14+'];
      } else if (height > 12) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['12'];
      } else if (height > 10) {
        highCeilAdd = pricing.HIGH_CEILING_TIERS['10'];
      }
      laborHours *= (1 + highCeilAdd);

      primerSqFt = sqFt * primerCoats * (1 + textureMultiplier);
      if (service.useSpray) primerSqFt *= (1 + pricing.sprayUpcharge);
      totalPrimerSqFt += primerSqFt;

      let paintSqFt = sqFt * coats;
      if (service.type === 'popcornRemoval') paintSqFt = 0;

      if (paintSqFt > 0) {
        if (service.useSpray) paintSqFt *= (1 + pricing.sprayUpcharge);
        const key = `${paintTypeSafe}`;
        paintUsage[key] = (paintUsage[key] || 0) + paintSqFt;
      }

      if (service.useSpray) laborHours *= 0.8;

      let laborCost = laborHours * pricing.laborRate;
      laborCost *= pricing.PROFIT_MARKUP;

      // NaN check for service costs
      const safeLaborCost = isNaN(laborCost) ? 0 : laborCost;
      const serviceTotal = safeLaborCost;

      servicesBreakdown.push({
        serviceId: service.id,
        serviceType: service.type,
        name: service.name,
        total: serviceTotal,
      });

      roomTotal += serviceTotal;
    });

    subtotal += roomTotal;
    breakdown.push({
      roomId: room.id,
      roomName: room.name,
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
    const type = key;
    let costPerGal = pricing.paintCosts[type as PaintType];
    if (typeof costPerGal !== 'number' || isNaN(costPerGal)) {
      costPerGal = DEFAULT_PRICING.paintCosts[type as PaintType] || 0;
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

  const totalDrywallCost = 0;

  subtotal += totalPaintCost + totalPrimerCost + asbestosCost + totalDrywallCost;
  subtotal = Math.max(subtotal, pricing.MIN_JOB_FEE);

  let discountPercentage = 0;
  if (typeof pricing.DISCOUNT_PERCENTAGE === 'number' && !isNaN(pricing.DISCOUNT_PERCENTAGE) && pricing.DISCOUNT_PERCENTAGE > 0) {
    discountPercentage = pricing.DISCOUNT_PERCENTAGE;
  }

  const discountAmount = Math.round((subtotal * (discountPercentage / 100)) * 100) / 100;
  const adjustedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;  

  let taxAmount = discountAmount > 0 ? Math.round((adjustedSubtotal * pricing.TAX_RATE) * 100) / 100 : Math.round((subtotal * pricing.TAX_RATE) * 100) / 100;
  let total = discountAmount > 0 ? Math.round((adjustedSubtotal + taxAmount) * 100) / 100 : Math.round((subtotal + taxAmount) * 100) / 100;

  if (isNaN(subtotal)) subtotal = pricing.MIN_JOB_FEE;
  if (isNaN(taxAmount)) taxAmount = pricing.MIN_JOB_FEE * pricing.TAX_RATE;
  if (isNaN(total)) total = subtotal + taxAmount;

  return { total, breakdown, subtotal, tax: taxAmount, paintCost: totalPaintCost, primerCost: totalPrimerCost, asbestosCost, drywallCost: totalDrywallCost, discountAmount, adjustedSubtotal };
};