// src/components/modals/ContractModal.tsx
import React, { useState, useEffect } from 'react';
import type { DetailedBreakdownItem } from '../../types/paintingEstimator';
import { useAuth } from '../../hooks/useAuth';
import {
  generateAndDownloadContract,
  type ContractData,
  type PaymentSchedule,
} from '../../lib/contractUtils';

interface RoomDescription {
  roomId: string;
  roomName: string;
  description: string;
}

// Define the shape for initial contract info
interface InitialContractInfo {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectAddress: string;
    startDate: string;
    completionDate: string;
    warrantyPeriod: string;
}

interface ContractModalProps {
  onClose: () => void;
  // Add initialContractInfo as an optional prop
  initialContractInfo?: Partial<InitialContractInfo>; // Use Partial if some fields might be missing
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

const ContractModal: React.FC<ContractModalProps> = ({
  onClose,
  initialContractInfo, // Destructure the new prop
  breakdown,
  subtotal,
  tax,
  total,
  discountAmount,
  adjustedSubtotal,
  paintCost,
  primerCost,
  asbestosCost,
  formatCurrency,
}) => {
  const { user } = useAuth();
  // Use initialContractInfo to set the initial state, providing defaults
  const [contractInfo, setContractInfo] = useState({
    clientName: initialContractInfo?.clientName || '',
    clientEmail: initialContractInfo?.clientEmail || '',
    clientPhone: initialContractInfo?.clientPhone || '',
    projectAddress: initialContractInfo?.projectAddress || '',
    startDate: initialContractInfo?.startDate || '',
    completionDate: initialContractInfo?.completionDate || '',
    warrantyPeriod: initialContractInfo?.warrantyPeriod || '1 year', // Default warranty
  });

  const [roomDescriptions, setRoomDescriptions] = useState<RoomDescription[]>([]);
  // Initialize payment schedule based on total
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule>(() => {
      const deposit = Math.round(total * 0.10); // 10% deposit
      const second = Math.round(total * 0.40); // 40% second payment
      const final = total - deposit - second; // Remaining balance
      return {
        depositAmount: deposit,
        depositDate: '',
        depositUseCustomDate: false,
        depositCustomDate: 'Upon Signing', // Default custom text
        secondAmount: second,
        secondDate: '',
        secondUseCustomDate: false,
        secondCustomDate: 'Upon 50% Completion', // Default custom text
        finalAmount: final,
        finalDate: '',
        finalUseCustomDate: false,
        finalCustomDate: 'Upon Final Completion', // Default custom text
      };
  });


  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize room descriptions from breakdown
  useEffect(() => {
    const descriptions: RoomDescription[] = breakdown.map(item => ({
        roomId: String(item.roomId),
        roomName: item.roomName,
        description: '', // Start with empty descriptions
    }));
    setRoomDescriptions(descriptions);
  }, [breakdown]);

  // Removed redundant formatTypeLabel function definition

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContractInfo(prev => ({ ...prev, [name]: value }));
     // Clear error if required fields are filled
    if ((name === 'clientName' || name === 'projectAddress') && value.trim()) {
        setError(null);
    }
  };

  const handleRoomDescriptionChange = (roomId: string, description: string) => {
    setRoomDescriptions(prev =>
      prev.map(item =>
        item.roomId === roomId
          ? { ...item, description }
          : item
      )
    );
  };

  const handlePaymentScheduleChange = (field: keyof PaymentSchedule, value: string | number | boolean) => {
    setPaymentSchedule(prev => {
        const newState = { ...prev, [field]: value };

        // Recalculate final amount if deposit or second amount changes
        if (field === 'depositAmount' || field === 'secondAmount') {
            const deposit = field === 'depositAmount' ? Number(value) : newState.depositAmount;
            const second = field === 'secondAmount' ? Number(value) : newState.secondAmount;
            newState.finalAmount = Math.max(0, total - deposit - second); // Ensure final is not negative
        }

        // Clear date if custom date is checked, and vice versa
        if (field === 'depositUseCustomDate') {
            newState.depositDate = value ? '' : newState.depositDate;
            newState.depositCustomDate = !value ? '' : newState.depositCustomDate || 'Upon Signing';
        } else if (field === 'secondUseCustomDate') {
            newState.secondDate = value ? '' : newState.secondDate;
            newState.secondCustomDate = !value ? '' : newState.secondCustomDate || 'Upon 50% Completion';
        } else if (field === 'finalUseCustomDate') {
            newState.finalDate = value ? '' : newState.finalDate;
            newState.finalCustomDate = !value ? '' : newState.finalCustomDate || 'Upon Final Completion';
        }


        // Clear error related to payment total if amounts change
        if (field.includes('Amount')) {
             setError(prevError => prevError?.includes('Payment schedule amounts') ? null : prevError);
        }

        return newState;
    });
  };


