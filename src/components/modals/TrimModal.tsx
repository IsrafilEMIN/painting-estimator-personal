import React, { useState } from 'react';
import type { Service } from '@/types/paintingEstimator';

interface TrimModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const TrimModal: React.FC<TrimModalProps> = ({ service, onSave, onClose, onBack }) => {
  const [linearFeet, setLinearFeet] = useState<string>(String(service?.lnFt ?? ''));

  const handleSave = () => {
    const parsedLinearFeet = Number(linearFeet);
    if (!Number.isFinite(parsedLinearFeet) || parsedLinearFeet <= 0) {
      alert('Linear Feet must be a positive number.');
      return;
    }

    onSave({
      id: service?.id || Date.now(),
      type: 'trims',
      lnFt: parsedLinearFeet,
    } as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{service ? 'Edit' : 'Add'} Trim Painting</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="linearFeet" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Linear Feet
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="linearFeet"
              value={linearFeet}
              onChange={(e) => setLinearFeet(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">
              Back
            </button>
            <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimModal;

