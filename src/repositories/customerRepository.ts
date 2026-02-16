import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';

export interface CustomerRepository {
  listByUser(userId: string): Promise<Customer[]>;
  searchByNamePrefix(userId: string, term: string): Promise<Customer[]>;
  getById(userId: string, customerId: string): Promise<Customer | null>;
  create(userId: string, input: NewCustomerInput): Promise<Customer>;
}

