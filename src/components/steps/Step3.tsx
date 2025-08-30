// src/components/steps/Step3.tsx
import React from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface Step3Props {
  isLoading: boolean;
  breakdown: DetailedBreakdownItem[];
  subtotal: number;
  tax: number;
  total: number;
  formatCurrency: (value: number) => string;
  setCurrentStep: (step: number) => void;
  startOver: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const Step3: React.FC<Step3Props> = ({
  isLoading,
  breakdown,
  subtotal,
  tax,
  total,
  formatCurrency,
  setCurrentStep,
  startOver,
  setIsSettingsOpen,
}) => {
  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  if (isLoading) return <div className="text-center p-8">Calculating...</div>;

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-serif font-bold text-[#162733] mb-6">Estimate Breakdown</h2>
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8">
        <table className="w-full text-left text-gray-900">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 px-4">Room/Service</th>
              <th className="py-2 px-4 text-right">Labor</th>
              <th className="py-2 px-4 text-right">Material</th>
              <th className="py-2 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map(item => (
              <React.Fragment key={item.roomId}>
                <tr className="border-b">
                  <td className="py-3 px-4 font-semibold">{item.roomName} (Base)</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.baseLabor)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.baseMaterial)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.roomTotal)}</td>
                </tr>
                {item.services.map(svc => (
                  <tr key={svc.serviceId} className="border-b">
                    <td className="py-1 px-8 text-gray-600">› {formatTypeLabel(svc.serviceType)}</td>
                    <td className="py-1 px-4 text-right text-gray-600">{formatCurrency(svc.laborCost)}</td>
                    <td className="py-1 px-4 text-right text-gray-600">{formatCurrency(svc.materialCost)}</td>
                    <td className="py-1 px-4 text-right">{formatCurrency(svc.total)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-400">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Subtotal</td>
              <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td className="py-2 px-4">Tax</td>
              <td colSpan={3} className="py-2 px-4 text-right">{formatCurrency(tax)}</td>
            </tr>
            <tr className="border-t-2 border-gray-400">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Total</td>
              <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setCurrentStep(2)} className="bg-gray-500 text-white py-2 px-4 rounded">Back</button>
        <button onClick={startOver} className="bg-blue-500 text-white py-2 px-4 rounded">Start Over</button>
        <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-500 text-white py-2 px-4 rounded">Settings</button>
      </div>
    </div>
  );
};

export default Step3;