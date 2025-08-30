// src/constants/pricing.ts
import type { Pricing } from '@/types/paintingEstimator';

export const DEFAULT_PRICING: Pricing = {
  laborRate: 60.00, // Adjusted for Richmond Hill market
  paintCoverage: 350,
  paintCosts: {
    standard: 40,
    benjaminMooreAura: 80,
    sherwinWilliamsEmerald: 90,
    moldResistant: 70,
    benjaminMooreRegal: 70,
    sherwinWilliamsDuration: 75,
    behrPremiumPlus: 50,
    // Added from research
    sherwinWilliamsSuperPaint: 45,  // Mid-tier, good coverage
    sherwinWilliamsCashmere: 50,    // Smooth application
    sherwinWilliamsProMar200: 30,   // Contractor-grade, budget option
    sherwinWilliamsCaptivate: 40,   // Entry-level durable
    sherwinWilliamsHarmony: 55,     // Low-VOC, odor-reducing
    benjaminMooreBen: 40,           // Budget-friendly, easy apply
    benjaminMooreAdvance: 70,       // Trim/cabinetry specialist
    benjaminMooreUltraSpec: 40,     // Pro-grade, zero-VOC
    benjaminMooreScuffX: 80,        // Scuff-resistant for high-traffic
    behrUltra: 45,                  // Stain-blocking mid-tier
    behrMarquee: 50,                // One-coat hide option
    behrDynasty: 55,                // Premium scuff-resistant
  },
  primerCost: 40,
  sprayUpcharge: 0.25,
  PROFIT_MARKUP: 2.0,
  TAX_RATE: 0.13, // HST for Ontario
  SUPPLIES_PERCENTAGE: 0.15, // Adjusted
  PRODUCTION_RATES: {
    wallPainting: 150,
    ceilingPainting: 150,
    popcornRemoval: 35,
    crownMolding: 60,
    trims: 70,
    doorPainting: 1.5,
    vanityDoors: 1.0,
    vanityDrawers: 1.0,
    cabinetDoors: 1.0,
    cabinetDrawers: 1.0,
    fireplaceMantel: 1.0,
  },
  ADDITIONAL_PAINT_USAGE: {
    wallPainting: 0,
    ceilingPainting: 0,
    popcornRemoval: 0,
    crownMolding: 0.2,
    trims: 0.2,
    doorPainting: 40,
    vanityDoors: 10,
    vanityDrawers: 5,
    cabinetDoors: 20,
    cabinetDrawers: 10,
    fireplaceMantel: 50,
  },
  COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT: 1.5,
  BASE_PREP_HOURS_FIXED: 0.5,
  PREP_HOURS_PER_FLOOR_SQFT: 0.005,
  PREP_HOURS_PER_PERIMETER_LFT: 0.005,
  PREP_CONDITION_ADDITIVES: { good: 0.0, fair: 0.2, poor: 0.5 },
  TEXTURE_ADDITIVES: { smooth: 0.0, light: 0.2, heavy: 0.4 },
  EXTRA_COAT_ADDITIVE: 0.3,
  HIGH_CEILING_TIERS: { '10': 0.1, '12': 0.2, '14+': 0.4 },
  WASTE_FACTOR: 1.1,
  DOOR_DEDUCTION_SQFT: 20,
  WINDOW_DEDUCTION_SQFT: 15,
  INTERIOR_DOOR_MATERIAL_ADDITIVES: { Wood: 0.2, MDF: 0.0, Metal: 0.5 },
  CABINET_MATERIAL_ADDITIVES: { Wood: 0.0, MDF: 0.1, Laminate: 0.3, Metal: 0.5 },
  MANTEL_MATERIAL_ADDITIVES: { Wood: 0.0, Stone: 0.4, Metal: 0.3 },
  STAIRWELL_COMPLEXITY_ADDITIVE: 0.3,
  COST_ASBESTOS_TEST: 1000.00,
  COST_RAILINGS_SPINDLES: 300.00,
  SCAFFOLDING_COST_TIERS: { '10': 100, '12': 300, '14+': 500 },
  MIN_JOB_FEE: 550.00,
};