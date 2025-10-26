// src/components/modals/CustomalModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/types/paintingEstimator';
import { useCustomers } from '@/hooks/useCustomers'; // Import the hook
import { useAuth } from '@/hooks/useAuth'; // To get user ID

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer | Omit<Customer, 'id' | 'createdAt'>) => void;
}


const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onCustomerSelect }) => {
    const { user } = useAuth();
    const {
        customers: recentCustomers,
        isLoading: isLoadingCustomersHook, // Renamed for clarity
        error: errorCustomersHook,
        hasAttemptedFetch, // <-- GET NEW STATE
        searchCustomers,
        addCustomer
    } = useCustomers(user?.uid);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false); // Specific loading for search action
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<typeof newCustomerData>>({});

    // --- Search Logic ---
    const performSearch = useCallback(async (term: string) => {
        if (!isOpen || !term) return; // Don't search if modal closed or term empty
        setIsLoadingSearch(true);
        try {
            const results = await searchCustomers(term);
            setSearchResults(results);
        } catch (searchError) {
             console.error("Search error:", searchError);
             setSearchResults([]); // Clear results on error
        } finally {
             setIsLoadingSearch(false);
        }
    }, [isOpen, searchCustomers]);

    // Debounced search effect
    useEffect(() => {
        if (!isOpen) return;

        const trimmedSearch = searchTerm.trim();

        // If search term is cleared, show recent customers immediately
        if (trimmedSearch === '') {
             // Use recentCustomers directly if available and initial fetch is done
            if(hasAttemptedFetch) {
                setSearchResults(recentCustomers);
            }
            setIsLoadingSearch(false); // Ensure search loading stops
            return; // Don't trigger debounce timer
        }

        // Set loading true immediately for feedback while typing
        setIsLoadingSearch(true);
        const timer = setTimeout(() => {
             performSearch(trimmedSearch);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, recentCustomers, hasAttemptedFetch, performSearch]);


    // Effect to update results when recentCustomers load and search is empty
     useEffect(() => {
        if (isOpen && searchTerm.trim() === '' && hasAttemptedFetch) {
            setSearchResults(recentCustomers);
        }
    }, [recentCustomers, isOpen, searchTerm, hasAttemptedFetch]);

    // --- New Customer Handlers ---
    const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCustomerData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error when user types
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validateNewCustomer = (): boolean => {
        const errors: Partial<typeof newCustomerData> = {};
        if (!newCustomerData.name.trim()) errors.name = 'Full Name is required';
        if (!newCustomerData.address.trim()) errors.address = 'Project Address is required';
        // Basic email format check (optional but recommended)
        if (newCustomerData.email.trim() && !/\S+@\S+\.\S+/.test(newCustomerData.email.trim())) {
             errors.email = 'Please enter a valid email address';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateAndContinue = () => {
        if (validateNewCustomer()) {
            onCustomerSelect({
                name: newCustomerData.name.trim(),
                email: newCustomerData.email.trim() || undefined,
                phone: newCustomerData.phone.trim() || undefined,
                address: newCustomerData.address.trim(),
            });
            // resetForm(); // Let useEffect handle reset on close
        }
    };

    const handleSelectExisting = (customer: Customer) => {
        onCustomerSelect(customer);
        // resetForm(); // Let useEffect handle reset on close
    };

    const resetForm = useCallback(() => {
        setSearchTerm('');
        setNewCustomerData({ name: '', email: '', phone: '', address: '' });
        setFormErrors({});
        // Only reset search results if the initial fetch has happened
        if(hasAttemptedFetch) {
          setSearchResults(recentCustomers);
        } else {
          setSearchResults([]); // Clear if initial fetch hasn't happened yet
        }
        setIsLoadingSearch(false);
    }, [recentCustomers, hasAttemptedFetch]);


    // Reset form state when modal closes OR opens
    useEffect(() => {
        if (isOpen) {
             // Reset when opening, ensure recents are shown if fetch is complete
             resetForm();
        }
        // No cleanup needed here as reset is handled on open/close trigger
    }, [isOpen, resetForm]);


    if (!isOpen) return null;

    // Determine OVERALL loading state for the list section (initial load OR active search)
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
                        id="customerSearch" type="text" placeholder="🔍 Email, name, or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* Search Results / Recent List */}
                <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
                        {searchTerm.trim() === '' ? '📋 Recent Customers' : 'Search Results'}
                    </h4>
                     {/* --- UPDATED LOADING/EMPTY/RESULTS LOGIC --- */}
                    {isListLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
                            {isLoadingSearch ? 'Searching...' : 'Loading recent...'}
                         </p>
                    ) : errorCustomersHook ? (
                         <p className="text-sm text-red-500 dark:text-red-400 px-1">{errorCustomersHook}</p>
                    // Only show empty state if loading is done, fetch has happened, AND results are empty
                    ) : (hasAttemptedFetch && searchResults.length === 0) ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
                            {searchTerm.trim() ? 'No customers found matching search.' : 'No recent customers found.'}
                        </p>
                    ) : ( // Otherwise, display results
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
                    )}
                     {/* --- END UPDATED LOGIC --- */}
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
                        <input type="text" id="newName" name="name" value={newCustomerData.name} onChange={handleNewCustomerChange}
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                    </div>
                     {/* Email */}
                    <div>
                        <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input type="email" id="newEmail" name="email" value={newCustomerData.email} onChange={handleNewCustomerChange}
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                    </div>
                    {/* Phone */}
                    <div>
                        <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input type="tel" id="newPhone" name="phone" value={newCustomerData.phone} onChange={handleNewCustomerChange}
                                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </div>
                     {/* Address */}
                    <div>
                        <label htmlFor="newAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Address <span className="text-red-500">*</span></label>
                        <input type="text" id="newAddress" name="address" value={newCustomerData.address} onChange={handleNewCustomerChange}
                                className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${formErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} />
                        {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                    </div>
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