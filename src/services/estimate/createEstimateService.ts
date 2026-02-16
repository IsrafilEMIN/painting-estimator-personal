import { db } from '@/lib/firebase';
import { FirestoreEstimateRepository } from '@/repositories/firestore/firestoreEstimateRepository';
import { EstimateService } from '@/services/estimate/estimateService';

const estimateRepository = new FirestoreEstimateRepository(db);
const estimateService = new EstimateService(estimateRepository);

export const createEstimateService = () => estimateService;

