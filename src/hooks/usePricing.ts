// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PRICING } from '@/constants/pricing';
import type { Pricing } from '@/types/paintingEstimator';

// Helper to deeply sanitize pricing: ensure all numeric fields are valid positive numbers, fallback to 0 or defaults
const sanitizePricing = (data: any, defaults: Pricing): Pricing => {
  const sanitized: any = { ...data };
  Object.keys(defaults).forEach(key => {
    if (!(key in sanitized)) {
      sanitized[key] = defaults[key as keyof Pricing]; // Fill missing with defaults
    }
    const value = sanitized[key];
    if (typeof defaults[key as keyof Pricing] === 'object' && value !== null) {
      sanitized[key] = sanitizePricing(value, defaults[key as keyof Pricing] as any); // Recurse for nested (e.g., paintCosts)
    } else {
      let num = Number(value);
      if (isNaN(num) || num < 0) { // Invalid or negative? Fallback to default
        num = defaults[key as keyof Pricing] as number || 0;
      }
      if (key.includes('RATE') || key.includes('COST') || key.includes('Coverage') || key.includes('FACTOR')) {
        if (num <= 0) num = defaults[key as keyof Pricing] as number || 1; // Ensure positive for rates/costs
      }
      sanitized[key] = num;
    }
  });
  return sanitized as Pricing;
};

export const usePricing = (userId: string | undefined) => {
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (userId) loadPricing(userId);
  }, [userId]);

  const loadPricing = async (uid: string) => {
    try {
      const pricingDoc = await getDoc(doc(db, `users/${uid}/configs/pricing`));
      const data = pricingDoc.data() as Pricing | undefined;
      const merged = data ? { ...DEFAULT_PRICING, ...data } : DEFAULT_PRICING;
      setPricing(sanitizePricing(merged, DEFAULT_PRICING));
    } catch (error) {
      console.error('Error loading pricing:', error);
      setPricing(sanitizePricing(DEFAULT_PRICING, DEFAULT_PRICING));
    }
  };

  const savePricing = async (newPricing: Pricing) => {
    if (!userId) return;
    try {
      const sanitized = sanitizePricing(newPricing, DEFAULT_PRICING);
      await setDoc(doc(db, `users/${userId}/configs/pricing`), sanitized);
      setPricing(sanitized);
    } catch (error) {
      console.error('Error saving pricing:', error);
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing };
};