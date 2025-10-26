// src/hooks/useEstimates.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, query, getDocs, addDoc, doc, getDoc,
    setDoc, deleteDoc, Timestamp, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';
import type { Estimate, Room, Service } from '@/types/paintingEstimator';

// ... (keep convertTimestamps helper)
const convertTimestamps = (data: any): any => {
    // ... (implementation as before)
     if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (data !== null && typeof data === 'object') {
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            // Avoid prototype pollution
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                 newData[key] = convertTimestamps(data[key]);
            }
        }
        return newData;
    }
    return data;
};

export const useEstimates = (userId?: string) => {
    // ... (keep useState, refs, fetchEstimates, getEstimate)
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
            const q = query(estimatesColRef, orderBy('lastModified', 'desc')); // Order by lastModified
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
        // Do not set loading/error here, let the page component handle it
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
                // setError("Estimate not found."); // Don't set global error
                console.warn(`Estimate ${estimateId} not found.`);
                return null;
            }
        } catch (err) {
            console.error("Error fetching estimate:", err);
            // setError(err instanceof Error ? err.message : "Failed to fetch estimate."); // Don't set global error
            return null;
        }
    }, [userId]);


    // --- Create New Estimate ---
    const createEstimate = async ( /* ... params as before ... */
        customerId: string,
        customerName: string,
        projectAddress: string
    ): Promise<string | null> => {
         // ... (implementation as before)
         if (!userId || !estimatesColRef || !countersColRef) {
            setError("User not authenticated.");
            return null;
        }
        setIsLoading(true);
        setError(null);

        const batch = writeBatch(db);
        const counterRef = doc(countersColRef, 'estimate');
        let newEstimateNumber = '00001';

        try {
             const counterSnap = await getDoc(counterRef);
            let nextCount = 1;
            if (counterSnap.exists()) {
                nextCount = (counterSnap.data()?.count || 0) + 1;
            }
            newEstimateNumber = nextCount.toString().padStart(5, '0');

            batch.set(counterRef, { count: nextCount }, { merge: true });

             const dataToSave = {
                customerId,
                customerName,
                projectAddress,
                estimateNumber: newEstimateNumber,
                status: 'Draft' as const,
                createdAt: Timestamp.now(),
                lastModified: Timestamp.now(),
                subtotal: 0, tax: 0, total: 0, discountAmount: 0, adjustedSubtotal: 0,
                paintCost: 0, primerCost: 0, asbestosCost: 0, drywallCost: 0,
                rooms: [],
            };

            const newEstimateRef = doc(estimatesColRef);
            batch.set(newEstimateRef, dataToSave);

            await batch.commit();

            const createdEstimate: Estimate = {
                ...dataToSave,
                id: newEstimateRef.id,
                createdAt: new Date(),
                lastModified: new Date(),
                status: 'Draft',
                rooms: [],
            };
             setEstimates(prev => [createdEstimate, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())); // Sort after adding


            return newEstimateRef.id;
        } catch (err) {
            console.error("Error creating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to create estimate.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // --- Update Estimate ---
    const updateEstimate = async ( /* ... params as before ... */ estimateData: Estimate): Promise<boolean> => {
        // ... (implementation as before)
        if (!userId) {
            setError("User not authenticated.");
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { id, ...dataToUpdate } = estimateData;
            const estimateRef = doc(db, `users/${userId}/estimates`, id);

            // Convert rooms/services back to plain objects if they contain Dates
            const plainData = JSON.parse(JSON.stringify(dataToUpdate));

            await setDoc(estimateRef, {
                ...plainData, // Use plain JS objects/arrays
                createdAt: dataToUpdate.createdAt instanceof Date ? Timestamp.fromDate(dataToUpdate.createdAt) : dataToUpdate.createdAt, // Keep original createdAt
                lastModified: serverTimestamp() // Update modification time
            }, { merge: true });

            // Update local state optimisticall with JS Date for lastModified
             const updatedEstimateForState = { ...estimateData, lastModified: new Date() };
             setEstimates(prev => prev.map(est => est.id === id ? updatedEstimateForState : est)
                                     .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()) // Re-sort after update
            );


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
    const deleteEstimate = async ( /* ... params as before ... */ estimateId: string): Promise<boolean> => {
        // ... (implementation as before)
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

    // --- NEW: Duplicate Estimate ---
     const duplicateEstimate = async (estimateId: string): Promise<string | null> => {
        if (!userId) {
            setError("User not authenticated.");
            return null;
        }
        setIsLoading(true);
        setError(null);

        try {
            // 1. Get the original estimate data
            const originalEstimate = await getEstimate(estimateId);
            if (!originalEstimate) {
                throw new Error("Original estimate not found");
            }

            // 2. Prepare data for the new estimate (reset status, update dates, potentially clear totals)
            // Use Firestore Batch for counter increment + creation
             const batch = writeBatch(db);
             const counterRef = doc(countersColRef!, 'estimate'); // Assert countersColRef is non-null
             let newEstimateNumber = '00001';

             const counterSnap = await getDoc(counterRef);
             let nextCount = 1;
             if (counterSnap.exists()) {
                nextCount = (counterSnap.data()?.count || 0) + 1;
             }
             newEstimateNumber = nextCount.toString().padStart(5, '0');

             batch.set(counterRef, { count: nextCount }, { merge: true });


             // Reset fields for the duplicate
             // Convert rooms back to plain objects before saving
            const plainRooms = JSON.parse(JSON.stringify(originalEstimate.rooms));

            const duplicatedData = {
                ...originalEstimate, // Spread original data
                id: undefined, // Remove original ID
                estimateNumber: newEstimateNumber, // Assign new number
                status: 'Draft' as const, // Reset status to Draft
                createdAt: Timestamp.now(), // New creation timestamp
                lastModified: Timestamp.now(), // New modification timestamp
                // Optionally reset calculated totals
                subtotal: 0, tax: 0, total: 0, discountAmount: 0, adjustedSubtotal: 0,
                paintCost: 0, primerCost: 0, asbestosCost: 0, drywallCost: 0,
                rooms: plainRooms, // Use plain rooms data
            };
            delete duplicatedData.id; // Ensure ID is removed

            // 3. Add the new estimate document
            const newEstimateRef = doc(estimatesColRef!); // Assert estimatesColRef is non-null
            batch.set(newEstimateRef, duplicatedData);

            await batch.commit(); // Commit batch

            // 4. Add to local state
             const addedEstimate: Estimate = {
                ...duplicatedData,
                id: newEstimateRef.id,
                createdAt: new Date(), // Convert to JS Date
                lastModified: new Date(), // Convert to JS Date
                status: 'Draft', // Ensure correct type
                rooms: originalEstimate.rooms, // Keep original room structure for local state
            };
            setEstimates(prev => [addedEstimate, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()));


            return newEstimateRef.id; // Return the new ID

        } catch (err) {
            console.error("Error duplicating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to duplicate estimate.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };


    return {
        estimates,
        isLoading,
        error,
        fetchEstimates,
        createEstimate,
        updateEstimate,
        deleteEstimate,
        getEstimate,
        duplicateEstimate, // <-- Export the new function
    };
};