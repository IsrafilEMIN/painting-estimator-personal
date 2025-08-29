// src/components/steps/Step2.tsx
import React from 'react';
import type { InteriorWall, InteriorCeiling, PopcornRemoval, TrimItem, AdditionalItem } from '@/types/paintingEstimator';

interface Step2Props {
  interiorWalls: InteriorWall[];
  editWall: (wall: InteriorWall) => void;
  deleteWall: (id: number) => void;
  interiorCeilings: InteriorCeiling[];
  editCeiling: (ceiling: InteriorCeiling) => void;
  deleteCeiling: (id: number) => void;
  popcornRemovals: PopcornRemoval[];
  editPopcorn: (popcorn: PopcornRemoval) => void;
  deletePopcorn: (id: number) => void;
  interiorTrims: TrimItem[];
  editTrim: (trim: TrimItem) => void;
  deleteTrim: (id: number) => void;
  additionalItems: AdditionalItem[];
  editAdditionalItem: (item: AdditionalItem) => void;
  deleteAdditionalItem: (id: number) => void;
  openWallModal: () => void;
  openCeilingModal: () => void;
  openPopcornModal: () => void;
  openTrimModal: () => void;
  openAdditionalModal: () => void;
  setCurrentStep: (step: number) => void;
}

const Step2: React.FC<Step2Props> = ({
  interiorWalls,
  editWall,
  deleteWall,
  interiorCeilings,
  editCeiling,
  deleteCeiling,
  popcornRemovals,
  editPopcorn,
  deletePopcorn,
  interiorTrims,
  editTrim,
  deleteTrim,
  additionalItems,
  editAdditionalItem,
  deleteAdditionalItem,
  openWallModal,
  openCeilingModal,
  openPopcornModal,
  openTrimModal,
  openAdditionalModal,
  setCurrentStep,
}) => {
  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center text-[#162733] mb-6">Build Your Project</h2>
      <div className="max-w-3xl mx-auto">
        <div className="space-y-8">
          {/* Walls section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Walls</h3>
            <div className="space-y-4 mb-6">
              {interiorWalls.length > 0 ? (
                interiorWalls.map((wall) => (
                  <div key={wall.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-[#162733]">Walls</p>
                      <p className="text-sm text-gray-600">{wall.length}'x{wall.width}' height {wall.ceilingHeight}'</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editWall(wall)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => deleteWall(wall.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No walls added yet.</p>
              )}
            </div>
            <button onClick={openWallModal} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Walls
            </button>
          </div>

          {/* Ceilings section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Ceilings</h3>
            <div className="space-y-4 mb-6">
              {interiorCeilings.length > 0 ? (
                interiorCeilings.map((ceiling) => (
                  <div key={ceiling.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-[#162733]">Ceiling Painting</p>
                      <p className="text-sm text-gray-600">{ceiling.length}'x{ceiling.width}'</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editCeiling(ceiling)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => deleteCeiling(ceiling.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No ceilings added yet.</p>
              )}
            </div>
            <button onClick={openCeilingModal} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Ceiling Painting
            </button>
          </div>

          {/* Popcorn section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Popcorn Ceiling Removal</h3>
            <div className="space-y-4 mb-6">
              {popcornRemovals.length > 0 ? (
                popcornRemovals.map((popcorn) => (
                  <div key={popcorn.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-[#162733]">Popcorn Removal</p>
                      <p className="text-sm text-gray-600">{popcorn.length}'x{popcorn.width}'</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editPopcorn(popcorn)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => deletePopcorn(popcorn.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No popcorn removals added yet.</p>
              )}
            </div>
            <button onClick={openPopcornModal} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Popcorn Removal
            </button>
          </div>

          {/* Trim section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Trim / Baseboards</h3>
            <div className="space-y-4 mb-6">
              {interiorTrims.length > 0 ? (
                interiorTrims.map((trim) => (
                  <div key={trim.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-[#162733]">Trim</p>
                      <p className="text-sm text-gray-600">{trim.lnFt} ln ft</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editTrim(trim)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => deleteTrim(trim.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No trims added yet.</p>
              )}
            </div>
            <button onClick={openTrimModal} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Trim
            </button>
          </div>

          {/* Additional items section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Additional Items (Doors, Cabinets, etc.)</h3>
            <div className="space-y-4 mb-6">
              {additionalItems.length > 0 ? (
                additionalItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-[#162733]">{formatTypeLabel(item.type)}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}{item.material ? ` (${item.material})` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editAdditionalItem(item)} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button>
                      <button onClick={() => deleteAdditionalItem(item.id)} className="text-red-600 hover:text-red-800 font-semibold">Delete</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No additional items added yet.</p>
              )}
            </div>
            <button onClick={openAdditionalModal} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Additional Item
            </button>
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-4">
          <button onClick={() => setCurrentStep(1)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
          <button onClick={() => setCurrentStep(3)} className="btn-primary font-bold py-3 px-6 rounded-lg shadow-md">Next: Quality</button>
        </div>
      </div>
    </div>
  );
};

export default Step2;