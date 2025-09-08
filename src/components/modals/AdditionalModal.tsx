// src/components/modals/AdditionalModal.tsx
import React, { useState } from 'react';
import type { Service, ServiceType } from '@/types/paintingEstimator';
import { paintStructure } from '@/constants/paintTypes';

interface AdditionalModalProps {
  service?: Service;
  serviceType?: ServiceType;
  onSave: (service: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const materialOptions: { [key in ServiceType]?: string[] } = {
  doorPainting: ['Wood', 'MDF', 'Metal'],
  vanityDoors: ['Wood', 'MDF', 'Metal', 'Laminate'],
  vanityDrawers: ['Wood', 'MDF', 'Metal', 'Laminate'],
  cabinetDoors: ['Wood', 'MDF', 'Metal', 'Laminate'],
  cabinetDrawers: ['Wood', 'MDF', 'Metal', 'Laminate'],
  fireplaceMantel: ['Wood', 'Stone', 'Metal'],
};

const AdditionalModal: React.FC<AdditionalModalProps> = ({ service, serviceType, onSave, onClose, onBack }) => {
  const initialState: Partial<Service> = {
    id: service?.id || Date.now(),
    type: service?.type || serviceType,
    quantity: service?.quantity || 1,
    material: service?.material,
    prepCondition: service?.prepCondition || 'good',
    coats: service?.coats || 2,
    primerType: service?.primerType || 'none',
    primerCoats: service?.primerCoats || 1,
    paintType: service?.paintType || 'sherwinWilliamsCaptivateFlat',
    useSpray: service?.useSpray || false,
    moldResistant: service?.moldResistant || false,
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
    if (name === 'quantity' || name === 'coats' || name === 'primerCoats') {
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
    if ((formData.quantity || 0) <= 0) return alert("Quantity > 0");
    if ((formData.coats || 0) < 1) return alert("Coats >= 1");
    if (!formData.prepCondition) return alert("Select condition");
    if (formData.type && materialOptions[formData.type as keyof typeof materialOptions] && !formData.material) return alert("Select material");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{service ? 'Edit' : 'Add'} Additional Item</h3>
        <div className="space-y-5">
          {formData.type && materialOptions[formData.type as keyof typeof materialOptions] && (
            <div>
              <label htmlFor="material" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Material</label>
              <select id="material" name="material" value={formData.material || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">Select Material</option>
                {materialOptions[formData.type as keyof typeof materialOptions]!.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Coats</label>
            <input type="number" min="1" id="coats" name="coats" value={formData.coats || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.coats ? 'border-red-500' : ''}`} />
            {fieldErrors.coats && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input type="number" min="0" step="0.1" id="quantity" name="quantity" value={formData.quantity || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.quantity ? 'border-red-500' : ''}`} />
            {fieldErrors.quantity && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.quantity}</p>}
          </div>
          <div>
            <label htmlFor="primerType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Primer</label>
            <select id="primerType" name="primerType" value={formData.primerType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="none">None</option>
              <option value="spot">Spot</option>
              <option value="full">Full</option>
            </select>
          </div>
          {formData.primerType === 'full' && (
            <div>
              <label htmlFor="primerCoats" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Primer Coats</label>
              <input type="number" min="1" id="primerCoats" name="primerCoats" value={formData.primerCoats || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            </div>
          )}
          <div>
            <label htmlFor="paintType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Paint Type</label>
            <select id="paintType" name="paintType" value={formData.paintType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {paintStructure.map((brand) => (
                brand.lines.map((line) => (
                  <optgroup key={line.name} label={`${brand.brand} - ${line.name}`}>
                    {line.sheens.map((sheen) => (
                      <option key={sheen.key} value={sheen.key}>
                        {sheen.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="moldResistant" checked={formData.moldResistant} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">Mold Resistance</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="useSpray" checked={formData.useSpray} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">Use Spray (upcharge)</span>
          </label>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onBack} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">Back</button>
            <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalModal;