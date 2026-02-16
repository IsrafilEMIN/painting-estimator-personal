import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';
import type { CustomerRepository } from '@/repositories/customerRepository';
import type { Firestore } from 'firebase/firestore';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

export class FirestoreCustomerRepository implements CustomerRepository {
  constructor(private readonly firestore: Firestore) {}

  private customersCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/customers`);
  }

  private toCustomer(id: string, data: Record<string, unknown>): Customer {
    let createdAtDate = new Date();
    const createdAt = data.createdAt;
    if (createdAt instanceof Timestamp) {
      createdAtDate = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      createdAtDate = createdAt;
    }

    return {
      id,
      name: (data.name as string) || 'Unknown Name',
      email: (data.email as string) || '',
      phone: (data.phone as string) || '',
      address: data.address as string | undefined,
      createdAt: createdAtDate,
    };
  }

  async listByUser(userId: string): Promise<Customer[]> {
    const customersColRef = this.customersCollection(userId);
    const q = query(customersColRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    const customers: Customer[] = [];
    querySnapshot.forEach((snapshot) => {
      customers.push(this.toCustomer(snapshot.id, snapshot.data() as Record<string, unknown>));
    });

    return customers;
  }

  async searchByNamePrefix(userId: string, term: string): Promise<Customer[]> {
    const customersColRef = this.customersCollection(userId);
    const nameQuery = query(
      customersColRef,
      where('name', '>=', term),
      where('name', '<=', term + '\uf8ff'),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(nameQuery);

    const customers: Customer[] = [];
    querySnapshot.forEach((snapshot) => {
      customers.push(this.toCustomer(snapshot.id, snapshot.data() as Record<string, unknown>));
    });

    return customers;
  }

  async getById(userId: string, customerId: string): Promise<Customer | null> {
    const customerRef = doc(this.firestore, `users/${userId}/customers`, customerId);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
      return null;
    }

    return this.toCustomer(customerSnap.id, customerSnap.data() as Record<string, unknown>);
  }

  async create(userId: string, input: NewCustomerInput): Promise<Customer> {
    const customersColRef = this.customersCollection(userId);
    const dataToSave = {
      ...input,
      createdAt: Timestamp.now(),
    };

    const customerRef = await addDoc(customersColRef, dataToSave);
    return {
      ...input,
      id: customerRef.id,
      createdAt: dataToSave.createdAt.toDate(),
    };
  }
}

