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
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Start true
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

    const estimatesColRef = userId ? collection(db, `users/${userId}/estimates`) : null;
    const countersColRef = userId ? collection(db, `users/${userId}/counters`) : null;

    // --- Fetch All Estimates ---
    const fetchEstimates = useCallback(async () => {
        setHasAttemptedFetch(false); // Reset attempt flag on new fetch
        setIsLoading(true); // Ensure loading is true when fetch starts
        setError(null);

        if (!estimatesColRef) {
            setEstimates([]);
            setIsLoading(false);
            setHasAttemptedFetch(true); // Mark attempt as complete even if no user
            return;
        }

        try {
            const q = query(estimatesColRef, orderBy('lastModified', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedEstimates: Estimate[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                fetchedEstimates.push({
                    id: doc.id,
                    ...convertTimestamps(data),
                } as Estimate);
            });
            setEstimates(fetchedEstimates);
        } catch (err) {
            console.error("Error fetching estimates:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch estimates.");
             setEstimates([]); // Clear estimates on error
        } finally {
            setIsLoading(false); // Stop loading
            setHasAttemptedFetch(true); // Mark attempt as complete
        }
    }, [estimatesColRef]); // Dependency on ref

    // Fetch estimates when userId changes
    useEffect(() => {
        fetchEstimates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]); // Rerun fetch only when userId changes


    // --- Get Single Estimate ---
     const getEstimate = useCallback(async (estimateId: string): Promise<Estimate | null> => {
          if (!userId) return null;
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
                console.warn(`Estimate ${estimateId} not found.`);
                return null;
            }
        } catch (err) {
            console.error("Error fetching estimate:", err);
            return null;
        }
    }, [userId]);

     // --- Create New Estimate ---
     // Signature now includes projectAddress
    const createEstimate = async (
        customerId: string,
        customerName: string,
        projectAddress: string // Add projectAddress parameter
    ): Promise<string | null> => {
         if (!userId || !estimatesColRef || !countersColRef) {
            setError("User not authenticated.");
            return null;
        }
        // Don't set global loading for create
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

             // Include projectAddress in the data to save
             const dataToSave = {
                customerId,
                customerName,
                projectAddress, // Use the passed-in value (initially empty string)
                estimateNumber: newEstimateNumber,
                status: 'Draft' as const,
                createdAt: Timestamp.now(),
                lastModified: Timestamp.now(),
                subtotal: 0, tax: 0, total: 0, discountAmount: 0, adjustedSubtotal: 0,
                paintCost: 0, primerCost: 0, asbestosCost: 0,
                rooms: [],
            };

            const newEstimateRef = doc(estimatesColRef);
            batch.set(newEstimateRef, dataToSave);

            await batch.commit();

            const createdEstimate: Estimate = {
                ...dataToSave,
                id: newEstimateRef.id,
                createdAt: dataToSave.createdAt.toDate(),
                lastModified: dataToSave.lastModified.toDate(),
                status: 'Draft',
                rooms: [],
            };
            setEstimates(prev => [createdEstimate, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()));

            return newEstimateRef.id;
        } catch (err) {
            console.error("Error creating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to create estimate.");
            return null;
        }
    };

    // --- Update Estimate ---
    const updateEstimate = async (estimateData: Estimate): Promise<boolean> => {
        if (!userId) {
            setError("User not authenticated.");
            return false;
        }
        setError(null);
        try {
            const { id, ...dataToUpdate } = estimateData;
            const estimateRef = doc(db, `users/${userId}/estimates`, id);

            const plainData: { [key: string]: any } = {};
            for (const key in dataToUpdate) {
                if (key !== 'createdAt' && key !== 'lastModified' && Object.prototype.hasOwnProperty.call(dataToUpdate, key)) {
                     plainData[key] = JSON.parse(JSON.stringify((dataToUpdate as any)[key]));
                }
            }

            let createdAtTimestamp: Timestamp;
            const incomingCreatedAt = dataToUpdate.createdAt;

            if (incomingCreatedAt instanceof Date) {
                createdAtTimestamp = Timestamp.fromDate(incomingCreatedAt);
            } else if (incomingCreatedAt && typeof (incomingCreatedAt as any).toDate === 'function') {
                createdAtTimestamp = incomingCreatedAt as Timestamp;
            } else {
                console.warn("createdAt was not a valid Date or Timestamp during update, resetting to now.");
                createdAtTimestamp = Timestamp.now();
            }

            await setDoc(estimateRef, {
                ...plainData,
                createdAt: createdAtTimestamp,
                lastModified: serverTimestamp()
            }, { merge: true });

             const updatedEstimateForState: Estimate = {
                ...estimateData,
                createdAt: createdAtTimestamp.toDate(),
                lastModified: new Date()
            };
            setEstimates(prev => prev.map(est => est.id === id ? updatedEstimateForState : est)
                                     .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()));

            return true;
        } catch (err) {
            console.error("Error updating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to update estimate.");
            return false;
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
        }
    };

     // --- Duplicate Estimate ---
     const duplicateEstimate = async (estimateId: string): Promise<string | null> => {
         if (!userId || !estimatesColRef || !countersColRef) {
            setError("User not authenticated or refs not initialized.");
            return null;
        }
        // Use hook's isLoading for duplication feedback
        setIsLoading(true);
        setError(null);

        try {
            const originalEstimate = await getEstimate(estimateId);
            if (!originalEstimate) {
                throw new Error("Original estimate not found");
            }

            const batch = writeBatch(db);
            const counterRef = doc(countersColRef, 'estimate');
            let newEstimateNumber = '00001';

            const counterSnap = await getDoc(counterRef);
            let nextCount = 1;
            if (counterSnap.exists()) {
               nextCount = (counterSnap.data()?.count || 0) + 1;
            }
            newEstimateNumber = nextCount.toString().padStart(5, '0');

            batch.set(counterRef, { count: nextCount }, { merge: true });

            const plainRooms = JSON.parse(JSON.stringify(originalEstimate.rooms));

            // Ensure projectAddress is copied from original
            const duplicatedData = {
                customerId: originalEstimate.customerId,
                customerName: originalEstimate.customerName,
                projectAddress: originalEstimate.projectAddress, // Copy project address
                estimateNumber: newEstimateNumber,
                status: 'Draft' as const,
                createdAt: Timestamp.now(),
                lastModified: Timestamp.now(),
                subtotal: 0, tax: 0, total: 0, discountAmount: 0, adjustedSubtotal: 0,
                paintCost: 0, primerCost: 0, asbestosCost: 0,
                rooms: plainRooms,
                startDate: originalEstimate.startDate || '',
                completionDate: originalEstimate.completionDate || '',
            };

            const newEstimateRef = doc(estimatesColRef);
            batch.set(newEstimateRef, duplicatedData);

            await batch.commit();

            const addedEstimate: Estimate = {
                ...duplicatedData,
                id: newEstimateRef.id,
                createdAt: new Date(),
                lastModified: new Date(),
                status: 'Draft',
                rooms: originalEstimate.rooms, // Use original rooms for local state
            };
            setEstimates(prev => [addedEstimate, ...prev].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()));

            return newEstimateRef.id;

        } catch (err) {
            console.error("Error duplicating estimate:", err);
            setError(err instanceof Error ? err.message : "Failed to duplicate estimate.");
            return null;
        } finally {
            setIsLoading(false); // Stop loading after duplication attempt
        }
    };


    return {
        estimates,
        isLoading,
        error,
        hasAttemptedFetch,
        fetchEstimates,
        createEstimate,
        updateEstimate,
        deleteEstimate,
        getEstimate,
        duplicateEstimate,
    };
};
