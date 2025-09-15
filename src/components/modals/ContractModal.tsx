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

interface ContractModalProps {
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

const ContractModal: React.FC<ContractModalProps> = ({
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
  formatCurrency,
}) => {
  const { user } = useAuth();
  const [contractInfo, setContractInfo] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    projectAddress: '',
    startDate: '',
    completionDate: '',
    warrantyPeriod: '1 year',
  });

  const [roomDescriptions, setRoomDescriptions] = useState<RoomDescription[]>([]);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule>({
    depositAmount: Math.round(total * 10) / 100,
    depositDate: '',
    depositUseCustomDate: false,
    depositCustomDate: '',
    secondAmount: Math.round(total * 40) / 100,
    secondDate: '',
    secondUseCustomDate: false,
    secondCustomDate: '',
    finalAmount: Math.round((total - Math.round(total * 10) / 100 -  Math.round(total * 40) / 100) * 100) / 100,
    finalDate: '',
    finalUseCustomDate: false,
    finalCustomDate: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize room descriptions from breakdown
  useEffect(() => {
    const descriptions: RoomDescription[] = [];
    breakdown.forEach(item => {
      descriptions.push({
        roomId: String(item.roomId),
        roomName: item.roomName,
        description: '',
      });
    });
    setRoomDescriptions(descriptions);
  }, [breakdown]);

  const formatTypeLabel = (type: string) =>
    type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContractInfo(prev => ({ ...prev, [name]: value }));
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
    setPaymentSchedule(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setError(null);
    if (!user) {
      setError('You must be signed in to generate a contract.');
      return;
    }
    if (!contractInfo.clientName || !contractInfo.projectAddress) {
      setError('Please fill in client name and project address.');
      return;
    }

    const totalPayments = paymentSchedule.depositAmount + paymentSchedule.secondAmount + paymentSchedule.finalAmount;
    if (Math.abs(totalPayments - total) > 1) {
      setError('Payment schedule amounts must equal the total contract amount.');
      return;
    }

    setIsGenerating(true);
    try {
      const idToken = await user.getIdToken();

      const contractData: ContractData = {
        uid: user.uid,
        contractInfo,
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
      
      onClose();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract. Please try again.';
      console.error('Error generating contract:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

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
                Start Date
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
                Completion Date
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
          </div>
        </div>

        {/* Room Descriptions */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 border-gray-200 dark:border-gray-600">Room Descriptions</h4>
          <div className="space-y-6">
            {breakdown.map(room => (
              <div key={String(room.roomId)} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{room.roomName}</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={roomDescriptions.find(
                        desc => desc.roomId === String(room.roomId)
                      )?.description || ''}
                      onChange={(e) => handleRoomDescriptionChange(String(room.roomId), e.target.value)}
                      className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder={`Describe the work for ${room.roomName}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 border-gray-200 dark:border-gray-600">Payment Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Initial Deposit */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Initial Deposit</h5>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentSchedule.depositAmount}
                  onChange={(e) => handlePaymentScheduleChange('depositAmount', Number(e.target.value))}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="depositUseCustomDate"
                  checked={paymentSchedule.depositUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('depositUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="depositUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                {paymentSchedule.depositUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.depositCustomDate}
                    onChange={(e) => handlePaymentScheduleChange('depositCustomDate', e.target.value)}
                    placeholder="e.g., Upon signing"
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.depositDate}
                    onChange={(e) => handlePaymentScheduleChange('depositDate', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>
            </div>

            {/* Second Payment */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Second Payment</h5>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentSchedule.secondAmount}
                  onChange={(e) => handlePaymentScheduleChange('secondAmount', Number(e.target.value))}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secondUseCustomDate"
                  checked={paymentSchedule.secondUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('secondUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="secondUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                {paymentSchedule.secondUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.secondCustomDate}
                    placeholder="e.g., At 50% completion"
                    onChange={(e) => handlePaymentScheduleChange('secondCustomDate', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.secondDate}
                    onChange={(e) => handlePaymentScheduleChange('secondDate', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>
            </div>

            {/* Final Payment */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 dark:text-gray-300">Final Payment</h5>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentSchedule.finalAmount}
                  onChange={(e) => handlePaymentScheduleChange('finalAmount', Number(e.target.value))}
                  className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="finalUseCustomDate"
                  checked={paymentSchedule.finalUseCustomDate}
                  onChange={(e) => handlePaymentScheduleChange('finalUseCustomDate', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="finalUseCustomDate" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Custom due date
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                {paymentSchedule.finalUseCustomDate ? (
                  <input
                    type="text"
                    value={paymentSchedule.finalCustomDate}
                    placeholder="e.g., Upon completion"
                    onChange={(e) => handlePaymentScheduleChange('finalCustomDate', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <input
                    type="date"
                    value={paymentSchedule.finalDate}
                    onChange={(e) => handlePaymentScheduleChange('finalDate', e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Total Scheduled: {formatCurrency(paymentSchedule.depositAmount + paymentSchedule.secondAmount + paymentSchedule.finalAmount)} | Left: {formatCurrency(total - (paymentSchedule.depositAmount + paymentSchedule.secondAmount + paymentSchedule.finalAmount))} |
              Contract Total: {formatCurrency(total)}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
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