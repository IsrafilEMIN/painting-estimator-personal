// src/components/modals/InvoiceModal.tsx
import React, { useState } from 'react';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';
import { useAuth } from '@/hooks/useAuth';
import { generateAndDownloadInvoice } from '@/lib/invoiceUtils';

// Define the shape for initial client info
interface InitialClientInfo {
  name: string;
  address: string; // This might represent billing or project initially
  address2: string; // e.g., City, Postal Code line
  email: string;
  phone: string;
}

interface InvoiceModalProps {
  onClose: () => void;
  // Add initialClientInfo as an optional prop
  initialClientInfo?: Partial<InitialClientInfo>;
  breakdown: DetailedBreakdownItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountAmount: number;
  adjustedSubtotal: number;
  paintCost: number;
  primerCost: number;
  asbestosCost: number;
  formatCurrency: (value: number) => string; // Keep formatCurrency if used inside modal
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  onClose,
  initialClientInfo, // Destructure the new prop
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
  // Use initialClientInfo to set the initial state, providing defaults
  const [clientInfo, setClientInfo] = useState({
    name: initialClientInfo?.name || '',
    address: initialClientInfo?.address || '',
    address2: initialClientInfo?.address2 || '', // For City, Postal Code etc.
    email: initialClientInfo?.email || '',
    phone: initialClientInfo?.phone || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientInfo(prev => ({ ...prev, [name]: value }));
    // Clear error if required fields are filled
    if ((name === 'name' || name === 'address' || name === 'address2') && value.trim()) {
        setError(null);
    }
  };

  const handleGenerate = async () => {
    setError(null); // Clear previous errors
    if (!user) {
      setError('You must be signed in to generate an invoice.');
      return;
    }
    // Validate required fields (adjust based on your invoice needs)
    if (!clientInfo.name.trim() || !clientInfo.address.trim() || !clientInfo.address2.trim()) {
      setError('Please fill in client name, address, and city/postal code.');
      return;
    }

    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();

      const invoiceData = {
        uid: user.uid,
        clientInfo, // Pass the current state
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Client Information for Invoice</h3>
        {error && <p className="text-red-600 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={clientInfo.name}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={clientInfo.address}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., 123 Main St"
              required
            />
          </div>
          <div>
            <label htmlFor="address2" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Address Line 2 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address2"
              name="address2"
              value={clientInfo.address2}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., City, Postal Code"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={clientInfo.email}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={clientInfo.phone}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
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
