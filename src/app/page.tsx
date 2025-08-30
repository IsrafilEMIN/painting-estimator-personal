// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
    rooms, setRooms,
    isRoomModalOpen, setIsRoomModalOpen,
    editingRoom, setEditingRoom,
    openRoomModal, handleSaveRoom, duplicateRoom, deleteRoom,
    isServiceModalOpen, setIsServiceModalOpen,
    editingService, setEditingService,
    openServiceModal, handleSaveService, deleteService,
    estimate, setEstimate,
    subtotal, setSubtotal,
    tax, setTax,
    breakdown, setBreakdown,
    isLoading, setIsLoading,
    startOver,
  } = useEstimatorState();

  useEffect(() => {
    if (currentStep === 3) {
      setIsLoading(true);
      const { total, breakdown, subtotal, tax } = calculateEstimate(rooms, pricing);
      setEstimate(total);
      setBreakdown(breakdown);
      setSubtotal(subtotal);
      setTax(tax);
      setIsLoading(false);
    }
  }, [currentStep, rooms, pricing]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const canProceedToCalculate = rooms.length > 0 && rooms.every(room => room.services.length > 0);

  return (
    <div className="bg-gray-100 min-h-screen font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Painting Estimator</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSettingsOpen(true)} className="text-gray-600 hover:text-blue-500">Settings</button>
                <button onClick={handleSignOut} className="bg-red-500 text-white py-1 px-3 rounded-md">Sign Out</button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="bg-blue-500 text-white py-1 px-3 rounded-md">Sign In</button>
            )}
          </div>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-8">
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
            isLoading ? <p>Calculating...</p> : <Step3
              isLoading={isLoading}
              breakdown={breakdown}
              subtotal={subtotal}
              tax={tax}
              total={estimate}
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