// src/components/modals/PricingSettingsModal.tsx
import React, { useState } from 'react';
import type { Pricing } from '@/types/paintingEstimator';

interface PricingSettingsModalProps {
  pricing: Pricing;
  onSave: (newPricing: Pricing) => void;
  onClose: () => void;
}

const PricingSettingsModal: React.FC<PricingSettingsModalProps> = ({ pricing, onSave, onClose }) => {
  const [formData, setFormData] = useState<Pricing>({ ...pricing });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');
    const num = parseFloat(value) || 0;

    if (parts.length === 2) {
      const category = parts[0] as keyof Pricing;
      const key = parts[1] as string;
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...prev[category] as object,
          [key]: num,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: num }));
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">Pricing Settings</h3>
        <div className="space-y-6">
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">General</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InputField label="Labor Rate ($/hr)" name="laborRate" value={formData.laborRate} onChange={handleChange} />
              <InputField label="Paint Coverage (sqft/gal)" name="paintCoverage" value={formData.paintCoverage} onChange={handleChange} />
              <InputField label="Primer Cost ($/gal)" name="primerCost" value={formData.primerCost} onChange={handleChange} />
              <InputField label="Spray Upcharge (%)" name="sprayUpcharge" value={formData.sprayUpcharge} onChange={handleChange} />
              <InputField label="Profit Markup" name="PROFIT_MARKUP" value={formData.PROFIT_MARKUP} onChange={handleChange} step={0.01} />
              <InputField label="Tax Rate" name="TAX_RATE" value={formData.TAX_RATE} onChange={handleChange} step={0.001} />
              <InputField label="Supplies Percentage" name="SUPPLIES_PERCENTAGE" value={formData.SUPPLIES_PERCENTAGE} onChange={handleChange} step={0.01} />
              <InputField label="Waste Factor" name="WASTE_FACTOR" value={formData.WASTE_FACTOR} onChange={handleChange} step={0.01} />
              <InputField label="Popcorn Removal Materials ($/sqft)" name="COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT" value={formData.COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT} onChange={handleChange} step={0.01} />
              <InputField label="Base Prep Hours Fixed" name="BASE_PREP_HOURS_FIXED" value={formData.BASE_PREP_HOURS_FIXED} onChange={handleChange} step={0.01} />
              <InputField label="Prep Hours Per Floor Sqft" name="PREP_HOURS_PER_FLOOR_SQFT" value={formData.PREP_HOURS_PER_FLOOR_SQFT} onChange={handleChange} step={0.001} />
              <InputField label="Prep Hours Per Perimeter Lft" name="PREP_HOURS_PER_PERIMETER_LFT" value={formData.PREP_HOURS_PER_PERIMETER_LFT} onChange={handleChange} step={0.001} />
              <InputField label="Mold Resistant Paint Upcharge" name="COST_MOLD_RESISTANT_PAINT_UPCHARGE" value={formData.COST_MOLD_RESISTANT_PAINT_UPCHARGE} onChange={handleChange} />
              <InputField label="Fireplace Mantel Cost" name="COST_FIREPLACE_MANTEL" value={formData.COST_FIREPLACE_MANTEL} onChange={handleChange} />
              <InputField label="Extra Coat Additive" name="EXTRA_COAT_ADDITIVE" value={formData.EXTRA_COAT_ADDITIVE} onChange={handleChange} step={0.01} />
              <InputField label="Door Deduction Sqft" name="DOOR_DEDUCTION_SQFT" value={formData.DOOR_DEDUCTION_SQFT} onChange={handleChange} />
              <InputField label="Window Deduction Sqft" name="WINDOW_DEDUCTION_SQFT" value={formData.WINDOW_DEDUCTION_SQFT} onChange={handleChange} />
              <InputField label="Stairwell Complexity Additive" name="STAIRWELL_COMPLEXITY_ADDITIVE" value={formData.STAIRWELL_COMPLEXITY_ADDITIVE} onChange={handleChange} step={0.01} />
              <InputField label="Asbestos Test Cost" name="COST_ASBESTOS_TEST" value={formData.COST_ASBESTOS_TEST} onChange={handleChange} />
              <InputField label="Railings Spindles Cost" name="COST_RAILINGS_SPINDLES" value={formData.COST_RAILINGS_SPINDLES} onChange={handleChange} />
              <InputField label="Minimum Job Fee" name="MIN_JOB_FEE" value={formData.MIN_JOB_FEE} onChange={handleChange} />
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Paint Costs ($/gal)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.paintCosts).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`paintCosts.${key}`} value={value} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Production Rates (sqft/hr or items/hr)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.PRODUCTION_RATES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`PRODUCTION_RATES.${key}`} value={value} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Additional Paint Usage</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.ADDITIONAL_PAINT_USAGE).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`ADDITIONAL_PAINT_USAGE.${key}`} value={value} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Prep Condition Additives</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.PREP_CONDITION_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`PREP_CONDITION_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Texture Additives</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.TEXTURE_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`TEXTURE_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">High Ceiling Tiers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.HIGH_CEILING_TIERS).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`HIGH_CEILING_TIERS.${key}`} value={value} onChange={handleChange} step={0.01} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Scaffolding Cost Tiers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.SCAFFOLDING_COST_TIERS).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`SCAFFOLDING_COST_TIERS.${key}`} value={value} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Door Material Additives</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.INTERIOR_DOOR_MATERIAL_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`INTERIOR_DOOR_MATERIAL_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-md">
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Cabinet Material Additives</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(formData.CABINET_MATERIAL_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`CABINET_MATERIAL_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, step = 1 }: { label: string; name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="number"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      step={step}
      className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900"
    />
  </div>
);

export default PricingSettingsModal;