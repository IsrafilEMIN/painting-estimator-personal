// src/components/modals/AdditionalModal.tsx
import React, { useState } from 'react';
import type { Service, ServiceType } from '@/types/paintingEstimator';

interface AdditionalModalProps {
  service?: Service;
  serviceType: ServiceType;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const AdditionalModal: React.FC<AdditionalModalProps> = ({ service, serviceType, onSave, onClose, onBack }) => {
  type FormData = Omit<Partial<Service>, 'quantity' | 'cost'> & {
    quantity?: string | number;
    cost?: string | number;
  };

  const initialState: FormData & { name?: string } = {
    id: service?.id || Date.now(),
    type: serviceType,
    name: service?.name ?? '',
    quantity: service?.quantity ?? '',
    cost: service?.cost ?? '',
  };
  const [formData, setFormData] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
      return;
    }
    const numberFields = ['quantity', 'cost'];
    if (numberFields.includes(name)) {
      if (value === '') {
        setFormData(prev => ({ ...prev, [name]: '' }));
        setFieldErrors(prev => ({ ...prev, [name]: undefined }));
        return;
      }
      const num = parseFloat(value);
      if (isNaN(num)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Must be a valid number' }));
        return;
      }
      if (num < 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
        return;
      }
      if (name === 'quantity' && num === 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Quantity must be positive' }));
        return;
      }
      if (name === 'cost' && num === 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Cost must be positive' }));
        return;
      }
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
      setFormData(prev => ({ ...prev, [name]: num }));
    }
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Please enter an item name');
      return;
    }
    const quantity = Number(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Quantity must be positive');
      return;
    }
    const cost = Number(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      alert('Cost must be positive');
      return;
    }
    onSave({
      ...formData,
      quantity,
      cost,
    } as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{service ? 'Edit' : 'Add'} Additional Service</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name ?? ''}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              step="1"
              id="quantity"
              name="quantity"
              value={formData.quantity ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.quantity ? 'border-red-500' : ''}`}
            />
            {fieldErrors.quantity && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.quantity}</p>}
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cost per Unit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              id="cost"
              name="cost"
              value={formData.cost ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.cost ? 'border-red-500' : ''}`}
            />
            {fieldErrors.cost && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.cost}</p>}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onBack}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalModal;