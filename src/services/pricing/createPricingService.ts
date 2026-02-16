import { db } from '@/lib/firebase';
import { FirestorePricingRepository } from '@/repositories/firestore/firestorePricingRepository';
import { PricingService } from '@/services/pricing/pricingService';

const pricingRepository = new FirestorePricingRepository(db);
const pricingService = new PricingService(pricingRepository);

export const createPricingService = () => pricingService;

