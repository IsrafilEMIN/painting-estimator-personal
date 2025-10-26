// src/app/estimate/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EstimateEditor from '@/components/EstimateEditor';
import type { Estimate, Customer, Pricing } from '@/types/paintingEstimator';
import { useAuth } from '@/hooks/useAuth';
import { useEstimates } from '@/hooks/useEstimates'; // Import full hook
import { useCustomers } from '@/hooks/useCustomers'; // Import full hook
import { usePricing } from '@/hooks/usePricing'; // Import pricing hook
import { calculateEstimate } from '@/utils/calculateEstimate';

// Remove mock data

export default function EstimatePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const estimateId = params.id as string;

    // Use hooks for data fetching and actions
    const { getEstimate, updateEstimate, isLoading: isLoadingEstimateHook, error: errorEstimateHook } = useEstimates(user?.uid);
    const { getCustomer, isLoading: isLoadingCustomerHook } = useCustomers(user?.uid); // Only need getCustomer here
    const { pricing, isLoading: isLoadingPricing, savePricing } = usePricing(user?.uid); // Get pricing data

    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    // Combine loading states
    const [pageLoading, setPageLoading] = useState(true); // Initial page load state
    const [pageError, setPageError] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        if (!user) {
             // Redirect immediately if no user
             router.push('/');
            return;
        }

        if (estimateId && user.uid) { // Ensure user.uid is available
            setPageLoading(true);
            setPageError(null);
            console.log(`Fetching estimate data for ID: ${estimateId}`);

            const fetchData = async () => {
                const fetchedEstimate = await getEstimate(estimateId);

                if (fetchedEstimate) {
                    setEstimate(fetchedEstimate);
                    if (fetchedEstimate.customerId) {
                        const fetchedCustomer = await getCustomer(fetchedEstimate.customerId);
                        setCustomer(fetchedCustomer);
                    } else {
                        setCustomer(null); // No customer linked
                    }
                } else {
                     setPageError(`Estimate with ID ${estimateId} not found or access denied.`);
                }
                 setPageLoading(false);
            };

            fetchData();
        } else if (estimateId !== 'new') { // Handle cases where ID might be missing but not 'new'
              setPageError("Invalid estimate ID provided.");
              setPageLoading(false);
        } else {
            // Handle 'new' case if needed (though creation flow in Dashboard is preferred)
             console.warn("Direct navigation to '/estimate/new' is not the primary flow.");
             setPageError("Cannot directly create estimate here. Use the dashboard.");
             setPageLoading(false);
        }
    }, [estimateId, user, getEstimate, getCustomer, router]); // Add dependencies
    // --- End Data Fetching ---

    // --- Save Handler ---
    const handleSaveEstimate = async (updatedEstimate: Estimate) => {
        if (!user) return; // Guard against saving when logged out

        // The updateEstimate hook handles loading state internally
        const success = await updateEstimate(updatedEstimate);

        if (success) {
            // Update local state immediately after successful save
            // Note: updateEstimate already updates the list state in useEstimates,
            // but we might need to update the single estimate state here too.
             setEstimate(prev => ({ ...prev, ...updatedEstimate, lastModified: new Date() })); // Use JS date for local state
            alert('Estimate saved successfully!');
            // Optional: navigate back after save
            // router.push('/');
        } else {
            alert('Error saving estimate. Please check console and try again.');
        }
    };
    // --- End Save Handler ---

    // Combine loading states
    const isLoading = pageLoading || isLoadingEstimateHook || isLoadingCustomerHook || isLoadingPricing;


    if (isLoading) {
        return <div className="p-8 text-center">Loading estimate data...</div>;
    }

    // Prioritize page error (e.g., not found) over hook errors during initial load
    if (pageError) {
         return <div className="p-8 text-center text-red-600">{pageError}</div>;
    }
    // Show hook error if fetching failed after initial load check
    if (errorEstimateHook) {
         return <div className="p-8 text-center text-red-600">Error loading estimate: {errorEstimateHook}</div>;
    }


    if (!estimate) {
         return <div className="p-8 text-center">Estimate data could not be loaded or does not exist.</div>;
    }


    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen font-sans p-4 md:p-8">
            <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                 <header className="flex justify-between items-center px-8 py-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 truncate pr-4">
                        {estimate.status === 'Draft' ? 'Editing' : 'Viewing'} Estimate #{estimate.estimateNumber} for {estimate.customerName}
                    </h1>
                     <button
                        onClick={() => router.push('/')}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-4 rounded-md transition text-sm flex-shrink-0"
                    >
                        Back to Dashboard
                    </button>
                </header>
                {/* Main Content */}
                <main className="p-8">
                     <EstimateEditor
                        initialEstimate={estimate}
                        customer={customer}
                        onSave={handleSaveEstimate}
                        pricing={pricing} // Pass real pricing data
                        calculateEstimateFn={calculateEstimate}
                    />
                </main>
                 {/* Optional: Add Pricing Settings Modal Trigger */}
                {/* <button onClick={() => setIsSettingsOpen(true)}>Pricing Settings</button>
                {isSettingsOpen && <PricingSettingsModal ... />} */}
            </div>
        </div>
    );
}