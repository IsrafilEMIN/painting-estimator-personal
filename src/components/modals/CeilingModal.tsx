// src/components/modals/CeilingModal.tsx
import React, { useState } from 'react';
import type { CeilingModalProps, InteriorCeiling } from '@/types/paintingEstimator';

const CeilingModal: React.FC<CeilingModalProps> = ({ ceiling, onSave, onClose }) => {
  const initialCeilingState: InteriorCeiling = {
    id: Date.now(),
    length: '',
    width: '',
    ceilingHeight: 8,
    texture: 'smooth',
    coats: 2,
    prepCondition: 'good',
    useMoldResistantPaint: false,
    paintCrownMolding: false,
    paintFireplaceMantel: false,
  };
  const [formData, setFormData] = useState<InteriorCeiling>({ ...initialCeilingState, ...ceiling });
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let checked: boolean | undefined;
    if (type === 'checkbox') {
      checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    const newValue = value;
    if (['length', 'width', 'ceilingHeight', 'coats'].includes(name)) {
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
    if (!formData.length || !formData.width || !formData.ceilingHeight || parseFloat(String(formData.length)) <= 0 || parseFloat(String(formData.width)) <= 0 || parseFloat(String(formData.ceilingHeight)) <= 0) {
      alert("Please enter valid dimensions greater than 0.");
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
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{ceiling ? 'Edit' : 'Add'} Interior Ceiling Painting</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ceiling-length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
              <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-length" name="length" value={formData.length} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
              {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
            </div>
            <div>
              <label htmlFor="ceiling-width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
              <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-width" name="width" value={formData.width} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
              {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="ceiling-height" className="block text-sm font-medium text-gray-700">Ceiling Height (ft)</label>
            <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-height" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.ceilingHeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.ceilingHeight && <p className="text-red-500 text-sm mt-1">{fieldErrors.ceilingHeight}</p>}
          </div>
          <div>
            <label htmlFor="texture" className="block text-sm font-medium text-gray-700">Surface Texture</label>
            <select id="texture" name="texture" value={formData.texture} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="smooth">Smooth</option>
              <option value="light">Light Texture</option>
              <option value="heavy">Heavy Texture</option>
            </select>
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
            <label className="flex items-center">
              <input type="checkbox" name="useMoldResistantPaint" checked={formData.useMoldResistantPaint} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
              Use Mold-Resistant Paint
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="paintCrownMolding" checked={formData.paintCrownMolding} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
              Paint Crown Molding
            </label>
            <label className="flex items-center">
              <input type="checkbox" name="paintFireplaceMantel" checked={formData.paintFireplaceMantel} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />
              Paint Fireplace Mantel
            </label>
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

export default CeilingModal;