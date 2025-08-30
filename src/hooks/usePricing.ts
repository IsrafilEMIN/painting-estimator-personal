// src/hooks/usePricing.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_PRICING } from '@/constants/pricing';
import type { Pricing } from '@/types/paintingEstimator';

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
      setPricing(data ? { ...DEFAULT_PRICING, ...data } : DEFAULT_PRICING);
    } catch (error) {
      console.error('Error loading pricing:', error);
      setPricing(DEFAULT_PRICING);
    }
  };

  const savePricing = async (newPricing: Pricing) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, `users/${userId}/configs/pricing`), newPricing);
      setPricing(newPricing);
    } catch (error) {
      console.error('Error saving pricing:', error);
    }
  };

  return { pricing, isSettingsOpen, setIsSettingsOpen, savePricing };
};