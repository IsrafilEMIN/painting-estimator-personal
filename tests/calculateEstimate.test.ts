import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateEstimate } from '../src/utils/calculateEstimate';
import type { Pricing, Room } from '../src/types/paintingEstimator';

const pricing: Pricing = {
  laborRate: 50,
  overheadRate: 0.1,
  profitMarginRate: 0.2,
  materialRates: {
    wallPainting: 1,
    ceilingPainting: 2,
    trims: 3,
  },
  productionRates: {
    wallPainting: 100,
    ceilingPainting: 50,
    trims: 25,
  },
};

test('calculateEstimate returns correct simple cost stack', () => {
  const rooms: Room[] = [
    {
      id: 1,
      name: 'Living Room',
      height: 8,
      prepHours: 2,
      services: [
        { id: 11, type: 'wallPainting', surfaceArea: 200 },
        { id: 12, type: 'ceilingPainting', surfaceArea: 100 },
        { id: 13, type: 'trims', lnFt: 40 },
        { id: 14, type: 'additional', quantity: 3, cost: 25, name: 'Patching Material' },
      ],
    },
  ];

  const result = calculateEstimate(rooms, pricing);

  assert.equal(result.materialCost, 595);
  assert.equal(result.laborCost, 380);
  assert.equal(result.baseCost, 975);
  assert.equal(result.overheadCost, 97.5);
  assert.equal(result.profitAmount, 214.5);
  assert.equal(result.total, 1287);

  assert.equal(result.breakdown.length, 1);
  assert.equal(result.breakdown[0].roomTotal, 975);
  assert.equal(result.breakdown[0].services.length, 5);
  assert.equal(result.breakdown[0].services[0].serviceType, 'prep');
});

test('calculateEstimate rounds money values and ignores invalid quantities', () => {
  const decimalPricing: Pricing = {
    laborRate: 1,
    overheadRate: 0.1,
    profitMarginRate: 0.1,
    materialRates: {
      wallPainting: 0.3333,
      ceilingPainting: 0,
      trims: 0,
    },
    productionRates: {
      wallPainting: 3,
      ceilingPainting: 1,
      trims: 1,
    },
  };

  const rooms: Room[] = [
    {
      id: 2,
      name: 'Small Room',
      height: 8,
      prepHours: 0,
      services: [
        { id: 21, type: 'wallPainting', surfaceArea: 1 },
        { id: 22, type: 'additional', quantity: Number.NaN, cost: 100, name: 'Invalid line' },
      ],
    },
  ];

  const result = calculateEstimate(rooms, decimalPricing);

  assert.equal(result.materialCost, 0.33);
  assert.equal(result.laborCost, 0.33);
  assert.equal(result.baseCost, 0.67);
  assert.equal(result.overheadCost, 0.07);
  assert.equal(result.profitAmount, 0.07);
  assert.equal(result.total, 0.81);
});
