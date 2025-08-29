// src/components/steps/Step1.tsx
import React from 'react';

interface Step1Props {
  setCurrentStep: (step: number) => void;
  setIsSettingsOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const Step1: React.FC<Step1Props> = ({ setCurrentStep, setIsSettingsOpen, handleLogout }) => {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-4xl font-serif font-bold text-[#162733] mb-4">Interior Painting Estimator</h1>
      <p className="text-gray-600 mb-8">Build accurate, profitable quotes for your interior painting projects.</p>
      <div className="flex justify-center mb-8 gap-4">
        <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Adjust Pricing</button>
        <button onClick={handleLogout} className="btn-secondary font-bold py-2 px-6 rounded-lg">Logout</button>
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep(2)}
          className="btn-primary font-bold py-3 px-8 rounded-lg"
        >
          Let&apos;s Get Started
        </button>
      </div>
    </div>
  );
};

export default Step1;