import React, { useState } from 'react';
import type { Pricing } from '@/types/paintingEstimator';

interface PricingSettingsModalProps {
  pricing: Pricing;
  onSave: (newPricing: Pricing) => void;
  onClose: () => void;
}

type PricingFormData = {
  laborRate: string;
  overheadRate: string;
  profitMarginRate: string;
  materialRates: {
    wallPainting: string;
    ceilingPainting: string;
    trims: string;
  };
  productionRates: {
    wallPainting: string;
    ceilingPainting: string;
    trims: string;
  };
};

const toFormData = (value: Pricing): PricingFormData => ({
  laborRate: String(value.laborRate),
  overheadRate: String(value.overheadRate),
  profitMarginRate: String(value.profitMarginRate),
  materialRates: {
    wallPainting: String(value.materialRates.wallPainting),
    ceilingPainting: String(value.materialRates.ceilingPainting),
    trims: String(value.materialRates.trims),
  },
  productionRates: {
    wallPainting: String(value.productionRates.wallPainting),
    ceilingPainting: String(value.productionRates.ceilingPainting),
    trims: String(value.productionRates.trims),
  },
});

const parseNumberField = (
  rawValue: string,
  label: string,
  { min = 0, allowZero = true }: { min?: number; allowZero?: boolean } = {}
): { value?: number; error?: string } => {
  const trimmed = rawValue.trim();
  if (trimmed === '') {
    return { error: `${label} is required.` };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { error: `${label} must be a valid number.` };
  }

  if (!allowZero && parsed === 0) {
    return { error: `${label} must be greater than 0.` };
  }

  if (parsed < min) {
    return { error: `${label} must be at least ${min}.` };
  }

  return { value: parsed };
};

const PricingSettingsModal: React.FC<PricingSettingsModalProps> = ({ pricing, onSave, onClose }) => {
  const [formData, setFormData] = useState<PricingFormData>(toFormData(pricing));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = (field: string, message?: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleRootChange = (field: 'laborRate' | 'overheadRate' | 'profitMarginRate', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(field);
  };

  const handleNestedChange = (
    group: 'materialRates' | 'productionRates',
    field: 'wallPainting' | 'ceilingPainting' | 'trims',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }));
    setError(`${group}.${field}`);
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    const laborRate = parseNumberField(formData.laborRate, 'Labor rate', { min: 0, allowZero: false });
    if (laborRate.error) nextErrors.laborRate = laborRate.error;

    const overheadRate = parseNumberField(formData.overheadRate, 'Overhead rate', { min: 0 });
    if (overheadRate.error) nextErrors.overheadRate = overheadRate.error;

    const profitMarginRate = parseNumberField(formData.profitMarginRate, 'Profit margin rate', { min: 0 });
    if (profitMarginRate.error) nextErrors.profitMarginRate = profitMarginRate.error;

    const materialWall = parseNumberField(formData.materialRates.wallPainting, 'Wall material rate', { min: 0 });
    if (materialWall.error) nextErrors['materialRates.wallPainting'] = materialWall.error;

    const materialCeiling = parseNumberField(formData.materialRates.ceilingPainting, 'Ceiling material rate', { min: 0 });
    if (materialCeiling.error) nextErrors['materialRates.ceilingPainting'] = materialCeiling.error;

    const materialTrims = parseNumberField(formData.materialRates.trims, 'Trim material rate', { min: 0 });
    if (materialTrims.error) nextErrors['materialRates.trims'] = materialTrims.error;

    const prodWall = parseNumberField(formData.productionRates.wallPainting, 'Wall production rate', { min: 0, allowZero: false });
    if (prodWall.error) nextErrors['productionRates.wallPainting'] = prodWall.error;

    const prodCeiling = parseNumberField(formData.productionRates.ceilingPainting, 'Ceiling production rate', { min: 0, allowZero: false });
    if (prodCeiling.error) nextErrors['productionRates.ceilingPainting'] = prodCeiling.error;

    const prodTrims = parseNumberField(formData.productionRates.trims, 'Trim production rate', { min: 0, allowZero: false });
    if (prodTrims.error) nextErrors['productionRates.trims'] = prodTrims.error;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      laborRate: laborRate.value as number,
      overheadRate: overheadRate.value as number,
      profitMarginRate: profitMarginRate.value as number,
      materialRates: {
        wallPainting: materialWall.value as number,
        ceilingPainting: materialCeiling.value as number,
        trims: materialTrims.value as number,
      },
      productionRates: {
        wallPainting: prodWall.value as number,
        ceilingPainting: prodCeiling.value as number,
        trims: prodTrims.value as number,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Pricing Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Estimator uses: material + labour + overhead + profit.</p>

        <div className="space-y-6">
          <section className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Core Rates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Labor Rate ($/hr)"
                value={formData.laborRate}
                onChange={(value) => handleRootChange('laborRate', value)}
                step="0.01"
                error={errors.laborRate}
              />
              <InputField
                label="Overhead Rate (0-1)"
                value={formData.overheadRate}
                onChange={(value) => handleRootChange('overheadRate', value)}
                step="0.001"
                error={errors.overheadRate}
              />
              <InputField
                label="Profit Margin Rate (0-1)"
                value={formData.profitMarginRate}
                onChange={(value) => handleRootChange('profitMarginRate', value)}
                step="0.001"
                error={errors.profitMarginRate}
              />
            </div>
          </section>

          <section className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Material Rates ($ per unit)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Walls"
                value={formData.materialRates.wallPainting}
                onChange={(value) => handleNestedChange('materialRates', 'wallPainting', value)}
                step="0.01"
                error={errors['materialRates.wallPainting']}
              />
              <InputField
                label="Ceilings"
                value={formData.materialRates.ceilingPainting}
                onChange={(value) => handleNestedChange('materialRates', 'ceilingPainting', value)}
                step="0.01"
                error={errors['materialRates.ceilingPainting']}
              />
              <InputField
                label="Trims"
                value={formData.materialRates.trims}
                onChange={(value) => handleNestedChange('materialRates', 'trims', value)}
                step="0.01"
                error={errors['materialRates.trims']}
              />
            </div>
          </section>

          <section className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Production Rates (units per hour)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Walls"
                value={formData.productionRates.wallPainting}
                onChange={(value) => handleNestedChange('productionRates', 'wallPainting', value)}
                step="0.01"
                error={errors['productionRates.wallPainting']}
              />
              <InputField
                label="Ceilings"
                value={formData.productionRates.ceilingPainting}
                onChange={(value) => handleNestedChange('productionRates', 'ceilingPainting', value)}
                step="0.01"
                error={errors['productionRates.ceilingPainting']}
              />
              <InputField
                label="Trims"
                value={formData.productionRates.trims}
                onChange={(value) => handleNestedChange('productionRates', 'trims', value)}
                step="0.01"
                error={errors['productionRates.trims']}
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 pt-4 flex justify-end gap-4 mt-8 border-t border-gray-200 dark:border-gray-600">
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
  );
};

const InputField = ({
  label,
  value,
  onChange,
  step,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: string;
  error?: string;
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      className={`block w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
        error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
      }`}
    />
    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

export default PricingSettingsModal;
