// src/components/steps/Step3.tsx
import React from 'react';
import SelectableCard from '@/components/SelectableCard';
import type { PaintQuality } from '@/types/paintingEstimator';

interface Step3Props {
  selectedPaintQuality: PaintQuality;
  setSelectedPaintQuality: (quality: PaintQuality) => void;
  setCurrentStep: (step: number) => void;
}

const Step3: React.FC<Step3Props> = ({ selectedPaintQuality, setSelectedPaintQuality, setCurrentStep }) => {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-serif font-bold text-[#162733] mb-4">Select Paint Quality</h2>
      <p className="text-gray-600 mb-8">Choose your preferred paint quality</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <SelectableCard
          label="Good"
          selected={selectedPaintQuality === 'good'}
          onClick={() => setSelectedPaintQuality('good')}
        >
          <p className="text-sm text-gray-600 mt-2">Basic coverage, affordable option</p>
        </SelectableCard>
        <SelectableCard
          label="Better"
          selected={selectedPaintQuality === 'better'}
          onClick={() => setSelectedPaintQuality('better')}
        >
          <p className="text-sm text-gray-600 mt-2">Improved durability, mid-range</p>
        </SelectableCard>
        <SelectableCard
          label="Best"
          selected={selectedPaintQuality === 'best'}
          onClick={() => setSelectedPaintQuality('best')}
        >
          <p className="text-sm text-gray-600 mt-2">Premium quality, long-lasting</p>
        </SelectableCard>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setCurrentStep(2)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
        <button
          onClick={() => setCurrentStep(4)}
          disabled={!selectedPaintQuality}
          className={`btn-primary font-bold py-2 px-6 rounded-lg ${!selectedPaintQuality ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Get Estimate
        </button>
      </div>
    </div>
  );
};

export default Step3;