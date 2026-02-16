import type { Pricing } from '@/types/paintingEstimator';
import type { PricingRepository } from '@/repositories/pricingRepository';
import type { Firestore } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export class FirestorePricingRepository implements PricingRepository {
  constructor(private readonly firestore: Firestore) {}

  async getByUser(userId: string): Promise<Pricing | undefined> {
    const pricingDoc = await getDoc(doc(this.firestore, `users/${userId}/configs/pricing`));
    return pricingDoc.data() as Pricing | undefined;
  }

  async saveByUser(userId: string, pricing: Pricing): Promise<void> {
    await setDoc(doc(this.firestore, `users/${userId}/configs/pricing`), pricing);
  }
}

