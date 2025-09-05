// src/components/modals/InvoiceModal.tsx
import React, { useState } from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';
import { useAuth } from '@/hooks/useAuth';
import { generateAndDownloadInvoice } from '@/lib/invoiceUtils';

interface InvoiceModalProps {
  onClose: () => void;
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
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  onClose,
  breakdown,
  subtotal,
  tax,
  total,
  discountAmount,
  adjustedSubtotal,
  paintCost,
  primerCost,
  asbestosCost,
}) => {
  const { user } = useAuth();
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    address2: '',
    email: '',
    phone: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setError(null);
    if (!user) {
      setError('You must be signed in to generate an invoice.');
      return;
    }
    if (!clientInfo.name || !clientInfo.address) {
      setError('Please fill in client name and address.');
      return;
    }

    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();

      const invoiceData = {
        uid: user.uid,
        clientInfo,
        breakdown,
        subtotal,
        tax,
        total,
        discountAmount,
        adjustedSubtotal,
        paintCost,
        primerCost,
        asbestosCost,
      };

      await generateAndDownloadInvoice(invoiceData, idToken);
      console.log('Invoice generated successfully.');
      
      // Close modal on success
      onClose();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice. Please try again.';
      console.error('Error generating invoice:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Client Information</h3>
        {error && <p className="text-red-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={clientInfo.name}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={clientInfo.address}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
              City, Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={clientInfo.address2}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={clientInfo.email}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={clientInfo.phone}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;