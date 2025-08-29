// src/components/PricingSettingsModal.tsx
import React, { useState } from 'react';
import type { PricingConfig } from '@/types/paintingEstimator';
import { DEFAULT_PRICING } from '@/constants/pricing';

const PricingSettingsModal = ({ pricing, onSave, onClose }: { pricing: PricingConfig; onSave: (newPricing: PricingConfig) => void; onClose: () => void; }) => {
  const [formData, setFormData] = useState<PricingConfig>(pricing);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parts = name.split('.');
    if (parts.length >= 2) {
      const parent = parts[0] as keyof PricingConfig;
      const child = parts.slice(1).join('.');
      setFormData((prev) => {
        const nested = prev[parent] as Record<string, number>;
        return {
          ...prev,
          [parent]: {
            ...nested,
            [child]: parseFloat(value) || 0,
          },
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_PRICING);
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">Adjust Pricing Configuration</h3>
        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">General Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="PROFIT_MARKUP" className="block text-sm text-gray-600">Profit Markup (for 50% margin: 2.0)</label>
                <input type="number" step="0.01" min="0" id="PROFIT_MARKUP" name="PROFIT_MARKUP" value={formData.PROFIT_MARKUP} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
              <div>
                <label htmlFor="TAX_RATE" className="block text-sm text-gray-600">Tax Rate</label>
                <input type="number" step="0.01" min="0" id="TAX_RATE" name="TAX_RATE" value={formData.TAX_RATE} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
              <div>
                <label htmlFor="PAINTER_BURDENED_HOURLY_COST" className="block text-sm text-gray-600">Burdened Hourly Labor Cost</label>
                <input type="number" step="0.01" min="0" id="PAINTER_BURDENED_HOURLY_COST" name="PAINTER_BURDENED_HOURLY_COST" value={formData.PAINTER_BURDENED_HOURLY_COST} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
              <div>
                <label htmlFor="SUPPLIES_PERCENTAGE" className="block text-sm text-gray-600">Supplies % of Paint Cost</label>
                <input type="number" step="0.01" min="0" id="SUPPLIES_PERCENTAGE" name="SUPPLIES_PERCENTAGE" value={formData.SUPPLIES_PERCENTAGE} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
              <div>
                <label htmlFor="COVERAGE_PER_GALLON" className="block text-sm text-gray-600">Coverage per Gallon (sq ft)</label>
                <input type="number" step="1" min="0" id="COVERAGE_PER_GALLON" name="COVERAGE_PER_GALLON" value={formData.COVERAGE_PER_GALLON} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
              <div>
                <label htmlFor="PRIMER_COST_PER_GALLON" className="block text-sm text-gray-600">Primer Cost per Gallon</label>
                <input type="number" step="0.01" min="0" id="PRIMER_COST_PER_GALLON" name="PRIMER_COST_PER_GALLON" value={formData.PRIMER_COST_PER_GALLON} onChange={handleChange} className="mt-1 block w-full rounded-md border-2 border-gray-400 focus:border-[#093373]" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Material Costs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="paint_good" className="block text-sm text-gray-600">Paint Cost/Gallon - Good</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_good" name="PAINT_COST_PER_GALLON.good" value={formData.PAINT_COST_PER_GALLON.good} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_better" className="block text-sm text-gray-600">Paint Cost/Gallon - Better</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_better" name="PAINT_COST_PER_GALLON.better" value={formData.PAINT_COST_PER_GALLON.better} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_best" className="block text-sm text-gray-600">Paint Cost/Gallon - Best</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_best" name="PAINT_COST_PER_GALLON.best" value={formData.PAINT_COST_PER_GALLON.best} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="primer_cost" className="block text-sm text-gray-600">Primer Cost/Gallon</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="primer_cost" name="PRIMER_COST_PER_GALLON" value={formData.PRIMER_COST_PER_GALLON} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Prep Hours</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="BASE_PREP_HOURS_FIXED" className="block text-sm text-gray-600">Base Prep Hours Fixed (per project)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="BASE_PREP_HOURS_FIXED" name="BASE_PREP_HOURS_FIXED" value={formData.BASE_PREP_HOURS_FIXED} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="PREP_HOURS_PER_FLOOR_SQFT" className="block text-sm text-gray-600">Interior Prep Hours per Floor SqFt</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="PREP_HOURS_PER_FLOOR_SQFT" name="PREP_HOURS_PER_FLOOR_SQFT" value={formData.PREP_HOURS_PER_FLOOR_SQFT} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="PREP_HOURS_PER_PERIMETER_LFT" className="block text-sm text-gray-600">Interior Prep Hours per Perimeter LnFt</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="PREP_HOURS_PER_PERIMETER_LFT" name="PREP_HOURS_PER_PERIMETER_LFT" value={formData.PREP_HOURS_PER_PERIMETER_LFT} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Addon Costs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="COST_MOLD_RESISTANT_PAINT_UPCHARGE" className="block text-sm text-gray-600">Cost Mold Resistant Paint Upcharge</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="COST_MOLD_RESISTANT_PAINT_UPCHARGE" name="COST_MOLD_RESISTANT_PAINT_UPCHARGE" value={formData.COST_MOLD_RESISTANT_PAINT_UPCHARGE} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="COST_CROWN_MOLDING" className="block text-sm text-gray-600">Cost Crown Molding</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="COST_CROWN_MOLDING" name="COST_CROWN_MOLDING" value={formData.COST_CROWN_MOLDING} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="COST_FIREPLACE_MANTEL" className="block text-sm text-gray-600">Cost Fireplace Mantel</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="COST_FIREPLACE_MANTEL" name="COST_FIREPLACE_MANTEL" value={formData.COST_FIREPLACE_MANTEL} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="COST_STAIRWELL" className="block text-sm text-gray-600">Cost Stairwell</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="COST_STAIRWELL" name="COST_STAIRWELL" value={formData.COST_STAIRWELL} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Multipliers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prep_good" className="block text-sm text-gray-600">Prep Multiplier - Good</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="prep_good" name="PREP_CONDITION_MULTIPLIERS.good" value={formData.PREP_CONDITION_MULTIPLIERS.good} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="prep_fair" className="block text-sm text-gray-600">Prep Multiplier - Fair</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="prep_fair" name="PREP_CONDITION_MULTIPLIERS.fair" value={formData.PREP_CONDITION_MULTIPLIERS.fair} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="prep_poor" className="block text-sm text-gray-600">Prep Multiplier - Poor</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="prep_poor" name="PREP_CONDITION_MULTIPLIERS.poor" value={formData.PREP_CONDITION_MULTIPLIERS.poor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="texture_smooth" className="block text-sm text-gray-600">Texture Multiplier - Smooth</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="texture_smooth" name="TEXTURE_MULTIPLIERS.smooth" value={formData.TEXTURE_MULTIPLIERS.smooth} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="texture_light" className="block text-sm text-gray-600">Texture Multiplier - Light</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="texture_light" name="TEXTURE_MULTIPLIERS.light" value={formData.TEXTURE_MULTIPLIERS.light} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="texture_heavy" className="block text-sm text-gray-600">Texture Multiplier - Heavy</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="texture_heavy" name="TEXTURE_MULTIPLIERS.heavy" value={formData.TEXTURE_MULTIPLIERS.heavy} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="EXTRA_COAT_MULTIPLIER" className="block text-sm text-gray-600">Extra Coat Multiplier</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="EXTRA_COAT_MULTIPLIER" name="EXTRA_COAT_MULTIPLIER" value={formData.EXTRA_COAT_MULTIPLIER} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="HIGH_CEILING_MULTIPLIER" className="block text-sm text-gray-600">High Ceiling Multiplier</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="HIGH_CEILING_MULTIPLIER" name="HIGH_CEILING_MULTIPLIER" value={formData.HIGH_CEILING_MULTIPLIER} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="interior_door_wood" className="block text-sm text-gray-600">Interior Door Labor Mult - Wood</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="interior_door_wood" name="INTERIOR_DOOR_MATERIAL_MULTIPLIERS.Wood" value={formData.INTERIOR_DOOR_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="interior_door_mdf" className="block text-sm text-gray-600">Interior Door Labor Mult - MDF</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="interior_door_mdf" name="INTERIOR_DOOR_MATERIAL_MULTIPLIERS.MDF" value={formData.INTERIOR_DOOR_MATERIAL_MULTIPLIERS.MDF} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="interior_door_metal" className="block text-sm text-gray-600">Interior Door Labor Mult - Metal</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="interior_door_metal" name="INTERIOR_DOOR_MATERIAL_MULTIPLIERS.Metal" value={formData.INTERIOR_DOOR_MATERIAL_MULTIPLIERS.Metal} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="cabinet_wood" className="block text-sm text-gray-600">Cabinet Labor Mult - Wood</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="cabinet_wood" name="CABINET_MATERIAL_MULTIPLIERS.Wood" value={formData.CABINET_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="cabinet_laminate" className="block text-sm text-gray-600">Cabinet Labor Mult - Laminate</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="cabinet_laminate" name="CABINET_MATERIAL_MULTIPLIERS.Laminate" value={formData.CABINET_MATERIAL_MULTIPLIERS.Laminate} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="cabinet_metal" className="block text-sm text-gray-600">Cabinet Labor Mult - Metal</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="cabinet_metal" name="CABINET_MATERIAL_MULTIPLIERS.Metal" value={formData.CABINET_MATERIAL_MULTIPLIERS.Metal} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Production Rates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="production_walls" className="block text-sm text-gray-600">Walls (sqft/hr)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="production_walls" name="PRODUCTION_RATES.walls" value={formData.PRODUCTION_RATES.walls} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_ceilings" className="block text-sm text-gray-600">Ceilings (sqft/hr)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="production_ceilings" name="PRODUCTION_RATES.ceilings" value={formData.PRODUCTION_RATES.ceilings} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_trim" className="block text-sm text-gray-600">Trim (lnft/hr)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="production_trim" name="PRODUCTION_RATES.trim" value={formData.PRODUCTION_RATES.trim} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_interiorDoor" className="block text-sm text-gray-600">Interior Door (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_interiorDoor" name="PRODUCTION_RATES.interiorDoor" value={formData.PRODUCTION_RATES.interiorDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_closetDoor" className="block text-sm text-gray-600">Closet Door (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_closetDoor" name="PRODUCTION_RATES.closetDoor" value={formData.PRODUCTION_RATES.closetDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_vanityDoor" className="block text-sm text-gray-600">Vanity Door (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_vanityDoor" name="PRODUCTION_RATES.vanityDoor" value={formData.PRODUCTION_RATES.vanityDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_vanityDrawer" className="block text-sm text-gray-600">Vanity Drawer (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_vanityDrawer" name="PRODUCTION_RATES.vanityDrawer" value={formData.PRODUCTION_RATES.vanityDrawer} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_cabinetDoor" className="block text-sm text-gray-600">Cabinet Door (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_cabinetDoor" name="PRODUCTION_RATES.cabinetDoor" value={formData.PRODUCTION_RATES.cabinetDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_cabinetDrawer" className="block text-sm text-gray-600">Cabinet Drawer (hr/item)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_cabinetDrawer" name="PRODUCTION_RATES.cabinetDrawer" value={formData.PRODUCTION_RATES.cabinetDrawer} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="production_popcornRemoval" className="block text-sm text-gray-600">Popcorn Removal (sqft/hr)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="production_popcornRemoval" name="PRODUCTION_RATES.popcornRemoval" value={formData.PRODUCTION_RATES.popcornRemoval} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#162733] mb-4">Additional Paint Usage</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="paint_interiorDoor" className="block text-sm text-gray-600">Interior Door Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_interiorDoor" name="ADDITIONAL_PAINT_USAGE.interiorDoor" value={formData.ADDITIONAL_PAINT_USAGE.interiorDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_trim" className="block text-sm text-gray-600">Trim Paint Usage (sqft/lnft)</label>
                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_trim" name="ADDITIONAL_PAINT_USAGE.trim" value={formData.ADDITIONAL_PAINT_USAGE.trim} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_closetDoor" className="block text-sm text-gray-600">Closet Door Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_closetDoor" name="ADDITIONAL_PAINT_USAGE.closetDoor" value={formData.ADDITIONAL_PAINT_USAGE.closetDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_vanityDoor" className="block text-sm text-gray-600">Vanity Door Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_vanityDoor" name="ADDITIONAL_PAINT_USAGE.vanityDoor" value={formData.ADDITIONAL_PAINT_USAGE.vanityDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_vanityDrawer" className="block text-sm text-gray-600">Vanity Drawer Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_vanityDrawer" name="ADDITIONAL_PAINT_USAGE.vanityDrawer" value={formData.ADDITIONAL_PAINT_USAGE.vanityDrawer} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_cabinetDoor" className="block text-sm text-gray-600">Cabinet Door Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_cabinetDoor" name="ADDITIONAL_PAINT_USAGE.cabinetDoor" value={formData.ADDITIONAL_PAINT_USAGE.cabinetDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
              <div>
                <label htmlFor="paint_cabinetDrawer" className="block text-sm text-gray-600">Cabinet Drawer Paint Usage (sqft/item)</label>
                <input type="number" inputMode="decimal" step="1" min="0" id="paint_cabinetDrawer" name="ADDITIONAL_PAINT_USAGE.cabinetDrawer" value={formData.ADDITIONAL_PAINT_USAGE.cabinetDrawer} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={handleReset} className="btn-secondary font-bold py-2 px-4 rounded-lg">Reset to Default</button>
          <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default PricingSettingsModal;