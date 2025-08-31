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
    useCustomSqFt: service?.useCustomSqFt || false,
    customSqFt: service?.customSqFt || undefined,
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
    if (name === 'customSqFt') {
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
    if (formData.useCustomSqFt && ((formData.customSqFt || 0) <= 0)) return alert("Custom SqFt must be positive if enabled");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{service ? 'Edit' : 'Add'} Popcorn Removal</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="asbestos" checked={formData.asbestos} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Asbestos Check Required</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="useCustomSqFt" checked={formData.useCustomSqFt} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Use Custom Surface Area</span>
          </label>
          {formData.useCustomSqFt && (
            <div>
              <label htmlFor="customSqFt" className="block text-sm font-semibold text-gray-700 mb-1">Custom Sq Ft</label>
              <input type="number" min="1" id="customSqFt" name="customSqFt" value={formData.customSqFt || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${fieldErrors.customSqFt ? 'border-red-500' : ''}`} />
              {fieldErrors.customSqFt && <p className="text-red-500 text-sm mt-1">{fieldErrors.customSqFt}</p>}
            </div>
          )}
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