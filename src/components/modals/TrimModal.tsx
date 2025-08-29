// src/components/modals/TrimModal.tsx
import React, { useState } from 'react';
import type { TrimModalProps, TrimItem } from '@/types/paintingEstimator';

const TrimModal: React.FC<TrimModalProps> = ({ trim, onSave, onClose }) => {
  const initialTrimState: TrimItem = {
    id: Date.now(),
    lnFt: '',
    coats: 2,
    prepCondition: 'good',
    hasCarpet: false,
  };
  const [formData, setFormData] = useState<TrimItem>({ ...initialTrimState, ...trim });
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = value;
    if (['lnFt', 'coats'].includes(name)) {
      const num = parseFloat(value);
      if (value !== '' && !isNaN(num) && num < 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
        return;
      } else {
        setFieldErrors(prev => { const p = { ...prev }; delete p[name]; return p; });
      }
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = () => {
    if (!formData.lnFt || parseFloat(String(formData.lnFt)) <= 0) {
      alert("Please enter valid linear feet greater than 0.");
      return;
    }
    if (parseFloat(String(formData.coats)) < 1) {
      alert("Number of coats must be at least 1.");
      return;
    }
    if (!formData.prepCondition) {
      alert("Please select a surface condition.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{trim ? 'Edit' : 'Add'} Trim / Baseboards</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="lnFt" className="block text-sm font-medium text-gray-700">Linear Feet</label>
            <input type="number" inputMode="decimal" step="0.1" min="0" id="lnFt" name="lnFt" value={formData.lnFt} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.lnFt ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.lnFt && <p className="text-red-500 text-sm mt-1">{fieldErrors.lnFt}</p>}
          </div>
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
            <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div className="space-y-2">
            {/* --- FIX HERE --- */}
            <label className="flex items-center"><input type="checkbox" name="hasCarpet" checked={formData.hasCarpet || false} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Has Carpet?</label>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrimModal;