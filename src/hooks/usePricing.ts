// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PRICING } from '@/constants/pricing';
import type { Pricing } from '@/types/paintingEstimator';

// ... (keep sanitizePricing function as before)
const sanitizePricing = <T extends object>(data: unknown, defaults: T): T => {
    // ... implementation
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
            num <= 0 &&
            key !== 'DISCOUNT_PERCENTAGE' // Allow 0 discount
        ) {
            // For specific keys that must be positive (except discount), ensure they fallback correctly.
            num = (defaultValue as number) || 1; // Fallback to default or 1 if default is 0
        }
        sanitized[key] = num;
        }
    });

    return sanitized as T;
};


export const usePricing = (uid: string | undefined) => {
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // <-- Add isLoading state, default true

  useEffect(() => {
    if (uid) {
        loadPricing(uid);
    } else {
        // If no UID, reset to default and set loading to false
        setPricing(DEFAULT_PRICING);
        setIsLoading(false);
    }
  }, [uid]);

  const loadPricing = async (userId: string) => {
    setIsLoading(true); // <-- Set loading true at the start
    try {
      const pricingDoc = await getDoc(doc(db, `users/${userId}/configs/pricing`));
      const data = pricingDoc.data() as Pricing | undefined;
      const merged = data ? { ...DEFAULT_PRICING, ...data } : DEFAULT_PRICING;
      setPricing(sanitizePricing(merged, DEFAULT_PRICING));
    } catch (error) {
      console.error('Error loading pricing:', error);
      setPricing(sanitizePricing(DEFAULT_PRICING, DEFAULT_PRICING)); // Fallback to default on error
    } finally {
        setIsLoading(false); // <-- Set loading false when done (success or error)
    }
  };

  const savePricing = async (newPricing: Pricing) => {
    if (!uid) return;
    // Consider adding a saving state if needed
    try {
      const sanitized = sanitizePricing(newPricing, DEFAULT_PRICING);
      await setDoc(doc(db, `users/${uid}/configs/pricing`), sanitized);
      setPricing(sanitized); // Update local state after saving
    } catch (error) {
      console.error('Error saving pricing:', error);
      // Optionally show an error to the user
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing, isLoading }; // <-- Return isLoading
};