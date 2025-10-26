// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp, orderBy, setDoc, or } from 'firebase/firestore'; // Import 'or'
import type { Customer } from '@/types/paintingEstimator';

export const useCustomers = (userId?: string) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Start true
    const [error, setError] = useState<string | null>(null);
    // Add state to track if the initial fetch attempt completed
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false); // <-- NEW STATE

    const customersColRef = userId ? collection(db, `users/${userId}/customers`) : null;

    // Fetch ALL customers (e.g., for initial display or full list)
    const fetchCustomers = useCallback(async () => {
        setHasAttemptedFetch(false); // Reset attempt flag on new fetch
        setIsLoading(true); // Ensure loading is true when fetch starts
        setError(null);

        if (!customersColRef) {
            setCustomers([]);
            setIsLoading(false);
            setHasAttemptedFetch(true); // Mark attempt as complete even if no user/ref
            return;
        }

        try {
            const q = query(customersColRef, orderBy('name', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedCustomers: Customer[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Ensure createdAt is converted, provide default if missing/invalid
                let createdAtDate = new Date(); // Default to now
                if (data.createdAt instanceof Timestamp) {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                     createdAtDate = data.createdAt; // Already a Date
                } else if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') {
                    try {
                         // Attempt to parse if it's a string/number representation
                        createdAtDate = new Date(data.createdAt);
                        // Check if the parsed date is valid
                        if (isNaN(createdAtDate.getTime())) {
                            createdAtDate = new Date(); // Fallback if parsing fails
                        }
                    } catch {
                         createdAtDate = new Date(); // Fallback on parsing error
                    }
                }

                fetchedCustomers.push({
                    id: doc.id,
                    ...data,
                    createdAt: createdAtDate, // Use the validated/converted date
                } as Customer);
            });
            setCustomers(fetchedCustomers);
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch customers.");
             setCustomers([]); // Clear customers on error
        } finally {
            setIsLoading(false); // Stop loading
            setHasAttemptedFetch(true); // Mark attempt as complete
        }
    }, [customersColRef]); // Dependency on ref

    // Search customers based on a term
    const searchCustomers = useCallback(async (searchTerm: string): Promise<Customer[]> => {
        if (!customersColRef) {
            return []; // No ref, return empty
        }
        if (!searchTerm.trim()) {
            return customers; // Return cached list if search is empty
        }

        // Don't set global isLoading, let modal handle its search loading
        setError(null);
        const lowerSearchTerm = searchTerm.toLowerCase();
        try {
            // Firestore doesn't do case-insensitive substring search well.
            // Fetching based on prefix and filtering locally is a common approach.
            // For a more robust solution, consider a dedicated search service (Algolia, etc.)
            // or storing lowercase fields in Firestore.

            // Prefix search on name (adjust if needed)
             const nameQuery = query(
                customersColRef,
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'), // \uf8ff for prefix matching
                orderBy('name', 'asc')
            );

            const querySnapshot = await getDocs(nameQuery);
            const results: Customer[] = [];
            querySnapshot.forEach((doc) => {
                 const data = doc.data();
                 // Additional local filtering (case-insensitive)
                 if (data.name?.toLowerCase().includes(lowerSearchTerm) ||
                    data.email?.toLowerCase().includes(lowerSearchTerm) ||
                    data.address?.toLowerCase().includes(lowerSearchTerm) ) {

                     // Ensure createdAt is converted correctly for results
                    let createdAtDate = new Date();
                    if (data.createdAt instanceof Timestamp) {
                        createdAtDate = data.createdAt.toDate();
                    } else if (data.createdAt instanceof Date) {
                         createdAtDate = data.createdAt;
                    } // Add more checks if needed based on stored format

                    results.push({
                        id: doc.id,
                        ...data,
                        createdAt: createdAtDate,
                    } as Customer);
                 }
            });
            // If few name results, could potentially add more queries (e.g., email),
            // but be mindful of Firestore query limits/complexity.
            return results;
        } catch (err) {
            console.error("Error searching customers:", err);
            setError(err instanceof Error ? err.message : "Failed to search customers.");
            return [];
        }
    }, [customersColRef, customers]); // Include `customers` for returning on empty search

    // Fetch initial list when userId changes
    useEffect(() => {
        fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]); // Rerun fetch only when userId changes

    // --- Get Single Customer ---
     const getCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
        if (!userId) return null;
        try {
            const docRef = doc(db, `users/${userId}/customers`, customerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                 // Ensure createdAt is converted
                let createdAtDate = new Date();
                if (data.createdAt instanceof Timestamp) {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                    createdAtDate = data.createdAt;
                } // Add more checks if needed

                return {
                    id: docSnap.id,
                    ...data,
                    createdAt: createdAtDate,
                } as Customer;
            } else {
                return null;
            }
        } catch (err) {
            console.error("Error fetching single customer:", err);
            return null;
        }
    }, [userId]);

    // --- Add Customer ---
    const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<string | null> => {
        if (!customersColRef) {
        setError("User not authenticated.");
        return null;
        }
        // Don't set global isLoading for add, let caller handle if needed
        setError(null);
        try {
        const docRef = await addDoc(customersColRef, {
            ...customerData,
            createdAt: Timestamp.now(), // Store as Firestore Timestamp
        });
        // Add locally immediately
        const newCustomer = { ...customerData, id: docRef.id, createdAt: new Date() };
        // Add and re-sort
        setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
        return docRef.id;
        } catch (err) {
        console.error("Error adding customer:", err);
        setError(err instanceof Error ? err.message : "Failed to add customer.");
        return null;
        }
    };


    return {
        customers,
        isLoading,
        error,
        hasAttemptedFetch, // <-- EXPORT NEW STATE
        fetchCustomers, // Keep if manual refresh is needed
        addCustomer,
        getCustomer,
        searchCustomers
    };
};