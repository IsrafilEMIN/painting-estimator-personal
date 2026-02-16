import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';
import type { CustomerRepository } from '@/repositories/customerRepository';

export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  listCustomers(userId: string): Promise<Customer[]> {
    return this.repository.listByUser(userId);
  }

  async searchCustomers(userId: string, term: string): Promise<Customer[]> {
    if (!term.trim()) {
      return this.repository.listByUser(userId);
    }

    const rawResults = await this.repository.searchByNamePrefix(userId, term);
    const normalizedTerm = term.toLowerCase();

    return rawResults.filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedTerm) ||
        customer.email.toLowerCase().includes(normalizedTerm) ||
        customer.phone.toLowerCase().includes(normalizedTerm)
    );
  }

  getCustomer(userId: string, customerId: string): Promise<Customer | null> {
    return this.repository.getById(userId, customerId);
  }

  createCustomer(userId: string, input: NewCustomerInput): Promise<Customer> {
    return this.repository.create(userId, input);
  }
}

