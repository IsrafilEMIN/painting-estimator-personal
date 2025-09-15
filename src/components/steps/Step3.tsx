// src/components/steps/Step3.tsx
import React, { useState } from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';
import InvoiceModal from '@/components/modals/InvoiceModal';
import ContractModal from '@/components/modals/ContractModal';

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
  drywallCost: number;
  formatCurrency: (value: number) => string;
  setCurrentStep: (step: number) => void;
  startOver: () => void;
  setIsSettingsOpen: (open: boolean) => void;
}

const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

const Step3: React.FC<Step3Props> = ({
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
  drywallCost,
}) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Estimate Breakdown</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-md">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-[#899499] dark:bg-gray-700 text-black dark:text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
            {breakdown.map(item => (
              <React.Fragment key={item.roomId}>
                <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.roomName}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.roomTotal)}</td>
                </tr>
                {item.services.map(svc => (
                  <tr key={svc.serviceId} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <td className="py-2 px-8 text-gray-600 dark:text-gray-400">› {svc.name || formatTypeLabel(svc.serviceType)}</td>
                    <td className="py-2 px-4 text-right text-gray-800 dark:text-gray-200">{formatCurrency(svc.total)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {paintCost > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Paint</td>
                <td className="py-2 px-4 text-right">{formatCurrency(paintCost)}</td>
              </tr>
            )}
            {primerCost > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Primer</td>
                <td className="py-2 px-4 text-right">{formatCurrency(primerCost)}</td>
              </tr>
            )}
            {drywallCost > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Drywall Compound</td>
                <td className="py-2 px-4 text-right">{formatCurrency(drywallCost)}</td>
              </tr>
            )}
            {asbestosCost > 0 && (
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Asbestos Check Fee</td>
                <td className="py-2 px-4 text-right">{formatCurrency(asbestosCost)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
              <td className="py-3 px-4 text-md font-bold text-gray-800 dark:text-gray-200">Subtotal</td>
              <td className="py-3 px-4 text-md font-bold text-right text-gray-800 dark:text-gray-200">{formatCurrency(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
                <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Discount Applied</td>
                <td className="py-2 px-4 text-right">-{formatCurrency(discountAmount)}</td>
              </tr>
            )}
            {discountAmount > 0 && (
              <tr className="border-t-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
                <td className="py-3 px-4 text-md font-bold text-gray-800 dark:text-gray-200">Adjusted Subtotal</td>
                <td className="py-3 px-4 text-md font-bold text-right text-gray-800 dark:text-gray-200">{formatCurrency(adjustedSubtotal)}</td>
              </tr>
            )}
            <tr className="bg-gray-50 dark:bg-gray-700">
              <td className="py-2 px-4 text-gray-800 dark:text-gray-200">Tax</td>
              <td className="py-2 px-4 text-right">{formatCurrency(tax)}</td>
            </tr>
            <tr className="border-t-2 border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
              <td className="pt-4 pb-2 px-4 text-xl font-bold text-gray-800 dark:text-gray-200">Total</td>
              <td className="pt-4 pb-2 px-4 text-xl font-bold text-right text-gray-800 dark:text-gray-200">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setCurrentStep(2)} 
            className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition"
          >
            Back
          </button>
          <button 
            onClick={startOver} 
            className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition"
          >
            Start Over
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsContractModalOpen(true)} 
            className="bg-purple-600 dark:bg-purple-800 hover:bg-purple-700 dark:hover:bg-purple-900 text-white py-2 px-6 rounded-lg transition"
          >
            Generate Contract
          </button>
          <button 
            onClick={() => setIsInvoiceModalOpen(true)} 
            className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-6 rounded-lg transition"
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Modals */}
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
      
      {isContractModalOpen && (
        <ContractModal
          onClose={() => setIsContractModalOpen(false)}
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