// src/app/page.tsx
"use client";

import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard'; // Import the new Dashboard component
// Remove unused imports like usePricing, useEstimatorState, steps, modals etc.

export default function HomePage() {
  const { user } = useAuth();
  // Keep authentication logic if needed, but remove estimator state management
  // const { pricing, isSettingsOpen, setIsSettingsOpen, savePricing } = usePricing(user?.uid); // Keep if settings are global
  // Remove estimator state hooks

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen font-sans p-4 md:p-8">
       {/* Keep the outer container if you like the gradient background */}
       <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header (Optional - Can be moved into Dashboard or kept here) */}
        <header className="mb-0 flex justify-between items-center px-8 py-6 bg-blue-600 dark:bg-blue-800 text-white">
          <h1 className="text-3xl font-bold">Painting Estimator Dashboard</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Keep Settings button if managed outside Dashboard */}
                {/* <button onClick={() => setIsSettingsOpen(true)} className="hover:underline">Settings</button> */}
                <button onClick={handleSignOut} className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 py-1 px-3 rounded-md transition">Sign Out</button>
              </>
            ) : (
              <button onClick={handleSignIn} className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 py-1 px-3 rounded-md transition hover:bg-gray-100 dark:hover:bg-gray-600">Sign In with Google</button>
            )}
          </div>
        </header>

        {/* Render Dashboard or Login Prompt */}
        <main className="p-8">
            {user ? (
                <Dashboard />
            ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold mb-4">Please Sign In</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in with Google to access your estimates.</p>
                    <button onClick={handleSignIn} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition">
                        Sign In with Google
                    </button>
                </div>
            )}
        </main>

        {/* Remove Modals related to old steps (RoomModal, ServiceModal, PricingSettingsModal if not global) */}
        {/* {isSettingsOpen && (
          <PricingSettingsModal
            pricing={pricing}
            onSave={savePricing}
            onClose={() => setIsSettingsOpen(false)}
          />
        )} */}
       </div>
    </div>
  );
}