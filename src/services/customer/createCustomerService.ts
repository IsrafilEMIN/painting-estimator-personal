import { db } from '@/lib/firebase';
import { FirestoreCustomerRepository } from '@/repositories/firestore/firestoreCustomerRepository';
import { CustomerService } from '@/services/customer/customerService';

const customerRepository = new FirestoreCustomerRepository(db);
const customerService = new CustomerService(customerRepository);

export const createCustomerService = () => customerService;

