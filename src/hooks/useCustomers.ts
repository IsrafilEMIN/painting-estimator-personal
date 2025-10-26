// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp, orderBy, setDoc, or } from 'firebase/firestore'; // Import 'or'
import type { Customer } from '@/types/paintingEstimator';

export const useCustomers = (userId?: string) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const customersColRef = userId ? collection(db, `users/${userId}/customers`) : null;

    // Fetch ALL customers (e.g., for initial display or full list)
    const fetchCustomers = useCallback(async () => {
        if (!customersColRef) {
            setCustomers([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const q = query(customersColRef, orderBy('name', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedCustomers: Customer[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedCustomers.push({
                    id: doc.id,
                    ...data,
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

    // Search customers based on a term
    const searchCustomers = useCallback(async (searchTerm: string): Promise<Customer[]> => {
        if (!customersColRef || !searchTerm.trim()) {
            // Optionally return recent/all customers or empty array if search is empty
             // Let's return the currently loaded list (or fetch all if needed)
             if (!searchTerm.trim()) return customers; // Return cached list if search is empty
             return [];
        }
        setIsLoading(true); // Indicate loading specific to search
        setError(null);
        const lowerSearchTerm = searchTerm.toLowerCase();
        try {
            // Basic search: Checks if name or email starts with the term (case-insensitive requires backend usually)
            // Firestore doesn't support case-insensitive search directly or partial text search easily.
            // A common workaround is to store lowercase versions of fields to search.
            // For simplicity here, we'll fetch based on name >= term and filter locally (less efficient for large datasets).
            // A more robust solution might involve Algolia or dedicated search service.

            // Example: Simple prefix search on name (adjust field name if needed)
             const nameQuery = query(
                customersColRef,
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'), // \uf8ff is a high Unicode point for prefix matching
                orderBy('name', 'asc')
            );
             // Add other fields if needed, but Firestore query complexity increases
            // const emailQuery = query(customersColRef, where('email', '==', searchTerm)); // Example exact email match
            // Combine queries if necessary (more complex)

            const querySnapshot = await getDocs(nameQuery);
            const results: Customer[] = [];
            querySnapshot.forEach((doc) => {
                 const data = doc.data();
                 // Additional local filtering if needed (e.g., address)
                 if (data.name?.toLowerCase().includes(lowerSearchTerm) ||
                    data.email?.toLowerCase().includes(lowerSearchTerm) ||
                    data.address?.toLowerCase().includes(lowerSearchTerm) ) {
                    results.push({
                        id: doc.id,
                        ...data,
                        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    } as Customer);
                 }
            });
            // If few results from name, consider searching other fields (add complexity)
            return results;
        } catch (err) {
            console.error("Error searching customers:", err);
            setError(err instanceof Error ? err.message : "Failed to search customers.");
            return [];
        } finally {
             setIsLoading(false); // Search loading finished
        }
    }, [customersColRef, customers]); // Include `customers` if returning it on empty search

    // Fetch initial list when userId changes
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // ... (keep getCustomer and addCustomer)
     const getCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
        if (!userId) return null;
        // Removed setIsLoading/setError here as it conflicts with dashboard loading
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
            console.error("Error fetching single customer:", err);
            // setError(err instanceof Error ? err.message : "Failed to fetch customer."); // Avoid setting global error
            return null;
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
        // Add locally immediately for better UX
        const newCustomer = { ...customerData, id: docRef.id, createdAt: new Date() };
        setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
        return docRef.id;
        } catch (err) {
        console.error("Error adding customer:", err);
        setError(err instanceof Error ? err.message : "Failed to add customer.");
        return null;
        } finally {
        setIsLoading(false);
        }
    };


    return { customers, isLoading, error, fetchCustomers, addCustomer, getCustomer, searchCustomers }; // Add searchCustomers
};