  const handleGenerate = async () => {
    setError(null); // Clear previous errors
    if (!user) {
      setError('You must be signed in to generate a contract.');
      return;
    }
    // Validate required fields
    if (!contractInfo.clientName.trim() || !contractInfo.projectAddress.trim()) {
      setError('Please fill in client name and project address.');
      return;
    }

    // Validate payment schedule total
    const totalPayments = (paymentSchedule.depositAmount || 0) + (paymentSchedule.secondAmount || 0) + (paymentSchedule.finalAmount || 0);
    // Use a small tolerance for floating point comparisons
    if (Math.abs(totalPayments - total) > 0.01) {
      setError(`Payment schedule amounts (${formatCurrency(totalPayments)}) must equal the total contract amount (${formatCurrency(total)}). Adjust amounts.`);
      return;
    }

    // Validate date/custom date fields in payment schedule
    if (paymentSchedule.depositAmount > 0 && !paymentSchedule.depositUseCustomDate && !paymentSchedule.depositDate) {
        setError('Please provide a due date or select "Custom due date" for the Initial Deposit.'); return;
    }
    if (paymentSchedule.depositAmount > 0 && paymentSchedule.depositUseCustomDate && !paymentSchedule.depositCustomDate.trim()) {
         setError('Please provide a custom due date description for the Initial Deposit.'); return;
    }
     if (paymentSchedule.secondAmount > 0 && !paymentSchedule.secondUseCustomDate && !paymentSchedule.secondDate) {
        setError('Please provide a due date or select "Custom due date" for the Second Payment.'); return;
    }
     if (paymentSchedule.secondAmount > 0 && paymentSchedule.secondUseCustomDate && !paymentSchedule.secondCustomDate.trim()) {
         setError('Please provide a custom due date description for the Second Payment.'); return;
    }
     if (paymentSchedule.finalAmount > 0 && !paymentSchedule.finalUseCustomDate && !paymentSchedule.finalDate) {
        setError('Please provide a due date or select "Custom due date" for the Final Payment.'); return;
    }
    if (paymentSchedule.finalAmount > 0 && paymentSchedule.finalUseCustomDate && !paymentSchedule.finalCustomDate.trim()) {
         setError('Please provide a custom due date description for the Final Payment.'); return;
    }


    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();

      const contractData: ContractData = {
        uid: user.uid,
        contractInfo, // Contains all fields including warranty
        breakdown,
        subtotal,
        tax,
        total,
        discountAmount,
        adjustedSubtotal,
        paintCost,
        primerCost,
        asbestosCost,
        roomDescriptions,
        paymentSchedule,
      };

      const result = await generateAndDownloadContract(contractData, idToken);
      console.log('Contract generated successfully:', result);

      onClose(); // Close modal on success

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract. Please try again.';
      console.error('Error generating contract:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate remaining payment amount for display
   const currentPaymentTotal = (paymentSchedule.depositAmount || 0) + (paymentSchedule.secondAmount || 0) + (paymentSchedule.finalAmount || 0);
   const remainingToSchedule = total - currentPaymentTotal;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Contract Information</h3>
        {error && <p className="text-red-600 dark:text-red-400 mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-600">Client Information</h4>
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={contractInfo.clientName}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                id="clientEmail"
                name="clientEmail"
                value={contractInfo.clientEmail}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                id="clientPhone"
                name="clientPhone"
                value={contractInfo.clientPhone}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 border-gray-200 dark:border-gray-600">Project Information</h4>
            <div>
              <label htmlFor="projectAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Project Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="projectAddress"
                name="projectAddress"
                value={contractInfo.projectAddress}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Estimated Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={contractInfo.startDate}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="completionDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Estimated Completion Date
              </label>
              <input
                type="date"
                id="completionDate"
                name="completionDate"
                value={contractInfo.completionDate}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
             {/* Warranty Period (Optional, could be fixed in template) */}
             <div>
              <label htmlFor="warrantyPeriod" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Warranty Period
              </label>
              <input
                type="text"
                id="warrantyPeriod"
                name="warrantyPeriod"
                value={contractInfo.warrantyPeriod}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Room Descriptions */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 border-gray-200 dark:border-gray-600">Room Service Descriptions</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Provide a brief description of the work included for each room (e.g., "Standard prep, paint walls (2 coats), ceiling (1 coat)"). This will appear in the contract's scope of work.</p>
          <div className="space-y-4">
            {roomDescriptions.map(room => (
              <div key={room.roomId} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <label htmlFor={`desc-${room.roomId}`} className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {room.roomName}
                </label>
                <textarea
                    id={`desc-${room.roomId}`}
                    rows={2}
                    value={room.description}
                    onChange={(e) => handleRoomDescriptionChange(room.roomId, e.target.value)}
                    className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder={`Describe work for ${room.roomName}...`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 border-gray-200 dark:border-gray-600">Payment Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Initial Deposit */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Initial Deposit</h5>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentSchedule.depositAmount}
                  onChange={(e) => handlePaymentScheduleChange('depositAmount', Number(e.target.value))}
                  className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="depositUseCustomDate"
                  checked={paymentSchedule.depositUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('depositUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="depositUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date text
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                {paymentSchedule.depositUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.depositCustomDate}
                    onChange={(e) => handlePaymentScheduleChange('depositCustomDate', e.target.value)}
                    placeholder="e.g., Upon signing"
                    className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.depositDate}
                    onChange={(e) => handlePaymentScheduleChange('depositDate', e.target.value)}
                    className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Second Payment */}
             <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Second Payment</h5>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                   step="0.01"
                   min="0"
                  value={paymentSchedule.secondAmount}
                  onChange={(e) => handlePaymentScheduleChange('secondAmount', Number(e.target.value))}
                   className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="secondUseCustomDate"
                  checked={paymentSchedule.secondUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('secondUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="secondUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date text
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                {paymentSchedule.secondUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.secondCustomDate}
                    placeholder="e.g., At 50% completion"
                    onChange={(e) => handlePaymentScheduleChange('secondCustomDate', e.target.value)}
                     className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.secondDate}
                    onChange={(e) => handlePaymentScheduleChange('secondDate', e.target.value)}
                     className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Final Payment */}
             <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Final Payment</h5>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                   step="0.01"
                   min="0"
                  value={paymentSchedule.finalAmount}
                  // Make final amount read-only or recalculate automatically
                  readOnly
                  // onChange={(e) => handlePaymentScheduleChange('finalAmount', Number(e.target.value))}
                   className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                   title="Final amount is calculated automatically"
                />
              </div>
              <div className="flex items-center pt-1">
                <input
                  type="checkbox"
                  id="finalUseCustomDate"
                  checked={paymentSchedule.finalUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('finalUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="finalUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date text
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                {paymentSchedule.finalUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.finalCustomDate}
                    placeholder="e.g., Upon completion"
                    onChange={(e) => handlePaymentScheduleChange('finalCustomDate', e.target.value)}
                     className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.finalDate}
                    onChange={(e) => handlePaymentScheduleChange('finalDate', e.target.value)}
                     className="block w-full py-1.5 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                )}
              </div>
            </div>
          </div>
          {/* Display Total and Remaining */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            Total Scheduled: {formatCurrency(currentPaymentTotal)} | Remaining: <span className={Math.abs(remainingToSchedule) > 0.01 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>{formatCurrency(remainingToSchedule)}</span> | Contract Total: {formatCurrency(total)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-6 rounded-lg transition disabled:opacity-50"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="bg-green-600 dark:bg-green-800 hover:bg-green-700 dark:hover:bg-green-900 text-white py-2 px-6 rounded-lg transition disabled:opacity-50"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Contract'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;