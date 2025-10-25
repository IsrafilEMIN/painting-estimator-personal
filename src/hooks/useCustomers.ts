// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp, orderBy, setDoc } from 'firebase/firestore';
import type { Customer } from '@/types/paintingEstimator';

export const useCustomers = (userId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customersColRef = userId ? collection(db, `users/${userId}/customers`) : null;

  const fetchCustomers = useCallback(async () => {
    if (!customersColRef) {
        setCustomers([]); // Clear customers if no user ID
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Fetch customers ordered by name for consistency
      const q = query(customersColRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedCustomers: Customer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedCustomers.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps back to JS Dates if necessary
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        } as Customer);
      });
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch customers.");
    } finally {
      setIsLoading(false);
    }
  }, [customersColRef]);


  // Fetch customers when userId changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]); // fetchCustomers is memoized and depends on customersColRef (userId)

  const getCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
     if (!userId) return null;
     setIsLoading(true);
     setError(null);
     try {
        const docRef = doc(db, `users/${userId}/customers`, customerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
            } as Customer;
        } else {
            return null;
        }
     } catch (err) {
        console.error("Error fetching customer:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch customer.");
        return null;
     } finally {
        setIsLoading(false);
     }
  }, [userId]);


  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!customersColRef) {
      setError("User not authenticated.");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(customersColRef, {
        ...customerData,
        createdAt: Timestamp.now(), // Store as Firestore Timestamp
      });
      // Optionally refetch customers or add locally
      // fetchCustomers();
      setCustomers(prev => [...prev, { ...customerData, id: docRef.id, createdAt: new Date() }].sort((a,b) => a.name.localeCompare(b.name)));
      return docRef.id;
    } catch (err) {
      console.error("Error adding customer:", err);
      setError(err instanceof Error ? err.message : "Failed to add customer.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Add updateCustomer function if needed

  return { customers, isLoading, error, fetchCustomers, addCustomer, getCustomer };
};