import { useState, useEffect } from 'react';
import type { Pricing } from '@/types/paintingEstimator';
import { createPricingService } from '@/services/pricing/createPricingService';

const pricingService = createPricingService();

export const usePricing = (uid: string | undefined) => {
  const [pricing, setPricing] = useState<Pricing>(pricingService.defaultPricing());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPricing(pricingService.defaultPricing());
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const loaded = await pricingService.loadPricing(uid);
        setPricing(loaded);
      } catch (loadError) {
        console.error('Error loading pricing:', loadError);
        setPricing(pricingService.defaultPricing());
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [uid]);

  const savePricing = async (newPricing: Pricing) => {
    if (!uid) return;
    try {
      const saved = await pricingService.savePricing(uid, newPricing);
      setPricing(saved);
    } catch (saveError) {
      console.error('Error saving pricing:', saveError);
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing, isLoading };
};

