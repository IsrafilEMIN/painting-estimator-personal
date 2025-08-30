// src/components/modals/TrimModal.tsx
import React, { useState } from 'react';
import type { Service, ServiceType } from '@/types/paintingEstimator';

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
    id: Date.now(),
    type: serviceType,
    lnFt: service?.lnFt || 0,
    prepCondition: service?.prepCondition || 'good',
    coats: service?.coats || 2,
    primerType: service?.primerType || 'none',
    primerCoats: service?.primerCoats || 1,
    paintType: service?.paintType || 'standard',
    useSpray: service?.useSpray || false,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{service ? 'Edit' : 'Add'} {serviceType === 'trims' ? 'Trim' : 'Crown Molding'} Painting</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="lnFt" className="block text-sm font-medium text-gray-700">Linear Feet</label>
            <input type="number" min="0" step="0.1" id="lnFt" name="lnFt" value={formData.lnFt || ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.lnFt ? 'border-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.lnFt && <p className="text-red-500 text-sm">{fieldErrors.lnFt}</p>}
          </div>
          {serviceType === 'trims' && (
            <label className="flex items-center">
              <input type="checkbox" name="hasCarpet" checked={formData.hasCarpet} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
              Has Carpet
            </label>
          )}
          {serviceType === 'crownMolding' && (
            <label className="flex items-center">
              <input type="checkbox" name="sameAsWallCeiling" checked={formData.sameAsWallCeiling} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
              Same as Wall/Ceiling (reduce labor)
            </label>
          )}
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Coats</label>
            <input type="number" min="1" id="coats" name="coats" value={formData.coats || ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.coats && <p className="text-red-500 text-sm">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="primerType" className="block text-sm font-medium text-gray-700">Primer</label>
            <select id="primerType" name="primerType" value={formData.primerType} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="none">None</option>
              <option value="spot">Spot</option>
              <option value="full">Full</option>
            </select>
          </div>
          {formData.primerType === 'full' && (
            <div>
              <label htmlFor="primerCoats" className="block text-sm font-medium text-gray-700">Primer Coats</label>
              <input type="number" min="1" id="primerCoats" name="primerCoats" value={formData.primerCoats || ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900`} />
            </div>
          )}
          <div>
            <label htmlFor="paintType" className="block text-sm font-medium text-gray-700">Paint Type</label>
            <select id="paintType" name="paintType" value={formData.paintType} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="standard">Standard</option>
              <option value="benjaminMooreAura">Benjamin Moore Aura</option>
              <option value="sherwinWilliamsEmerald">Sherwin Williams Emerald</option>
              <option value="moldResistant">Mold Resistant</option>
              <option value="benjaminMooreRegal">Benjamin Moore Regal</option>
              <option value="sherwinWilliamsDuration">Sherwin Williams Duration</option>
              <option value="behrPremiumPlus">Behr Premium Plus</option>
            </select>
          </div>
          <label className="flex items-center">
            <input type="checkbox" name="useSpray" checked={formData.useSpray} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
            Use Spray (upcharge)
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

export default TrimModal;