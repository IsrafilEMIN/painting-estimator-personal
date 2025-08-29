// src/components/modals/AdditionalModal.tsx
import React, { useState } from 'react';
import type { AdditionalModalProps, AdditionalItem } from '@/types/paintingEstimator';

// --- CONSTANTS DEFINED OUTSIDE THE COMPONENT ---
// This is the key fix. These objects are now created only once.
const interiorTypes = ['interiorDoor', 'closetDoor', 'vanityDoor', 'vanityDrawer', 'cabinetDoor', 'cabinetDrawer'] as const;

type ExtendedAdditionalItem = AdditionalItem & { type: AdditionalItem['type'] | '' };

const initialState: ExtendedAdditionalItem = {
  id: Date.now(),
  type: '', // Set to empty initially
  quantity: '',
  material: undefined,
  prepCondition: 'good',
  coats: 2,
};

const materialOptions: { [key in typeof interiorTypes[number]]?: string[] } = {
  interiorDoor: ['Wood', 'MDF', 'Metal'],
  closetDoor: ['Wood', 'MDF', 'Metal'],
  vanityDoor: ['Wood', 'MDF', 'Metal'],
  vanityDrawer: ['Wood', 'Laminate', 'Metal'],
  cabinetDoor: ['Wood', 'Laminate', 'Metal'],
  cabinetDrawer: ['Wood', 'Laminate', 'Metal'],
};
// --- END OF CONSTANTS ---


const AdditionalModal: React.FC<AdditionalModalProps> = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState<ExtendedAdditionalItem>(item ? { ...initialState, ...item, type: item.type } : initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      const newType = value as ExtendedAdditionalItem['type'];
      setFormData(prev => {
        // Keep material if it's compatible with the new type, otherwise reset to undefined
        const currentMaterial = prev.material;

        // --- FIX START ---
        // 1. Perform the lookup only ONCE and store the result.
        const availableMaterials = newType ? materialOptions[newType as typeof interiorTypes[number]] : undefined;

        // 2. Use the new variable. TypeScript now knows if `availableMaterials` exists, it's an array.
        const newMaterial = (availableMaterials && currentMaterial && availableMaterials.includes(currentMaterial))
          ? currentMaterial
          : undefined;
        // --- FIX END ---

        return {
          ...prev,
          type: newType,
          material: newMaterial,
        };
      });
      return;
    }

    if (name === 'quantity' || name === 'coats') {
      const num = parseFloat(value);
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
    if (!formData.type) {
      alert("Please select an item type.");
      return;
    }
    if (!formData.quantity || parseFloat(String(formData.quantity)) <= 0) {
      alert("Please enter valid quantity greater than 0.");
      return;
    }
    if (parseFloat(String(formData.coats)) < 1) {
      alert("Number of coats must be at least 1.");
      return;
    }
    if (materialOptions[formData.type as typeof interiorTypes[number]] && !formData.material) {
      alert("Please select a material.");
      return;
    }
    if (!formData.prepCondition) {
      alert("Please select a surface condition.");
      return;
    }
    onSave(formData as AdditionalItem); // Cast back to AdditionalItem since type is now set
  };

  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{item ? 'Edit' : 'Add'} Additional Item</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="item-type" className="block text-sm font-medium text-gray-700">Item Type</label>
            <select id="item-type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
              <option value="">Select Item Type</option>
              {interiorTypes.map(t => <option key={t} value={t}>{formatTypeLabel(t)}</option>)}
            </select>
          </div>
          {formData.type && materialOptions[formData.type as typeof interiorTypes[number]] && (
            <div>
              <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
              <select id="material" name="material" value={formData.material || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                <option value="">Select Material</option>
                {materialOptions[formData.type as typeof interiorTypes[number]]!.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
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
            <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats || ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" inputMode="decimal" step="0.1" min="0" id="quantity" name="quantity" value={formData.quantity || ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.quantity && <p className="text-red-500 text-sm mt-1">{fieldErrors.quantity}</p>}
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

export default AdditionalModal;