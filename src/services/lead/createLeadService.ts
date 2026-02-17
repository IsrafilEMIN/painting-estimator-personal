import { db } from '@/lib/firebase';
import { FirestoreLeadRepository } from '@/repositories/firestore/firestoreLeadRepository';
import { LeadService } from '@/services/lead/leadService';

const leadRepository = new FirestoreLeadRepository(db);
const leadService = new LeadService(leadRepository);

export const createLeadService = () => leadService;
