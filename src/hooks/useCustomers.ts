import { useState, useEffect, useCallback } from 'react';
import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';
import { createCustomerService } from '@/services/customer/createCustomerService';

const customerService = createCustomerService();

export const useCustomers = (userId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setHasAttemptedFetch(false);
    setIsLoading(true);
    setError(null);

    if (!userId) {
      setCustomers([]);
      setIsLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    try {
      const fetchedCustomers = await customerService.listCustomers(userId);
      setCustomers(fetchedCustomers);
    } catch (fetchError) {
      console.error('Error fetching customers:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch customers.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [userId]);

  const searchCustomers = useCallback(
    async (searchTerm: string): Promise<Customer[]> => {
      if (!userId) return [];
      if (!searchTerm.trim()) return customers;

      setError(null);
      try {
        return await customerService.searchCustomers(userId, searchTerm);
      } catch (searchError) {
        console.error('Error searching customers:', searchError);
        setError(searchError instanceof Error ? searchError.message : 'Failed to search customers.');
        return [];
      }
    },
    [userId, customers]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const getCustomer = useCallback(
    async (customerId: string): Promise<Customer | null> => {
      if (!userId) return null;
      try {
        return await customerService.getCustomer(userId, customerId);
      } catch (fetchError) {
        console.error('Error fetching single customer:', fetchError);
        return null;
      }
    },
    [userId]
  );

  const addCustomer = async (customerData: NewCustomerInput): Promise<string | null> => {
    if (!userId) {
      setError('User not authenticated.');
      return null;
    }

    setError(null);
    try {
      const created = await customerService.createCustomer(userId, customerData);
      setCustomers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created.id;
    } catch (createError) {
      console.error('Error adding customer:', createError);
      setError(createError instanceof Error ? createError.message : 'Failed to add customer.');
      return null;
    }
  };

  return {
    customers,
    isLoading,
    error,
    hasAttemptedFetch,
    fetchCustomers,
    addCustomer,
    getCustomer,
    searchCustomers,
  };
};

