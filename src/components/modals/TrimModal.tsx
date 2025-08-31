// src/components/modals/TrimModal.tsx
import React, { useState } from 'react';
import type { Service, ServiceType } from '@/types/paintingEstimator';
import { paintOptions } from '@/constants/paintTypes';

interface TrimModalProps {
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
  intendedType?: ServiceType; // Add this prop to specify the type when creating new service
}

const TrimModal: React.FC<TrimModalProps> = ({ service, intendedType, onSave, onClose, onBack }) => {
  const serviceType = service?.type || intendedType || 'trims';
  const initialState: Partial<Service> = {
    id: service?.id || Date.now(),
    type: serviceType,
    lnFt: service?.lnFt || 0,
    prepCondition: service?.prepCondition || 'good',
    coats: service?.coats || 2,
    primerType: service?.primerType || 'none',
    primerCoats: service?.primerCoats || 1,
    paintType: service?.paintType || 'sherwinWilliamsCaptivate',
    useSpray: service?.useSpray || false,
    moldResistant: service?.moldResistant || false,
  };
  if (serviceType === 'trims') {
    initialState.hasCarpet = service?.hasCarpet || false;
  }
  if (serviceType === 'crownMolding') {
    initialState.sameAsWallCeiling = service?.sameAsWallCeiling || false;
  }
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
    if (name === 'lnFt' || name === 'coats' || name === 'primerCoats') {
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
    if ((formData.coats || 0) < 1) return alert("Coats >= 1");
    if (!formData.prepCondition) return alert("Select condition");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{service ? 'Edit' : 'Add'} {serviceType === 'trims' ? 'Trim' : 'Crown Molding'} Painting</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="lnFt" className="block text-sm font-semibold text-gray-700 mb-1">Linear Feet</label>
            <input type="number" min="0" step="0.1" id="lnFt" name="lnFt" value={formData.lnFt || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.lnFt ? 'border-red-500' : ''}`} />
            {fieldErrors.lnFt && <p className="text-red-500 text-sm mt-1">{fieldErrors.lnFt}</p>}
          </div>
          {serviceType === 'trims' && (
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="hasCarpet" checked={formData.hasCarpet} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span>Has Carpet</span>
            </label>
          )}
          {serviceType === 'crownMolding' && (
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="sameAsWallCeiling" checked={formData.sameAsWallCeiling} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span>Same as Wall/Ceiling (reduce labor)</span>
            </label>
          )}
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-semibold text-gray-700 mb-1">Coats</label>
            <input type="number" min="1" id="coats" name="coats" value={formData.coats || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.coats ? 'border-red-500' : ''}`} />
            {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="primerType" className="block text-sm font-semibold text-gray-700 mb-1">Primer</label>
            <select id="primerType" name="primerType" value={formData.primerType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="none">None</option>
              <option value="spot">Spot</option>
              <option value="full">Full</option>
            </select>
          </div>
          {formData.primerType === 'full' && (
            <div>
              <label htmlFor="primerCoats" className="block text-sm font-semibold text-gray-700 mb-1">Primer Coats</label>
              <input type="number" min="1" id="primerCoats" name="primerCoats" value={formData.primerCoats || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition" />
            </div>
          )}
          <div>
            <label htmlFor="paintType" className="block text-sm font-semibold text-gray-700 mb-1">Paint Type</label>
            <select id="paintType" name="paintType" value={formData.paintType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              {paintOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="moldResistant" checked={formData.moldResistant} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Mold Resistance</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="useSpray" checked={formData.useSpray} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Use Spray (upcharge)</span>
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

export default TrimModal;