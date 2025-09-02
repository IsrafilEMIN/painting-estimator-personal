// src/components/modals/WallModal.tsx
import React, { useState } from 'react';
import type { Service } from '@/types/paintingEstimator';
import { paintStructure } from '@/constants/paintTypes';

interface WallModalProps {
  wall?: Partial<Service>;
  onSave: (wall: Service) => void;
  onClose: () => void;
  onBack: () => void;
}

const WallModal: React.FC<WallModalProps> = ({ wall, onSave, onClose, onBack }) => {
  const initialState: Partial<Service> = {
    id: wall?.id || Date.now(),
    type: 'wallPainting',
    hasStairway: wall?.hasStairway || false,
    stairwaySqFt: wall?.stairwaySqFt || 0,
    hasRisers: wall?.hasRisers || false,
    hasRailings: wall?.hasRailings || false,
    texture: wall?.texture || 'smooth',
    prepCondition: wall?.prepCondition || 'good',
    coats: wall?.coats || 2,
    primerType: wall?.primerType || 'none',
    primerCoats: wall?.primerCoats || 1,
    paintType: wall?.paintType || 'sherwinWilliamsCaptivateFlat',
    useSpray: wall?.useSpray || false,
    moldResistant: wall?.moldResistant || false,
    surfaceArea: wall?.surfaceArea ?? '', // New: surfaceArea
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
    const numberFields = ['stairwaySqFt', 'coats', 'primerCoats', 'surfaceArea'];
    if (numberFields.includes(name)) {
      const num = parseFloat(value) || 0;
      if (num < 0) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
        return;
      } else {
        setFieldErrors(prev => { const p = { ...prev }; delete p[name]; return p; });
      }
      setFormData(prev => ({ ...prev, [name]: num }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if ((formData.coats || 0) < 1) return alert("Coats >= 1");
    if (!formData.prepCondition) return alert("Select condition");
    if ((Number(formData.surfaceArea) || 0) <= 0) return alert("Surface Area must be positive");
    if (formData.hasStairway && (formData.stairwaySqFt || 0) <= 0) return alert("Stairway SqFt > 0");
    onSave(formData as Service);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{wall ? 'Edit' : 'Add'} Wall Painting</h3>
        <div className="space-y-5">
          <div> {/* New: surfaceArea input */}
            <label htmlFor="surfaceArea" className="block text-sm font-semibold text-gray-700 mb-1">Surface Area (sq ft)</label>
            <input type="number" min="1" id="surfaceArea" name="surfaceArea" value={formData.surfaceArea || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${fieldErrors.surfaceArea ? 'border-red-500' : ''}`} />
            {fieldErrors.surfaceArea && <p className="text-red-500 text-sm mt-1">{fieldErrors.surfaceArea}</p>}
          </div>
          <div>
            <label htmlFor="texture" className="block text-sm font-semibold text-gray-700 mb-1">Texture</label>
            <select id="texture" name="texture" value={formData.texture} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="smooth">Smooth</option>
              <option value="light">Light</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label htmlFor="prepCondition" className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
            <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label htmlFor="coats" className="block text-sm font-semibold text-gray-700 mb-1">Coats</label>
            <input type="number" min="1" id="coats" name="coats" value={formData.coats || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.coats ? 'border-red-500' : ''}`} />
            {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
          </div>
          <div>
            <label htmlFor="primerType" className="block text-sm font-semibold text-gray-700 mb-1">Primer</label>
            <select id="primerType" name="primerType" value={formData.primerType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="none">None</option>
              <option value="spot">Spot</option>
              <option value="full">Full</option>
            </select>
          </div>
          {formData.primerType === 'full' && (
            <div>
              <label htmlFor="primerCoats" className="block text-sm font-semibold text-gray-700 mb-1">Primer Coats</label>
              <input type="number" min="1" id="primerCoats" name="primerCoats" value={formData.primerCoats || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition" />
            </div>
          )}
          <div>
            <label htmlFor="paintType" className="block text-sm font-semibold text-gray-700 mb-1">Paint Type</label>
            <select id="paintType" name="paintType" value={formData.paintType} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
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
            <input type="checkbox" name="moldResistant" checked={formData.moldResistant} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Mold Resistance</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="hasStairway" checked={formData.hasStairway} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Has Stairway</span>
          </label>
          {formData.hasStairway && (
            <div className="space-y-3 pl-4 border-l-4 border-blue-200">
              <label htmlFor="stairwaySqFt" className="block text-sm font-semibold text-gray-700 mb-1">Stairway SqFt</label>
              <input type="number" min="0" step="0.1" id="stairwaySqFt" name="stairwaySqFt" value={formData.stairwaySqFt || ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.stairwaySqFt ? 'border-red-500' : ''}`} />
              {fieldErrors.stairwaySqFt && <p className="text-red-500 text-sm mt-1">{fieldErrors.stairwaySqFt}</p>}
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="hasRisers" checked={formData.hasRisers} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span>Has Risers</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="hasRailings" checked={formData.hasRailings} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span>Has Railings/Spindles</span>
              </label>
            </div>
          )}
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="useSpray" checked={formData.useSpray} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>Use Spray (upcharge)</span>
          </label>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Back</button>
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallModal;