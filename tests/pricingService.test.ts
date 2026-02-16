import assert from 'node:assert/strict';
import test from 'node:test';
import { PricingService } from '../src/services/pricing/pricingService';
import { DEFAULT_PRICING } from '../src/constants/pricing';
import type { Pricing } from '../src/types/paintingEstimator';
import type { PricingRepository } from '../src/repositories/pricingRepository';

class FakePricingRepository implements PricingRepository {
  stored: Pricing | undefined;
  saved: Pricing | undefined;

  async getByUser(): Promise<Pricing | undefined> {
    return this.stored;
  }

  async saveByUser(_userId: string, pricing: Pricing): Promise<void> {
    this.saved = pricing;
    this.stored = pricing;
  }
}

test('loadPricing returns defaults when repository has no pricing', async () => {
  const repository = new FakePricingRepository();
  const service = new PricingService(repository);

  const loaded = await service.loadPricing('user-1');

  assert.deepEqual(loaded, DEFAULT_PRICING);
});

test('savePricing sanitizes invalid values before persisting', async () => {
  const repository = new FakePricingRepository();
  const service = new PricingService(repository);

  const dirtyInput = {
    laborRate: 0,
    overheadRate: -0.25,
    profitMarginRate: '0.3',
    materialRates: {
      wallPainting: -1,
      ceilingPainting: 'oops',
      trims: 0,
    },
    productionRates: {
      wallPainting: 0,
      ceilingPainting: -10,
      trims: 90,
    },
  } as unknown as Pricing;

  const saved = await service.savePricing('user-1', dirtyInput);

  assert.equal(saved.laborRate, DEFAULT_PRICING.laborRate);
  assert.equal(saved.overheadRate, DEFAULT_PRICING.overheadRate);
  assert.equal(saved.profitMarginRate, 0.3);
  assert.equal(saved.materialRates.wallPainting, DEFAULT_PRICING.materialRates.wallPainting);
  assert.equal(saved.materialRates.ceilingPainting, DEFAULT_PRICING.materialRates.ceilingPainting);
  assert.equal(saved.materialRates.trims, 0);
  assert.equal(saved.productionRates.wallPainting, DEFAULT_PRICING.productionRates.wallPainting);
  assert.equal(saved.productionRates.ceilingPainting, DEFAULT_PRICING.productionRates.ceilingPainting);
  assert.equal(saved.productionRates.trims, 90);

  assert.deepEqual(repository.saved, saved);
});

test('loadPricing merges partial stored pricing with defaults', async () => {
  const repository = new FakePricingRepository();
  repository.stored = {
    overheadRate: 0.25,
    materialRates: {
      wallPainting: 1.1,
    },
  } as unknown as Pricing;

  const service = new PricingService(repository);
  const loaded = await service.loadPricing('user-1');

  assert.equal(loaded.overheadRate, 0.25);
  assert.equal(loaded.materialRates.wallPainting, 1.1);
  assert.equal(loaded.materialRates.ceilingPainting, DEFAULT_PRICING.materialRates.ceilingPainting);
  assert.equal(loaded.materialRates.trims, DEFAULT_PRICING.materialRates.trims);
  assert.deepEqual(loaded.productionRates, DEFAULT_PRICING.productionRates);
});
