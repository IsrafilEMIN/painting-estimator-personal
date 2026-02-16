// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Import NewCustomerInput
import type { EstimateStatus, Customer, NewCustomerInput } from '@/types/paintingEstimator';
import CustomerModal from './modals/CustomerModal';
import { useEstimates } from '@/hooks/useEstimates';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';

// ... (Keep formatCurrency, formatDate, StatusBadge components) ...
const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
const formatDate = (date: Date | undefined) => date ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
const StatusBadge: React.FC<{ status: EstimateStatus }> = ({ status }) => {
  // ... (implementation as before)
   const colors: Record<EstimateStatus, string> = {
    Draft: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
    Sent: 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    Approved: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100',
    Archived: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const {
        estimates,
        isLoading: isLoadingEstimates,
        error: errorEstimates,
        hasAttemptedFetch,
        createEstimate,
        deleteEstimate,
        duplicateEstimate
    } = useEstimates(user?.uid);
    // Destructure addCustomer which now expects NewCustomerInput
    const { addCustomer } = useCustomers(user?.uid);

    // Local state for UI
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<EstimateStatus | ''>('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

    // --- Action Handlers ---
    const handleNewEstimateClick = () => {
        setIsCustomerModalOpen(true);
    };

    // Update parameter type to accept both existing and new customer data shapes
    const handleCustomerSelected = async (customerData: Customer | NewCustomerInput) => {
        setIsCustomerModalOpen(false);
        if (!user) return;

        let customerId: string | null = null;
        let finalCustomerName: string = '';
        // Removed finalProjectAddress from here

        if ('id' in customerData) {
            // Existing customer selected (Type Customer)
            customerId = customerData.id;
            finalCustomerName = customerData.name;
            // projectAddress is handled in the EstimateEditor now
        } else {
            // New customer data (Type NewCustomerInput)
            finalCustomerName = customerData.name;
            // projectAddress is handled in the EstimateEditor now
            // Save the new customer using addCustomer (which now expects NewCustomerInput)
            customerId = await addCustomer(customerData); // Pass the input data directly
        }

        if (!customerId) {
            alert("Error saving or finding customer information. Please try again.");
            return;
        }

         // Now create the new estimate, passing an EMPTY project address initially
         const initialProjectAddress = ""; // Project address will be set in the editor
         const newEstimateId = await createEstimate(customerId, finalCustomerName, initialProjectAddress);

        if (newEstimateId) {
            router.push(`/estimate/${newEstimateId}`); // Navigate to the editor
        } else {
            alert("Error creating new estimate. Please try again.");
        }
    };

    const handleView = (id: string) => {
        router.push(`/estimate/${id}`);
    };
    const handleEdit = (id: string) => {
         router.push(`/estimate/${id}`);
    };

     const handleDuplicate = async (id: string) => {
        const newEstimateId = await duplicateEstimate(id);
        if (newEstimateId) {
             router.push(`/estimate/${newEstimateId}`);
        } else {
            alert("Error duplicating estimate.");
        }
    };

    const handleDelete = async (id: string) => {
        await deleteEstimate(id);
    };

    // --- End Action Handlers ---

    // --- Filtering logic ---
    const filteredEstimates = estimates.filter(est => {
        const matchesSearch = searchTerm === '' ||
            (est.customerName && est.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (est.projectAddress && est.projectAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (est.estimateNumber && est.estimateNumber.includes(searchTerm));
        const matchesStatus = filterStatus === '' || est.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // --- Stats Calculation ---
    const totalRevenuePotential = filteredEstimates.reduce((sum, est) => sum + (est.total || 0), 0);
    const pendingApprovals = filteredEstimates.filter(est => est.status === 'Sent').length;

    return (
        <div className="relative min-h-[calc(100vh-150px)]">
            {/* --- Top Bar --- */}
             <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
                 {/* Search Input */}
                <input
                    type="text"
                    placeholder="🔍 Search #, name, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                 {/* Status Filter */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as EstimateStatus | '')}
                     className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-[150px]"
                >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                </select>
                 {/* Date Range Picker */}
                 <input
                    type="text"
                    placeholder="Date Range..."
                    disabled
                    className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                 />
                 {/* View Toggle */}
                <div>
                     <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>Grid</button>
                     <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-r-lg ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>Table</button>
                </div>
            </div>

            {/* --- Stats Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Estimates (Filtered)</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{filteredEstimates.length}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Potential (Filtered)</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalRevenuePotential)}</p>
                 </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approvals (Filtered)</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{pendingApprovals}</p>
                 </div>
            </div>

            {/* --- Loading / Error / Content Area --- */}
            {isLoadingEstimates ? (
                 <p className="text-center text-gray-600 dark:text-gray-400 py-4">Loading estimates...</p>
            ) : errorEstimates ? (
                <p className="text-center text-red-600 dark:text-red-400 py-4">Error loading estimates: {errorEstimates}</p>
            ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Estimates</h2>
                    {!isLoadingEstimates && hasAttemptedFetch && filteredEstimates.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No estimates found.</p>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredEstimates.map(est => (
                                <div key={est.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 relative group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleView(est.id)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{est.customerName}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">#{est.estimateNumber}</p>
                                        </div>
                                        <StatusBadge status={est.status} />
                                    </div>
                                    {/* Display Project Address Here */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={est.projectAddress}>{est.projectAddress || 'No Project Address Set'}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(est.total || 0)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Modified: {formatDate(est.lastModified)}</p>
                                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(est.id); }} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded shadow hover:bg-yellow-200">Edit</button>
                                         <button onClick={(e) => { e.stopPropagation(); handleDuplicate(est.id); }} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded shadow hover:bg-green-200">Dup</button>
                                         <button onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded shadow hover:bg-red-200">Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : ( // Table View
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                    {/* Display Project Address Here */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Modified</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredEstimates.map(est => (
                                    <tr key={est.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{est.estimateNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{est.customerName}</td>
                                        {/* Display Project Address Here */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs" title={est.projectAddress}>{est.projectAddress || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatCurrency(est.total || 0)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={est.status} /></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(est.lastModified)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleView(est.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View</button>
                                        <button onClick={() => handleEdit(est.id)} className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-200">Edit</button>
                                        <button onClick={() => handleDuplicate(est.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Dup</button>
                                         <button onClick={() => handleDelete(est.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Del</button>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    )}
                </div>
            )}


            {/* --- Floating Action Button --- */}
            <button
                onClick={handleNewEstimateClick}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
                aria-label="Create New Estimate"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* --- Customer Modal --- */}
            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onCustomerSelect={handleCustomerSelected}
            />
        </div>
    );
};

export default Dashboard;
