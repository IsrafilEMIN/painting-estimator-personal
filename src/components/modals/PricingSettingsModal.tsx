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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');
    const num = parseFloat(value);

    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [name]: 'Must be a number' }));
      return;
    }
    if (num < 0) {
      setErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
      return;
    }
    if (name.includes('PRODUCTION_RATES') || name.includes('paintCoverage') || name.includes('laborRate')) {
      if (num <= 0) {
        setErrors(prev => ({ ...prev, [name]: 'Must be positive' }));
        return;
      }
    }
    setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });

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
    if (Object.keys(errors).length > 0) {
      alert('Please fix validation errors before saving.');
      return;
    }
    onSave(formData);
    onClose();
  };

  const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Pricing Settings</h3>
        <div className="space-y-8">
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">General</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Labor Rate ($/hr)" name="laborRate" value={formData.laborRate} onChange={handleChange} error={errors['laborRate']} />
              <InputField label="Paint Coverage (sqft/gal)" name="paintCoverage" value={formData.paintCoverage} onChange={handleChange} error={errors['paintCoverage']} />
              <InputField label="Primer Cost ($/gal)" name="primerCost" value={formData.primerCost} onChange={handleChange} error={errors['primerCost']} />
              <InputField label="Spray Upcharge (%)" name="sprayUpcharge" value={formData.sprayUpcharge} onChange={handleChange} error={errors['sprayUpcharge']} />
              <InputField label="Profit Markup" name="PROFIT_MARKUP" value={formData.PROFIT_MARKUP} onChange={handleChange} step={0.01} error={errors['PROFIT_MARKUP']} />
              <InputField label="Tax Rate" name="TAX_RATE" value={formData.TAX_RATE} onChange={handleChange} step={0.001} error={errors['TAX_RATE']} />
              <InputField label="Supplies Percentage" name="SUPPLIES_PERCENTAGE" value={formData.SUPPLIES_PERCENTAGE} onChange={handleChange} step={0.01} error={errors['SUPPLIES_PERCENTAGE']} />
              <InputField label="Waste Factor" name="WASTE_FACTOR" value={formData.WASTE_FACTOR} onChange={handleChange} step={0.01} error={errors['WASTE_FACTOR']} />
              <InputField label="Popcorn Removal Materials ($/sqft)" name="COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT" value={formData.COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT} onChange={handleChange} step={0.01} error={errors['COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT']} />
              <InputField label="Base Prep Hours Fixed" name="BASE_PREP_HOURS_FIXED" value={formData.BASE_PREP_HOURS_FIXED} onChange={handleChange} step={0.01} error={errors['BASE_PREP_HOURS_FIXED']} />
              <InputField label="Prep Hours Per Floor Sqft" name="PREP_HOURS_PER_FLOOR_SQFT" value={formData.PREP_HOURS_PER_FLOOR_SQFT} onChange={handleChange} step={0.001} error={errors['PREP_HOURS_PER_FLOOR_SQFT']} />
              <InputField label="Prep Hours Per Perimeter Lft" name="PREP_HOURS_PER_PERIMETER_LFT" value={formData.PREP_HOURS_PER_PERIMETER_LFT} onChange={handleChange} step={0.001} error={errors['PREP_HOURS_PER_PERIMETER_LFT']} />
              <InputField label="Mold Resistant Paint Upcharge" name="COST_MOLD_RESISTANT_PAINT_UPCHARGE" value={formData.COST_MOLD_RESISTANT_PAINT_UPCHARGE} onChange={handleChange} error={errors['COST_MOLD_RESISTANT_PAINT_UPCHARGE']} />
              <InputField label="Fireplace Mantel Cost" name="COST_FIREPLACE_MANTEL" value={formData.COST_FIREPLACE_MANTEL} onChange={handleChange} error={errors['COST_FIREPLACE_MANTEL']} />
              <InputField label="Extra Coat Additive" name="EXTRA_COAT_ADDITIVE" value={formData.EXTRA_COAT_ADDITIVE} onChange={handleChange} step={0.01} error={errors['EXTRA_COAT_ADDITIVE']} />
              <InputField label="Door Deduction Sqft" name="DOOR_DEDUCTION_SQFT" value={formData.DOOR_DEDUCTION_SQFT} onChange={handleChange} error={errors['DOOR_DEDUCTION_SQFT']} />
              <InputField label="Window Deduction Sqft" name="WINDOW_DEDUCTION_SQFT" value={formData.WINDOW_DEDUCTION_SQFT} onChange={handleChange} error={errors['WINDOW_DEDUCTION_SQFT']} />
              <InputField label="Stairwell Complexity Additive" name="STAIRWELL_COMPLEXITY_ADDITIVE" value={formData.STAIRWELL_COMPLEXITY_ADDITIVE} onChange={handleChange} step={0.01} error={errors['STAIRWELL_COMPLEXITY_ADDITIVE']} />
              <InputField label="Asbestos Test Cost" name="COST_ASBESTOS_TEST" value={formData.COST_ASBESTOS_TEST} onChange={handleChange} error={errors['COST_ASBESTOS_TEST']} />
              <InputField label="Railings Spindles Cost" name="COST_RAILINGS_SPINDLES" value={formData.COST_RAILINGS_SPINDLES} onChange={handleChange} error={errors['COST_RAILINGS_SPINDLES']} />
              <InputField label="Minimum Job Fee" name="MIN_JOB_FEE" value={formData.MIN_JOB_FEE} onChange={handleChange} error={errors['MIN_JOB_FEE']} />
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Paint Costs ($/gal)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.paintCosts).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`paintCosts.${key}`} value={value} onChange={handleChange} error={errors[`paintCosts.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Production Rates (sqft/hr or items/hr)</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.PRODUCTION_RATES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`PRODUCTION_RATES.${key}`} value={value} onChange={handleChange} error={errors[`PRODUCTION_RATES.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Paint Usage</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.ADDITIONAL_PAINT_USAGE).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`ADDITIONAL_PAINT_USAGE.${key}`} value={value} onChange={handleChange} error={errors[`ADDITIONAL_PAINT_USAGE.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Prep Condition Additives</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.PREP_CONDITION_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`PREP_CONDITION_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} error={errors[`PREP_CONDITION_ADDITIVES.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Texture Additives</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.TEXTURE_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`TEXTURE_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} error={errors[`TEXTURE_ADDITIVES.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">High Ceiling Tiers</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.HIGH_CEILING_TIERS).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`HIGH_CEILING_TIERS.${key}`} value={value} onChange={handleChange} step={0.01} error={errors[`HIGH_CEILING_TIERS.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Scaffolding Cost Tiers</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.SCAFFOLDING_COST_TIERS).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`SCAFFOLDING_COST_TIERS.${key}`} value={value} onChange={handleChange} error={errors[`SCAFFOLDING_COST_TIERS.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Door Material Additives</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.INTERIOR_DOOR_MATERIAL_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`INTERIOR_DOOR_MATERIAL_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} error={errors[`INTERIOR_DOOR_MATERIAL_ADDITIVES.${key}`]} />
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Cabinet Material Additives</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(formData.CABINET_MATERIAL_ADDITIVES).map(([key, value]) => (
                <InputField key={key} label={formatLabel(key)} name={`CABINET_MATERIAL_ADDITIVES.${key}`} value={value} onChange={handleChange} step={0.01} error={errors[`CABINET_MATERIAL_ADDITIVES.${key}`]} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Save</button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, step = 1, error }: { label: string; name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number; error?: string }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      step={step}
      className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${error ? 'border-red-500' : ''}`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default PricingSettingsModal;