import React, { useState } from 'react';
import type { Service } from '@/types/paintingEstimator';

interface CeilingModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const CeilingModal: React.FC<CeilingModalProps> = ({ service, onSave, onClose, onBack }) => {
  const [surfaceArea, setSurfaceArea] = useState<string>(String(service?.surfaceArea ?? ''));

  const handleSave = () => {
    const parsedArea = Number(surfaceArea);
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      alert('Surface Area must be a positive number.');
      return;
    }

    onSave({
      id: service?.id || Date.now(),
      type: 'ceilingPainting',
      surfaceArea: parsedArea,
    } as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{service ? 'Edit' : 'Add'} Ceiling Painting</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="surfaceArea" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Surface Area (sq ft)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="surfaceArea"
              value={surfaceArea}
              onChange={(e) => setSurfaceArea(e.target.value)}
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

export default CeilingModal;

