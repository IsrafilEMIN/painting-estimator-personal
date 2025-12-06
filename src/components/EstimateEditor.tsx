// src/components/EstimateEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
// Import NewCustomerInput type for clarity, though not directly used here
import type { Estimate, Customer, Room, Service, DetailedBreakdownItem, Pricing, NewCustomerInput } from '@/types/paintingEstimator';
import RoomModal from './modals/RoomModal';
import ServiceModal from './modals/ServiceModal';
import InvoiceModal from './modals/InvoiceModal';
import ContractModal from './modals/ContractModal';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);
const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

interface EstimateEditorProps {
    initialEstimate: Estimate;
    customer: Customer | null;
    onSave: (estimate: Estimate) => Promise<void>;
    pricing: Pricing;
    calculateEstimateFn: (rooms: Room[], pricing: Pricing) => {
        total: number;
        breakdown: DetailedBreakdownItem[];
        subtotal: number;
        tax: number;
        paintCost: number;
        primerCost: number;
        asbestosCost: number;
        // Assume drywallCost is handled if needed by calculateEstimateFn
        drywallCost: number; // Keep if calculateEstimate returns it
        discountAmount: number;
        adjustedSubtotal: number;
    };
}

const EstimateEditor: React.FC<EstimateEditorProps> = ({
    initialEstimate,
    customer,
    onSave,
    pricing,
    calculateEstimateFn
}) => {
    const [estimate, setEstimate] = useState<Estimate>(initialEstimate);
    const [activeTab, setActiveTab] = useState<'build' | 'review'>('build');
    const [isSaving, setIsSaving] = useState(false);
    const [calculationResult, setCalculationResult] = useState<ReturnType<typeof calculateEstimateFn> | null>(null);
    // Add state for project address validation
    const [addressError, setAddressError] = useState<string | undefined>(undefined);


    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<{ roomId: number; service?: Service } | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);

    // --- Handle Project Address Change ---
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value;
        setEstimate(prev => ({
            ...prev,
            projectAddress: newAddress,
            lastModified: new Date() // Update last modified on change
        }));
        // Basic validation: Clear error if address is not empty
        if (newAddress.trim()) {
            setAddressError(undefined);
        } else {
             setAddressError('Project Address is required');
        }
    };

    // --- Recalculate Estimate ---
     const runCalculation = useCallback(() => {
        if (!estimate) return;
        // Validate address before calculating
        if (!estimate.projectAddress.trim()) {
            setAddressError('Project Address is required before calculating.');
             setActiveTab('build'); // Switch back to build tab if address missing
             alert('Please enter the Project Address before reviewing.');
            return;
        }
        try {
            const result = calculateEstimateFn(estimate.rooms, pricing);
            setCalculationResult(result);
        } catch (error) {
            console.error("Error calculating estimate:", error);
        }
    }, [estimate, pricing, calculateEstimateFn]);

    useEffect(() => {
        if (activeTab === 'review') {
            runCalculation();
        }
    }, [activeTab, runCalculation]);

     useEffect(() => {
        setCalculationResult(null);
    }, [estimate?.rooms, estimate?.projectAddress]); // Invalidate calc if address changes too


    // --- Room/Service Handlers (remain the same) ---
    const openRoomModal = (room?: Room) => {
        setEditingRoom(room);
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = (room: Room) => {
        setEstimate(prev => {
            const existing = prev.rooms.find(r => r.id === room.id);
            const newRooms = existing
                ? prev.rooms.map(r => r.id === room.id ? room : r)
                : [...prev.rooms, { ...room, id: Date.now() }];
            return { ...prev, rooms: newRooms, lastModified: new Date() };
        });
        setIsRoomModalOpen(false);
        setEditingRoom(undefined);
    };

     const duplicateRoom = (roomToDuplicate: Room) => {
        setEstimate(prev => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                {
                    ...roomToDuplicate,
                    id: Date.now(),
                    name: `${roomToDuplicate.name} (Copy)`
                }
            ],
            lastModified: new Date()
        }));
    };


    const deleteRoom = (roomId: number) => {
        // Use a simple confirm dialog for now
        const confirmation = window.confirm('Are you sure you want to delete this room and its services?');
        if (confirmation) {
             setEstimate(prev => ({
                ...prev,
                rooms: prev.rooms.filter(r => r.id !== roomId),
                lastModified: new Date()
            }));
        }
    };


    const openServiceModal = (roomId: number, service?: Service) => {
        setEditingService({ roomId, service });
        setIsServiceModalOpen(true);
    };

    const handleSaveService = (service: Service) => {
        if (!editingService) return;
        const { roomId } = editingService;
        setEstimate(prev => ({
            ...prev,
            rooms: prev.rooms.map(room => {
                if (room.id === roomId) {
                    const existingService = room.services.find(s => s.id === service.id);
                    const newServices = existingService
                        ? room.services.map(s => s.id === service.id ? service : s)
                        : [...room.services, { ...service, id: Date.now() }];
                    return { ...room, services: newServices };
                }
                return room;
            }),
            lastModified: new Date()
        }));
        setIsServiceModalOpen(false);
        setEditingService(null);
    };

    const deleteService = (roomId: number, serviceId: number) => {
         // Use a simple confirm dialog for now
         const confirmation = window.confirm('Are you sure you want to delete this service?');
         if (confirmation) {
             setEstimate(prev => ({
                ...prev,
                rooms: prev.rooms.map(r =>
                    r.id === roomId
                        ? { ...r, services: r.services.filter(s => s.id !== serviceId) }
                        : r
                ),
                lastModified: new Date()
            }));
        }
    };
    // --- End Room/Service Handlers ---

    // --- Save Handler ---
    const handleTriggerSave = async () => {
        // Validate Project Address before saving
        if (!estimate.projectAddress.trim()) {
            setAddressError('Project Address is required before saving.');
            setActiveTab('build'); // Ensure user sees the address field
            alert('Please enter the Project Address before saving.');
            return;
        }

        setIsSaving(true);
        // Ensure calculation is up-to-date before saving
        const result = calculateEstimateFn(estimate.rooms, pricing);
        const estimateToSave: Estimate = {
            ...estimate, // Includes the latest projectAddress from state
            subtotal: result.subtotal,
            tax: result.tax,
            total: result.total,
            discountAmount: result.discountAmount,
            adjustedSubtotal: result.adjustedSubtotal,
            paintCost: result.paintCost,
            primerCost: result.primerCost,
            asbestosCost: result.asbestosCost,
            // drywallCost: result.drywallCost, // Include if applicable
            lastModified: new Date(), // This will be replaced by serverTimestamp in the hook
            createdAt: estimate.createdAt || new Date(), // Keep original createdAt
        };

        try {
            await onSave(estimateToSave); // The hook handles setting serverTimestamp
            // Update local state if needed (e.g., if onSave returns the updated estimate with server time)
            // setEstimate(estimateToSave); // Already updated optimistically + hook updates list
            setCalculationResult(result);
            alert('Estimate saved successfully!'); // Provide feedback
        } catch (err) {
            console.error("Failed to save estimate:", err);
            alert("Error saving estimate. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

     // --- Render Functions for Tabs ---
    const renderBuildTab = () => (
         <div className="space-y-6">
            {/* Project Address Input */}
            <div className="mb-6">
                <label htmlFor="projectAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Project Address <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="projectAddress"
                    name="projectAddress"
                    value={estimate.projectAddress}
                    onChange={handleAddressChange}
                    required
                    className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${addressError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {addressError && <p className="text-red-500 text-xs mt-1">{addressError}</p>}
            </div>

            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-t pt-4 border-gray-200 dark:border-gray-700">Rooms & Services</h2>
            {estimate.rooms.map((room) => (
                <div key={room.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{room.name}</h3>
                         <div className="space-x-2 text-sm">
                            <button onClick={() => openRoomModal(room)} className="text-blue-600 dark:text-blue-400 hover:underline">Edit Room</button>
                            <button onClick={() => duplicateRoom(room)} className="text-green-600 dark:text-green-400 hover:underline">Duplicate</button>
                            <button onClick={() => deleteRoom(room.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete Room</button>
                        </div>
                    </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Height: {room.height}ft | Prep: {room.prepHours}hrs</p>

                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Services</h4>
                        {room.services.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">No services added yet.</p>}
                        {room.services.map(service => (
                        <div key={service.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{service.name || formatTypeLabel(service.type)}</span>
                            <div className="space-x-2 text-sm">
                            <button onClick={() => openServiceModal(room.id, service)} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                            <button onClick={() => deleteService(room.id, service.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                            </div>
                        </div>
                        ))}
                        <button onClick={() => openServiceModal(room.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mt-2">+ Add Service</button>
                    </div>
                </div>
            ))}
            <button onClick={() => openRoomModal()} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg w-full transition">
                + Add Room
            </button>
         </div>
    );

    const renderReviewTab = () => {
        if (!calculationResult) {
            return (
                 <div className="text-center p-8">
                     <p className="text-gray-600 dark:text-gray-400 mb-4">Calculation results will appear here once calculated.</p>
                     {/* Optionally keep a manual calculate button if needed */}
                     <button
                        onClick={runCalculation}
                        disabled={!estimate.projectAddress.trim() || estimate.rooms.length === 0}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!estimate.projectAddress.trim() ? "Project Address is required" : estimate.rooms.length === 0 ? "Add rooms before calculating" : "Recalculate Estimate"}
                    >
                        {calculationResult ? 'Recalculate Estimate' : 'Calculate Estimate'}
                    </button>

                 </div>
            );
        }

        const { breakdown, subtotal, tax, total, discountAmount, adjustedSubtotal, paintCost, primerCost, asbestosCost, drywallCost } = calculationResult;

         return (
             <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Estimate Review</h2>
                {/* --- Display Project Address in Review --- */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Address:</p>
                    <p className="text-gray-900 dark:text-gray-100">{estimate.projectAddress}</p>
                </div>

                 <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                         {breakdown.map(item => (
                            <React.Fragment key={item.roomId}>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                                <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">{item.roomName}</td>
                                <td className="py-2 px-4 text-sm text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.roomTotal)}</td>
                                </tr>
                                {item.services.map(svc => (
                                <tr key={svc.serviceId}>
                                    <td className="py-1.5 px-6 text-sm text-gray-600 dark:text-gray-400">› {svc.name || formatTypeLabel(svc.serviceType)}</td>
                                    <td className="py-1.5 px-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(svc.total)}</td>
                                </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        {paintCost > 0 && (
                            <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                                <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">Paint Costs</td>
                                <td className="py-2 px-4 text-sm text-right">{formatCurrency(paintCost)}</td>
                            </tr>
                        )}
                        {primerCost > 0 && (
                             <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                                <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">Primer Costs</td>
                                <td className="py-2 px-4 text-sm text-right">{formatCurrency(primerCost)}</td>
                            </tr>
                        )}
                         {drywallCost > 0 && (
                            <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                                <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">Drywall Compound</td>
                                <td className="py-2 px-4 text-sm text-right">{formatCurrency(drywallCost)}</td>
                            </tr>
                        )}
                        {asbestosCost > 0 && (
                             <tr className="bg-gray-50 dark:bg-gray-700/50 font-medium">
                                <td className="py-2 px-4 text-sm text-gray-800 dark:text-gray-200">Asbestos Check Fee</td>
                                <td className="py-2 px-4 text-sm text-right">{formatCurrency(asbestosCost)}</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <td className="py-2 px-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Subtotal</td>
                            <td className="py-2 px-4 text-sm font-semibold text-right text-gray-800 dark:text-gray-100">{formatCurrency(subtotal)}</td>
                        </tr>
                         {discountAmount > 0 && (
                        <>
                            <tr>
                                <td className="py-1 px-4 text-sm text-gray-700 dark:text-gray-300">Discount</td>
                                <td className="py-1 px-4 text-sm text-right text-gray-700 dark:text-gray-300">-{formatCurrency(discountAmount)}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-sm font-semibold text-gray-800 dark:text-gray-100">Adjusted Subtotal</td>
                                <td className="py-2 px-4 text-sm font-semibold text-right text-gray-800 dark:text-gray-100">{formatCurrency(adjustedSubtotal)}</td>
                            </tr>
                        </>
                        )}
                        <tr>
                            <td className="py-1 px-4 text-sm text-gray-700 dark:text-gray-300">Tax ({ (pricing.TAX_RATE * 100).toFixed(1) }%)</td>
                            <td className="py-1 px-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(tax)}</td>
                        </tr>
                        <tr className="text-lg font-bold border-t border-gray-300 dark:border-gray-500">
                            <td className="py-3 px-4 text-gray-900 dark:text-white">Total</td>
                            <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{formatCurrency(total)}</td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
                 {/* Action Buttons for Review Tab */}
                 <div className="flex flex-wrap justify-end gap-4 mt-6">
                    <button
                        onClick={runCalculation} // Add explicit recalculate button
                        disabled={!estimate.projectAddress.trim() || estimate.rooms.length === 0}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-5 rounded-lg transition disabled:opacity-50"
                        title={!estimate.projectAddress.trim() ? "Project Address is required" : estimate.rooms.length === 0 ? "Add rooms before calculating" : "Recalculate Estimate"}
                    >
                         Recalculate
                    </button>
                    <button
                        onClick={() => setIsContractModalOpen(true)}
                        className="bg-purple-600 dark:bg-purple-800 hover:bg-purple-700 dark:hover:bg-purple-900 text-white py-2 px-5 rounded-lg transition"
                    >
                        Generate Contract
                    </button>
                     <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-5 rounded-lg transition"
                    >
                        Generate Invoice
                    </button>
                 </div>
            </div>
         );
    };


    return (
        <div>
            {/* Customer Info Header */}
            {customer && (
                 <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">{customer.name}</h3>
                     <p className="text-sm text-blue-700 dark:text-blue-300">{customer.email}</p>
                     <p className="text-sm text-blue-700 dark:text-blue-300">{customer.phone}</p>
                     {customer.address && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Billing Address: {customer.address}</p>}
                 </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('build')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'build'
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                    >
                        Build Estimate
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                         className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'review'
                                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                         disabled={estimate.rooms.length === 0 || !estimate.projectAddress.trim()}
                         title={!estimate.projectAddress.trim() ? "Enter Project Address first" : estimate.rooms.length === 0 ? "Add rooms before reviewing" : ""}
                    >
                        Review & Calculate
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'build' && renderBuildTab()}
                {activeTab === 'review' && renderReviewTab()}
            </div>

             {/* Save Button */}
             <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                    onClick={handleTriggerSave}
                    disabled={isSaving || !estimate.projectAddress.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!estimate.projectAddress.trim() ? "Project Address is required before saving" : ""}
                >
                    {isSaving ? 'Saving...' : 'Save Estimate'}
                </button>
            </div>


            {/* Modals */}
            {isRoomModalOpen && (
                <RoomModal
                    room={editingRoom}
                    onSave={handleSaveRoom}
                    onClose={() => { setIsRoomModalOpen(false); setEditingRoom(undefined); }}
                />
            )}
             {isServiceModalOpen && editingService && (
                <ServiceModal
                     room={estimate.rooms.find(r => r.id === editingService.roomId)}
                    service={editingService.service}
                    onSave={handleSaveService}
                    onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
                />
            )}
             {isInvoiceModalOpen && calculationResult && customer && (
                <InvoiceModal
                    onClose={() => setIsInvoiceModalOpen(false)}
                    initialClientInfo={{ // Pass initial info
                        name: customer.name,
                        address: customer.address || '',
                        address2: '',
                        email: customer.email,
                        phone: customer.phone,
                    }}
                    breakdown={calculationResult.breakdown}
                    subtotal={calculationResult.subtotal}
                    tax={calculationResult.tax}
                    total={calculationResult.total}
                    discountAmount={calculationResult.discountAmount}
                    adjustedSubtotal={calculationResult.adjustedSubtotal}
                    paintCost={calculationResult.paintCost}
                    primerCost={calculationResult.primerCost}
                    asbestosCost={calculationResult.asbestosCost}
                    formatCurrency={formatCurrency}
                />
             )}
             {isContractModalOpen && calculationResult && customer && (
                 <ContractModal
                    onClose={() => setIsContractModalOpen(false)}
                    initialContractInfo={{ // Pass initial info
                        clientName: customer.name || '',
                        clientEmail: customer.email || '',
                        clientPhone: customer.phone || '',
                        projectAddress: estimate.projectAddress || '',
                        startDate: estimate.startDate || '',
                        completionDate: estimate.completionDate || '',
                        warrantyPeriod: '1 year', // Default or make configurable
                    }}
                    breakdown={calculationResult.breakdown}
                    subtotal={calculationResult.subtotal}
                    tax={calculationResult.tax}
                    total={calculationResult.total}
                    discountAmount={calculationResult.discountAmount}
                    adjustedSubtotal={calculationResult.adjustedSubtotal}
                    paintCost={calculationResult.paintCost}
                    primerCost={calculationResult.primerCost}
                    asbestosCost={calculationResult.asbestosCost}
                    formatCurrency={formatCurrency}
                />
             )}

        </div>
    );
};

export default EstimateEditor;