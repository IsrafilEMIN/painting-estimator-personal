// src/hooks/useEstimates.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, query, getDocs, addDoc, doc, getDoc,
    setDoc, deleteDoc, Timestamp, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import type { Estimate, Room, Service } from '@/types/paintingEstimator';

// Helper to convert Firestore Timestamps in nested objects (like rooms/services)
// This is basic, might need enhancement for deeper nesting if structure changes
const convertTimestamps = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (data !== null && typeof data === 'object') {
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            newData[key] = convertTimestamps(data[key]);
        }
        return newData;
    }
    return data;
};


export const useEstimates = (userId?: string) => {
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const estimatesColRef = userId ? collection(db, `users/${userId}/estimates`) : null;
    const countersColRef = userId ? collection(db, `users/${userId}/counters`) : null;

    // --- Fetch All Estimates ---
    const fetchEstimates = useCallback(async () => {
        if (!estimatesColRef) {
            setEstimates([]); // Clear if no user
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Fetch estimates ordered by creation date, newest first
            const q = query(estimatesColRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedEstimates: Estimate[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedEstimates.push({
                    id: doc.id,
                    ...convertTimestamps(data), // Convert potential Timestamps
                } as Estimate);
            });
            setEstimates(fetchedEstimates);
        } catch (err) {
            console.error("Error fetching estimates:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch estimates.");
        } finally {
            setIsLoading(false);
        }
    }, [estimatesColRef]); // Depends only on the collection reference

    // Fetch estimates when userId changes
    useEffect(() => {
        fetchEstimates();
    }, [fetchEstimates]);


    // --- Get Single Estimate (primarily for editor page) ---
     const getEstimate = useCallback(async (estimateId: string): Promise<Estimate | null> => {
        if (!userId) return null;
        setIsLoading(true);
        setError(null);
        try {
            const docRef = doc(db, `users/${userId}/estimates`, estimateId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                   ...convertTimestamps(data),
                } as Estimate;
            } else {
                setError("Estimate not found.");
                return null;
            }
        } catch (err) {
            console.error("Error fetching estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch estimate.");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId]);


    // --- Create New Estimate ---
    const createEstimate = async (
        customerId: string,
        customerName: string,
        projectAddress: string
    ): Promise<string | null> => {
        if (!userId || !estimatesColRef || !countersColRef) {
            setError("User not authenticated.");
            return null;
        }
        setIsLoading(true);
        setError(null);

        // Firestore Transaction to ensure counter increment and estimate creation are atomic
        const batch = writeBatch(db);
        const counterRef = doc(countersColRef, 'estimate');
        let newEstimateNumber = '00001'; // Default starting number

        try {
             const counterSnap = await getDoc(counterRef); // Fetch outside transaction is fine for reading current value
            let nextCount = 1;
            if (counterSnap.exists()) {
                nextCount = (counterSnap.data()?.count || 0) + 1;
            }
            newEstimateNumber = nextCount.toString().padStart(5, '0');

            // Update counter within the batch
            batch.set(counterRef, { count: nextCount }, { merge: true });


            // Define the data specifically for Firestore save, allowing Timestamps
            const dataToSave = {
                customerId,
                customerName,
                projectAddress,
                estimateNumber: newEstimateNumber,
                status: 'Draft' as const, // Explicitly type status
                createdAt: Timestamp.now(), // Use Firestore Timestamp for saving
                lastModified: Timestamp.now(), // Use Firestore Timestamp for saving
                subtotal: 0,
                tax: 0,
                total: 0,
                discountAmount: 0,
                adjustedSubtotal: 0,
                paintCost: 0,
                primerCost: 0,
                asbestosCost: 0,
                drywallCost: 0,
                rooms: [],
            };

            // Add new estimate within the batch (let Firestore generate ID)
            const newEstimateRef = doc(estimatesColRef); // Create ref with auto-ID
            // TypeScript won't complain here as dataToSave doesn't strictly conform to Estimate yet
            batch.set(newEstimateRef, dataToSave);

            await batch.commit(); // Commit the transaction

            // Add to local state (using JS Dates as defined in Estimate type)
            const createdEstimate: Estimate = {
                ...dataToSave, // Spread the saved data
                id: newEstimateRef.id, // Use the generated ID
                createdAt: new Date(), // Convert to JS Date for local state
                lastModified: new Date(), // Convert to JS Date for local state
                 status: 'Draft', // Ensure status type consistency
                 rooms: [], // Ensure rooms are typed correctly if needed
            };
             setEstimates(prev => [createdEstimate, ...prev]);

            return newEstimateRef.id; // Return the new Firestore document ID
        } catch (err) {
            console.error("Error creating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to create estimate.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // --- Update Estimate ---
    const updateEstimate = async (estimateData: Estimate): Promise<boolean> => {
        if (!userId) {
            setError("User not authenticated.");
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { id, ...dataToUpdate } = estimateData;
            const estimateRef = doc(db, `users/${userId}/estimates`, id);
            await setDoc(estimateRef, {
                ...dataToUpdate,
                // Ensure dates are Firestore Timestamps if needed, or use serverTimestamp
                // createdAt might already be a Date object from fetching, convert back if necessary
                createdAt: dataToUpdate.createdAt instanceof Date ? Timestamp.fromDate(dataToUpdate.createdAt) : dataToUpdate.createdAt,
                lastModified: serverTimestamp() // Use server timestamp for modification
            }, { merge: true }); // Use merge: true if you only want to update changed fields

             // Update local state
            setEstimates(prev => prev.map(est => est.id === id ? { ...estimateData, lastModified: new Date() } : est));

            return true;
        } catch (err) {
            console.error("Error updating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to update estimate.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // --- Delete Estimate ---
    const deleteEstimate = async (estimateId: string): Promise<boolean> => {
        if (!userId) {
            setError("User not authenticated.");
            return false;
        }
        if (!window.confirm('Are you sure you want to permanently delete this estimate?')) {
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            const estimateRef = doc(db, `users/${userId}/estimates`, estimateId);
            await deleteDoc(estimateRef);

             // Update local state
            setEstimates(prev => prev.filter(est => est.id !== estimateId));

            return true;
        } catch (err) {
            console.error("Error deleting estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to delete estimate.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };


    // Remove startOver and single-estimate state management like currentStep, rooms, modals state etc.
    // They belong in the specific components (Dashboard, EstimateEditor)

    return {
        estimates,
        isLoading,
        error,
        fetchEstimates, // Function to manually refetch if needed
        createEstimate,
        updateEstimate,
        deleteEstimate,
        getEstimate, // Function to fetch a single estimate by ID
    };
};