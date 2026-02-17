"use client";

import React from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';

export default function HomePage() {
  const { user } = useAuth();
  const allowedGoogleEmail = process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL?.trim().toLowerCase();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);

    if (allowedGoogleEmail && result.user.email && result.user.email.toLowerCase() !== allowedGoogleEmail) {
      await signOut(auth);
      window.alert(`Please sign in with ${allowedGoogleEmail}.`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_45%),radial-gradient(circle_at_bottom_right,#fef3c7,transparent_50%),#f8fafc] px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {user ? (
          <main>
            <Dashboard onSignOut={handleSignOut} userEmail={user.email} />
          </main>
        ) : (
          <main className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Painting Estimator</p>
            <h2 className="text-3xl font-bold text-slate-900">Sign In to Access Operations</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 md:text-base">
              Monitor the full lead-to-estimate-to-customer lifecycle, keep bid activity visible, and track painter
              workload from one control panel.
            </p>
            <button
              onClick={handleSignIn}
              className="mt-6 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Continue with Google
            </button>
          </main>
        )}
      </div>
    </div>
  );
}
