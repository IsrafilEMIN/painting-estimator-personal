// src/app/page.tsx
"use client";

import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

import { useEstimatorState } from '@/hooks/useEstimatorState';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { calculateEstimate } from '@/utils/calculateEstimate';
import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import Step4 from '@/components/steps/Step4';
import WallModal from '@/components/modals/WallModal';
import CeilingModal from '@/components/modals/CeilingModal';
import PopcornModal from '@/components/modals/PopcornModal';
import TrimModal from '@/components/modals/TrimModal';
import AdditionalModal from '@/components/modals/AdditionalModal';
import PricingSettingsModal from '@/components/modals/PricingSettingsModal';

export default function PaintingEstimator() {
  const { user } = useAuth();
  const { pricing, isSettingsOpen, setIsSettingsOpen, savePricing } = usePricing(user?.uid);
  const {
    currentStep,
    setCurrentStep,
    interiorWalls,
    interiorCeilings,
    popcornRemovals,
    interiorTrims,
    additionalItems,
    selectedPaintQuality,
    setSelectedPaintQuality,
    isWallModalOpen,
    setIsWallModalOpen,
    isCeilingModalOpen,
    setIsCeilingModalOpen,
    isPopcornModalOpen,
    setIsPopcornModalOpen,
    isTrimModalOpen,
    setIsTrimModalOpen,
    isAdditionalModalOpen,
    setIsAdditionalModalOpen,
    editingWall,
    setEditingWall,
    editingCeiling,
    setEditingCeiling,
    editingPopcorn,
    setEditingPopcorn,
    editingTrim,
    setEditingTrim,
    editingAdditionalItem,
    setEditingAdditionalItem,
    estimate,
    setEstimate,
    breakdown,
    setBreakdown,
    isLoading,
    setIsLoading,
    handleSaveWall,
    handleSaveCeiling,
    handleSavePopcorn,
    handleSaveTrim,
    handleSaveAdditional,
    openWallModal,
    openCeilingModal,
    openPopcornModal,
    openTrimModal,
    openAdditionalModal,
    editWall,
    editCeiling,
    editPopcorn,
    editTrim,
    editAdditionalItem,
    deleteWall,
    deleteCeiling,
    deletePopcorn,
    deleteTrim,
    deleteAdditionalItem,
    startOver,
  } = useEstimatorState();

  React.useEffect(() => {
    if (currentStep === 4 && selectedPaintQuality) {
      setIsLoading(true);
      const { total, breakdown } = calculateEstimate(
        interiorWalls,
        interiorCeilings,
        popcornRemovals,
        interiorTrims,
        additionalItems,
        selectedPaintQuality,
        pricing
      );
      setEstimate(total);
      setBreakdown(breakdown);
      setIsLoading(false);
    }
  }, [currentStep, interiorWalls, interiorCeilings, popcornRemovals, interiorTrims, additionalItems, selectedPaintQuality, pricing]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen px-6 py-24 font-sans">
      <style>{`
        .btn-primary { background-color: #093373; color: #ffffff; }
        .btn-primary:hover { background-color: #0c4194; }
        .btn-secondary { background-color: #e0e7ff; color: #162733; }
        .btn-secondary:hover { background-color: #c7d2fe; }
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Inter:wght@400;700&display=swap');
        .font-serif { font-family: 'Lora', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        
        /* --- DARK MODE FIXES --- */
        @media (prefers-color-scheme: dark) {
            /* This rule changes the text on various gray backgrounds to be light */
            .text-gray-600, .text-gray-700, .text-gray-900, .text-[#162733] {
                color: #e2e8f0 !important; /* A light gray for dark mode */
            }
            
            /* This rule now correctly targets BOTH the white cards AND the main page background */
            .bg-white, .bg-[#f0f2f5] {
                background-color: #1a202c !important; /* A dark background for contrast */
            }
            .bg-gray-50 {
                background-color: #2d3748 !important;
            }
            .border-gray-200 {
                border-color: #4a5568 !important;
            }
            .border-gray-400 {
                border-color: #718096 !important;
            }
            .border-red-500 {
                border-color: #f56565 !important;
            }
        }
      `}</style>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl">
        <div className="relative app-container p-6 md:p-10">
          {currentStep === 1 && (
            <Step1
              setCurrentStep={setCurrentStep}
              setIsSettingsOpen={setIsSettingsOpen}
              handleLogout={handleSignOut}
            />
          )}
          {currentStep === 2 && (
            <Step2
              interiorWalls={interiorWalls}
              editWall={editWall}
              deleteWall={deleteWall}
              interiorCeilings={interiorCeilings}
              editCeiling={editCeiling}
              deleteCeiling={deleteCeiling}
              popcornRemovals={popcornRemovals}
              editPopcorn={editPopcorn}
              deletePopcorn={deletePopcorn}
              interiorTrims={interiorTrims}
              editTrim={editTrim}
              deleteTrim={deleteTrim}
              additionalItems={additionalItems}
              editAdditionalItem={editAdditionalItem}
              deleteAdditionalItem={deleteAdditionalItem}
              openWallModal={openWallModal}
              openCeilingModal={openCeilingModal}
              openPopcornModal={openPopcornModal}
              openTrimModal={openTrimModal}
              openAdditionalModal={openAdditionalModal}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === 3 && (
            <Step3
              selectedPaintQuality={selectedPaintQuality}
              setSelectedPaintQuality={setSelectedPaintQuality}
              setCurrentStep={setCurrentStep}
            />
          )}
          {currentStep === 4 && (
            <Step4
              isLoading={isLoading}
              breakdown={breakdown}
              estimate={estimate}
              formatCurrency={formatCurrency}
              setCurrentStep={setCurrentStep}
              startOver={startOver}
              setIsSettingsOpen={setIsSettingsOpen}
            />
          )}
        </div>
      </div>
      {isWallModalOpen && <WallModal key={editingWall?.id || 'new'} wall={editingWall} onSave={handleSaveWall} onClose={() => { setIsWallModalOpen(false); setEditingWall(null); }} />}
      {isCeilingModalOpen && <CeilingModal key={editingCeiling?.id || 'new'} ceiling={editingCeiling} onSave={handleSaveCeiling} onClose={() => { setIsCeilingModalOpen(false); setEditingCeiling(null); }} />}
      {isPopcornModalOpen && <PopcornModal key={editingPopcorn?.id || 'new'} popcorn={editingPopcorn} onSave={handleSavePopcorn} onClose={() => { setIsPopcornModalOpen(false); setEditingPopcorn(null); }} />}
      {isTrimModalOpen && <TrimModal key={editingTrim?.id || 'new'} trim={editingTrim} onSave={handleSaveTrim} onClose={() => { setIsTrimModalOpen(false); setEditingTrim(null); }} />}
      
      {/* --- THIS IS THE FIX --- */}
      {isAdditionalModalOpen && <AdditionalModal key={editingAdditionalItem?.id || 'new'} item={editingAdditionalItem} onSave={handleSaveAdditional} onClose={() => { setIsAdditionalModalOpen(false); setEditingAdditionalItem(null); }} />}
      
      {isSettingsOpen && <PricingSettingsModal pricing={pricing} onSave={savePricing} onClose={() => setIsSettingsOpen(false)} />}
      <div className="mt-4 text-center">
        {!user ? (
          <button onClick={handleSignIn} className="btn-primary font-bold py-2 px-4 rounded-lg">Sign In with Google</button>
        ) : (
          <div>
            <p>Welcome, {user.displayName}</p>
            <button onClick={handleSignOut} className="btn-secondary font-bold py-2 px-4 rounded-lg">Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );
}