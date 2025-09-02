// src/components/steps/Step1.tsx
import React from 'react';

interface Step1Props {
  setCurrentStep: (step: number) => void;
  setIsSettingsOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const Step1: React.FC<Step1Props> = ({ setCurrentStep }) => {
  return (
    <div className="text-center p-8 bg-white rounded-xl shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to the Painting Estimator</h2>
      <p className="text-gray-600 mb-6">Get a quick and accurate estimate for your painting project.</p>
      <button onClick={() => setCurrentStep(2)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105">
        Start Estimate
      </button>
    </div>
  );
};

export default Step1;