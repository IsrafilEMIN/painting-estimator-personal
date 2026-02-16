// src/components/modals/CustomerModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import NewCustomerInput type
import type { Customer, NewCustomerInput } from '@/types/paintingEstimator';
import { useCustomers } from '@/hooks/useCustomers'; // Import the hook
import { useAuth } from '@/hooks/useAuth'; // To get user ID

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Update the type here to accept NewCustomerInput for new customers
  onCustomerSelect: (customer: Customer | NewCustomerInput) => void;
}


const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onCustomerSelect }) => {
    const { user } = useAuth();
    const {
        customers: recentCustomers,
        isLoading: isLoadingCustomersHook,
        error: errorCustomersHook,
        hasAttemptedFetch,
        searchCustomers,
        // addCustomer function is no longer needed directly here
    } = useCustomers(user?.uid);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    // Remove 'address' from initial state
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<typeof newCustomerData>>({});

    // --- Search Logic (remains the same) ---
    const performSearch = useCallback(async (term: string) => {
        if (!isOpen || !term) return;
        setIsLoadingSearch(true);
        try {
            const results = await searchCustomers(term);
            setSearchResults(results);
        } catch (searchError) {
             console.error("Search error:", searchError);
             setSearchResults([]);
        } finally {
             setIsLoadingSearch(false);
        }
    }, [isOpen, searchCustomers]);

    useEffect(() => {
        if (!isOpen) return;
        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch === '') {
             if(hasAttemptedFetch) {
                setSearchResults(recentCustomers);
            }
            setIsLoadingSearch(false);
            return;
        }
        setIsLoadingSearch(true);
        const timer = setTimeout(() => {
             performSearch(trimmedSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, recentCustomers, hasAttemptedFetch, performSearch]);

     useEffect(() => {
        if (isOpen && searchTerm.trim() === '' && hasAttemptedFetch) {
            setSearchResults(recentCustomers);
        }
    }, [recentCustomers, isOpen, searchTerm, hasAttemptedFetch]);
    // --- End Search Logic ---

    // --- New Customer Handlers ---
    const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCustomerData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validateNewCustomer = (): boolean => {
        const errors: Partial<typeof newCustomerData> = {};
        if (!newCustomerData.name.trim()) {
            errors.name = 'Full Name is required';
        }
        // Add email validation
        if (!newCustomerData.email.trim()) {
            errors.email = 'Email Address is required';
        } else if (!/\S+@\S+\.\S+/.test(newCustomerData.email.trim())) {
             errors.email = 'Please enter a valid email address';
        }
        // Add phone validation
        if (!newCustomerData.phone.trim()) {
            errors.phone = 'Phone Number is required';
        }
        // Removed address validation
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateAndContinue = () => {
        if (validateNewCustomer()) {
            // Pass back only name, email, phone using NewCustomerInput type
            const customerInput: NewCustomerInput = {
                name: newCustomerData.name.trim(),
                email: newCustomerData.email.trim(), // Already validated as non-empty
                phone: newCustomerData.phone.trim(), // Already validated as non-empty
            };
            onCustomerSelect(customerInput);
            // resetForm(); // Let useEffect handle reset on close
        }
    };
    // --- End New Customer Handlers ---

    const handleSelectExisting = (customer: Customer) => {
        onCustomerSelect(customer);
         // resetForm(); // Let useEffect handle reset on close
    };

    const resetForm = useCallback(() => {
        setSearchTerm('');
        // Reset form data (without address)
        setNewCustomerData({ name: '', email: '', phone: '' });
        setFormErrors({});
        if(hasAttemptedFetch) {
          setSearchResults(recentCustomers);
        } else {
          setSearchResults([]);
        }
        setIsLoadingSearch(false);
    }, [recentCustomers, hasAttemptedFetch]);


    useEffect(() => {
        if (isOpen) {
             resetForm();
        }
    }, [isOpen, resetForm]);


    if (!isOpen) return null;

    const isListLoading = isLoadingCustomersHook || isLoadingSearch;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            {/* Modal Content */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 max-w-lg w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                 {/* Header */}
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200">New Estimate</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
                </div>

                {/* --- Search Existing Customer --- */}
                 <div className="mb-4">
                    <label htmlFor="customerSearch" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Search Existing Customer
                    </label>
                    <input
                        id="customerSearch" type="text" placeholder="🔍 Email, name, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} // Updated placeholder
                        className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>
                {/* Search Results / Recent List */}
                <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
                        {searchTerm.trim() === '' ? '📋 Recent Customers' : 'Search Results'}
                    </h4>
                    {isListLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
                            {isLoadingSearch ? 'Searching...' : 'Loading recent...'}
                         </p>
                    ) : errorCustomersHook ? (
                         <p className="text-sm text-red-500 dark:text-red-400 px-1">{errorCustomersHook}</p>
                    ) : (hasAttemptedFetch && searchResults.length === 0) ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
                            {searchTerm.trim() ? 'No customers found matching search.' : 'No recent customers found.'}
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {searchResults.map((customer) => (
                                <li key={customer.id}>
                                <button
                                    onClick={() => handleSelectExisting(customer)}
                                    className="w-full text-left p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-sm"
                                >
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{customer.name}</span>
                                    {/* Show email or phone for better identification */}
                                    <span className="text-gray-500 dark:text-gray-400"> - {customer.email || customer.phone}</span>
                                </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* --- Separator --- */}
                <div className="relative flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* --- Create New Customer Form --- */}
                 <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Create New Customer</h4>
                 <div className="space-y-4">
                    {/* Name */}
                     <div>
                        <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" id="newName" name="name" value={newCustomerData.name} onChange={handleNewCustomerChange} required
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                     {/* Email - Now Required */}
                    <div>
                        <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input type="email" id="newEmail" name="email" value={newCustomerData.email} onChange={handleNewCustomerChange} required
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                         {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    {/* Phone - Now Required */}
                    <div>
                        <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                        <input type="tel" id="newPhone" name="phone" value={newCustomerData.phone} onChange={handleNewCustomerChange} required
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                         {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                    {/* Address Field Removed */}
                 </div>

                {/* --- Action Buttons --- */}
                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-5 rounded-lg transition">Cancel</button>
                    <button onClick={handleCreateAndContinue} className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-5 rounded-lg transition">Continue &rarr;</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal;
