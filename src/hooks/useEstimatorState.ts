// src/hooks/useEstimatorState.ts
import { useState } from 'react';
import type {
  InteriorWall, InteriorCeiling, PopcornRemoval, TrimItem, AdditionalItem,
  PaintQuality, DetailedBreakdownItem
} from '@/types/paintingEstimator';

export const useEstimatorState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [interiorWalls, setInteriorWalls] = useState<InteriorWall[]>([]);
  const [interiorCeilings, setInteriorCeilings] = useState<InteriorCeiling[]>([]);
  const [popcornRemovals, setPopcornRemovals] = useState<PopcornRemoval[]>([]);
  const [interiorTrims, setInteriorTrims] = useState<TrimItem[]>([]);
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [selectedPaintQuality, setSelectedPaintQuality] = useState<PaintQuality>('');
  const [isWallModalOpen, setIsWallModalOpen] = useState(false);
  const [isCeilingModalOpen, setIsCeilingModalOpen] = useState(false);
  const [isPopcornModalOpen, setIsPopcornModalOpen] = useState(false);
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [isAdditionalModalOpen, setIsAdditionalModalOpen] = useState(false);
  const [editingWall, setEditingWall] = useState<InteriorWall | null>(null);
  const [editingCeiling, setEditingCeiling] = useState<InteriorCeiling | null>(null);
  const [editingPopcorn, setEditingPopcorn] = useState<PopcornRemoval | null>(null);
  const [editingTrim, setEditingTrim] = useState<TrimItem | null>(null);
  const [editingAdditionalItem, setEditingAdditionalItem] = useState<AdditionalItem | null>(null);
  const [estimate, setEstimate] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<DetailedBreakdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveWall = (wallData: InteriorWall) => {
    setInteriorWalls((prev) => {
      const index = prev.findIndex((w) => w.id === wallData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = wallData;
        return updated;
      }
      return [...prev, { ...wallData, id: Date.now() }];
    });
    setIsWallModalOpen(false);
    setEditingWall(null);
  };

  const handleSaveCeiling = (ceilingData: InteriorCeiling) => {
    setInteriorCeilings((prev) => {
      const index = prev.findIndex((c) => c.id === ceilingData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = ceilingData;
        return updated;
      }
      return [...prev, { ...ceilingData, id: Date.now() }];
    });
    setIsCeilingModalOpen(false);
    setEditingCeiling(null);
  };

  const handleSavePopcorn = (popcornData: PopcornRemoval) => {
    setPopcornRemovals((prev) => {
      const index = prev.findIndex((p) => p.id === popcornData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = popcornData;
        return updated;
      }
      return [...prev, { ...popcornData, id: Date.now() }];
    });
    setIsPopcornModalOpen(false);
    setEditingPopcorn(null);
  };

  const handleSaveTrim = (trimData: TrimItem) => {
    setInteriorTrims((prev) => {
      const index = prev.findIndex((t) => t.id === trimData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = trimData;
        return updated;
      }
      return [...prev, { ...trimData, id: Date.now() }];
    });
    setIsTrimModalOpen(false);
    setEditingTrim(null);
  };

  const handleSaveAdditional = (itemData: AdditionalItem) => {
    setAdditionalItems((prev) => {
      const index = prev.findIndex((a) => a.id === itemData.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = itemData;
        return updated;
      }
      return [...prev, { ...itemData, id: Date.now() }];
    });
    setIsAdditionalModalOpen(false);
    setEditingAdditionalItem(null);
  };

  const openWallModal = (wall?: InteriorWall) => {
    setEditingWall(wall || null);
    setIsWallModalOpen(true);
  };

  const openCeilingModal = (ceiling?: InteriorCeiling) => {
    setEditingCeiling(ceiling || null);
    setIsCeilingModalOpen(true);
  };

  const openPopcornModal = (popcorn?: PopcornRemoval) => {
    setEditingPopcorn(popcorn || null);
    setIsPopcornModalOpen(true);
  };

  const openTrimModal = (trim?: TrimItem) => {
    setEditingTrim(trim || null);
    setIsTrimModalOpen(true);
  };

  const openAdditionalModal = (item?: AdditionalItem) => {
    setEditingAdditionalItem(item || null);
    setIsAdditionalModalOpen(true);
  };

  const editWall = (wall: InteriorWall) => openWallModal(wall);
  const editCeiling = (ceiling: InteriorCeiling) => openCeilingModal(ceiling);
  const editPopcorn = (popcorn: PopcornRemoval) => openPopcornModal(popcorn);
  const editTrim = (trim: TrimItem) => openTrimModal(trim);
  const editAdditionalItem = (item: AdditionalItem) => openAdditionalModal(item);

  const deleteWall = (id: number) => setInteriorWalls((prev) => prev.filter((w) => w.id !== id));
  const deleteCeiling = (id: number) => setInteriorCeilings((prev) => prev.filter((c) => c.id !== id));
  const deletePopcorn = (id: number) => setPopcornRemovals((prev) => prev.filter((p) => p.id !== id));
  const deleteTrim = (id: number) => setInteriorTrims((prev) => prev.filter((t) => t.id !== id));
  const deleteAdditionalItem = (id: number) => setAdditionalItems((prev) => prev.filter((a) => a.id !== id));

  const startOver = () => {
    setCurrentStep(1);
    setInteriorWalls([]);
    setInteriorCeilings([]);
    setPopcornRemovals([]);
    setInteriorTrims([]);
    setAdditionalItems([]);
    setSelectedPaintQuality('');
    setEstimate(0);
    setBreakdown([]);
  };

  return {
    currentStep,
    setCurrentStep,
    interiorWalls,
    interiorCeilings,
    popcornRemovals,
    interiorTrims,
    additionalItems,
    selectedPaintQuality,
    setSelectedPaintQuality,
    isWallModalOpen,
    setIsWallModalOpen,
    isCeilingModalOpen,
    setIsCeilingModalOpen,
    isPopcornModalOpen,
    setIsPopcornModalOpen,
    isTrimModalOpen,
    setIsTrimModalOpen,
    isAdditionalModalOpen,
    setIsAdditionalModalOpen,
    editingWall,
    setEditingWall,
    editingCeiling,
    setEditingCeiling,
    editingPopcorn,
    setEditingPopcorn,
    editingTrim,
    setEditingTrim,
    editingAdditionalItem,
    setEditingAdditionalItem,
    estimate,
    setEstimate,
    breakdown,
    setBreakdown,
    isLoading,
    setIsLoading,
    handleSaveWall,
    handleSaveCeiling,
    handleSavePopcorn,
    handleSaveTrim,
    handleSaveAdditional,
    openWallModal,
    openCeilingModal,
    openPopcornModal,
    openTrimModal,
    openAdditionalModal,
    editWall,
    editCeiling,
    editPopcorn,
    editTrim,
    editAdditionalItem,
    deleteWall,
    deleteCeiling,
    deletePopcorn,
    deleteTrim,
    deleteAdditionalItem,
    startOver,
  };
};