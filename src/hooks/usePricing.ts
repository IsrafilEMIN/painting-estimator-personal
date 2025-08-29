// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_PRICING } from '@/constants/pricing';
import type { PricingConfig } from '@/types/paintingEstimator';

export const usePricing = (userId: string | undefined) => {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPricing(userId);
    }
  }, [userId]);

  const loadPricing = async (uid: string) => {
    try {
      const pricingDoc = await getDoc(doc(db, `users/${uid}/configs/pricing`));
      const data = pricingDoc.data() || {};
      setPricing({
        ...DEFAULT_PRICING,
        ...data,
        PRODUCTION_RATES: { ...DEFAULT_PRICING.PRODUCTION_RATES, ...(data.PRODUCTION_RATES || {}) },
        ADDITIONAL_PAINT_USAGE: { ...DEFAULT_PRICING.ADDITIONAL_PAINT_USAGE, ...(data.ADDITIONAL_PAINT_USAGE || {}) },
        TEXTURE_MULTIPLIERS: { ...DEFAULT_PRICING.TEXTURE_MULTIPLIERS, ...(data.TEXTURE_MULTIPLIERS || {}) },
        PAINT_COST_PER_GALLON: { ...DEFAULT_PRICING.PAINT_COST_PER_GALLON, ...(data.PAINT_COST_PER_GALLON || {}) },
        PREP_CONDITION_MULTIPLIERS: { ...DEFAULT_PRICING.PREP_CONDITION_MULTIPLIERS, ...(data.PREP_CONDITION_MULTIPLIERS || {}) },
        INTERIOR_DOOR_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.INTERIOR_DOOR_MATERIAL_MULTIPLIERS, ...(data.INTERIOR_DOOR_MATERIAL_MULTIPLIERS || {}) },
        CABINET_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.CABINET_MATERIAL_MULTIPLIERS, ...(data.CABINET_MATERIAL_MULTIPLIERS || {}) },
      });
    } catch (error) {
      console.error('Load pricing error:', error);
      setPricing(DEFAULT_PRICING);
    }
  };

  const savePricing = async (newPricing: PricingConfig) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, `users/${userId}/configs/pricing`), newPricing);
      setPricing(newPricing);
    } catch (error) {
      console.error('Save pricing error:', error);
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing };
};