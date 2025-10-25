// src/app/estimate/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use next/navigation for App Router
import EstimateEditor from '@/components/EstimateEditor';
import type { Estimate, Customer } from '@/types/paintingEstimator'; // Make sure types are updated
import { useAuth } from '@/hooks/useAuth'; // To ensure user is logged in
import { DEFAULT_PRICING } from '@/constants/pricing'; // Needed for calculation
import { calculateEstimate } from '@/utils/calculateEstimate'; // Needed for calculation


// --- Mock Data (Replace with actual data fetching later) ---
const mockCustomer: Customer = { id: 'cust1', name: 'John Doe', email: 'john@example.com', address: '123 Main St', createdAt: new Date() };
const mockEstimate: Estimate = {
    id: 'est123', // Example ID
    customerId: 'cust1',
    customerName: 'John Doe',
    projectAddress: '123 Main St, Anytown',
    estimateNumber: '00004',
    status: 'Draft',
    createdAt: new Date(),
    lastModified: new Date(),
    subtotal: 0,
    tax: 0,
    total: 0,
    discountAmount: 0,
    adjustedSubtotal: 0,
    paintCost: 0,
    primerCost: 0,
    asbestosCost: 0,
    rooms: [
        // Add some mock rooms if you want initial data
        // { id: 1, name: 'Living Room', height: 9, prepHours: 2, services: [] }
    ],
};
// --- End Mock Data ---


export default function EstimatePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const estimateId = params.id as string; // Get estimate ID from URL

    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching Simulation ---
    useEffect(() => {
        if (!user) {
            // Redirect to login or dashboard if not authenticated
            // For now, just show error
             setError("Please sign in to view estimates.");
             setIsLoading(false);
            // router.push('/'); // Uncomment later
            return;
        }

        if (estimateId) {
            setIsLoading(true);
            setError(null);
            console.log(`Fetching estimate with ID: ${estimateId}`);
            // --- TODO: Replace with actual Firestore fetching ---
            // Example: Fetch estimate and associated customer data based on estimateId and user.uid
            setTimeout(() => {
                if (estimateId === 'new') { // Placeholder for creating a new one
                    // In reality, you'd create a draft in Firestore first and get its ID
                     setEstimate({ ...mockEstimate, id: 'temp-new-id', customerId: 'temp-cust-id', customerName: 'New Customer', projectAddress: 'New Address' }); // Adjust as needed
                     setCustomer(null); // Or fetch/create customer based on previous step
                } else if (estimateId === mockEstimate.id) { // Simulate finding the mock estimate
                    setEstimate(mockEstimate);
                    setCustomer(mockCustomer);
                } else {
                    setError(`Estimate with ID ${estimateId} not found.`);
                }
                setIsLoading(false);
            }, 500);
            // --- End Firestore fetching ---
        } else {
             setError("No estimate ID provided.");
             setIsLoading(false);
        }
    }, [estimateId, user, router]);
    // --- End Data Fetching ---

    const handleSaveEstimate = async (updatedEstimate: Estimate) => {
        if (!user) return;
        console.log('Saving estimate:', updatedEstimate);
        // --- TODO: Implement Firestore save logic ---
        // Example: await setDoc(doc(db, `users/${user.uid}/estimates/${updatedEstimate.id}`), updatedEstimate);
        alert('Estimate saved (simulated)');
        setEstimate(updatedEstimate); // Update local state
        // Optionally navigate back to dashboard or show success message
        // router.push('/');
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading estimate...</div>;
    }

    if (error) {
         return <div className="p-8 text-center text-red-600">{error}</div>;
    }

    if (!estimate) {
         return <div className="p-8 text-center">Estimate data could not be loaded.</div>;
    }


    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen font-sans p-4 md:p-8">
            <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                 {/* Simple Header for Editor */}
                 <header className="flex justify-between items-center px-8 py-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Editing Estimate #{estimate.estimateNumber} for {estimate.customerName}
                    </h1>
                     <button
                        onClick={() => router.push('/')} // Navigate back to dashboard
                        className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-4 rounded-md transition text-sm"
                    >
                        Back to Dashboard
                    </button>
                </header>
                <main className="p-8">
                     <EstimateEditor
                        initialEstimate={estimate}
                        customer={customer} // Pass customer info if available
                        onSave={handleSaveEstimate}
                        pricing={DEFAULT_PRICING} // Pass actual pricing later
                        calculateEstimateFn={calculateEstimate} // Pass calculation function
                    />
                </main>
            </div>
        </div>
    );
}