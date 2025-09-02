// src/components/steps/Step3.tsx
import React from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface Step3Props {
  isLoading: boolean;
  breakdown: DetailedBreakdownItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountAmount: number;
  adjustedTotal: number;
  paintCost: number;
  primerCost: number;
  asbestosCost: number;
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
  discountAmount, 
  adjustedTotal,
  paintCost,
  primerCost,
  asbestosCost,
  formatCurrency,
  setCurrentStep,
  startOver,
}) => {
  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  if (isLoading) return <div className="text-center p-8 text-lg text-gray-600">Calculating...</div>;

  return (
    <div className="space-y-6 transition-all duration-300">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Estimate Breakdown</h2>
      <div className="bg-gray-50 p-6 rounded-xl shadow-inner overflow-x-auto">
        <table className="w-full text-left text-gray-800 min-w-max text-sm md:text-base">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-3 px-4 font-semibold">Room/Service</th>
              <th className="py-3 px-4 text-right font-semibold">Labor</th>
              <th className="py-3 px-4 text-right font-semibold">Material</th>
              <th className="py-3 px-4 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map(item => (
              <React.Fragment key={item.roomId}>
                <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                  <td className="py-3 px-4 font-semibold">{item.roomName} (Base)</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.baseLabor)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(item.baseMaterial)}</td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(item.baseTotal)}</td>
                </tr>
                {item.services.map(svc => (
                  <tr key={svc.serviceId} className="border-b border-gray-200 hover:bg-gray-100 transition">
                    <td className="py-2 px-8 text-gray-600">› {formatTypeLabel(svc.serviceType)}</td>
                    <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(svc.laborCost)}</td>
                    <td className="py-2 px-4 text-right text-gray-600">{formatCurrency(svc.materialCost)}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(svc.total)}</td>
                  </tr>
                ))}
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-4 font-bold">{item.roomName} Subtotal</td>
                  <td className="py-3 px-4 text-right"></td>
                  <td className="py-3 px-4 text-right"></td>
                  <td className="py-3 px-4 text-right font-bold">{formatCurrency(item.roomTotal)}</td>
                </tr>
              </React.Fragment>
            ))}
            {paintCost > 0 && (
              <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="py-3 px-4 font-semibold">Paint (Global)</td>
                <td className="py-3 px-4 text-right"></td>
                <td className="py-3 px-4 text-right">{formatCurrency(paintCost)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(paintCost)}</td>
              </tr>
            )}
            {primerCost > 0 && (
              <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="py-3 px-4 font-semibold">Primer (Global)</td>
                <td className="py-3 px-4 text-right"></td>
                <td className="py-3 px-4 text-right">{formatCurrency(primerCost)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(primerCost)}</td>
              </tr>
            )}
            {asbestosCost > 0 && (
              <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="py-3 px-4 font-semibold">Asbestos Check Fee</td>
                <td className="py-3 px-4 text-right"></td>
                <td className="py-3 px-4 text-right">{formatCurrency(asbestosCost)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatCurrency(asbestosCost)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Subtotal</td>
              <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(subtotal)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 px-4">Tax</td>
              <td colSpan={3} className="py-2 px-4 text-right">{formatCurrency(tax)}</td>
            </tr>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Total</td>
              <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(total)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="pt-4 pb-2 px-4 text-xl font-bold">Discount Applied</td>
                <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(discountAmount)}</td>
              </tr>
            )}
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="pt-4 pb-2 px-4 text-xl font-bold">Adjusted Total</td>
                <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(adjustedTotal)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      <div className="flex justify-between space-x-4">
        <button onClick={() => setCurrentStep(2)} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition">Back</button>
        <button onClick={startOver} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition">Start Over</button>
      </div>
    </div>
  );
};

export default Step3;