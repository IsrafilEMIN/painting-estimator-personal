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
    <div className="animate-fade-in-up">
      <h2 className="text-3xl font-serif font-bold text-[#162733] mb-4">Walls, Ceilings, Popcorn Removal, Trim & Additional Items</h2>
      <p className="text-gray-600 mb-8">Add details for interior walls, ceilings, popcorn ceiling removal, trim, baseboards, doors, cabinets, etc.</p>
      <div className="space-y-8">
        {/* Walls section */}
        <div>
          <h3 className="text-xl font-bold text-[#162733] mb-4">Interior Walls</h3>
          {interiorWalls.length === 0 ? (
            <p className="text-gray-600">No walls added yet</p>
          ) : (
            <ul className="space-y-2">
              {interiorWalls.map((wall) => (
                <li key={wall.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>{`${wall.length} x ${wall.width} ft, Height: ${wall.ceilingHeight} ft, Texture: ${wall.texture}, Coats: ${wall.coats}`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editWall(wall)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteWall(wall.id)} className="text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={openWallModal} className="btn-primary font-bold py-2 px-4 rounded-lg mt-4">Add Walls</button>
        </div>
        {/* Ceilings section */}
        <div>
          <h3 className="text-xl font-bold text-[#162733] mb-4">Interior Ceilings</h3>
          {interiorCeilings.length === 0 ? (
            <p className="text-gray-600">No ceilings added yet</p>
          ) : (
            <ul className="space-y-2">
              {interiorCeilings.map((ceiling) => (
                <li key={ceiling.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>{`${ceiling.length} x ${ceiling.width} ft, Height: ${ceiling.ceilingHeight} ft, Texture: ${ceiling.texture}, Coats: ${ceiling.coats}`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editCeiling(ceiling)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteCeiling(ceiling.id)} className="text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={openCeilingModal} className="btn-primary font-bold py-2 px-4 rounded-lg mt-4">Add Ceiling</button>
        </div>
        {/* Popcorn section */}
        <div>
          <h3 className="text-xl font-bold text-[#162733] mb-4">Popcorn Ceiling Removal</h3>
          {popcornRemovals.length === 0 ? (
            <p className="text-gray-600">No popcorn removals added yet</p>
          ) : (
            <ul className="space-y-2">
              {popcornRemovals.map((popcorn) => (
                <li key={popcorn.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>{`${popcorn.length} x ${popcorn.width} ft, Height: ${popcorn.ceilingHeight} ft`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editPopcorn(popcorn)} className="text-blue-600">Edit</button>
                    <button onClick={() => deletePopcorn(popcorn.id)} className="text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={openPopcornModal} className="btn-primary font-bold py-2 px-4 rounded-lg mt-4">Add Popcorn Removal</button>
        </div>
        {/* Trim section */}
        <div>
          <h3 className="text-xl font-bold text-[#162733] mb-4">Trim / Baseboards</h3>
          {interiorTrims.length === 0 ? (
            <p className="text-gray-600">No trim added yet</p>
          ) : (
            <ul className="space-y-2">
              {interiorTrims.map((trim) => (
                <li key={trim.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>{`${trim.lnFt} ln ft, Coats: ${trim.coats}`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editTrim(trim)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteTrim(trim.id)} className="text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={openTrimModal} className="btn-primary font-bold py-2 px-4 rounded-lg mt-4">Add Trim</button>
        </div>
        {/* Additional items section */}
        <div>
          <h3 className="text-xl font-bold text-[#162733] mb-4">Additional Items</h3>
          {additionalItems.length === 0 ? (
            <p className="text-gray-600">No additional items added yet</p>
          ) : (
            <ul className="space-y-2">
              {additionalItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                  <span>{`${formatTypeLabel(item.type)} x ${item.quantity}, Material: ${item.material || 'N/A'}, Coats: ${item.coats}`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => editAdditionalItem(item)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteAdditionalItem(item.id)} className="text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={openAdditionalModal} className="btn-primary font-bold py-2 px-4 rounded-lg mt-4">Add Item</button>
        </div>
      </div>
      <div className="mt-8 flex justify-between">
        <button onClick={() => setCurrentStep(1)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
        <button onClick={() => setCurrentStep(3)} className="btn-primary font-bold py-2 px-6 rounded-lg">Next</button>
      </div>
    </div>
  );
};

export default Step2;