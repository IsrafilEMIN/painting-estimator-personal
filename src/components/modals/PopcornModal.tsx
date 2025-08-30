// src/components/modals/PopcornModal.tsx
import React, { useState } from 'react';
import type { Service, PrepCondition } from '@/types/paintingEstimator';

interface PopcornModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const PopcornModal: React.FC<PopcornModalProps> = ({ service, onClose, onSave, onBack }) => {
  const initialState: Partial<Service> = {
    id: Date.now(),
    type: 'popcornRemoval',
    prepCondition: service?.prepCondition || 'good',
    asbestos: service?.asbestos || false,
  };
  const [formData, setFormData] = useState<Partial<Service>>(initialState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.prepCondition) return alert("Select condition");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{service ? 'Edit' : 'Add'} Popcorn Removal</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <label className="flex items-center">
            <input type="checkbox" name="asbestos" checked={formData.asbestos} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
            Asbestos Check Required
          </label>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onBack} className="btn-secondary font-bold py-2 px-4 rounded-lg">Back</button>
            <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopcornModal;