// src/app/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
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
    discountAmount, setDiscountAmount,
    adjustedSubtotal, setAdjustedSubtotal,
    paintCost, setPaintCost,
    primerCost, setPrimerCost,
    breakdown, setBreakdown,
    isLoading, setIsLoading,
    asbestosCost, setAsbestosCost,
    startOver,
  } = useEstimatorState();
  const [drywallCost, setDrywallCost] = useState(0);

  useEffect(() => {
    if (currentStep === 3) {
      setIsLoading(true);
      const { total, breakdown, subtotal, tax, discountAmount, adjustedSubtotal, paintCost: pc, primerCost: prc, asbestosCost } = calculateEstimate(rooms, pricing);
      setEstimate(total);
      setBreakdown(breakdown);
      setSubtotal(subtotal);
      setTax(tax);
      setDiscountAmount(discountAmount);
      setAdjustedSubtotal(adjustedSubtotal);
      setPaintCost(pc);
      setPrimerCost(prc);
      setAsbestosCost(asbestosCost);
      setIsLoading(false);
    }
  }, [currentStep, rooms, pricing, setEstimate, setBreakdown, setSubtotal, setTax, setDiscountAmount, setAdjustedSubtotal, setPaintCost, setPrimerCost, setAsbestosCost, setDrywallCost, setIsLoading]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const canProceedToCalculate = rooms.length > 0 && rooms.every(room => room.services.length > 0);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen font-sans flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <header className="mb-8 flex justify-between items-center px-8 py-6 bg-blue-600 dark:bg-blue-800 text-white">
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button onClick={() => setIsSettingsOpen(true)} className="hover:underline">Settings</button>
                <button onClick={handleSignOut} className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 py-1 px-3 rounded-md transition">Sign Out</button>
              </>
            ) : (
              <button onClick={handleSignIn} className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 py-1 px-3 rounded-md transition hover:bg-gray-100 dark:hover:bg-gray-600">Sign In</button>
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
              setIsLoading={setIsLoading}
            />
          )}
          {currentStep === 3 && (
            isLoading ? <p className="text-center text-lg text-gray-800 dark:text-gray-200">Calculating...</p> : <Step3
              isLoading={isLoading}
              breakdown={breakdown}
              subtotal={subtotal}
              tax={tax}
              total={estimate}
              discountAmount={discountAmount}
              adjustedSubtotal={adjustedSubtotal}
              paintCost={paintCost}
              primerCost={primerCost}
              formatCurrency={formatCurrency}
              setCurrentStep={setCurrentStep}
              startOver={startOver}
              setIsSettingsOpen={setIsSettingsOpen}
              asbestosCost={asbestosCost}
              drywallCost={drywallCost}
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