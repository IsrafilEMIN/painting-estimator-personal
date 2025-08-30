// src/components/steps/Step1.tsx
import React from 'react';

interface Step1Props {
  setCurrentStep: (step: number) => void;
  setIsSettingsOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const Step1: React.FC<Step1Props> = ({ setCurrentStep, setIsSettingsOpen, handleLogout }) => {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to the Painting Estimator</h2>
      <p className="mb-6">Get a quick and accurate estimate for your painting project.</p>
      <button onClick={() => setCurrentStep(2)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
        Start Estimate
      </button>
      <div className="mt-4">
        <button onClick={() => setIsSettingsOpen(true)} className="text-gray-600 hover:text-blue-500 mr-4">Settings</button>
        <button onClick={handleLogout} className="text-gray-600 hover:text-blue-500">Logout</button>
      </div>
    </div>
  );
};

export default Step1;