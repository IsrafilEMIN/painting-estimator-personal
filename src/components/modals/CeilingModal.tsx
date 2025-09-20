// src/components/modals/CeilingModal.tsx
import React, { useState } from 'react';
import type { Service } from '@/types/paintingEstimator';
import { paintStructure } from '@/constants/paintTypes';

interface CeilingModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const CeilingModal: React.FC<CeilingModalProps> = ({ service, onSave, onClose, onBack }) => {
  // Define form data type to allow strings for input fields
  type FormData = Omit<Partial<Service>, 'texture' | 'coats' | 'primerCoats' | 'surfaceArea'> & {
    texture?: string | number;
    coats?: string | number;
    primerCoats?: string | number;
    surfaceArea?: string | number;
  };

  const initialState: FormData = {
    id: service?.id || Date.now(),
    type: 'ceilingPainting',
    texture: service?.texture ?? '',
    coats: service?.coats ?? '',
    primerCoats: service?.primerCoats ?? '',
    paintType: service?.paintType || 'standard',
    useSpray: service?.useSpray || false,
    surfaceArea: service?.surfaceArea ?? '',
  };
  const [formData, setFormData] = useState<FormData>(initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    const numberFields = ['coats', 'primerCoats', 'surfaceArea', 'texture'];
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
      if (name === 'surfaceArea' && num === 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Surface Area must be positive' }));
        return;
      }
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
      setFormData(prev => ({ ...prev, [name]: num }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    const surfaceArea = Number(formData.surfaceArea);
    if (isNaN(surfaceArea) || surfaceArea <= 0) {
      alert('Surface Area must be positive');
      return;
    }
    const coats = formData.coats === '' ? undefined : Number(formData.coats);
    const primerCoats = formData.primerCoats === '' ? undefined : Number(formData.primerCoats);
    const texture = formData.texture === '' ? undefined : Number(formData.texture);
    if ((coats !== undefined && coats < 0) || (primerCoats !== undefined && primerCoats < 0) || (texture !== undefined && texture < 0)) {
      alert('Coats, Primer Coats, and Texture cannot be negative');
      return;
    }
    onSave({
      ...formData,
      surfaceArea,
      coats,
      primerCoats,
      texture,
    } as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{service ? 'Edit' : 'Add'} Ceiling Painting</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="surfaceArea" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Surface Area (sq ft)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="surfaceArea"
              name="surfaceArea"
              value={formData.surfaceArea ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.surfaceArea ? 'border-red-500' : ''}`}
            />
            {fieldErrors.surfaceArea && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.surfaceArea}</p>}
          </div>
          <div>
            <label htmlFor="texture" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Texture Multiplier</label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="texture"
              name="texture"
              value={formData.texture ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.texture ? 'border-red-500' : ''}`}
            />
            {fieldErrors.texture && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.texture}</p>}
          </div>
          <div>
            <label htmlFor="primerCoats" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Primer Coats</label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="primerCoats"
              name="primerCoats"
              value={formData.primerCoats ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.primerCoats ? 'border-red-500' : ''}`}
            />
            {fieldErrors.primerCoats && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.primerCoats}</p>}
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Paint Coats</label>
            <input
              type="number"
              min="0"
              step="0.1"
              id="coats"
              name="coats"
              value={formData.coats ?? ''}
              onChange={handleChange}
              className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.coats ? 'border-red-500' : ''}`}
            />
            {fieldErrors.coats && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="paintType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Paint Type</label>
            <select
              id="paintType"
              name="paintType"
              value={formData.paintType}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {paintStructure.map((brand) =>
                brand.lines.map((line) => (
                  <optgroup key={line.name} label={`${brand.brand} - ${line.name}`}>
                    {line.sheens.map((sheen) => (
                      <option key={sheen.key} value={sheen.key}>
                        {sheen.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="useSpray"
              checked={formData.useSpray}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Use Spray (upcharge)</span>
          </label>
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

export default CeilingModal;