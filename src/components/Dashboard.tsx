// src/components/Dashboard.tsx
import React, { useState } from 'react';
import type { Estimate, EstimateStatus, Customer } from '@/types/paintingEstimator'; // Assuming types are updated as per Step 1
import CustomerModal from '@/components/modals/CustomalModal'; // Import the new modal

// --- Mock Data (Replace with actual data fetching later) ---
const mockEstimates: Estimate[] = [
  {
    id: 'est1',
    customerId: 'cust1',
    customerName: 'John Doe',
    projectAddress: '123 Main St, Anytown',
    estimateNumber: '00001',
    status: 'Sent',
    createdAt: new Date(2025, 9, 20),
    lastModified: new Date(2025, 9, 24),
    subtotal: 1500,
    tax: 195,
    total: 1695,
    discountAmount: 0,
    adjustedSubtotal: 1500,
    paintCost: 200,
    primerCost: 50,
    asbestosCost: 0,
    rooms: [], // Add mock room data if needed for detail view later
  },
  {
    id: 'est2',
    customerId: 'cust2',
    customerName: 'Jane Smith',
    projectAddress: '456 Oak Ave, Sometown',
    estimateNumber: '00002',
    status: 'Draft',
    createdAt: new Date(2025, 9, 23),
    lastModified: new Date(2025, 9, 25),
    subtotal: 2100,
    tax: 273,
    total: 2373,
    discountAmount: 210,
    adjustedSubtotal: 1890,
    paintCost: 300,
    primerCost: 70,
    asbestosCost: 0,
    rooms: [],
  },
   {
    id: 'est3',
    customerId: 'cust3',
    customerName: 'Bob Johnson',
    projectAddress: '789 Pine Ln, Villagetown',
    estimateNumber: '00003',
    status: 'Approved',
    createdAt: new Date(2025, 9, 15),
    lastModified: new Date(2025, 9, 22),
    subtotal: 800,
    tax: 104,
    total: 904,
    discountAmount: 0,
    adjustedSubtotal: 800,
    paintCost: 100,
    primerCost: 30,
    asbestosCost: 0,
    rooms: [],
  },
];
// --- End Mock Data ---

// Helper function to format currency
const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

// Helper function to format dates
const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

// Status Badge Component
const StatusBadge: React.FC<{ status: EstimateStatus }> = ({ status }) => {
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
  const [estimates, setEstimates] = useState<Estimate[]>(mockEstimates); // State to hold estimates
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<EstimateStatus | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // State for modal visibility

  // --- Placeholder functions (implement later) ---
  const handleNewEstimateClick = () => {
    setIsCustomerModalOpen(true); // Open the modal
  };

  const handleCustomerSelected = (customerData: Customer | Omit<Customer, 'id' | 'createdAt'>) => {
    setIsCustomerModalOpen(false); // Close the modal
    console.log('Customer selected/created:', customerData);
    // TODO:
    // 1. If it's a new customer (doesn't have 'id'), save it to Firestore and get the new ID.
    // 2. Create a new draft Estimate object in Firestore linked to this customer ID.
    // 3. Navigate to the Estimate Editor page/route (e.g., /estimate/new-estimate-id)
    alert(`Proceeding to create estimate for: ${customerData.name}`);
  };

  const handleView = (id: string) => alert(`View estimate ${id}`);
  const handleEdit = (id: string) => alert(`Edit estimate ${id}`);
  const handleDuplicate = (id: string) => alert(`Duplicate estimate ${id}`);
  const handleArchive = (id: string) => alert(`Archive estimate ${id}`);
  const handleEmail = (id: string) => alert(`Email estimate ${id}`);
  // --- End Placeholder functions ---

  // --- Filtering logic (basic example) ---
  const filteredEstimates = estimates.filter(est => {
    const matchesSearch = searchTerm === '' ||
      est.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.projectAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.estimateNumber.includes(searchTerm);
    const matchesStatus = filterStatus === '' || est.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  // --- End Filtering logic ---

  // --- Mock Stats Calculation ---
  const totalEstimatesThisMonth = filteredEstimates.length; // Simple count for now
  const totalRevenuePotential = filteredEstimates.reduce((sum, est) => sum + est.total, 0);
  const pendingApprovals = filteredEstimates.filter(est => est.status === 'Sent').length;
  // --- End Mock Stats ---

  return (
    <div className="relative min-h-[calc(100vh-150px)]"> {/* Ensure space for FAB */}
      {/* Top Bar */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder="🔍 Search estimates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EstimateStatus | '')}
          className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Approved">Approved</option>
          <option value="Archived">Archived</option>
        </select>
        {/* Placeholder for Date Range Picker */}
        <input
          type="text"
          placeholder="Date Range..."
          className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <div>
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>Grid</button>
          <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-r-lg ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>Table</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimates This Month</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{totalEstimatesThisMonth}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue Potential</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalRevenuePotential)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approvals</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{pendingApprovals}</p>
        </div>
        {/* Add Conversion Rate card later */}
      </div>

      {/* Estimates Grid/Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Estimates</h2>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEstimates.map(est => (
              <div key={est.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 relative group hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">{est.customerName}</h3>
                  <StatusBadge status={est.status} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{est.projectAddress}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(est.total)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Modified: {formatDate(est.lastModified)}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                   {/* Simplified actions for grid view */}
                   <button onClick={() => handleView(est.id)} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">View</button>
                   <button onClick={() => handleEdit(est.id)} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Edit</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Modified</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEstimates.map(est => (
                  <tr key={est.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{est.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{est.projectAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatCurrency(est.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={est.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(est.lastModified)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleView(est.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View</button>
                      <button onClick={() => handleEdit(est.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</button>
                      <button onClick={() => handleDuplicate(est.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">Dup</button>
                      {/* Add Archive/Email later */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredEstimates.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No estimates found matching your criteria.</p>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleNewEstimateClick} // This now opens the CustomerModal
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
        aria-label="Create New Estimate"
      >
        {/* ... (Keep SVG icon) */}
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* --- Render Customer Modal --- */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerSelect={handleCustomerSelected}
      />
    </div>
  );
};

export default Dashboard;