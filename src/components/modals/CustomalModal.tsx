// src/components/modals/CustomerModal.tsx
import React, { useState, useEffect } from 'react';
import type { Customer } from '@/types/paintingEstimator';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer | Omit<Customer, 'id' | 'createdAt'>) => void;
  // Add userId prop if needed for Firestore operations later
  // userId: string;
}

// --- Mock Data (Replace with actual data fetching later) ---
const mockRecentCustomers: Customer[] = [
  { id: 'cust1', name: 'John Doe', email: 'john@example.com', phone: '555-1111', address: '123 Main St', createdAt: new Date() },
  { id: 'cust2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-2222', address: '456 Oak Ave', createdAt: new Date() },
];
// --- End Mock Data ---

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onCustomerSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>(mockRecentCustomers); // Initially show recent
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '', // Project Address
  });
  const [formErrors, setFormErrors] = useState<Partial<typeof newCustomerData>>({});
  const [isLoadingSearch, setIsLoadingSearch] = useState(false); // For future async search

  // --- Search Logic (basic example) ---
  useEffect(() => {
    if (!isOpen) return; // Don't run search when modal is closed
    setIsLoadingSearch(true);
    // Simulate async search
    const timer = setTimeout(() => {
      if (searchTerm.trim() === '') {
        setSearchResults(mockRecentCustomers); // Show recent if search is empty
      } else {
        const lowerSearch = searchTerm.toLowerCase();
        // Replace with actual Firestore/API search later
        setSearchResults(
          mockRecentCustomers.filter(
            (c) =>
              c.name.toLowerCase().includes(lowerSearch) ||
              (c.email && c.email.toLowerCase().includes(lowerSearch)) ||
              (c.address && c.address.toLowerCase().includes(lowerSearch))
          )
        );
      }
      setIsLoadingSearch(false);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);
  // --- End Search Logic ---

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomerData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on change
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateNewCustomer = (): boolean => {
    const errors: Partial<typeof newCustomerData> = {};
    if (!newCustomerData.name.trim()) {
      errors.name = 'Full Name is required';
    }
    if (!newCustomerData.address.trim()) {
      errors.address = 'Project Address is required';
    }
    // Optional: Add email/phone validation if needed
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectExisting = (customer: Customer) => {
    onCustomerSelect(customer);
    resetForm();
  };

  const handleCreateAndContinue = () => {
    if (validateNewCustomer()) {
      // Here you would typically save the new customer to Firestore
      // For now, just pass the data back
      onCustomerSelect({
        name: newCustomerData.name.trim(),
        email: newCustomerData.email.trim() || undefined, // Store undefined if empty
        phone: newCustomerData.phone.trim() || undefined,
        address: newCustomerData.address.trim(),
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setNewCustomerData({ name: '', email: '', phone: '', address: '' });
    setFormErrors({});
    setSearchResults(mockRecentCustomers);
  }

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Slight delay to allow modal close animation before resetting
      const timer = setTimeout(resetForm, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">New Estimate</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&times;</button>
        </div>

        {/* --- Search Existing Customer --- */}
        <div className="mb-4">
          <label htmlFor="customerSearch" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Search Existing Customer
          </label>
          <input
            id="customerSearch"
            type="text"
            placeholder="🔍 Email, name, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
            {searchTerm.trim() === '' ? '📋 Recent Customers' : 'Search Results'}
          </h4>
          {isLoadingSearch ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-1">Searching...</p>
          ) : searchResults.length > 0 ? (
            <ul className="space-y-1">
              {searchResults.map((customer) => (
                <li key={customer.id}>
                  <button
                    onClick={() => handleSelectExisting(customer)}
                    className="w-full text-left p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-sm"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">{customer.name}</span>
                    <span className="text-gray-500 dark:text-gray-400"> - {customer.address || customer.email || 'No Address/Email'}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No customers found.</p>
          )}
        </div>

        {/* --- Separator --- */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        {/* --- Create New Customer --- */}
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Create New Customer</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" id="newName" name="name" value={newCustomerData.name} onChange={handleNewCustomerChange}
              className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email" id="newEmail" name="email" value={newCustomerData.email} onChange={handleNewCustomerChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel" id="newPhone" name="phone" value={newCustomerData.phone} onChange={handleNewCustomerChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="newAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text" id="newAddress" name="address" value={newCustomerData.address} onChange={handleNewCustomerChange}
              className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
             {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
          </div>

          {/* Placeholder for HubSpot Integration */}
          {/* <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">🔗 Link to HubSpot Contact</label>
             <div className="flex gap-2">
                <input type="text" placeholder="Search HubSpot..." className="flex-grow ..."/>
                <button className="bg-gray-200 ...">Auto-fill</button>
             </div>
          </div> */}

        </div>

        {/* --- Action Buttons --- */}
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-5 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateAndContinue}
            className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-5 rounded-lg transition"
          >
            Continue &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;