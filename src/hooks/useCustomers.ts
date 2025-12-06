// src/hooks/useCustomers.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp, orderBy, setDoc, or } from 'firebase/firestore';
// Import NewCustomerInput type
import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';

export const useCustomers = (userId?: string) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Start true
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

    const customersColRef = userId ? collection(db, `users/${userId}/customers`) : null;

    // Fetch ALL customers
    const fetchCustomers = useCallback(async () => {
        setHasAttemptedFetch(false);
        setIsLoading(true);
        setError(null);

        if (!customersColRef) {
            setCustomers([]);
            setIsLoading(false);
            setHasAttemptedFetch(true);
            return;
        }

        try {
            const q = query(customersColRef, orderBy('name', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedCustomers: Customer[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                let createdAtDate = new Date(); // Default
                if (data.createdAt instanceof Timestamp) {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                     createdAtDate = data.createdAt;
                } // Add more checks if needed

                fetchedCustomers.push({
                    id: doc.id,
                    name: data.name || 'Unknown Name', // Add fallback
                    email: data.email || '', // Add fallback
                    phone: data.phone || '', // Add fallback
                    address: data.address, // Keep optional address if present
                    createdAt: createdAtDate,
                } as Customer); // Use 'as Customer' for type safety, assuming fetched data matches
            });
            setCustomers(fetchedCustomers);
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch customers.");
             setCustomers([]);
        } finally {
            setIsLoading(false);
            setHasAttemptedFetch(true);
        }
    }, [customersColRef]);

    // Search customers based on a term
    const searchCustomers = useCallback(async (searchTerm: string): Promise<Customer[]> => {
        if (!customersColRef) {
            return [];
        }
        if (!searchTerm.trim()) {
            return customers; // Return cached list if search is empty
        }

        setError(null);
        const lowerSearchTerm = searchTerm.toLowerCase();
        try {
            // Simplified search: Query name prefix, filter locally on name, email, phone
            const nameQuery = query(
                customersColRef,
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'),
                orderBy('name', 'asc')
            );

            const querySnapshot = await getDocs(nameQuery);
            const results: Customer[] = [];
            querySnapshot.forEach((doc) => {
                 const data = doc.data();
                 // Local filtering (case-insensitive) - Removed address check
                 if (data.name?.toLowerCase().includes(lowerSearchTerm) ||
                    data.email?.toLowerCase().includes(lowerSearchTerm) ||
                    data.phone?.toLowerCase().includes(lowerSearchTerm) ) {

                    let createdAtDate = new Date();
                    if (data.createdAt instanceof Timestamp) {
                        createdAtDate = data.createdAt.toDate();
                    } else if (data.createdAt instanceof Date) {
                         createdAtDate = data.createdAt;
                    }

                    results.push({
                        id: doc.id,
                        name: data.name || 'Unknown Name',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: data.address, // Include optional address if it exists
                        createdAt: createdAtDate,
                    } as Customer);
                 }
            });
            // Consider querying email/phone separately if performance is an issue,
            // but this requires multiple reads or more complex indexing/data duplication.
            return results;
        } catch (err) {
            console.error("Error searching customers:", err);
            setError(err instanceof Error ? err.message : "Failed to search customers.");
            return [];
        }
    }, [customersColRef, customers]);

    // Fetch initial list when userId changes
    useEffect(() => {
        fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Get Single Customer
     const getCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
        if (!userId) return null;
        try {
            const docRef = doc(db, `users/${userId}/customers`, customerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                let createdAtDate = new Date();
                if (data.createdAt instanceof Timestamp) {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt instanceof Date) {
                    createdAtDate = data.createdAt;
                }

                return {
                    id: docSnap.id,
                    name: data.name || 'Unknown Name',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address,
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

    // Add Customer - Accepts NewCustomerInput (name, email, phone)
    const addCustomer = async (customerData: NewCustomerInput): Promise<string | null> => {
        if (!customersColRef) {
        setError("User not authenticated.");
        return null;
        }
        setError(null);
        try {
        // Data to save excludes address now
        const dataToSave = {
            ...customerData, // Contains name, email, phone
            createdAt: Timestamp.now(), // Store as Firestore Timestamp
        };
        const docRef = await addDoc(customersColRef, dataToSave);

        // Add locally immediately, converting Timestamp back to Date
        const newCustomer: Customer = {
             ...customerData,
             id: docRef.id,
             createdAt: dataToSave.createdAt.toDate(), // Convert to Date
             // address remains undefined here
        };
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
        hasAttemptedFetch,
        fetchCustomers,
        addCustomer, // Now accepts NewCustomerInput
        getCustomer,
        searchCustomers
    };
};
