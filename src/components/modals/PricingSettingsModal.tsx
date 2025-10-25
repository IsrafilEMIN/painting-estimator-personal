// src/components/modals/PricingSettingsModal.tsx
import React, { useState } from 'react';
import type { Pricing } from '@/types/paintingEstimator';
import { paintGroups } from '@/constants/paintTypes'; // paintStructure removed from import as it's not used

// Define a type for the form data that allows empty strings for number fields
type PricingFormData = {
  [K in keyof Pricing]: Pricing[K] extends number ? number | '' : { [P in keyof Pricing[K]]: number | '' };
};

interface PricingSettingsModalProps {
  pricing: Pricing;
  onSave: (newPricing: Pricing) => void;
  onClose: () => void;
}

interface Field {
  label: string;
  name: string;
  step?: number;
}

const PricingSettingsModal: React.FC<PricingSettingsModalProps> = ({ pricing, onSave, onClose }) => {
  const [formData, setFormData] = useState<PricingFormData>({ ...pricing });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [openSubGroups, setOpenSubGroups] = useState<{ [key: number]: Set<number> }>({});
  const [openSubSubGroups, setOpenSubSubGroups] = useState<{ [key: number]: { [key: number]: Set<number> } }>({});

  const toggleGroup = (index: number) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSubGroup = (groupIndex: number, subIndex: number) => {
    setOpenSubGroups((prev) => {
      const newObj = { ...prev };
      const currentSet = new Set(newObj[groupIndex]);
      if (currentSet.has(subIndex)) {
        currentSet.delete(subIndex);
      } else {
        currentSet.add(subIndex);
      }
      newObj[groupIndex] = currentSet;
      return newObj;
    });
  };

  const toggleSubSubGroup = (groupIndex: number, subIndex: number, subSubIndex: number) => {
    setOpenSubSubGroups((prev) => {
      const newObj = { ...prev };
      if (!newObj[groupIndex]) newObj[groupIndex] = {};
      const subObj = { ...newObj[groupIndex] };
      const currentSet = new Set(subObj[subIndex]);
      if (currentSet.has(subSubIndex)) {
        currentSet.delete(subSubIndex);
      } else {
        currentSet.add(subSubIndex);
      }
      subObj[subIndex] = currentSet;
      newObj[groupIndex] = subObj;
      return newObj;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');

    const newErrors = { ...errors };
    delete newErrors[name]; // Clear previous error for this field

    let finalValue: number | '' = '';

    if (value === '') {
      finalValue = '';
    } else {
      const num = parseFloat(value);
      if (isNaN(num)) {
        newErrors[name] = 'Must be a number';
      } else {
        if (num < 0) {
          newErrors[name] = 'Cannot be negative';
        } else if ((name.includes('PRODUCTION_RATES') || name.includes('paintCoverage') || name.includes('laborRate')) && num <= 0) {
          newErrors[name] = 'Must be positive';
        }
        finalValue = num;
      }
    }
    
    setErrors(newErrors);

    if (parts.length === 2) {
      const category = parts[0] as keyof Pricing;
      const key = parts[1] as string;
      setFormData(prev => ({
        ...prev,
        [category]: {
          ...(prev[category] as object),
          [key]: finalValue,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSave = () => {
    if (Object.values(errors).some(error => error)) {
      alert('Please fix validation errors before saving.');
      return;
    }

    // Check for empty fields before saving
    for (const key in formData) {
      if (typeof formData[key as keyof PricingFormData] === 'object') {
        const nestedObj = formData[key as keyof PricingFormData] as Record<string, number | ''>;
        for(const nestedKey in nestedObj) {
            if (nestedObj[nestedKey] === '') {
                alert(`Please fill out all fields. ${nestedKey} is empty.`);
                return;
            }
        }
      } else {
        if (formData[key as keyof PricingFormData] === '') {
            alert(`Please fill out all fields. ${key} is empty.`);
            return;
        }
      }
    }

    onSave(formData as Pricing); // Cast back to the original type
    onClose();
  };

  const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  const generalGroups: {
    title: string;
    fields?: Field[];
    subGroups?: {
      subTitle: string;
      fields?: Field[];
      subSubGroups?: {
        subSubTitle: string;
        fields: Field[];
      }[];
    }[];
  }[] = [
    {
      title: 'General Project Settings',
      fields: [
        { label: 'Labor Rate ($/hr)', name: 'laborRate' },
        { label: 'Profit Markup', name: 'PROFIT_MARKUP', step: 0.01 },
        { label: 'Tax Rate', name: 'TAX_RATE', step: 0.001 },
        { label: 'Minimum Job Fee', name: 'MIN_JOB_FEE' },
        { label: 'Waste Factor', name: 'WASTE_FACTOR', step: 0.01 },
        { label: 'Discount Percentage', name: 'DISCOUNT_PERCENTAGE', step: 0.01 }
      ],
    },
    {
      title: 'Paint and Primer Settings',
      fields: [
        { label: 'Paint Coverage (sqft/gal)', name: 'paintCoverage' },
        { label: 'Primer Cost ($/gal)', name: 'primerCost', step: 0.01 },
        { label: 'Spray Upcharge Percentage', name: 'sprayUpcharge', step: 0.01 },
      ],
    },
    {
      title: 'Paint Costs',
      fields: [
        { label: 'Standard ($/gal)', name: 'paintCosts.standard', step: 0.01 },
        { label: 'Better ($/gal)', name: 'paintCosts.better', step: 0.01 },
        { label: 'Premium ($/gal)', name: 'paintCosts.premium', step: 0.01 },
      ],
    },
    {
      title: 'Supplies and Material Costs',
      fields: [
        { label: 'Asbestos Test Cost', name: 'COST_ASBESTOS_TEST' },
      ],
    },
    {
      title: 'Production Rates',
      subGroups: [
        {
          subTitle: 'Walls and Ceilings',
          fields: [
            { label: formatLabel('wallPainting'), name: 'PRODUCTION_RATES.wallPainting', step: 0.01 },
            { label: formatLabel('ceilingPainting'), name: 'PRODUCTION_RATES.ceilingPainting', step: 0.01 },
          ],
        },
        {
          subTitle: 'Trims and Moldings',
          fields: [
            { label: formatLabel('trims'), name: 'PRODUCTION_RATES.trims', step: 0.01 },
          ],
        },
        {
          subTitle: 'Other',
          fields: [
            { label: formatLabel('popcornRemoval'), name: 'PRODUCTION_RATES.popcornRemoval', step: 0.01 },
            { label: formatLabel('popcornRemovalAsbestos'), name: 'PRODUCTION_RATES.popcornRemovalAsbestos', step: 0.01 },
          ],
        },
      ],
    },
    {
      title: 'Additional Paint Usage',
      subGroups: [
        {
          subTitle: 'Walls and Ceilings',
          fields: [
            { label: formatLabel('wallPainting'), name: 'ADDITIONAL_PAINT_USAGE.wallPainting' },
            { label: formatLabel('ceilingPainting'), name: 'ADDITIONAL_PAINT_USAGE.ceilingPainting' },
          ],
        },
        {
          subTitle: 'Trims and Moldings',
          fields: [
            { label: formatLabel('trims'), name: 'ADDITIONAL_PAINT_USAGE.trims' },
          ],
        },
        {
          subTitle: 'Other',
          fields: [
            { label: formatLabel('popcornRemoval'), name: 'ADDITIONAL_PAINT_USAGE.popcornRemoval' },
          ],
        },
      ],
    },
    {
      title: 'High Ceiling Tiers',
      fields: [
        { label: '10 ft', name: 'HIGH_CEILING_TIERS.10', step: 0.01 },
        { label: '12 ft', name: 'HIGH_CEILING_TIERS.12', step: 0.01 },
        { label: '14+ ft', name: 'HIGH_CEILING_TIERS.14+', step: 0.01 },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Pricing Settings</h3>
        <div className="space-y-8">
          {generalGroups.map((group, index) => (
            <div key={index} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
              <div
                onClick={() => toggleGroup(index)}
                className="cursor-pointer flex justify-between items-center mb-4"
              >
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{group.title}</h4>
                <span className="text-xl font-bold text-gray-600 dark:text-gray-400">
                  {openGroups.has(index) ? '-' : '+'}
                </span>
              </div>
              {openGroups.has(index) && (
                <>
                  {group.fields ? (
                    <div className={`grid grid-cols-1 md:grid-cols-1 gap-4`}>
                      {group.fields.map((field) => (
                        <InputField
                          key={field.name}
                          label={field.label}
                          name={field.name}
                          value={field.name.includes('.')
                            ? (formData[field.name.split('.')[0] as keyof PricingFormData] as Record<string, number | ''>)[field.name.split('.')[1]]
                            : formData[field.name as keyof PricingFormData] as number | ''}
                          onChange={handleChange}
                          step={field.step}
                          error={errors[field.name]}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {group.subGroups!.map((subGroup, subIndex) => (
                        <div key={subIndex}>
                          <div
                            onClick={() => toggleSubGroup(index, subIndex)}
                            className="cursor-pointer flex justify-between items-center mb-2"
                          >
                            <h5 className="text-md font-medium text-gray-700 dark:text-gray-300">{subGroup.subTitle}</h5>
                            <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                              {openSubGroups[index]?.has(subIndex) ? '-' : '+'}
                            </span>
                          </div>
                          {openSubGroups[index]?.has(subIndex) && (
                            <>
                              {subGroup.subSubGroups ? (
                                <div className="space-y-6">
                                  {subGroup.subSubGroups.map((subSubGroup, subSubIndex) => (
                                    <div key={subSubIndex}>
                                      <div
                                        onClick={() => toggleSubSubGroup(index, subIndex, subSubIndex)}
                                        className="cursor-pointer flex justify-between items-center mb-2"
                                      >
                                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">{subSubGroup.subSubTitle}</h6>
                                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                          {openSubSubGroups[index]?.[subIndex]?.has(subSubIndex) ? '-' : '+'}
                                        </span>
                                      </div>
                                      {openSubSubGroups[index]?.[subIndex]?.has(subSubIndex) && (
                                        <div className={`grid grid-cols-1 md:grid-cols-1 gap-4`}>
                                          {subSubGroup.fields.map((field) => (
                                            <InputField
                                              key={field.name}
                                              label={field.label}
                                              name={field.name}
                                              value={field.name.includes('.')
                                                ? (formData[field.name.split('.')[0] as keyof PricingFormData] as Record<string, number | ''>)[field.name.split('.')[1]]
                                                : formData[field.name as keyof PricingFormData] as number | ''}
                                              onChange={handleChange}
                                              step={field.step}
                                              error={errors[field.name]}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className={`grid grid-cols-1 md:grid-cols-1 gap-4`}>
                                  {subGroup.fields!.map((field) => (
                                    <InputField
                                      key={field.name}
                                      label={field.label}
                                      name={field.name}
                                      value={field.name.includes('.')
                                        ? (formData[field.name.split('.')[0] as keyof PricingFormData] as Record<string, number | ''>)[field.name.split('.')[1]]
                                        : formData[field.name as keyof PricingFormData] as number | ''}
                                      onChange={handleChange}
                                      step={field.step}
                                      error={errors[field.name]}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 pt-4 flex justify-end gap-4 -mx-8 px-8 border-t border-gray-200 dark:border-gray-600">
          <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition">Save</button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, step = 'any', error }: { label: string; name: string; value: number | ''; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number | 'any'; error?: string }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      type="number"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${error ? 'border-red-500' : ''}`}
    />
    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

export default PricingSettingsModal;