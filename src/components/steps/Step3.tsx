// src/components/steps/Step3.tsx
import React, { useState } from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';
import InvoiceModal from '@/components/modals/InvoiceModal';

interface Step3Props {
  isLoading: boolean;
  breakdown: DetailedBreakdownItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountAmount: number;
  adjustedSubtotal: number;
  paintCost: number;
  primerCost: number;
  asbestosCost: number;
  formatCurrency: (value: number) => string;
  setCurrentStep: (step: number) => void;
  startOver: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

const Step3: React.FC<Step3Props> = ({
  isLoading,
  breakdown,
  subtotal,
  tax,
  total,
  discountAmount,
  adjustedSubtotal,
  paintCost,
  primerCost,
  formatCurrency,
  setCurrentStep,
  startOver,
  asbestosCost,
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Estimate Breakdown</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Labor</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Material</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {breakdown.map(item => (
              <React.Fragment key={item.roomId}>
                <tr className="bg-gray-100 font-semibold">
                  <td className="py-3 px-4">{item.roomName}</td>
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
                <td className="py-2 px-4">Paint (Global)</td>
                <td className="py-2 px-4 text-right"></td>
                <td className="py-2 px-4 text-right">{formatCurrency(paintCost)}</td>
                <td className="py-2 px-4 text-right">{formatCurrency(paintCost)}</td>
              </tr>
            )}
            {primerCost > 0 && (
              <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="py-2 px-4">Primer (Global)</td>
                <td className="py-2 px-4 text-right"></td>
                <td className="py-2 px-4 text-right">{formatCurrency(primerCost)}</td>
                <td className="py-2 px-4 text-right">{formatCurrency(primerCost)}</td>
              </tr>
            )}
            {asbestosCost > 0 && (
              <tr className="border-b border-gray-200 hover:bg-gray-100 transition">
                <td className="py-2 px-4">Asbestos Check Fee</td>
                <td className="py-2 px-4 text-right"></td>
                <td className="py-2 px-4 text-right">{formatCurrency(asbestosCost)}</td>
                <td className="py-2 px-4 text-right">{formatCurrency(asbestosCost)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="py-3 px-4 text-md font-bold">Subtotal</td>
              <td colSpan={3} className="py-3 px-4 text-md font-bold text-right">{formatCurrency(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4">Discount Applied</td>
                <td colSpan={3} className="py-2 px-4 text-right">-{formatCurrency(discountAmount)}</td>
              </tr>
            )}
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-3 px-4 text-md font-bold">Adjusted Subtotal</td>
                <td colSpan={3} className="py-3 px-4 text-md font-bold text-right">{formatCurrency(adjustedSubtotal)}</td>
              </tr>
            )}
            <tr className="bg-gray-50">
              <td className="py-2 px-4">Tax</td>
              <td colSpan={3} className="py-2 px-4 text-right">{formatCurrency(tax)}</td>
            </tr>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="pt-4 pb-2 px-4 text-xl font-bold">Total</td>
              <td colSpan={3} className="pt-4 pb-2 px-4 text-xl font-bold text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-between space-x-4">
        <button onClick={() => setCurrentStep(2)} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition">Back</button>
        <button onClick={startOver} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition">Start Over</button>
        <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition">Generate Invoice</button>
      </div>
      {isInvoiceModalOpen && (
        <InvoiceModal
          onClose={() => setIsInvoiceModalOpen(false)}
          breakdown={breakdown}
          subtotal={subtotal}
          tax={tax}
          total={total}
          discountAmount={discountAmount}
          adjustedSubtotal={adjustedSubtotal}
          paintCost={paintCost}
          primerCost={primerCost}
          asbestosCost={asbestosCost}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default Step3;