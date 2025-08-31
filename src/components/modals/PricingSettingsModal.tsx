// src/components/modals/PricingSettingsModal.tsx
import React, { useState } from 'react';
import type { Pricing } from '@/types/paintingEstimator';
import { paintGroups } from '@/constants/paintTypes';

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
      fields: Field[];
    }[];
  }[] = [
    {
      title: 'General Project Settings',
      fields: [
        { label: 'Labor Rate ($/hr)', name: 'laborRate' },
        { label: 'Profit Markup', name: 'PROFIT_MARKUP', step: 0.01 },
        { label: 'Tax Rate', name: 'TAX_RATE', step: 0.001 },
        { label: 'Minimum Job Fee', name: 'MIN_JOB_FEE' },
        { label: 'Supplies Percentage', name: 'SUPPLIES_PERCENTAGE', step: 0.01 },
        { label: 'Waste Factor', name: 'WASTE_FACTOR', step: 0.01 },
      ],
    },
    {
      title: 'Paint and Primer Settings',
      fields: [
        { label: 'Paint Coverage (sqft/gal)', name: 'paintCoverage' },
        { label: 'Primer Cost ($/gal)', name: 'primerCost', step: 0.01 },
        { label: 'Spray Upcharge Percentage', name: 'sprayUpcharge', step: 0.01 },
        { label: 'Mold Resistant Upcharge ($/gal)', name: 'moldResistantUpcharge', step: 0.01 },
      ],
    },
    {
      title: 'Paint Costs',
      subGroups: paintGroups.map((group) => ({
        subTitle: group.subTitle,
        fields: group.fields.map((field) => ({
          label: field.label,
          name: `paintCosts.${field.key}`,
          step: 0.01,
        })),
      })),
    },
    {
      title: 'Supplies and Material Costs',
      fields: [
        { label: 'Popcorn Removal Materials ($/sqft)', name: 'COST_POPCORN_REMOVAL_MATERIALS_PER_SQFT', step: 0.01 },
        { label: 'Asbestos Test Cost', name: 'COST_ASBESTOS_TEST' },
        { label: 'Asbestos Additional ($/sqft)', name: 'ASBESTOS_ADDITIONAL_PER_SQFT', step: 0.01 },
        { label: 'Railings Spindles Cost', name: 'COST_RAILINGS_SPINDLES' },
      ],
    },
    {
      title: 'Prep Settings',
      fields: [
        { label: 'Base Prep Hours Fixed', name: 'BASE_PREP_HOURS_FIXED', step: 0.01 },
        { label: 'Prep Hours Per Floor Sqft', name: 'PREP_HOURS_PER_FLOOR_SQFT', step: 0.001 },
        { label: 'Prep Hours Per Perimeter Lft', name: 'PREP_HOURS_PER_PERIMETER_LFT', step: 0.001 },
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
            { label: formatLabel('crownMolding'), name: 'PRODUCTION_RATES.crownMolding', step: 0.01 },
          ],
        },
        {
          subTitle: 'Doors',
          fields: [
            { label: formatLabel('doorPainting'), name: 'PRODUCTION_RATES.doorPainting', step: 0.01 },
          ],
        },
        {
          subTitle: 'Cabinets',
          fields: [
            { label: formatLabel('cabinetDoors'), name: 'PRODUCTION_RATES.cabinetDoors', step: 0.01 },
            { label: formatLabel('cabinetDrawers'), name: 'PRODUCTION_RATES.cabinetDrawers', step: 0.01 },
          ],
        },
        {
          subTitle: 'Vanities',
          fields: [
            { label: formatLabel('vanityDoors'), name: 'PRODUCTION_RATES.vanityDoors', step: 0.01 },
            { label: formatLabel('vanityDrawers'), name: 'PRODUCTION_RATES.vanityDrawers', step: 0.01 },
          ],
        },
        {
          subTitle: 'Other',
          fields: [
            { label: formatLabel('popcornRemoval'), name: 'PRODUCTION_RATES.popcornRemoval', step: 0.01 },
            { label: formatLabel('popcornRemovalAsbestos'), name: 'PRODUCTION_RATES.popcornRemovalAsbestos', step: 0.01 },
            { label: formatLabel('fireplaceMantel'), name: 'PRODUCTION_RATES.fireplaceMantel', step: 0.01 },
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
            { label: formatLabel('crownMolding'), name: 'ADDITIONAL_PAINT_USAGE.crownMolding' },
          ],
        },
        {
          subTitle: 'Doors',
          fields: [
            { label: formatLabel('doorPainting'), name: 'ADDITIONAL_PAINT_USAGE.doorPainting' },
          ],
        },
        {
          subTitle: 'Cabinets',
          fields: [
            { label: formatLabel('cabinetDoors'), name: 'ADDITIONAL_PAINT_USAGE.cabinetDoors' },
            { label: formatLabel('cabinetDrawers'), name: 'ADDITIONAL_PAINT_USAGE.cabinetDrawers' },
          ],
        },
        {
          subTitle: 'Vanities',
          fields: [
            { label: formatLabel('vanityDoors'), name: 'ADDITIONAL_PAINT_USAGE.vanityDoors' },
            { label: formatLabel('vanityDrawers'), name: 'ADDITIONAL_PAINT_USAGE.vanityDrawers' },
          ],
        },
        {
          subTitle: 'Other',
          fields: [
            { label: formatLabel('popcornRemoval'), name: 'ADDITIONAL_PAINT_USAGE.popcornRemoval' },
            { label: formatLabel('fireplaceMantel'), name: 'ADDITIONAL_PAINT_USAGE.fireplaceMantel' },
          ],
        },
      ],
    },
    {
      title: 'Prep Condition Additives',
      fields: [
        { label: formatLabel('good'), name: 'PREP_CONDITION_ADDITIVES.good', step: 0.01 },
        { label: formatLabel('fair'), name: 'PREP_CONDITION_ADDITIVES.fair', step: 0.01 },
        { label: formatLabel('poor'), name: 'PREP_CONDITION_ADDITIVES.poor', step: 0.01 },
      ],
    },
    {
      title: 'Texture Additives',
      fields: [
        { label: formatLabel('smooth'), name: 'TEXTURE_ADDITIVES.smooth', step: 0.01 },
        { label: formatLabel('light'), name: 'TEXTURE_ADDITIVES.light', step: 0.01 },
        { label: formatLabel('heavy'), name: 'TEXTURE_ADDITIVES.heavy', step: 0.01 },
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
    {
      title: 'Interior Door Material Additives',
      fields: [
        { label: formatLabel('Wood'), name: 'INTERIOR_DOOR_MATERIAL_ADDITIVES.Wood', step: 0.01 },
        { label: formatLabel('MDF'), name: 'INTERIOR_DOOR_MATERIAL_ADDITIVES.MDF', step: 0.01 },
        { label: formatLabel('Metal'), name: 'INTERIOR_DOOR_MATERIAL_ADDITIVES.Metal', step: 0.01 },
      ],
    },
    {
      title: 'Cabinet Material Additives',
      fields: [
        { label: formatLabel('Wood'), name: 'CABINET_MATERIAL_ADDITIVES.Wood', step: 0.01 },
        { label: formatLabel('MDF'), name: 'CABINET_MATERIAL_ADDITIVES.MDF', step: 0.01 },
        { label: formatLabel('Laminate'), name: 'CABINET_MATERIAL_ADDITIVES.Laminate', step: 0.01 },
        { label: formatLabel('Metal'), name: 'CABINET_MATERIAL_ADDITIVES.Metal', step: 0.01 },
      ],
    },
    {
      title: 'Mantel Material Additives',
      fields: [
        { label: formatLabel('Wood'), name: 'MANTEL_MATERIAL_ADDITIVES.Wood', step: 0.01 },
        { label: formatLabel('Stone'), name: 'MANTEL_MATERIAL_ADDITIVES.Stone', step: 0.01 },
        { label: formatLabel('Metal'), name: 'MANTEL_MATERIAL_ADDITIVES.Metal', step: 0.01 },
      ],
    },
    {
      title: 'Scaffolding Cost Tiers',
      fields: [
        { label: '10 ft', name: 'SCAFFOLDING_COST_TIERS.10' },
        { label: '12 ft', name: 'SCAFFOLDING_COST_TIERS.12' },
        { label: '14+ ft', name: 'SCAFFOLDING_COST_TIERS.14+' },
      ],
    },
    {
      title: 'Additives and Deductions',
      fields: [
        { label: 'Extra Coat Additive', name: 'EXTRA_COAT_ADDITIVE', step: 0.01 },
        { label: 'Stairwell Complexity Additive', name: 'STAIRWELL_COMPLEXITY_ADDITIVE', step: 0.01 },
      ],
    },
  ];

  const getMdCols = (len: number) => {
    if (len === 1) return 1;
    if (len === 2) return 2;
    if (len === 3) return 3;
    if (len === 4) return 2;
    return 3;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Pricing Settings</h3>
        <div className="space-y-8">
          {generalGroups.map((group, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-inner">
              <div
                onClick={() => toggleGroup(index)}
                className="cursor-pointer flex justify-between items-center mb-4"
              >
                <h4 className="text-lg font-semibold text-gray-800">{group.title}</h4>
                <span className="text-xl font-bold text-gray-600">
                  {openGroups.has(index) ? '-' : '+'}
                </span>
              </div>
              {openGroups.has(index) && (
                <>
                  {group.fields ? (
                    <div className={`grid grid-cols-1 md:grid-cols-${getMdCols(group.fields.length)} gap-4`}>
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
                            <h5 className="text-md font-medium text-gray-700">{subGroup.subTitle}</h5>
                            <span className="text-lg font-bold text-gray-600">
                              {openSubGroups[index]?.has(subIndex) ? '-' : '+'}
                            </span>
                          </div>
                          {openSubGroups[index]?.has(subIndex) && (
                            <div className={`grid grid-cols-1 md:grid-cols-${getMdCols(subGroup.fields.length)} gap-4`}>
                              {subGroup.fields.map((field) => (
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
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 flex justify-end gap-4 -mx-8 px-8">
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Save</button>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, step = 'any', error }: { label: string; name: string; value: number | ''; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number | 'any'; error?: string }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${error ? 'border-red-500' : ''}`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default PricingSettingsModal;