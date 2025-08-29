// src/components/steps/Step4.tsx
import React from 'react';

// This is the new, more detailed breakdown structure
interface DetailedBreakdownItem {
  id: string;
  laborCost: number;
  materialCost: number;
  totalPrice: number;
}

interface Step4Props {
  isLoading: boolean;
  breakdown: DetailedBreakdownItem[]; // Use the new type here
  estimate: number;
  formatCurrency: (value: number) => string;
  setCurrentStep: (step: number) => void;
  startOver: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const Step4: React.FC<Step4Props> = ({
  isLoading,
  breakdown,
  estimate,
  formatCurrency,
  setCurrentStep,
  startOver,
  setIsSettingsOpen,
}) => {
  if (isLoading) {
    return <div className="text-center text-gray-600 py-8">Calculating your estimate...</div>;
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-serif font-bold text-[#162733] mb-6">Your Painting Estimate</h2>
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8">
        <table className="w-full text-left text-gray-900">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4 text-right">Cost</th>
            </tr>
          </thead>
          {/* Use a separate tbody for each item group for better structure */}
          {breakdown.map((item, index) => (
            <tbody key={index} className="border-b">
              {/* Main Item Row */}
              <tr>
                <td className="py-3 px-4 font-semibold">{item.id}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
              </tr>
              {/* Sub-item for Labor */}
              <tr>
                <td className="py-1 px-4 pl-8 text-gray-600">› Labor</td>
                <td className="py-1 px-4 text-right text-gray-600">{formatCurrency(item.laborCost)}</td>
              </tr>
              {/* Sub-item for Materials */}
              <tr>
                <td className="py-1 px-4 pl-8 text-gray-600">› Materials</td>
                <td className="py-1 px-4 text-right text-gray-600">{formatCurrency(item.materialCost)}</td>
              </tr>
            </tbody>
          ))}
          <tfoot>
            <tr className="border-t-2 border-gray-400">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Total Estimate</td>
              <td className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(estimate)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-col items-center gap-4">
        <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Adjust Pricing</button>
        <div className="flex gap-4">
          <button onClick={() => setCurrentStep(3)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
          <button onClick={startOver} className="btn-secondary font-bold py-2 px-6 rounded-lg">Start Over</button>
        </div>
      </div>
    </div>
  );
};

export default Step4;