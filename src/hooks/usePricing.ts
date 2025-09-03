// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PRICING } from '@/constants/pricing';
import type { Pricing } from '@/types/paintingEstimator';

// Helper to deeply sanitize pricing: ensure all numeric fields are valid positive numbers, fallback to 0 or defaults
const sanitizePricing = <T extends object>(data: unknown, defaults: T): T => {
  const sanitized: { [key: string]: unknown } =
    typeof data === 'object' && data !== null ? { ...data } : {};

  Object.keys(defaults).forEach((key) => {
    const keyOfT = key as keyof T;

    if (!(key in sanitized)) {
      sanitized[key] = defaults[keyOfT]; // Fill missing with defaults
    }

    const value = sanitized[key];
    const defaultValue = defaults[keyOfT];

    // Check if the default value is a non-array object, indicating a nested structure we should recurse into.
    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
      sanitized[key] = sanitizePricing(value, defaultValue); // Recurse for nested objects
    } else {
      // Otherwise, assume the value should be a number and sanitize it.
      let num = Number(value);
      if (isNaN(num) || num < 0) {
        // Fallback to the default value if the current value is not a valid positive number.
        num = (defaultValue as number) || 0;
      }
      if (
        (key.includes('RATE') ||
          key.includes('COST') ||
          key.includes('Coverage') ||
          key.includes('FACTOR')) &&
        num <= 0
      ) {
        // For specific keys that must be positive, ensure they are at least 1.
        num = (defaultValue as number) || 1;
      }
      sanitized[key] = num;
    }
  });

  // We are confident the sanitized object now matches the shape of T.
  return sanitized as T;
};

export const usePricing = (uid: string | undefined) => {
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (uid) loadPricing(uid);
  }, [uid]);

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
    if (!uid) return;
    try {
      const sanitized = sanitizePricing(newPricing, DEFAULT_PRICING);
      await setDoc(doc(db, `users/${uid}/configs/pricing`), sanitized);
      setPricing(sanitized);
    } catch (error) {
      console.error('Error saving pricing:', error);
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing };
};