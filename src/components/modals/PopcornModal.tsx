// src/components/modals/PopcornModal.tsx
import React, { useState } from 'react';
import type { Service } from '@/types/paintingEstimator';

interface PopcornModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const PopcornModal: React.FC<PopcornModalProps> = ({ service, onClose, onSave, onBack }) => {
  const initialState: Partial<Service> = {
    id: service?.id || Date.now(),
    type: 'popcornRemoval',
    prepCondition: service?.prepCondition || 'good',
    asbestos: service?.asbestos || false,
    asbestosTest: service?.asbestosTest || false,
    surfaceArea: service?.surfaceArea ?? '',
  };
  const [formData, setFormData] = useState<Partial<Service>>(initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    let num;
    if (name === 'surfaceArea') {
      num = parseFloat(value) || 0;
      if (value !== '' && !isNaN(num) && num < 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
        return;
      } else {
        setFieldErrors(prev => { const p = { ...prev }; delete p[name]; return p; });
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.prepCondition) return alert("Select condition");
    if ((Number(formData.surfaceArea) || 0) <= 0) return alert("Surface Area must be positive");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{service ? 'Edit' : 'Add'} Popcorn Removal</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="surfaceArea" className="block text-sm font-semibold text-gray-700 mb-1">Surface Area (sq ft)</label>
            <input type="number" min="1" id="surfaceArea" name="surfaceArea" value={formData.surfaceArea || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${fieldErrors.surfaceArea ? 'border-red-500' : ''}`} />
            {fieldErrors.surfaceArea && <p className="text-red-500 text-sm mt-1">{fieldErrors.surfaceArea}</p>}
          </div>
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="asbestosTest" checked={formData.asbestosTest} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Check Asbestos?</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="asbestos" checked={formData.asbestos} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Has Asbestos?</span>
          </label>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Back</button>
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopcornModal;