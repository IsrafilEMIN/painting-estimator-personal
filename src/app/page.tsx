"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// --- TYPE DEFINITIONS ---
interface InteriorWall {
    id: number;
    length: number | string;
    width: number | string;
    ceilingHeight: number | string;
    texture: 'smooth' | 'light' | 'heavy';
    coats: number;
    prepCondition: PrepCondition;
    paintStairwell?: boolean;
}

interface InteriorCeiling {
    id: number;
    length: number | string;
    width: number | string;
    ceilingHeight: number | string;
    texture: 'smooth' | 'light' | 'heavy';
    coats: number;
    prepCondition: PrepCondition;
    useMoldResistantPaint?: boolean;
    paintCrownMolding?: boolean;
    paintFireplaceMantel?: boolean;
}

interface PopcornRemoval {
    id: number;
    length: number | string;
    width: number | string;
    ceilingHeight: number | string;
    prepCondition: PrepCondition;
}

interface TrimItem {
    id: number;
    lnFt: number | string;
    coats: number;
    prepCondition: PrepCondition;
}

interface ExteriorSiding {
    id: number;
    siding: string;
    sqft: number | string;
    stories: string;
    texture: 'smooth' | 'light' | 'heavy';
    coats: number;
    prepCondition: PrepCondition;
}

interface AdditionalItem {
    id: number;
    type: 'interiorDoor' | 'closetDoor' | 'vanityDoor' | 'vanityDrawer' | 'cabinetDoor' | 'cabinetDrawer' | 'exteriorDoor' | 'garageDoor' | 'shutter' | 'windowFrame' | 'gutter' | 'deck';
    quantity: number | string;
    material?: string; // Generic string for material, specific options per type
    prepCondition: PrepCondition;
    coats: number;
}

type PrepCondition = 'good' | 'fair' | 'poor';
type PaintQuality = 'good' | 'better' | 'best' | '';

interface SelectableCardProps { label: string; selected: boolean; onClick: () => void; children?: React.ReactNode; }
interface WallModalProps { wall: InteriorWall | null; onSave: (wallData: InteriorWall) => void; onClose: () => void; }
interface CeilingModalProps { ceiling: InteriorCeiling | null; onSave: (ceilingData: InteriorCeiling) => void; onClose: () => void; }
interface PopcornModalProps { popcorn: PopcornRemoval | null; onSave: (popcornData: PopcornRemoval) => void; onClose: () => void; }
interface TrimModalProps { trim: TrimItem | null; onSave: (trimData: TrimItem) => void; onClose: () => void; }
interface SidingModalProps { siding: ExteriorSiding | null; onSave: (sidingData: ExteriorSiding) => void; onClose: () => void; }
interface AdditionalModalProps { item: AdditionalItem | null; onSave: (itemData: AdditionalItem) => void; onClose: () => void; projectType: 'interior' | 'exterior' | 'both' | ''; }

// --- PRICING CONFIGURATION (EDITABLE) ---
interface PricingConfig {
    PROFIT_MARKUP: number;
    TAX_RATE: number;
    PAINTER_BURDENED_HOURLY_COST: number;
    PAINT_COST_PER_GALLON: { good: number; better: number; best: number };
    SUPPLIES_PERCENTAGE: number;
    PRODUCTION_RATES: {
        walls: number; // sqft/hr
        ceilings: number; // sqft/hr
        trim: number; // lnft/hr
        popcornRemoval: number; // sqft/hr
        interiorDoor: number; // hr/item
        closetDoor: number; // hr/item
        vanityDoor: number; // hr/item
        vanityDrawer: number; // hr/item
        cabinetDoor: number; // hr/item
        cabinetDrawer: number; // hr/item
        exteriorDoor: number; // hr/item
        garageDoor: number; // hr/item
        shutter: number; // hr/item
        windowFrame: number; // hr/item
        gutter: number; // hr/lnft
        deck: number; // hr/sqft
    };
    ADDITIONAL_PAINT_USAGE: {
        trim: number; // sqft/lnft
        interiorDoor: number; // sqft/item
        closetDoor: number; // sqft/item
        vanityDoor: number; // sqft/item
        vanityDrawer: number; // sqft/item
        cabinetDoor: number; // sqft/item
        cabinetDrawer: number; // sqft/item
        exteriorDoor: number; // sqft/item
        garageDoor: number; // sqft/item
        shutter: number; // sqft/item
        windowFrame: number; // sqft/item
        gutter: number; // sqft/lnft (approximate for paint)
        deck: number; // sqft/sqft
    };
    BASE_PREP_HOURS_PER_ROOM: number;
    BASE_PREP_HOURS_EXTERIOR: number;
    COST_MOLD_RESISTANT_PAINT_UPCHARGE: number;
    COST_CROWN_MOLDING: number;
    COST_FIREPLACE_MANTEL: number;
    COST_STAIRWELL: number;
    PREP_CONDITION_MULTIPLIERS: { good: number; fair: number; poor: number };
    TEXTURE_MULTIPLIERS: { smooth: number; light: number; heavy: number };
    EXTRA_COAT_MULTIPLIER: number; // Additional labor/material factor per extra coat beyond 2
    HIGH_CEILING_MULTIPLIER: number;
    SIDING_LABOR_MULTIPLIERS: { Vinyl: number; Wood: number; Stucco: number; Brick: number; Metal: number; 'Fiber Cement': number };
    STORY_MULTIPLIERS: { '1': number; '2': number; '3': number };
    COVERAGE_PER_GALLON: number;
    PRIMER_COST_PER_GALLON: number;
    GARAGE_DOOR_MATERIAL_MULTIPLIERS: { Wood: number; Metal: number; Aluminum: number; Fiberglass: number; Vinyl: number };
    INTERIOR_DOOR_MATERIAL_MULTIPLIERS: { Wood: number; MDF: number; Metal: number };
    EXTERIOR_DOOR_MATERIAL_MULTIPLIERS: { Wood: number; Steel: number; Fiberglass: number };
    CABINET_MATERIAL_MULTIPLIERS: { Wood: number; Laminate: number; Metal: number };
    SHUTTER_MATERIAL_MULTIPLIERS: { Wood: number; Vinyl: number; Composite: number };
    WINDOW_FRAME_MATERIAL_MULTIPLIERS: { Wood: number; Vinyl: number; Aluminum: number };
    GUTTER_MATERIAL_MULTIPLIERS: { Aluminum: number; Steel: number; Copper: number; Vinyl: number };
    DECK_MATERIAL_MULTIPLIERS: { Wood: number; Composite: number };
}

const DEFAULT_PRICING: PricingConfig = {
    PROFIT_MARKUP: 2.0,
    TAX_RATE: 0.13,
    PAINTER_BURDENED_HOURLY_COST: 40.00,
    PAINT_COST_PER_GALLON: { good: 30, better: 50, best: 65 },
    SUPPLIES_PERCENTAGE: 0.15,
    PRODUCTION_RATES: {
        walls: 175,
        ceilings: 150,
        trim: 40,
        popcornRemoval: 50,
        interiorDoor: 1.0, // hr per door
        closetDoor: 0.8,
        vanityDoor: 0.7,
        vanityDrawer: 0.5,
        cabinetDoor: 1.2,
        cabinetDrawer: 0.6,
        exteriorDoor: 1.5,
        garageDoor: 3.0,
        shutter: 0.5,
        windowFrame: 0.8,
        gutter: 0.1, // hr per lnft
        deck: 0.05, // hr per sqft
    },
    ADDITIONAL_PAINT_USAGE: {
        trim: 0.2,
        interiorDoor: 20, // sqft per door
        closetDoor: 15,
        vanityDoor: 10,
        vanityDrawer: 5,
        cabinetDoor: 12,
        cabinetDrawer: 6,
        exteriorDoor: 25,
        garageDoor: 100,
        shutter: 10,
        windowFrame: 15,
        gutter: 0.5, // sqft per lnft (approximate)
        deck: 1.0, // sqft per sqft
    },
    BASE_PREP_HOURS_PER_ROOM: 2.0,
    BASE_PREP_HOURS_EXTERIOR: 4.0,
    COST_MOLD_RESISTANT_PAINT_UPCHARGE: 75.00,
    COST_CROWN_MOLDING: 250.00,
    COST_FIREPLACE_MANTEL: 200.00,
    COST_STAIRWELL: 450.00,
    PREP_CONDITION_MULTIPLIERS: { good: 1.0, fair: 1.5, poor: 2.5 },
    TEXTURE_MULTIPLIERS: { smooth: 1.0, light: 1.3, heavy: 1.5 },
    EXTRA_COAT_MULTIPLIER: 0.5,
    HIGH_CEILING_MULTIPLIER: 1.20,
    SIDING_LABOR_MULTIPLIERS: { 'Vinyl': 1.0, 'Wood': 1.4, 'Stucco': 1.6, 'Brick': 1.7, 'Metal': 1.1, 'Fiber Cement': 1.1 },
    STORY_MULTIPLIERS: { '1': 1.0, '2': 1.25, '3': 1.5 },
    COVERAGE_PER_GALLON: 350,
    PRIMER_COST_PER_GALLON: 30, // Adjustable primer cost per gallon
    GARAGE_DOOR_MATERIAL_MULTIPLIERS: { Wood: 1.4, Metal: 1.2, Aluminum: 1.1, Fiberglass: 1.3, Vinyl: 1.5 },
    INTERIOR_DOOR_MATERIAL_MULTIPLIERS: { Wood: 1.2, MDF: 1.0, Metal: 1.5 },
    EXTERIOR_DOOR_MATERIAL_MULTIPLIERS: { Wood: 1.4, Steel: 1.3, Fiberglass: 1.1 },
    CABINET_MATERIAL_MULTIPLIERS: { Wood: 1.0, Laminate: 1.3, Metal: 1.5 },
    SHUTTER_MATERIAL_MULTIPLIERS: { Wood: 1.4, Vinyl: 1.0, Composite: 1.2 },
    WINDOW_FRAME_MATERIAL_MULTIPLIERS: { Wood: 1.4, Vinyl: 1.0, Aluminum: 1.1 },
    GUTTER_MATERIAL_MULTIPLIERS: { Aluminum: 1.0, Steel: 1.2, Copper: 1.1, Vinyl: 1.0 },
    DECK_MATERIAL_MULTIPLIERS: { Wood: 1.5, Composite: 1.0 },
};

// --- HELPER & MODAL COMPONENTS ---
const SelectableCard: React.FC<SelectableCardProps> = ({ label, selected, onClick, children = null }) => (
    <div className={`selectable-card border-2 rounded-lg p-4 cursor-pointer text-center transition-all duration-200 ${selected ? 'border-[#093373] shadow-lg scale-105' : 'border-gray-200 hover:border-blue-400'}`} onClick={onClick}>
        <h4 className="font-bold text-lg text-[#162733]">{label}</h4>
        {children}
    </div>
);

const WallModal: React.FC<WallModalProps> = ({ wall, onSave, onClose } ) => {
    const initialWallState: InteriorWall = {
        id: Date.now(),
        length: '',
        width: '',
        ceilingHeight: 8,
        texture: 'smooth',
        coats: 2,
        prepCondition: 'good',
        paintStairwell: false,
    };
    const [formData, setFormData] = useState<InteriorWall>(wall || initialWallState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let checked: boolean | undefined;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }
        const newValue = value;
        if (['length', 'width', 'ceilingHeight', 'coats'].includes(name)) {
            const num = parseFloat(value);
            if (value !== '' && !isNaN(num) && num < 0) {
                setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
                return;
            } else {
                setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
            }
        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSave = () => {
        if (!formData.length || !formData.width || !formData.ceilingHeight || parseFloat(String(formData.length)) <= 0 || parseFloat(String(formData.width)) <= 0 || parseFloat(String(formData.ceilingHeight)) <= 0) {
            alert("Please enter valid dimensions greater than 0.");
            return;
        }
        if (parseFloat(String(formData.coats)) < 1) {
            alert("Number of coats must be at least 1.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{wall ? 'Edit' : 'Add'} Interior Walls</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="wall-length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="wall-length" name="length" value={formData.length} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
                        </div>
                        <div>
                            <label htmlFor="wall-width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="wall-width" name="width" value={formData.width} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ceiling-height" className="block text-sm font-medium text-gray-700">Ceiling Height (ft)</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-height" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.ceilingHeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.ceilingHeight && <p className="text-red-500 text-sm mt-1">{fieldErrors.ceilingHeight}</p>}
                    </div>
                    <div>
                        <label htmlFor="texture" className="block text-sm font-medium text-gray-700">Surface Texture</label>
                        <select id="texture" name="texture" value={formData.texture} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="smooth">Smooth</option>
                            <option value="light">Light Texture</option>
                            <option value="heavy">Heavy Texture</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
                        <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" name="paintStairwell" checked={formData.paintStairwell} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Includes Stairwell Walls / Risers</label>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CeilingModal: React.FC<CeilingModalProps> = ({ ceiling, onSave, onClose } ) => {
    const initialCeilingState: InteriorCeiling = {
        id: Date.now(),
        length: '',
        width: '',
        ceilingHeight: 8,
        texture: 'smooth',
        coats: 2,
        prepCondition: 'good',
        useMoldResistantPaint: false,
        paintCrownMolding: false,
        paintFireplaceMantel: false,
    };
    const [formData, setFormData] = useState<InteriorCeiling>(ceiling || initialCeilingState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let checked: boolean | undefined;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }
        const newValue = value;
        if (['length', 'width', 'ceilingHeight', 'coats'].includes(name)) {
            const num = parseFloat(value);
            if (value !== '' && !isNaN(num) && num < 0) {
                setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
                return;
            } else {
                setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
            }
        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSave = () => {
        if (!formData.length || !formData.width || !formData.ceilingHeight || parseFloat(String(formData.length)) <= 0 || parseFloat(String(formData.width)) <= 0 || parseFloat(String(formData.ceilingHeight)) <= 0) {
            alert("Please enter valid dimensions greater than 0.");
            return;
        }
        if (parseFloat(String(formData.coats)) < 1) {
            alert("Number of coats must be at least 1.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{ceiling ? 'Edit' : 'Add'} Interior Ceiling Painting</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="ceiling-length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-length" name="length" value={formData.length} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
                        </div>
                        <div>
                            <label htmlFor="ceiling-width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-width" name="width" value={formData.width} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ceiling-height" className="block text-sm font-medium text-gray-700">Ceiling Height (ft)</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-height" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.ceilingHeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.ceilingHeight && <p className="text-red-500 text-sm mt-1">{fieldErrors.ceilingHeight}</p>}
                    </div>
                    <div>
                        <label htmlFor="texture" className="block text-sm font-medium text-gray-700">Surface Texture</label>
                        <select id="texture" name="texture" value={formData.texture} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="smooth">Smooth</option>
                            <option value="light">Light Texture</option>
                            <option value="heavy">Heavy Texture</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
                        <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" name="useMoldResistantPaint" checked={formData.useMoldResistantPaint} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Use Mold-Resistant Paint</label>
                        <label className="flex items-center"><input type="checkbox" name="paintCrownMolding" checked={formData.paintCrownMolding} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Crown Molding</label>
                        <label className="flex items-center"><input type="checkbox" name="paintFireplaceMantel" checked={formData.paintFireplaceMantel} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Fireplace Mantel</label>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PopcornModal: React.FC<PopcornModalProps> = ({ popcorn, onSave, onClose } ) => {
    const initialPopcornState: PopcornRemoval = {
        id: Date.now(),
        length: '',
        width: '',
        ceilingHeight: 8,
        prepCondition: 'good',
    };
    const [formData, setFormData] = useState<PopcornRemoval>(popcorn || initialPopcornState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newValue = value;
        if (['length', 'width', 'ceilingHeight'].includes(name)) {
            const num = parseFloat(value);
            if (value !== '' && !isNaN(num) && num < 0) {
                setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
                return;
            } else {
                setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
            }
        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSave = () => {
        if (!formData.length || !formData.width || !formData.ceilingHeight || parseFloat(String(formData.length)) <= 0 || parseFloat(String(formData.width)) <= 0 || parseFloat(String(formData.ceilingHeight)) <= 0) {
            alert("Please enter valid dimensions greater than 0.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{popcorn ? 'Edit' : 'Add'} Popcorn Ceiling Removal</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="popcorn-length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="popcorn-length" name="length" value={formData.length} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
                        </div>
                        <div>
                            <label htmlFor="popcorn-width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
                            <input type="number" inputMode="decimal" step="0.1" min="0" id="popcorn-width" name="width" value={formData.width} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ceiling-height" className="block text-sm font-medium text-gray-700">Ceiling Height (ft)</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="ceiling-height" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.ceilingHeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.ceilingHeight && <p className="text-red-500 text-sm mt-1">{fieldErrors.ceilingHeight}</p>}
                    </div>
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrimModal: React.FC<TrimModalProps> = ({ trim, onSave, onClose } ) => {
    const initialTrimState: TrimItem = {
        id: Date.now(),
        lnFt: '',
        coats: 2,
        prepCondition: 'good',
    };
    const [formData, setFormData] = useState<TrimItem>(trim || initialTrimState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newValue = value;
        if (['lnFt', 'coats'].includes(name)) {
            const num = parseFloat(value);
            if (value !== '' && !isNaN(num) && num < 0) {
                setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
                return;
            } else {
                setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
            }
        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSave = () => {
        if (!formData.lnFt || parseFloat(String(formData.lnFt)) <= 0) {
            alert("Please enter valid linear feet greater than 0.");
            return;
        }
        if (parseFloat(String(formData.coats)) < 1) {
            alert("Number of coats must be at least 1.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{trim ? 'Edit' : 'Add'} Trim / Baseboards</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="lnFt" className="block text-sm font-medium text-gray-700">Linear Feet</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="lnFt" name="lnFt" value={formData.lnFt} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.lnFt ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.lnFt && <p className="text-red-500 text-sm mt-1">{fieldErrors.lnFt}</p>}
                    </div>
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
                        <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SidingModal: React.FC<SidingModalProps> = ({ siding, onSave, onClose } ) => {
    const initialSidingState: ExteriorSiding = {
        id: Date.now(),
        siding: 'Vinyl',
        sqft: '',
        stories: '1',
        texture: 'smooth',
        coats: 2,
        prepCondition: 'good',
    };
    const [formData, setFormData] = useState<ExteriorSiding>(siding || initialSidingState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const num = parseFloat(value);
        if (value !== '' && !isNaN(num) && num < 0) {
            setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
            return;
        } else {
            setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.sqft || parseFloat(String(formData.sqft)) <= 0) {
            alert("Please enter valid sqft greater than 0.");
            return;
        }
        if (parseFloat(String(formData.coats)) < 1) {
            alert("Number of coats must be at least 1.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{siding ? 'Edit' : 'Add'} Exterior Siding</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="siding-type" className="block text-sm font-medium text-gray-700">Siding Type</label>
                        <select id="siding-type" name="siding" value={formData.siding} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option>Vinyl</option><option>Wood</option><option>Stucco</option><option>Brick</option><option>Metal</option><option>Fiber Cement</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="exterior-sqft" className="block text-sm font-medium text-gray-700">Sq Ft of Siding</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="exterior-sqft" name="sqft" value={formData.sqft} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.sqft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.sqft && <p className="text-red-500 text-sm mt-1">{fieldErrors.sqft}</p>}
                    </div>
                    <div>
                        <label htmlFor="stories" className="block text-sm font-medium text-gray-700">Number of Stories</label>
                        <select id="stories" name="stories" value={formData.stories} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option>1</option><option>2</option><option>3</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="texture" className="block text-sm font-medium text-gray-700">Surface Texture</label>
                        <select id="texture" name="texture" value={formData.texture} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="smooth">Smooth</option>
                            <option value="light">Light Texture</option>
                            <option value="heavy">Heavy Texture</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
                        <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdditionalModal: React.FC<AdditionalModalProps> = ({ item, onSave, onClose, projectType } ) => {
    const interiorTypes = ['interiorDoor', 'closetDoor', 'vanityDoor', 'vanityDrawer', 'cabinetDoor', 'cabinetDrawer'] as const;
    const exteriorTypes = ['exteriorDoor', 'garageDoor', 'shutter', 'windowFrame', 'gutter', 'deck'] as const;
    const availableTypes = projectType === 'interior' ? interiorTypes : projectType === 'exterior' ? exteriorTypes : [...interiorTypes, ...exteriorTypes];
    const initialState: AdditionalItem = {
        id: Date.now(),
        type: availableTypes[0],
        quantity: '',
        material: undefined,
        prepCondition: 'good',
        coats: 2,
    };
    const [formData, setFormData] = useState<AdditionalItem>(item ? { ...item, coats: item.coats ?? 2 } : initialState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const materialOptions: { [key in AdditionalItem['type']]?: string[] } = {
        interiorDoor: ['Wood', 'MDF', 'Metal'],
        closetDoor: ['Wood', 'MDF', 'Metal'],
        vanityDoor: ['Wood', 'MDF', 'Metal'],
        exteriorDoor: ['Wood', 'Steel', 'Fiberglass'],
        garageDoor: ['Wood', 'Metal', 'Aluminum', 'Fiberglass', 'Vinyl'],
        shutter: ['Wood', 'Vinyl', 'Composite'],
        windowFrame: ['Wood', 'Vinyl', 'Aluminum'],
        gutter: ['Aluminum', 'Steel', 'Copper', 'Vinyl'],
        deck: ['Wood', 'Composite'],
        cabinetDoor: ['Wood', 'Laminate', 'Metal'],
        cabinetDrawer: ['Wood', 'Laminate', 'Metal'],
        vanityDrawer: ['Wood', 'Laminate', 'Metal'],
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'quantity' || name === 'coats') {
            const num = parseFloat(value);
            if (value !== '' && !isNaN(num) && num < 0) {
                setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
                return;
            } else {
                setFieldErrors(prev => { const p = {...prev}; delete p[name]; return p; });
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.quantity || parseFloat(String(formData.quantity)) <= 0) {
            alert("Please enter valid quantity greater than 0.");
            return;
        }
        if (parseFloat(String(formData.coats)) < 1) {
            alert("Number of coats must be at least 1.");
            return;
        }
        if (materialOptions[formData.type] && !formData.material) {
            alert("Please select a material.");
            return;
        }
        if (!formData.prepCondition) {
            alert("Please select a surface condition.");
            return;
        }
        onSave(formData);
    };

    const qtyLabel = formData.type === 'gutter' ? 'Linear Feet' : formData.type === 'deck' ? 'Square Feet' : 'Quantity';

    const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{item ? 'Edit' : 'Add'} Additional Item</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="item-type" className="block text-sm font-medium text-gray-700">Item Type</label>
                        <select id="item-type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            {availableTypes.map(t => <option key={t} value={t}>{formatTypeLabel(t)}</option>)}
                        </select>
                    </div>
                    {materialOptions[formData.type] && (
                        <div>
                            <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                            <select id="material" name="material" value={formData.material || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                                <option value="">Select Material</option>
                                {materialOptions[formData.type]!.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="prepCondition" className="block text-sm font-medium text-gray-700">Surface Condition</label>
                        <select id="prepCondition" name="prepCondition" value={formData.prepCondition} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900">
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="coats" className="block text-sm font-medium text-gray-700">Number of Coats</label>
                        <input type="number" inputMode="decimal" step="1" min="1" id="coats" name="coats" value={formData.coats} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.coats ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.coats && <p className="text-red-500 text-sm mt-1">{fieldErrors.coats}</p>}
                    </div>
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">{qtyLabel}</label>
                        <input type="number" inputMode="decimal" step="0.1" min="0" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.quantity ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.quantity && <p className="text-red-500 text-sm mt-1">{fieldErrors.quantity}</p>}
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="PROFIT_MARKUP" name="PROFIT_MARKUP" value={formData.PROFIT_MARKUP} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="PAINTER_BURDENED_HOURLY_COST" className="block text-sm text-gray-600">Burdened Hourly Labor Cost</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="PAINTER_BURDENED_HOURLY_COST" name="PAINTER_BURDENED_HOURLY_COST" value={formData.PAINTER_BURDENED_HOURLY_COST} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="SUPPLIES_PERCENTAGE" className="block text-sm text-gray-600">Supplies % of Paint Cost</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="SUPPLIES_PERCENTAGE" name="SUPPLIES_PERCENTAGE" value={formData.SUPPLIES_PERCENTAGE} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="COVERAGE_PER_GALLON" className="block text-sm text-gray-600">Coverage per Gallon</label>
                                <input type="number" inputMode="decimal" step="1" min="0" id="COVERAGE_PER_GALLON" name="COVERAGE_PER_GALLON" value={formData.COVERAGE_PER_GALLON} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                                <label htmlFor="BASE_PREP_HOURS_PER_ROOM" className="block text-sm text-gray-600">Base Prep Hours per Room</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="BASE_PREP_HOURS_PER_ROOM" name="BASE_PREP_HOURS_PER_ROOM" value={formData.BASE_PREP_HOURS_PER_ROOM} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="BASE_PREP_HOURS_EXTERIOR" className="block text-sm text-gray-600">Base Prep Hours Exterior</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="BASE_PREP_HOURS_EXTERIOR" name="BASE_PREP_HOURS_EXTERIOR" value={formData.BASE_PREP_HOURS_EXTERIOR} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                                <label htmlFor="siding_vinyl" className="block text-sm text-gray-600">Siding Labor Multiplier - Vinyl</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_vinyl" name="SIDING_LABOR_MULTIPLIERS.Vinyl" value={formData.SIDING_LABOR_MULTIPLIERS.Vinyl} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="siding_wood" className="block text-sm text-gray-600">Siding Labor Multiplier - Wood</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_wood" name="SIDING_LABOR_MULTIPLIERS.Wood" value={formData.SIDING_LABOR_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="siding_stucco" className="block text-sm text-gray-600">Siding Labor Multiplier - Stucco</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_stucco" name="SIDING_LABOR_MULTIPLIERS.Stucco" value={formData.SIDING_LABOR_MULTIPLIERS.Stucco} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="siding_brick" className="block text-sm text-gray-600">Siding Labor Multiplier - Brick</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_brick" name="SIDING_LABOR_MULTIPLIERS.Brick" value={formData.SIDING_LABOR_MULTIPLIERS.Brick} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="siding_metal" className="block text-sm text-gray-600">Siding Labor Multiplier - Metal</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_metal" name="SIDING_LABOR_MULTIPLIERS.Metal" value={formData.SIDING_LABOR_MULTIPLIERS.Metal} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="siding_fiberCement" className="block text-sm text-gray-600">Siding Labor Multiplier - Fiber Cement</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="siding_fiberCement" name="SIDING_LABOR_MULTIPLIERS.Fiber Cement" value={formData.SIDING_LABOR_MULTIPLIERS['Fiber Cement']} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                                <label htmlFor="exterior_door_wood" className="block text-sm text-gray-600">Exterior Door Labor Mult - Wood</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="exterior_door_wood" name="EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Wood" value={formData.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="exterior_door_steel" className="block text-sm text-gray-600">Exterior Door Labor Mult - Steel</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="exterior_door_steel" name="EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Steel" value={formData.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Steel} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="exterior_door_fiberglass" className="block text-sm text-gray-600">Exterior Door Labor Mult - Fiberglass</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="exterior_door_fiberglass" name="EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Fiberglass" value={formData.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS.Fiberglass} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                            <div>
                                <label htmlFor="shutter_wood" className="block text-sm text-gray-600">Shutter Labor Mult - Wood</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="shutter_wood" name="SHUTTER_MATERIAL_MULTIPLIERS.Wood" value={formData.SHUTTER_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="shutter_vinyl" className="block text-sm text-gray-600">Shutter Labor Mult - Vinyl</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="shutter_vinyl" name="SHUTTER_MATERIAL_MULTIPLIERS.Vinyl" value={formData.SHUTTER_MATERIAL_MULTIPLIERS.Vinyl} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="shutter_composite" className="block text-sm text-gray-600">Shutter Labor Mult - Composite</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="shutter_composite" name="SHUTTER_MATERIAL_MULTIPLIERS.Composite" value={formData.SHUTTER_MATERIAL_MULTIPLIERS.Composite} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="window_frame_wood" className="block text-sm text-gray-600">Window Frame Labor Mult - Wood</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="window_frame_wood" name="WINDOW_FRAME_MATERIAL_MULTIPLIERS.Wood" value={formData.WINDOW_FRAME_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="window_frame_vinyl" className="block text-sm text-gray-600">Window Frame Labor Mult - Vinyl</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="window_frame_vinyl" name="WINDOW_FRAME_MATERIAL_MULTIPLIERS.Vinyl" value={formData.WINDOW_FRAME_MATERIAL_MULTIPLIERS.Vinyl} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="window_frame_aluminum" className="block text-sm text-gray-600">Window Frame Labor Mult - Aluminum</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="window_frame_aluminum" name="WINDOW_FRAME_MATERIAL_MULTIPLIERS.Aluminum" value={formData.WINDOW_FRAME_MATERIAL_MULTIPLIERS.Aluminum} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="gutter_aluminum" className="block text-sm text-gray-600">Gutter Labor Mult - Aluminum</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="gutter_aluminum" name="GUTTER_MATERIAL_MULTIPLIERS.Aluminum" value={formData.GUTTER_MATERIAL_MULTIPLIERS.Aluminum} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="gutter_steel" className="block text-sm text-gray-600">Gutter Labor Mult - Steel</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="gutter_steel" name="GUTTER_MATERIAL_MULTIPLIERS.Steel" value={formData.GUTTER_MATERIAL_MULTIPLIERS.Steel} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="gutter_copper" className="block text-sm text-gray-600">Gutter Labor Mult - Copper</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="gutter_copper" name="GUTTER_MATERIAL_MULTIPLIERS.Copper" value={formData.GUTTER_MATERIAL_MULTIPLIERS.Copper} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="gutter_vinyl" className="block text-sm text-gray-600">Gutter Labor Mult - Vinyl</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="gutter_vinyl" name="GUTTER_MATERIAL_MULTIPLIERS.Vinyl" value={formData.GUTTER_MATERIAL_MULTIPLIERS.Vinyl} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="deck_wood" className="block text-sm text-gray-600">Deck Labor Mult - Wood</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="deck_wood" name="DECK_MATERIAL_MULTIPLIERS.Wood" value={formData.DECK_MATERIAL_MULTIPLIERS.Wood} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="deck_composite" className="block text-sm text-gray-600">Deck Labor Mult - Composite</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="deck_composite" name="DECK_MATERIAL_MULTIPLIERS.Composite" value={formData.DECK_MATERIAL_MULTIPLIERS.Composite} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="story_1" className="block text-sm text-gray-600">Story Multiplier - 1</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="story_1" name="STORY_MULTIPLIERS.1" value={formData.STORY_MULTIPLIERS['1']} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="story_2" className="block text-sm text-gray-600">Story Multiplier - 2</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="story_2" name="STORY_MULTIPLIERS.2" value={formData.STORY_MULTIPLIERS['2']} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="story_3" className="block text-sm text-gray-600">Story Multiplier - 3</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="story_3" name="STORY_MULTIPLIERS.3" value={formData.STORY_MULTIPLIERS['3']} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                                <label htmlFor="production_exteriorDoor" className="block text-sm text-gray-600">Exterior Door (hr/item)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_exteriorDoor" name="PRODUCTION_RATES.exteriorDoor" value={formData.PRODUCTION_RATES.exteriorDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="production_garageDoor" className="block text-sm text-gray-600">Garage Door (hr/item)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_garageDoor" name="PRODUCTION_RATES.garageDoor" value={formData.PRODUCTION_RATES.garageDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="production_shutter" className="block text-sm text-gray-600">Shutter (hr/item)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_shutter" name="PRODUCTION_RATES.shutter" value={formData.PRODUCTION_RATES.shutter} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="production_windowFrame" className="block text-sm text-gray-600">Window Frame (hr/item)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_windowFrame" name="PRODUCTION_RATES.windowFrame" value={formData.PRODUCTION_RATES.windowFrame} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="production_gutter" className="block text-sm text-gray-600">Gutter (hr/lnft)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_gutter" name="PRODUCTION_RATES.gutter" value={formData.PRODUCTION_RATES.gutter} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="production_deck" className="block text-sm text-gray-600">Deck (hr/sqft)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="production_deck" name="PRODUCTION_RATES.deck" value={formData.PRODUCTION_RATES.deck} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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
                            <div>
                                <label htmlFor="paint_exteriorDoor" className="block text-sm text-gray-600">Exterior Door Paint Usage (sqft/item)</label>
                                <input type="number" inputMode="decimal" step="1" min="0" id="paint_exteriorDoor" name="ADDITIONAL_PAINT_USAGE.exteriorDoor" value={formData.ADDITIONAL_PAINT_USAGE.exteriorDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="paint_garageDoor" className="block text-sm text-gray-600">Garage Door Paint Usage (sqft/item)</label>
                                <input type="number" inputMode="decimal" step="1" min="0" id="paint_garageDoor" name="ADDITIONAL_PAINT_USAGE.garageDoor" value={formData.ADDITIONAL_PAINT_USAGE.garageDoor} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="paint_shutter" className="block text-sm text-gray-600">Shutter Paint Usage (sqft/item)</label>
                                <input type="number" inputMode="decimal" step="1" min="0" id="paint_shutter" name="ADDITIONAL_PAINT_USAGE.shutter" value={formData.ADDITIONAL_PAINT_USAGE.shutter} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="paint_windowFrame" className="block text-sm text-gray-600">Window Frame Paint Usage (sqft/item)</label>
                                <input type="number" inputMode="decimal" step="1" min="0" id="paint_windowFrame" name="ADDITIONAL_PAINT_USAGE.windowFrame" value={formData.ADDITIONAL_PAINT_USAGE.windowFrame} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="paint_gutter" className="block text-sm text-gray-600">Gutter Paint Usage (sqft/lnft)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_gutter" name="ADDITIONAL_PAINT_USAGE.gutter" value={formData.ADDITIONAL_PAINT_USAGE.gutter} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
                            </div>
                            <div>
                                <label htmlFor="paint_deck" className="block text-sm text-gray-600">Deck Paint Usage (sqft/sqft)</label>
                                <input type="number" inputMode="decimal" step="0.01" min="0" id="paint_deck" name="ADDITIONAL_PAINT_USAGE.deck" value={formData.ADDITIONAL_PAINT_USAGE.deck} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373] text-gray-900" />
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

export default function PaintingEstimator() {
    const [currentStep, setCurrentStep] = useState(1);
    const [projectType, setProjectType] = useState<'interior' | 'exterior' | 'both' | ''>('');
    const [interiorWalls, setInteriorWalls] = useState<InteriorWall[]>([]);
    const [interiorCeilings, setInteriorCeilings] = useState<InteriorCeiling[]>([]);
    const [popcornRemovals, setPopcornRemovals] = useState<PopcornRemoval[]>([]);
    const [interiorTrims, setInteriorTrims] = useState<TrimItem[]>([]);
    const [exteriorSidings, setExteriorSidings] = useState<ExteriorSiding[]>([]);
    const [exteriorTrims, setExteriorTrims] = useState<TrimItem[]>([]);
    const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
    const [selectedPaintQuality, setSelectedPaintQuality] = useState<PaintQuality>('');
    const [isWallModalOpen, setIsWallModalOpen] = useState(false);
    const [isCeilingModalOpen, setIsCeilingModalOpen] = useState(false);
    const [isPopcornModalOpen, setIsPopcornModalOpen] = useState(false);
    const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
    const [isInteriorTrim, setIsInteriorTrim] = useState(true);
    const [isSidingModalOpen, setIsSidingModalOpen] = useState(false);
    const [isAdditionalModalOpen, setIsAdditionalModalOpen] = useState(false);
    const [editingWall, setEditingWall] = useState<InteriorWall | null>(null);
    const [editingCeiling, setEditingCeiling] = useState<InteriorCeiling | null>(null);
    const [editingPopcorn, setEditingPopcorn] = useState<PopcornRemoval | null>(null);
    const [editingTrim, setEditingTrim] = useState<TrimItem | null>(null);
    const [editingSiding, setEditingSiding] = useState<ExteriorSiding | null>(null);
    const [editingAdditionalItem, setEditingAdditionalItem] = useState<AdditionalItem | null>(null);
    const [estimate, setEstimate] = useState<number>(0);
    const [breakdown, setBreakdown] = useState<{name: string, price: number}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                loadPricing(currentUser.uid);
            }
        });
        return unsubscribe;
    }, []);

    const loadPricing = async (uid: string) => {
        try {
            const pricingDoc = await getDoc(doc(db, `users/${uid}/configs/pricing`));
            const data = pricingDoc.data() || {};
            setPricing({
                ...DEFAULT_PRICING,
                ...data,
                PRODUCTION_RATES: { ...DEFAULT_PRICING.PRODUCTION_RATES, ...(data.PRODUCTION_RATES || {}) },
                ADDITIONAL_PAINT_USAGE: { ...DEFAULT_PRICING.ADDITIONAL_PAINT_USAGE, ...(data.ADDITIONAL_PAINT_USAGE || {}) },
                TEXTURE_MULTIPLIERS: { ...DEFAULT_PRICING.TEXTURE_MULTIPLIERS, ...(data.TEXTURE_MULTIPLIERS || {}) },
                PAINT_COST_PER_GALLON: { ...DEFAULT_PRICING.PAINT_COST_PER_GALLON, ...(data.PAINT_COST_PER_GALLON || {}) },
                PREP_CONDITION_MULTIPLIERS: { ...DEFAULT_PRICING.PREP_CONDITION_MULTIPLIERS, ...(data.PREP_CONDITION_MULTIPLIERS || {}) },
                SIDING_LABOR_MULTIPLIERS: { ...DEFAULT_PRICING.SIDING_LABOR_MULTIPLIERS, ...(data.SIDING_LABOR_MULTIPLIERS || {}) },
                STORY_MULTIPLIERS: { ...DEFAULT_PRICING.STORY_MULTIPLIERS, ...(data.STORY_MULTIPLIERS || {}) },
                GARAGE_DOOR_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.GARAGE_DOOR_MATERIAL_MULTIPLIERS, ...(data.GARAGE_DOOR_MATERIAL_MULTIPLIERS || {}) },
                INTERIOR_DOOR_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.INTERIOR_DOOR_MATERIAL_MULTIPLIERS, ...(data.INTERIOR_DOOR_MATERIAL_MULTIPLIERS || {}) },
                EXTERIOR_DOOR_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS, ...(data.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS || {}) },
                CABINET_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.CABINET_MATERIAL_MULTIPLIERS, ...(data.CABINET_MATERIAL_MULTIPLIERS || {}) },
                SHUTTER_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.SHUTTER_MATERIAL_MULTIPLIERS, ...(data.SHUTTER_MATERIAL_MULTIPLIERS || {}) },
                WINDOW_FRAME_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.WINDOW_FRAME_MATERIAL_MULTIPLIERS, ...(data.WINDOW_FRAME_MATERIAL_MULTIPLIERS || {}) },
                GUTTER_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.GUTTER_MATERIAL_MULTIPLIERS, ...(data.GUTTER_MATERIAL_MULTIPLIERS || {}) },
                DECK_MATERIAL_MULTIPLIERS: { ...DEFAULT_PRICING.DECK_MATERIAL_MULTIPLIERS, ...(data.DECK_MATERIAL_MULTIPLIERS || {}) },
            });
        } catch (error) {
            console.error('Load pricing error:', error);
            setPricing(DEFAULT_PRICING);
        }
    };

    const savePricing = async (newPricing: PricingConfig) => {
        if (!user) return;
        try {
            await setDoc(doc(db, `users/${user.uid}/configs/pricing`), newPricing);
            setPricing(newPricing);
        } catch (error) {
            console.error('Save pricing error:', error);
        }
        setIsSettingsOpen(false);
    };

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setPricing(DEFAULT_PRICING); // Reset to defaults on logout
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSaveWall = (wallData: InteriorWall) => {
        if (editingWall) {
            setInteriorWalls(interiorWalls.map(w => w.id === editingWall.id ? wallData : w));
        } else {
            setInteriorWalls([...interiorWalls, wallData]);
        }
        setIsWallModalOpen(false);
        setEditingWall(null);
    };

    const handleSaveCeiling = (ceilingData: InteriorCeiling) => {
        if (editingCeiling) {
            setInteriorCeilings(interiorCeilings.map(c => c.id === editingCeiling.id ? ceilingData : c));
        } else {
            setInteriorCeilings([...interiorCeilings, ceilingData]);
        }
        setIsCeilingModalOpen(false);
        setEditingCeiling(null);
    };

    const handleSavePopcorn = (popcornData: PopcornRemoval) => {
        if (editingPopcorn) {
            setPopcornRemovals(popcornRemovals.map(p => p.id === editingPopcorn.id ? popcornData : p));
        } else {
            setPopcornRemovals([...popcornRemovals, popcornData]);
        }
        setIsPopcornModalOpen(false);
        setEditingPopcorn(null);
    };

    const handleSaveTrim = (trimData: TrimItem) => {
        if (editingTrim) {
            if (isInteriorTrim) {
                setInteriorTrims(interiorTrims.map(t => t.id === editingTrim.id ? trimData : t));
            } else {
                setExteriorTrims(exteriorTrims.map(t => t.id === editingTrim.id ? trimData : t));
            }
        } else {
            if (isInteriorTrim) {
                setInteriorTrims([...interiorTrims, trimData]);
            } else {
                setExteriorTrims([...exteriorTrims, trimData]);
            }
        }
        setIsTrimModalOpen(false);
        setEditingTrim(null);
    };

    const handleSaveSiding = (sidingData: ExteriorSiding) => {
        if (editingSiding) {
            setExteriorSidings(exteriorSidings.map(s => s.id === editingSiding.id ? sidingData : s));
        } else {
            setExteriorSidings([...exteriorSidings, sidingData]);
        }
        setIsSidingModalOpen(false);
        setEditingSiding(null);
    };

    const handleSaveAdditional = (itemData: AdditionalItem) => {
        if (editingAdditionalItem) {
            setAdditionalItems(additionalItems.map(i => i.id === editingAdditionalItem.id ? itemData : i));
        } else {
            setAdditionalItems([...additionalItems, itemData]);
        }
        setIsAdditionalModalOpen(false);
        setEditingAdditionalItem(null);
    };

    const calculateEstimate = useCallback(() => {
    if (!selectedPaintQuality) {
        console.error("Cannot calculate without selecting paint quality.");
        return;
    }

    setIsLoading(true);
    try {
        const paintCostPerGallon = pricing.PAINT_COST_PER_GALLON[selectedPaintQuality];
        const primerCostPerGallon = pricing.PRIMER_COST_PER_GALLON;
        const getPrimerFactor = (condition: PrepCondition) => {
            if (condition === 'fair') return 0.5;
            if (condition === 'poor') return 1.0;
            return 0;
        };

        let totalCogs = 0;
        const breakdownItems: {name: string, cogs: number}[] = [];

        const calculateItemCogs = (name: string, laborHours: number, effectivePaintSqFt: number, primerSqFt: number, addon: number = 0) => {
            const laborCost = laborHours * pricing.PAINTER_BURDENED_HOURLY_COST;
            const paintCost = (effectivePaintSqFt / pricing.COVERAGE_PER_GALLON) * paintCostPerGallon;
            const primerCost = (primerSqFt / pricing.COVERAGE_PER_GALLON) * primerCostPerGallon;
            const suppliesCost = (paintCost + primerCost) * pricing.SUPPLIES_PERCENTAGE;
            const itemCogs = laborCost + paintCost + primerCost + suppliesCost + addon;
            breakdownItems.push({name, cogs: itemCogs});
            return itemCogs;
        };

        // Calculate interior prep hours using unique room keys based on dimensions
        let interiorPrepHours = 0;
        const interiorRoomMap: Map<string, PrepCondition[]> = new Map();
        const addToRoomMap = (length: number, width: number, height: number, condition: PrepCondition) => {
            const key = `${length}_${width}_${height}`;
            if (!interiorRoomMap.has(key)) {
                interiorRoomMap.set(key, []);
            }
            interiorRoomMap.get(key)!.push(condition);
        };

        if (projectType === 'interior' || projectType === 'both') {
            interiorWalls.forEach((w) => {
                const length = parseFloat(String(w.length)) || 0;
                const width = parseFloat(String(w.width)) || 0;
                const ceilingHeight = parseFloat(String(w.ceilingHeight)) || 8;
                addToRoomMap(length, width, ceilingHeight, w.prepCondition);
            });
            interiorCeilings.forEach((c) => {
                const length = parseFloat(String(c.length)) || 0;
                const width = parseFloat(String(c.width)) || 0;
                const ceilingHeight = parseFloat(String(c.ceilingHeight)) || 8;
                addToRoomMap(length, width, ceilingHeight, c.prepCondition);
            });
            popcornRemovals.forEach((p) => {
                const length = parseFloat(String(p.length)) || 0;
                const width = parseFloat(String(p.width)) || 0;
                const ceilingHeight = parseFloat(String(p.ceilingHeight)) || 8;
                addToRoomMap(length, width, ceilingHeight, p.prepCondition);
            });

            for (const conditions of interiorRoomMap.values()) {
                if (conditions.length > 0) {
                    const maxMult = Math.max(...conditions.map((c) => pricing.PREP_CONDITION_MULTIPLIERS[c]));
                    interiorPrepHours += pricing.BASE_PREP_HOURS_PER_ROOM * maxMult;
                }
            }

            if (interiorPrepHours > 0) {
                const prepLaborCost = interiorPrepHours * pricing.PAINTER_BURDENED_HOURLY_COST;
                breakdownItems.push({ name: 'Interior Preparation', cogs: prepLaborCost });
                totalCogs += prepLaborCost;
            }

            interiorWalls.forEach((w: InteriorWall) => {
                const length = parseFloat(String(w.length)) || 0;
                const width = parseFloat(String(w.width)) || 0;
                const ceilingHeight = parseFloat(String(w.ceilingHeight)) || 8;
                const textureMult = pricing.TEXTURE_MULTIPLIERS[w.texture] || 1.0;
                const baseCoats = Math.max(w.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER; // E.g., for 0.5, 2 coats=1.5, 3=2.0, but adjust
                // Or simpler: full labor per coat, but discount extras: coatMult = 1 + (coats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
                const highCeilingMult = ceilingHeight > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1.0;
                const sqFt = (length + width) * 2 * ceilingHeight;
                const paintingHours = (sqFt / pricing.PRODUCTION_RATES.walls) * textureMult * coatMult * highCeilingMult;
                const laborHours = paintingHours; // prep handled separately
                const effectivePaintSqFt = sqFt * w.coats;
                const primerSqFt = sqFt * getPrimerFactor(w.prepCondition) * textureMult * (ceilingHeight > 10 ? 1.1 : 1.0);
                let addon = 0;
                if (w.paintStairwell) addon += pricing.COST_STAIRWELL;
                const name = `Interior Walls - ${length} x ${width} x ${ceilingHeight} ft`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });

            interiorCeilings.forEach((c: InteriorCeiling) => {
                const length = parseFloat(String(c.length)) || 0;
                const width = parseFloat(String(c.width)) || 0;
                const ceilingHeight = parseFloat(String(c.ceilingHeight)) || 8;
                const textureMult = pricing.TEXTURE_MULTIPLIERS[c.texture] || 1.0;
                const baseCoats = Math.max(c.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
                const highCeilingMult = ceilingHeight > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1.0;
                const sqFt = length * width;
                const paintingHours = (sqFt / pricing.PRODUCTION_RATES.ceilings) * textureMult * coatMult * highCeilingMult;
                const laborHours = paintingHours; // prep handled separately
                const effectivePaintSqFt = sqFt * c.coats;
                const primerSqFt = sqFt * getPrimerFactor(c.prepCondition) * textureMult * (ceilingHeight > 10 ? 1.1 : 1.0);
                let addon = 0;
                if (c.useMoldResistantPaint) addon += pricing.COST_MOLD_RESISTANT_PAINT_UPCHARGE;
                if (c.paintCrownMolding) addon += pricing.COST_CROWN_MOLDING;
                if (c.paintFireplaceMantel) addon += pricing.COST_FIREPLACE_MANTEL;
                const name = `Interior Ceiling Painting - ${length} x ${width} ft`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });

            popcornRemovals.forEach((p: PopcornRemoval) => {
                const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[p.prepCondition] || 1.0;
                const length = parseFloat(String(p.length)) || 0;
                const width = parseFloat(String(p.width)) || 0;
                const ceilingHeight = parseFloat(String(p.ceilingHeight)) || 8;
                const highCeilingMult = ceilingHeight > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1.0;
                const sqFt = length * width;
                const removalHours = (sqFt / pricing.PRODUCTION_RATES.popcornRemoval) * prepMultiplier * highCeilingMult;
                const laborHours = removalHours; // prep handled separately, but keep mult on removal
                const effectivePaintSqFt = 0;
                const primerSqFt = 0;
                const addon = 0;
                const name = `Popcorn Ceiling Removal - ${length} x ${width} ft`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });

            interiorTrims.forEach((t: TrimItem) => {
                const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[t.prepCondition] || 1.0;
                const lnFt = parseFloat(String(t.lnFt)) || 0;
                const baseCoats = Math.max(t.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
                const paintingHours = (lnFt / pricing.PRODUCTION_RATES.trim) * coatMult * prepMultiplier;
                const laborHours = paintingHours;
                const itemSqFt = lnFt * pricing.ADDITIONAL_PAINT_USAGE.trim;
                const effectivePaintSqFt = itemSqFt * t.coats;
                const primerSqFt = itemSqFt * getPrimerFactor(t.prepCondition);
                const addon = 0;
                const name = `Interior Trim - ${lnFt} ln ft`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });
        }

        // Calculate exterior prep hours once with max multiplier
        const exteriorPrepHours = 0;
        const exteriorConditions: PrepCondition[] = [];
        if (projectType === 'exterior' || projectType === 'both') {
            exteriorSidings.forEach((s) => exteriorConditions.push(s.prepCondition));
            exteriorTrims.forEach((t) => exteriorConditions.push(t.prepCondition));
            additionalItems.forEach((i) => {
                if (exteriorTypes.includes(i.type as any)) {
                    exteriorConditions.push(i.prepCondition);
                }
            });

            if (exteriorConditions.length > 0) {
                const maxMult = Math.max(...exteriorConditions.map((c) => pricing.PREP_CONDITION_MULTIPLIERS[c]));
                exteriorPrepHours = pricing.BASE_PREP_HOURS_EXTERIOR * maxMult;
                const prepLaborCost = exteriorPrepHours * pricing.PAINTER_BURDENED_HOURLY_COST;
                breakdownItems.push({ name: 'Exterior Preparation', cogs: prepLaborCost });
                totalCogs += prepLaborCost;
            }

            exteriorSidings.forEach((s: ExteriorSiding) => {
                const sqFt = parseFloat(String(s.sqft)) || 0;
                const textureMult = pricing.TEXTURE_MULTIPLIERS[s.texture] || 1.0;
                const baseCoats = Math.max(s.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
                const sidingMult = pricing.SIDING_LABOR_MULTIPLIERS[s.siding as keyof typeof pricing.SIDING_LABOR_MULTIPLIERS] || 1.0;
                const storyMult = pricing.STORY_MULTIPLIERS[s.stories as keyof typeof pricing.STORY_MULTIPLIERS] || 1.0;
                const paintingHours = (sqFt / pricing.PRODUCTION_RATES.walls) * textureMult * coatMult * sidingMult * storyMult;
                const laborHours = paintingHours; // prep handled separately
                const effectivePaintSqFt = sqFt * s.coats;
                const primerSqFt = sqFt * getPrimerFactor(s.prepCondition) * textureMult * storyMult;
                const addon = 0;
                const name = `Exterior Siding - ${s.sqft} sq ft, ${s.siding}, ${s.stories} stories`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });

            exteriorTrims.forEach((t: TrimItem) => {
                const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[t.prepCondition] || 1.0;
                const lnFt = parseFloat(String(t.lnFt)) || 0;
                const baseCoats = Math.max(t.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
                const paintingHours = (lnFt / pricing.PRODUCTION_RATES.trim) * coatMult * prepMultiplier;
                const laborHours = paintingHours;
                const itemSqFt = lnFt * pricing.ADDITIONAL_PAINT_USAGE.trim;
                const effectivePaintSqFt = itemSqFt * t.coats;
                const primerSqFt = itemSqFt * getPrimerFactor(t.prepCondition);
                const addon = 0;
                const name = `Exterior Trim - ${lnFt} ln ft`;
                totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
            });
        }

        additionalItems.forEach((item: AdditionalItem) => {
            const qty = parseFloat(String(item.quantity)) || 0;
            const rate = pricing.PRODUCTION_RATES[item.type] || 0;
            const paintUsage = pricing.ADDITIONAL_PAINT_USAGE[item.type] || 0;
            const baseCoats = Math.max(item.coats, 1);
                const coatMult = 1 + (baseCoats - 1) * pricing.EXTRA_COAT_MULTIPLIER;
            let itemHours = (item.type === 'gutter' || item.type === 'deck' ? qty * rate : qty * rate);
            let materialMult = 1.0;
            const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[item.prepCondition] || 1.0;
            if (item.material) {
                switch (item.type) {
                    case 'interiorDoor':
                    case 'closetDoor':
                    case 'vanityDoor':
                        materialMult = pricing.INTERIOR_DOOR_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.INTERIOR_DOOR_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'exteriorDoor':
                        materialMult = pricing.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.EXTERIOR_DOOR_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'garageDoor':
                        materialMult = pricing.GARAGE_DOOR_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.GARAGE_DOOR_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'cabinetDoor':
                    case 'cabinetDrawer':
                    case 'vanityDrawer':
                        materialMult = pricing.CABINET_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.CABINET_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'shutter':
                        materialMult = pricing.SHUTTER_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.SHUTTER_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'windowFrame':
                        materialMult = pricing.WINDOW_FRAME_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.WINDOW_FRAME_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'gutter':
                        materialMult = pricing.GUTTER_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.GUTTER_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                    case 'deck':
                        materialMult = pricing.DECK_MATERIAL_MULTIPLIERS[item.material as keyof typeof pricing.DECK_MATERIAL_MULTIPLIERS] || 1.0;
                        break;
                }
            }
            itemHours *= materialMult * prepMultiplier * coatMult;
            const itemSqFt = qty * paintUsage;
            const effectivePaintSqFt = itemSqFt * item.coats;
            const primerSqFt = itemSqFt * getPrimerFactor(item.prepCondition);
            const laborHours = itemHours;
            const addon = 0;
            const name = `${formatTypeLabel(item.type)} x ${qty}${item.material ? ` (${item.material})` : ''}`;
            totalCogs += calculateItemCogs(name, laborHours, effectivePaintSqFt, primerSqFt, addon);
        });

        const price = totalCogs * pricing.PROFIT_MARKUP * (1 + pricing.TAX_RATE);
        // const roundedPrice = Math.round(price / 25) * 25; commented out to show exact price
        const breakdownWithPrices = breakdownItems.map(item => ({name: item.name, price: item.cogs * pricing.PROFIT_MARKUP}));

        setBreakdown(breakdownWithPrices);
        setEstimate(price);
    } catch (error) {
        console.error('Calculation error:', error);
        setEstimate(0);
        setBreakdown([]);
    } finally {
        setIsLoading(false);
        setCurrentStep(5);
    }
}, [interiorWalls, interiorCeilings, popcornRemovals, interiorTrims, exteriorSidings, exteriorTrims, additionalItems, projectType, selectedPaintQuality, pricing]);

    const handleFinalCalculate = () => {
        if (interiorWalls.length === 0 && interiorCeilings.length === 0 && popcornRemovals.length === 0 && interiorTrims.length === 0 && exteriorSidings.length === 0 && exteriorTrims.length === 0 && additionalItems.length === 0) {
            setEstimate(0);
            setBreakdown([]);
            setCurrentStep(5);
            return;
        }
        calculateEstimate();
    };

    const startOver = () => {
        setCurrentStep(1);
        setProjectType('');
        setInteriorWalls([]);
        setInteriorCeilings([]);
        setPopcornRemovals([]);
        setInteriorTrims([]);
        setExteriorSidings([]);
        setExteriorTrims([]);
        setAdditionalItems([]);
        setSelectedPaintQuality('');
        setEstimate(0);
        setBreakdown([]);
    };

    const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

    const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

    if (!user) {
        return (
            <div className="bg-[#f0f2f5] min-h-screen px-6 py-24 font-sans text-center">
                <style>{`
                    .btn-primary { background-color: #093373; color: #ffffff; }
                    .btn-primary:hover { background-color: #0c4194; }
                    .btn-secondary { background-color: #e0e7ff; color: #162733; }
                    .btn-secondary:hover { background-color: #c7d2fe; }
                    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Inter:wght@400;700&display=swap');
                    .font-serif { font-family: 'Lora', serif; }
                    .font-sans { font-family: 'Inter', sans-serif; }
                    @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                    
                    /* --- DARK MODE FIXES --- */
                    @media (prefers-color-scheme: dark) {
                        /* This rule changes the text on various gray backgrounds to be light */
                        .text-gray-600, .text-gray-700, .text-gray-900, .text-[#162733] {
                            color: #e2e8f0 !important; /* A light gray for dark mode */
                        }
                        
                        /* This rule now correctly targets BOTH the white cards AND the main page background */
                        .bg-white, .bg-\\[\\#f0f2f5\\] {
                            background-color: #1a202c !important; /* A dark background for contrast */
                        }
                    }
                `}</style>
                <h1 className="text-4xl font-bold mb-4 text-gray-900">Login to Access Estimator</h1>
                <button onClick={handleLogin} className="btn-primary py-2 px-4">Sign in with Google</button>
            </div>
        );
    }

    const renderStep1 = () => (
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#162733] mb-6">Personal Painting Estimator</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">Build accurate, profitable quotes for your residential painting projects.</p>
            <div className="flex justify-center mb-8 gap-4">
                <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary font-bold py-2 px-6 rounded-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414L8.586 11l-1.293 1.293a1 1 0 101.414 1.414L10 12.414l1.293 1.293a1 1 0 001.414-1.414L11.414 11l1.293-1.293z" clipRule="evenodd" />
                    </svg>
                    Adjust Pricing
                </button>
                <button onClick={handleLogout} className="btn-secondary font-bold py-2 px-6 rounded-lg">Logout</button>
            </div>
            <button onClick={() => setCurrentStep(2)} className="btn-primary font-bold py-4 px-10 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-transform duration-200 flex items-center gap-2 mx-auto">
                Let&apos;s Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#162733] mb-8">What are we painting today?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <SelectableCard label="Interior" selected={projectType === 'interior'} onClick={() => setProjectType('interior')} />
                <SelectableCard label="Exterior" selected={projectType === 'exterior'} onClick={() => setProjectType('exterior')} />
                <SelectableCard label="Both" selected={projectType === 'both'} onClick={() => setProjectType('both')} />
            </div>
            <div className="mt-10 flex justify-center gap-4">
                <button onClick={() => setCurrentStep(1)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
                <button onClick={() => setCurrentStep(3)} className="btn-primary font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!projectType} title={projectType ? '' : 'Select a project type to continue'}>Continue</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center text-[#162733] mb-6">Build Your Project</h2>
            <div className="max-w-3xl mx-auto">
                <div className="space-y-8">
                    {(projectType === 'interior' || projectType === 'both') && (
                        <>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Walls</h3>
                                <div className="space-y-4 mb-6">{interiorWalls.length > 0 ? interiorWalls.map(wall => (
                                    <div key={wall.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">Walls</p><p className="text-sm text-gray-600">{wall.length}&apos;x{wall.width}&apos; height {wall.ceilingHeight}&apos;</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingWall(wall); setIsWallModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setInteriorWalls(interiorWalls.filter(w => w.id !== wall.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No walls added yet.</p>}</div>
                                <button onClick={() => { setEditingWall(null); setIsWallModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Walls</button>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Ceilings</h3>
                                <div className="space-y-4 mb-6">{interiorCeilings.length > 0 ? interiorCeilings.map(ceiling => (
                                    <div key={ceiling.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">Ceiling Painting</p><p className="text-sm text-gray-600">{ceiling.length}&apos;x{ceiling.width}&apos;</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingCeiling(ceiling); setIsCeilingModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setInteriorCeilings(interiorCeilings.filter(c => c.id !== ceiling.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No ceilings added yet.</p>}</div>
                                <button onClick={() => { setEditingCeiling(null); setIsCeilingModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Ceiling Painting</button>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Popcorn Ceiling Removal</h3>
                                <div className="space-y-4 mb-6">{popcornRemovals.length > 0 ? popcornRemovals.map(popcorn => (
                                    <div key={popcorn.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">Popcorn Removal</p><p className="text-sm text-gray-600">{popcorn.length}&apos;x{popcorn.width}&apos;</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingPopcorn(popcorn); setIsPopcornModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setPopcornRemovals(popcornRemovals.filter(p => p.id !== popcorn.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No popcorn removals added yet.</p>}</div>
                                <button onClick={() => { setEditingPopcorn(null); setIsPopcornModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Popcorn Removal</button>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Trim / Baseboards</h3>
                                <div className="space-y-4 mb-6">{interiorTrims.length > 0 ? interiorTrims.map(trim => (
                                    <div key={trim.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">Trim</p><p className="text-sm text-gray-600">{trim.lnFt} ln ft</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingTrim(trim); setIsInteriorTrim(true); setIsTrimModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setInteriorTrims(interiorTrims.filter(t => t.id !== trim.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No trims added yet.</p>}</div>
                                <button onClick={() => { setEditingTrim(null); setIsInteriorTrim(true); setIsTrimModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Trim</button>
                            </div>
                        </>
                    )}
                    {(projectType === 'exterior' || projectType === 'both') && (
                        <>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Exterior Siding</h3>
                                <div className="space-y-4 mb-6">{exteriorSidings.length > 0 ? exteriorSidings.map(siding => (
                                    <div key={siding.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">{siding.sqft} sq ft {siding.siding}</p><p className="text-sm text-gray-600">{siding.stories}-story</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingSiding(siding); setIsSidingModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setExteriorSidings(exteriorSidings.filter(s => s.id !== siding.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No siding added yet.</p>}</div>
                                <button onClick={() => { setEditingSiding(null); setIsSidingModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Siding</button>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-700">Exterior Trim</h3>
                                <div className="space-y-4 mb-6">{exteriorTrims.length > 0 ? exteriorTrims.map(trim => (
                                    <div key={trim.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div><p className="font-bold text-lg text-[#162733]">Trim</p><p className="text-sm text-gray-600">{trim.lnFt} ln ft</p></div>
                                        <div className="flex gap-2"><button onClick={() => { setEditingTrim(trim); setIsInteriorTrim(false); setIsTrimModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setExteriorTrims(exteriorTrims.filter(t => t.id !== trim.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                    </div>
                                )) : <p className="text-center text-gray-500 py-4">No trims added yet.</p>}</div>
                                <button onClick={() => { setEditingTrim(null); setIsInteriorTrim(false); setIsTrimModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Trim</button>
                            </div>
                        </>
                    )}
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-gray-700">Additional Items (Doors, Cabinets, etc.)</h3>
                        <div className="space-y-4 mb-6">{additionalItems.length > 0 ? additionalItems.map(item => (
                            <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                <div><p className="font-bold text-lg text-[#162733]">{formatTypeLabel(item.type)}</p><p className="text-sm text-gray-600">Quantity: {item.quantity}{item.material ? ` (${item.material})` : ''}</p></div>
                                <div className="flex gap-2"><button onClick={() => { setEditingAdditionalItem(item); setIsAdditionalModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => { if (confirm("Are you sure you want to delete this item?")) setAdditionalItems(additionalItems.filter(i => i.id !== item.id)) }} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">No additional items added yet.</p>}</div>
                        <button onClick={() => { setEditingAdditionalItem(null); setIsAdditionalModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Additional Item</button>
                    </div>
                </div>
                <div className="mt-10 flex justify-center gap-4">
                    <button onClick={() => setCurrentStep(2)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
                    <button onClick={() => setCurrentStep(4)} className="btn-primary font-bold py-3 px-6 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={interiorWalls.length === 0 && interiorCeilings.length === 0 && popcornRemovals.length === 0 && interiorTrims.length === 0 && exteriorSidings.length === 0 && exteriorTrims.length === 0 && additionalItems.length === 0} title="Add at least one item to proceed">Next: Quality</button>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center text-[#162733] mb-8">The Details That Matter</h2>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">What quality of paint do you have in mind?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <SelectableCard label="Good (Builder)" selected={selectedPaintQuality === 'good'} onClick={() => setSelectedPaintQuality('good')}><p className="text-sm text-gray-600 mt-1">Meets basic needs. Good for low-traffic areas.</p></SelectableCard>
                    <SelectableCard label="Better (Professional)" selected={selectedPaintQuality === 'better'} onClick={() => setSelectedPaintQuality('better')}><p className="text-sm text-gray-600 mt-1">Our most popular choice. Excellent durability and finish.</p></SelectableCard>
                    <SelectableCard label="Best (Premium)" selected={selectedPaintQuality === 'best'} onClick={() => setSelectedPaintQuality('best')}><p className="text-sm text-gray-600 mt-1">Superior longevity, richer color, and a truly luxurious finish. (e.g., BM Aura, SW Emerald)</p></SelectableCard>
                </div>
            </div>
            <div className="text-center mt-10 flex justify-center gap-4">
                <button onClick={() => setCurrentStep(3)} className="btn-secondary font-bold py-3 px-8 rounded-lg text-lg">Back</button>
                <button onClick={handleFinalCalculate} className="btn-primary font-bold py-3 px-8 rounded-lg text-lg shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!selectedPaintQuality} title={selectedPaintQuality ? '' : 'Select a paint quality to continue'}>
                    Calculate Precise Quote
                </button>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="text-center">
            <h2 className="text-2xl font-serif text-[#162733] mb-2">Your Precise Project Quote</h2>
            <div className="text-4xl md:text-6xl font-bold text-[#093373] my-4 min-h-[72px] flex items-center justify-center">
                {isLoading ? (
                    <span className="flex items-center animate-pulse"><span className="animate-spin mr-2">⏳</span>Calculating...</span>
                ) : (
                    <span>{formatCurrency(estimate)}</span>
                )}
            </div>
            <div className="text-left max-w-2xl mx-auto">
                <h3 className="text-xl font-serif font-semibold text-[#162733] mb-4">Understanding Your Quote</h3>
                <p className="text-gray-600 mb-4">This precise quote is based on your inputs. Adjust pricing in settings for different markets.</p>
            </div>
            <div className="max-w-2xl mx-auto mt-6">
                <h3 className="text-xl font-serif font-semibold text-[#162733] mb-4">Detailed Breakdown</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b text-left text-gray-900">Item</th>
                                <th className="py-2 px-4 border-b text-right text-gray-900">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdown.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 px-4 border-b text-left text-gray-900">{item.name}</td>
                                    <td className="py-2 px-4 border-b text-right text-gray-900">{formatCurrency(item.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-400">
                                <td className="py-2 px-4 font-bold text-left text-gray-900">Total</td>
                                <td className="py-2 px-4 font-bold text-right text-gray-900">{formatCurrency(estimate)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
                <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Adjust Pricing</button>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentStep(4)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
                    <button onClick={startOver} className="btn-secondary font-bold py-2 px-6 rounded-lg">Start Over</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-[#f0f2f5] min-h-screen px-6 py-24 font-sans">
            <style>{`
                .btn-primary { background-color: #093373; color: #ffffff; }
                .btn-primary:hover { background-color: #0c4194; }
                .btn-secondary { background-color: #e0e7ff; color: #162733; }
                .btn-secondary:hover { background-color: #c7d2fe; }
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Inter:wght@400;700&display=swap');
                .font-serif { font-family: 'Lora', serif; }
                .font-sans { font-family: 'Inter', sans-serif; }
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                
                /* --- DARK MODE FIXES --- */
                @media (prefers-color-scheme: dark) {
                    /* This rule changes the text on various gray backgrounds to be light */
                    .text-gray-600, .text-gray-700, .text-gray-900, .text-[#162733] {
                        color: #e2e8f0 !important; /* A light gray for dark mode */
                    }
                    
                    /* This rule now correctly targets BOTH the white cards AND the main page background */
                    .bg-white, .bg-\\[\\#f0f2f5\\] {
                        background-color: #1a202c !important; /* A dark background for contrast */
                    }
                    .bg-gray-50 {
                        background-color: #2d3748 !important;
                    }
                    .border-gray-200 {
                        border-color: #4a5568 !important;
                    }
                    .border-gray-400 {
                        border-color: #718096 !important;
                    }
                    .border-red-500 {
                        border-color: #f56565 !important;
                    }
                }
            `}</style>
            <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl">
                <div className="relative app-container p-6 md:p-10">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                </div>
            </div>
            {isWallModalOpen && <WallModal wall={editingWall} onSave={handleSaveWall} onClose={() => { setIsWallModalOpen(false); setEditingWall(null); }} />}
            {isCeilingModalOpen && <CeilingModal ceiling={editingCeiling} onSave={handleSaveCeiling} onClose={() => { setIsCeilingModalOpen(false); setEditingCeiling(null); }} />}
            {isPopcornModalOpen && <PopcornModal popcorn={editingPopcorn} onSave={handleSavePopcorn} onClose={() => { setIsPopcornModalOpen(false); setEditingPopcorn(null); }} />}
            {isTrimModalOpen && <TrimModal trim={editingTrim} onSave={handleSaveTrim} onClose={() => { setIsTrimModalOpen(false); setEditingTrim(null); }} />}
            {isSidingModalOpen && <SidingModal siding={editingSiding} onSave={handleSaveSiding} onClose={() => { setIsSidingModalOpen(false); setEditingSiding(null); }} />}
            {isAdditionalModalOpen && <AdditionalModal item={editingAdditionalItem} onSave={handleSaveAdditional} onClose={() => { setIsAdditionalModalOpen(false); setEditingAdditionalItem(null); }} projectType={projectType} />}
            {isSettingsOpen && <PricingSettingsModal pricing={pricing} onSave={savePricing} onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
}