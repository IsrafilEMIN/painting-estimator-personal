// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming this exists
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { useEstimatorState } from '@/hooks/useEstimatorState';
import { calculateEstimate } from '@/utils/calculateEstimate';
import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import RoomModal from '@/components/modals/RoomModal';
import ServiceModal from '@/components/modals/ServiceModal'; // New unified ServiceModal
import PricingSettingsModal from '@/components/modals/PricingSettingsModal';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function PaintingEstimator() {
  const { user } = useAuth();
  const { pricing, isSettingsOpen, setIsSettingsOpen, savePricing } = usePricing(user?.uid);
  const {
    currentStep, setCurrentStep,
    rooms,
    isRoomModalOpen, setIsRoomModalOpen,
    editingRoom, setEditingRoom,
    openRoomModal, handleSaveRoom, duplicateRoom, deleteRoom,
    isServiceModalOpen, setIsServiceModalOpen,
    editingService, setEditingService,
    openServiceModal, handleSaveService, deleteService,
    estimate, setEstimate,
    subtotal, setSubtotal,
    tax, setTax,
    paintCost, setPaintCost,
    primerCost, setPrimerCost,
    breakdown, setBreakdown,
    isLoading, setIsLoading,
    startOver,
  } = useEstimatorState();

  useEffect(() => {
    if (currentStep === 3) {
      setIsLoading(true);
      const { total, breakdown, subtotal, tax, paintCost: pc, primerCost: prc } = calculateEstimate(rooms, pricing);
      setEstimate(total);
      setBreakdown(breakdown);
      setSubtotal(subtotal);
      setTax(tax);
      setPaintCost(pc);
      setPrimerCost(prc);
      setIsLoading(false);
    }
  }, [currentStep, rooms, pricing, setEstimate, setBreakdown, setSubtotal, setTax, setPaintCost, setPrimerCost, setIsLoading]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const canProceedToCalculate = rooms.length > 0 && rooms.every(room => room.services.length > 0);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen font-sans flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <header className="mb-8 flex justify-between items-center px-8 py-6 bg-blue-600 text-white">
          <h1 className="text-3xl font-bold">Painting Estimator</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button onClick={() => setIsSettingsOpen(true)} className="hover:underline">Settings</button>
                <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 py-1 px-3 rounded-md transition">Sign Out</button>
              </>
            ) : (
              <button onClick={handleSignIn} className="bg-white text-blue-600 py-1 px-3 rounded-md transition hover:bg-gray-100">Sign In</button>
            )}
          </div>
        </header>

        <main className="p-8 transition-all duration-300">
          {currentStep === 1 && <Step1 setCurrentStep={setCurrentStep} setIsSettingsOpen={setIsSettingsOpen} handleLogout={handleSignOut} />}
          {currentStep === 2 && (
            <Step2
              rooms={rooms}
              openRoomModal={openRoomModal}
              duplicateRoom={duplicateRoom}
              deleteRoom={deleteRoom}
              openServiceModal={openServiceModal}
              deleteService={deleteService}
              setCurrentStep={setCurrentStep}
              canProceed={canProceedToCalculate}
            />
          )}
          {currentStep === 3 && (
            isLoading ? <p className="text-center text-lg">Calculating...</p> : <Step3
              isLoading={isLoading}
              breakdown={breakdown}
              subtotal={subtotal}
              tax={tax}
              total={estimate}
              paintCost={paintCost}
              primerCost={primerCost}
              formatCurrency={formatCurrency}
              setCurrentStep={setCurrentStep}
              startOver={startOver}
              setIsSettingsOpen={setIsSettingsOpen}
            />
          )}
        </main>

        {isRoomModalOpen && (
          <RoomModal
            room={editingRoom}
            onSave={handleSaveRoom}
            onClose={() => { setIsRoomModalOpen(false); setEditingRoom(undefined); }}
          />
        )}

        {isServiceModalOpen && editingService && (
          <ServiceModal
            room={rooms.find(r => r.id === editingService.roomId)}
            service={editingService.service}
            onSave={handleSaveService}
            onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
          />
        )}

        {isSettingsOpen && (
          <PricingSettingsModal
            pricing={pricing}
            onSave={savePricing}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}