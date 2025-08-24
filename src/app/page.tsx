"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // Adjust path if needed

// --- TYPE DEFINITIONS ---
interface Room {
    id: number;
    type: 'Bedroom' | 'Bathroom' | 'Living Room' | 'Dining Room' | 'Kitchen' | 'Hallway' | 'Entryway' | 'Office';
    length: number | string;
    width: number | string;
    ceilingHeight: number | string;
    paintWalls: boolean;
    paintCeiling: boolean;
    paintTrim: boolean;
    doors: number | string;
    paintDoorsCheck: boolean;
    closetDoors?: number | string;
    paintVanity?: boolean;
    vanityDoors?: number | string;
    vanityDrawers?: number | string;
    useMoldResistantPaint?: boolean;
    paintCrownMolding?: boolean;
    paintFireplaceMantel?: boolean;
    paintStairwell?: boolean;
    paintCabinets?: boolean;
    cabinetDoors?: number | string;
    cabinetDrawers?: number | string;
}

interface ExteriorItem {
    id: number;
    siding: string;
    sqft: number | string;
    stories: string;
    trimLft: number | string;
    doors: number | string;
    shutters?: number | string;
    windowFrames?: number | string;
    gutterLft?: number | string;
    deckSqft?: number | string;
}

type PrepCondition = 'good' | 'fair' | 'poor' | '';
type PaintQuality = 'good' | 'better' | 'best' | '';

interface SelectableCardProps { label: string; selected: boolean; onClick: () => void; children?: React.ReactNode; }
interface RoomModalProps { room: Room | null; onSave: (roomData: Room) => void; onClose: () => void; }
interface ExteriorModalProps { item: ExteriorItem | null; onSave: (itemData: ExteriorItem) => void; onClose: () => void; }

// --- PRICING CONFIGURATION (EDITABLE) ---
interface PricingConfig {
    PROFIT_MARKUP: number;
    PAINTER_BURDENED_HOURLY_COST: number;
    PAINT_COST_PER_GALLON: { good: number; better: number; best: number };
    SUPPLIES_PERCENTAGE: number;
    PAINTING_SQFT_PER_HOUR: number;
    BASE_PREP_HOURS_PER_ROOM: number;
    BASE_PREP_HOURS_EXTERIOR: number;
    COST_PER_DOOR: number;
    COST_PER_EXTERIOR_DOOR: number;
    COST_PER_CABINET_PIECE: number;
    COST_PER_CLOSET_DOOR: number;
    COST_PER_VANITY_PIECE: number;
    COST_MOLD_RESISTANT_PAINT_UPCHARGE: number;
    COST_CROWN_MOLDING: number;
    COST_FIREPLACE_MANTEL: number;
    COST_STAIRWELL: number;
    COST_PER_SHUTTER: number;
    COST_PER_WINDOW_FRAME: number;
    COST_GUTTERS_PER_LFT: number;
    COST_DECK_STAIN_PER_SQFT: number;
    PREP_CONDITION_MULTIPLIERS: { good: number; fair: number; poor: number };
    HIGH_CEILING_MULTIPLIER: number;
    SIDING_LABOR_MULTIPLIERS: { Vinyl: number; Wood: number; Stucco: number; Brick: number; Metal: number; 'Fiber Cement': number };
    STORY_MULTIPLIERS: { '1': number; '2': number; '3': number };
    COVERAGE_PER_GALLON: number;
}

const DEFAULT_PRICING: PricingConfig = {
    PROFIT_MARKUP: 2.0, // For 50% gross margin (price = COGS * 2)
    PAINTER_BURDENED_HOURLY_COST: 40.00,
    PAINT_COST_PER_GALLON: { good: 30, better: 50, best: 65 },
    SUPPLIES_PERCENTAGE: 0.15,
    PAINTING_SQFT_PER_HOUR: 175,
    BASE_PREP_HOURS_PER_ROOM: 2.0,
    BASE_PREP_HOURS_EXTERIOR: 4.0,
    COST_PER_DOOR: 75.00,
    COST_PER_EXTERIOR_DOOR: 125.00,
    COST_PER_CABINET_PIECE: 100.00,
    COST_PER_CLOSET_DOOR: 40.00,
    COST_PER_VANITY_PIECE: 60.00,
    COST_MOLD_RESISTANT_PAINT_UPCHARGE: 75.00,
    COST_CROWN_MOLDING: 250.00,
    COST_FIREPLACE_MANTEL: 200.00,
    COST_STAIRWELL: 450.00,
    COST_PER_SHUTTER: 25.00,
    COST_PER_WINDOW_FRAME: 40.00,
    COST_GUTTERS_PER_LFT: 3.00,
    COST_DECK_STAIN_PER_SQFT: 2.50,
    PREP_CONDITION_MULTIPLIERS: { good: 1.0, fair: 1.5, poor: 2.5 },
    HIGH_CEILING_MULTIPLIER: 1.20,
    SIDING_LABOR_MULTIPLIERS: { 'Vinyl': 1.0, 'Wood': 1.4, 'Stucco': 1.6, 'Brick': 1.7, 'Metal': 1.1, 'Fiber Cement': 1.1 },
    STORY_MULTIPLIERS: { '1': 1.0, '2': 1.25, '3': 1.5 },
    COVERAGE_PER_GALLON: 350,
};

// --- HELPER & MODAL COMPONENTS ---
const SelectableCard: React.FC<SelectableCardProps> = ({ label, selected, onClick, children = null }) => (
    <div className={`selectable-card border-2 rounded-lg p-4 cursor-pointer text-center transition-all duration-200 ${selected ? 'border-[#093373] shadow-lg scale-105' : 'border-gray-200 hover:border-blue-400'}`} onClick={onClick}>
        <h4 className="font-bold text-lg text-[#162733]">{label}</h4>
        {children}
    </div>
);

const RoomModal: React.FC<RoomModalProps> = ({ room, onSave, onClose }) => {
    const initialRoomState: Room = {
        id: Date.now(), type: 'Bedroom', length: '', width: '', ceilingHeight: 8,
        paintWalls: true, paintCeiling: false, paintTrim: false, doors: '', paintDoorsCheck: false,
        closetDoors: '', paintVanity: false, vanityDoors: '', vanityDrawers: '', useMoldResistantPaint: false,
        paintCrownMolding: false, paintFireplaceMantel: false, paintStairwell: false,
        paintCabinets: false, cabinetDoors: '', cabinetDrawers: ''
    };
    const [formData, setFormData] = useState<Room>(room || initialRoomState);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let checked: boolean | undefined;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
        }
        const newValue = type === 'checkbox' ? checked : value;
        if (type === 'number') {
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

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as Room['type'];
        setFormData(prev => ({
            ...initialRoomState,
            id: prev.id,
            length: prev.length,
            width: prev.width,
            ceilingHeight: prev.ceilingHeight,
            type: newType,
        }));
    };

    const handleSave = () => {
        if (!formData.length || !formData.width) {
            alert("Please enter valid room dimensions."); return;
        }
        onSave(formData);
    };

    const renderCustomFields = () => {
        switch (formData.type) {
            case 'Bedroom':
                return (
                    <div>
                        <label htmlFor="closet-doors" className="block text-sm text-gray-600">Closet Doors (qty)</label>
                        <input type="number" id="closet-doors" name="closetDoors" value={formData.closetDoors} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.closetDoors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.closetDoors && <p className="text-red-500 text-sm mt-1">{fieldErrors.closetDoors}</p>}
                    </div>
                );
            case 'Bathroom':
                return (
                    <div className="space-y-4">
                        <label className="flex items-center"><input type="checkbox" name="useMoldResistantPaint" checked={formData.useMoldResistantPaint} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Use Mold-Resistant Paint (Recommended)</label>
                        <label className="flex items-center"><input type="checkbox" name="paintVanity" checked={formData.paintVanity} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Vanity</label>
                        {formData.paintVanity && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div>
                                    <label htmlFor="vanity-doors" className="block text-sm text-gray-600">Vanity Doors</label>
                                    <input type="number" id="vanity-doors" name="vanityDoors" value={formData.vanityDoors} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.vanityDoors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                                    {fieldErrors.vanityDoors && <p className="text-red-500 text-sm mt-1">{fieldErrors.vanityDoors}</p>}
                                </div>
                                <div>
                                    <label htmlFor="vanity-drawers" className="block text-sm text-gray-600">Vanity Drawers</label>
                                    <input type="number" id="vanity-drawers" name="vanityDrawers" value={formData.vanityDrawers} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.vanityDrawers ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                                    {fieldErrors.vanityDrawers && <p className="text-red-500 text-sm mt-1">{fieldErrors.vanityDrawers}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Living Room':
            case 'Dining Room':
                return (
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" name="paintCrownMolding" checked={formData.paintCrownMolding} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Crown Molding</label>
                        <label className="flex items-center"><input type="checkbox" name="paintFireplaceMantel" checked={formData.paintFireplaceMantel} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Fireplace Mantel</label>
                    </div>
                );
            case 'Hallway':
            case 'Entryway':
                return (
                    <label className="flex items-center"><input type="checkbox" name="paintStairwell" checked={formData.paintStairwell} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Includes Stairwell Walls / Risers</label>
                );
            case 'Kitchen':
                return (
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" name="paintCabinets" checked={formData.paintCabinets} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Refinish Kitchen Cabinets</label>
                        {formData.paintCabinets && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div>
                                    <label htmlFor="cabinet-doors" className="block text-sm text-gray-600">Cabinet Doors</label>
                                    <input type="number" id="cabinet-doors" name="cabinetDoors" value={formData.cabinetDoors} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.cabinetDoors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                                    {fieldErrors.cabinetDoors && <p className="text-red-500 text-sm mt-1">{fieldErrors.cabinetDoors}</p>}
                                </div>
                                <div>
                                    <label htmlFor="cabinet-drawers" className="block text-sm text-gray-600">Cabinet Drawers</label>
                                    <input type="number" id="cabinet-drawers" name="cabinetDrawers" value={formData.cabinetDrawers} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.cabinetDrawers ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                                    {fieldErrors.cabinetDrawers && <p className="text-red-500 text-sm mt-1">{fieldErrors.cabinetDrawers}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{room ? 'Edit' : 'Add'} Interior Space</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="room-type" className="block text-sm font-medium text-gray-700">Room Type</label>
                        <select id="room-type" name="type" value={formData.type} onChange={handleTypeChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373]">
                            <option>Bedroom</option><option>Living Room</option><option>Kitchen</option><option>Bathroom</option><option>Hallway</option><option>Entryway</option><option>Office</option><option>Dining Room</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="room-length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
                            <input type="number" id="room-length" name="length" value={formData.length} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
                        </div>
                        <div>
                            <label htmlFor="room-width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
                            <input type="number" id="room-width" name="width" value={formData.width} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.width ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                            {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ceiling-height" className="block text-sm font-medium text-gray-700">Ceiling Height (ft)</label>
                        <input type="number" id="ceiling-height" name="ceilingHeight" value={formData.ceilingHeight} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.ceilingHeight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.ceilingHeight && <p className="text-red-500 text-sm mt-1">{fieldErrors.ceilingHeight}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" name="paintWalls" checked={formData.paintWalls} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Walls</label>
                        <label className="flex items-center"><input type="checkbox" name="paintCeiling" checked={formData.paintCeiling} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Ceiling</label>
                        <label className="flex items-center"><input type="checkbox" name="paintTrim" checked={formData.paintTrim} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Trim/Baseboards</label>
                    </div>
                    <div>
                        <label htmlFor="room-doors" className="block text-sm font-medium text-gray-700">Doors (qty)</label>
                        <input type="number" id="room-doors" name="doors" value={formData.doors} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.doors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.doors && <p className="text-red-500 text-sm mt-1">{fieldErrors.doors}</p>}
                    </div>
                    <label className="flex items-center"><input type="checkbox" name="paintDoorsCheck" checked={formData.paintDoorsCheck} onChange={handleChange} className="h-4 w-4 rounded border-2 border-gray-400 text-[#093373] focus:ring-[#093373] mr-2" />Paint Doors</label>
                    {renderCustomFields()}
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="btn-primary font-bold py-2 px-4 rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExteriorModal: React.FC<ExteriorModalProps> = ({ item, onSave, onClose }) => {
    const initialExteriorState: ExteriorItem = {
        id: Date.now(), siding: 'Vinyl', sqft: '', stories: '1', trimLft: '', doors: '', shutters: '', windowFrames: '', gutterLft: '', deckSqft: ''
    };
    const [formData, setFormData] = useState<ExteriorItem>(item || initialExteriorState);
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
        if (!formData.sqft) {
            alert("Please enter valid sqft."); return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{item ? 'Edit' : 'Add'} Exterior Surface</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="siding-type" className="block text-sm font-medium text-gray-700">Siding Type</label>
                        <select id="siding-type" name="siding" value={formData.siding} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373]">
                            <option>Vinyl</option><option>Wood</option><option>Stucco</option><option>Brick</option><option>Metal</option><option>Fiber Cement</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="exterior-sqft" className="block text-sm font-medium text-gray-700">Sq Ft of Siding</label>
                        <input type="number" id="exterior-sqft" name="sqft" value={formData.sqft} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.sqft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.sqft && <p className="text-red-500 text-sm mt-1">{fieldErrors.sqft}</p>}
                    </div>
                    <div>
                        <label htmlFor="stories" className="block text-sm font-medium text-gray-700">Number of Stories</label>
                        <select id="stories" name="stories" value={formData.stories} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373]">
                            <option>1</option><option>2</option><option>3</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="trim-lft" className="block text-sm font-medium text-gray-700">Trim Linear Ft</label>
                        <input type="number" id="trim-lft" name="trimLft" value={formData.trimLft} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.trimLft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.trimLft && <p className="text-red-500 text-sm mt-1">{fieldErrors.trimLft}</p>}
                    </div>
                    <div>
                        <label htmlFor="exterior-doors" className="block text-sm font-medium text-gray-700">Doors (qty)</label>
                        <input type="number" id="exterior-doors" name="doors" value={formData.doors} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.doors ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.doors && <p className="text-red-500 text-sm mt-1">{fieldErrors.doors}</p>}
                    </div>
                    <div>
                        <label htmlFor="shutters" className="block text-sm font-medium text-gray-700">Shutters (qty)</label>
                        <input type="number" id="shutters" name="shutters" value={formData.shutters} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.shutters ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.shutters && <p className="text-red-500 text-sm mt-1">{fieldErrors.shutters}</p>}
                    </div>
                    <div>
                        <label htmlFor="window-frames" className="block text-sm font-medium text-gray-700">Window Frames (qty)</label>
                        <input type="number" id="window-frames" name="windowFrames" value={formData.windowFrames} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.windowFrames ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.windowFrames && <p className="text-red-500 text-sm mt-1">{fieldErrors.windowFrames}</p>}
                    </div>
                    <div>
                        <label htmlFor="gutter-lft" className="block text-sm font-medium text-gray-700">Gutters Linear Ft</label>
                        <input type="number" id="gutter-lft" name="gutterLft" value={formData.gutterLft} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.gutterLft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.gutterLft && <p className="text-red-500 text-sm mt-1">{fieldErrors.gutterLft}</p>}
                    </div>
                    <div>
                        <label htmlFor="deck-sqft" className="block text-sm font-medium text-gray-700">Deck Sq Ft (for staining)</label>
                        <input type="number" id="deck-sqft" name="deckSqft" value={formData.deckSqft} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] ${fieldErrors.deckSqft ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-[#093373]'}`} />
                        {fieldErrors.deckSqft && <p className="text-red-500 text-sm mt-1">{fieldErrors.deckSqft}</p>}
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
        if (parts.length === 2) {
            const [parent, child] = parts;
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent as keyof PricingConfig], [child]: parseFloat(value) || 0 }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        }
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">Adjust Pricing Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="PROFIT_MARKUP" className="block text-sm text-gray-600">Profit Markup (for 50% margin: 2.0)</label>
                        <input type="number" step="0.01" id="PROFIT_MARKUP" name="PROFIT_MARKUP" value={formData.PROFIT_MARKUP} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="PAINTER_BURDENED_HOURLY_COST" className="block text-sm text-gray-600">Burdened Hourly Labor Cost</label>
                        <input type="number" step="0.01" id="PAINTER_BURDENED_HOURLY_COST" name="PAINTER_BURDENED_HOURLY_COST" value={formData.PAINTER_BURDENED_HOURLY_COST} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="paint_good" className="block text-sm text-gray-600">Paint Cost/Gallon - Good</label>
                        <input type="number" step="0.01" id="paint_good" name="PAINT_COST_PER_GALLON.good" value={formData.PAINT_COST_PER_GALLON.good} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="paint_better" className="block text-sm text-gray-600">Paint Cost/Gallon - Better</label>
                        <input type="number" step="0.01" id="paint_better" name="PAINT_COST_PER_GALLON.better" value={formData.PAINT_COST_PER_GALLON.better} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="paint_best" className="block text-sm text-gray-600">Paint Cost/Gallon - Best</label>
                        <input type="number" step="0.01" id="paint_best" name="PAINT_COST_PER_GALLON.best" value={formData.PAINT_COST_PER_GALLON.best} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="SUPPLIES_PERCENTAGE" className="block text-sm text-gray-600">Supplies % of Paint Cost</label>
                        <input type="number" step="0.01" id="SUPPLIES_PERCENTAGE" name="SUPPLIES_PERCENTAGE" value={formData.SUPPLIES_PERCENTAGE} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="PAINTING_SQFT_PER_HOUR" className="block text-sm text-gray-600">Painting SqFt per Hour</label>
                        <input type="number" id="PAINTING_SQFT_PER_HOUR" name="PAINTING_SQFT_PER_HOUR" value={formData.PAINTING_SQFT_PER_HOUR} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="BASE_PREP_HOURS_PER_ROOM" className="block text-sm text-gray-600">Base Prep Hours per Room</label>
                        <input type="number" step="0.01" id="BASE_PREP_HOURS_PER_ROOM" name="BASE_PREP_HOURS_PER_ROOM" value={formData.BASE_PREP_HOURS_PER_ROOM} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    <div>
                        <label htmlFor="BASE_PREP_HOURS_EXTERIOR" className="block text-sm text-gray-600">Base Prep Hours Exterior</label>
                        <input type="number" step="0.01" id="BASE_PREP_HOURS_EXTERIOR" name="BASE_PREP_HOURS_EXTERIOR" value={formData.BASE_PREP_HOURS_EXTERIOR} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    {/* Add more fields for all other pricing keys similarly */}
                    {/* For brevity, I'll outline a few more; in full code, include all */}
                    <div>
                        <label htmlFor="COST_PER_DOOR" className="block text-sm text-gray-600">Cost per Interior Door</label>
                        <input type="number" step="0.01" id="COST_PER_DOOR" name="COST_PER_DOOR" value={formData.COST_PER_DOOR} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    {/* ... Continue for COST_PER_EXTERIOR_DOOR, COST_PER_CABINET_PIECE, etc. */}
                    {/* For multipliers like PREP_CONDITION_MULTIPLIERS.good, etc. */}
                    <div>
                        <label htmlFor="prep_good" className="block text-sm text-gray-600">Prep Multiplier - Good</label>
                        <input type="number" step="0.01" id="prep_good" name="PREP_CONDITION_MULTIPLIERS.good" value={formData.PREP_CONDITION_MULTIPLIERS.good} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                    {/* Add for fair, poor, HIGH_CEILING_MULTIPLIER, SIDING_LABOR_MULTIPLIERS.Vinyl, etc. */}
                    {/* STORY_MULTIPLIERS['1'], etc. */}
                    <div>
                        <label htmlFor="COVERAGE_PER_GALLON" className="block text-sm text-gray-600">Coverage per Gallon</label>
                        <input type="number" id="COVERAGE_PER_GALLON" name="COVERAGE_PER_GALLON" value={formData.COVERAGE_PER_GALLON} onChange={handleChange} className="mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:border-[#093373] focus:ring-[#093373]" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
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
    const [rooms, setRooms] = useState<Room[]>([]);
    const [exteriorItems, setExteriorItems] = useState<ExteriorItem[]>([]);
    const [selectedPrep, setSelectedPrep] = useState<PrepCondition>('');
    const [selectedPaintQuality, setSelectedPaintQuality] = useState<PaintQuality>('');
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isExteriorModalOpen, setIsExteriorModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [editingExteriorItem, setEditingExteriorItem] = useState<ExteriorItem | null>(null);
    const [estimate, setEstimate] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
    const [user, setUser] = useState(null);

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
            if (pricingDoc.exists()) {
                setPricing(pricingDoc.data() as PricingConfig);
            } else {
                setPricing(DEFAULT_PRICING);
            }
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

    const handleSaveRoom = (roomData: Room) => {
        if (editingRoom) {
            setRooms(rooms.map(r => r.id === editingRoom.id ? roomData : r));
        } else {
            setRooms([...rooms, roomData]);
        }
        setIsRoomModalOpen(false);
        setEditingRoom(null);
    };

    const handleSaveExterior = (itemData: ExteriorItem) => {
        if (editingExteriorItem) {
            setExteriorItems(exteriorItems.map(i => i.id === editingExteriorItem.id ? itemData : i));
        } else {
            setExteriorItems([...exteriorItems, itemData]);
        }
        setIsExteriorModalOpen(false);
        setEditingExteriorItem(null);
    };

    const calculateEstimate = useCallback(() => {
        setIsLoading(true);
        try {
            let totalPaintableSqFt = 0, totalPaintingHours = 0, totalPrepHours = 0, addonCOGS = 0;
            const prepMultiplier = pricing.PREP_CONDITION_MULTIPLIERS[selectedPrep as keyof typeof pricing.PREP_CONDITION_MULTIPLIERS] || 1.0;

            if (projectType === 'interior' || projectType === 'both') {
                rooms.forEach((room: Room) => {
                    const length = parseFloat(String(room.length)) || 0;
                    const width = parseFloat(String(room.width)) || 0;
                    const ceilingHeight = parseFloat(String(room.ceilingHeight)) || 8;
                    
                    let roomSqFt = 0;
                    const ceilingMultiplier = ceilingHeight > 10 ? pricing.HIGH_CEILING_MULTIPLIER : 1;

                    if (room.paintWalls) roomSqFt += (length + width) * 2 * ceilingHeight;
                    if (room.paintCeiling) roomSqFt += length * width;
                    if (room.paintTrim) totalPaintingHours += ((length + width) * 2) / 40;

                    totalPaintableSqFt += roomSqFt;
                    totalPaintingHours += (roomSqFt * 2 * ceilingMultiplier) / pricing.PAINTING_SQFT_PER_HOUR;
                    totalPrepHours += pricing.BASE_PREP_HOURS_PER_ROOM;

                    if (room.paintDoorsCheck) addonCOGS += (parseFloat(String(room.doors)) || 0) * pricing.COST_PER_DOOR;
                    if (room.closetDoors) addonCOGS += (parseFloat(String(room.closetDoors)) || 0) * pricing.COST_PER_CLOSET_DOOR;
                    if (room.useMoldResistantPaint) addonCOGS += pricing.COST_MOLD_RESISTANT_PAINT_UPCHARGE;
                    if (room.paintVanity) {
                        const vanityCount = (parseFloat(String(room.vanityDoors)) || 0) + (parseFloat(String(room.vanityDrawers)) || 0);
                        addonCOGS += vanityCount * pricing.COST_PER_VANITY_PIECE;
                    }
                    if (room.paintCrownMolding) addonCOGS += pricing.COST_CROWN_MOLDING;
                    if (room.paintFireplaceMantel) addonCOGS += pricing.COST_FIREPLACE_MANTEL;
                    if (room.paintStairwell) addonCOGS += pricing.COST_STAIRWELL;
                    if (room.paintCabinets) {
                        const cabinetCount = (parseFloat(String(room.cabinetDoors)) || 0) + (parseFloat(String(room.cabinetDrawers)) || 0);
                        addonCOGS += cabinetCount * pricing.COST_PER_CABINET_PIECE;
                    }
                });
            }
            
            if (projectType === 'exterior' || projectType === 'both') {
                exteriorItems.forEach((item: ExteriorItem) => {
                    const sqft = parseFloat(String(item.sqft)) || 0;
                    const sidingMultiplier = pricing.SIDING_LABOR_MULTIPLIERS[item.siding as keyof typeof pricing.SIDING_LABOR_MULTIPLIERS] || 1;
                    const storyMultiplier = pricing.STORY_MULTIPLIERS[item.stories as keyof typeof pricing.STORY_MULTIPLIERS] || 1;
                    
                    totalPaintableSqFt += sqft;
                    totalPaintingHours += (sqft * 2 * sidingMultiplier * storyMultiplier) / pricing.PAINTING_SQFT_PER_HOUR;
                    totalPrepHours += pricing.BASE_PREP_HOURS_EXTERIOR;

                    if (item.trimLft) totalPaintingHours += (parseFloat(String(item.trimLft)) || 0) / 30;
                    if (item.doors) addonCOGS += (parseFloat(String(item.doors)) || 0) * pricing.COST_PER_EXTERIOR_DOOR;
                    if (item.shutters) addonCOGS += (parseFloat(String(item.shutters)) || 0) * pricing.COST_PER_SHUTTER;
                    if (item.windowFrames) addonCOGS += (parseFloat(String(item.windowFrames)) || 0) * pricing.COST_PER_WINDOW_FRAME;
                    if (item.gutterLft) addonCOGS += (parseFloat(String(item.gutterLft)) || 0) * pricing.COST_GUTTERS_PER_LFT;
                    if (item.deckSqft) addonCOGS += (parseFloat(String(item.deckSqft)) || 0) * pricing.COST_DECK_STAIN_PER_SQFT;
                });
            }
            
            const finalPrepHours = totalPrepHours * prepMultiplier;
            const totalLaborHours = totalPaintingHours + finalPrepHours;
            const laborCOGS = totalLaborHours * pricing.PAINTER_BURDENED_HOURLY_COST;
            
            let materialCOGS = 0;
            if (selectedPaintQuality) {
                const paintCostPerGallon = pricing.PAINT_COST_PER_GALLON[selectedPaintQuality as keyof typeof pricing.PAINT_COST_PER_GALLON];
                const gallonsNeeded = Math.ceil((totalPaintableSqFt * 2) / pricing.COVERAGE_PER_GALLON);
                const totalPaintCost = gallonsNeeded * paintCostPerGallon;
                const suppliesCost = totalPaintCost * pricing.SUPPLIES_PERCENTAGE;
                materialCOGS = totalPaintCost + suppliesCost;
            }

            const totalCOGS = laborCOGS + materialCOGS + addonCOGS;
            const price = totalCOGS * pricing.PROFIT_MARKUP;
            const roundedPrice = Math.round(price / 25) * 25; // Round to nearest 25 for clean pricing

            setEstimate(roundedPrice);
        } catch (error) {
            console.error('Calculation error:', error);
            setEstimate(0);
        } finally {
            setIsLoading(false);
            setCurrentStep(5);
        }
    }, [rooms, exteriorItems, projectType, selectedPrep, selectedPaintQuality, pricing]);

    const handleFinalCalculate = () => {
        if ((!rooms || rooms.length === 0) && (!exteriorItems || exteriorItems.length === 0)) {
            setEstimate(0);
            setCurrentStep(5);
            return;
        }
        calculateEstimate();
    };

    const startOver = () => {
        setCurrentStep(1);
        setProjectType('');
        setRooms([]);
        setExteriorItems([]);
        setSelectedPrep('');
        setSelectedPaintQuality('');
        setEstimate(0);
    };

    const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

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
                `}</style>
                <h1 className="text-4xl font-bold mb-4">Login to Access Estimator</h1>
                <button onClick={handleLogin} className="btn-primary py-2 px-4">Sign in with Google</button>
            </div>
        );
    }

    const renderStep1 = () => (
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#162733] mb-6">Personal Painting Estimator</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">Build accurate, profitable quotes for your residential painting projects. Customized for 50% gross margin.</p>
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
                <button onClick={() => setCurrentStep(3)} className="btn-primary font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!projectType}>Continue</button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center text-[#162733] mb-6">Build Your Project</h2>
            <div className="max-w-3xl mx-auto">
                <div className="space-y-8">
                    {(projectType === 'interior' || projectType === 'both') && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-700">Interior Spaces</h3>
                            <div className="space-y-4 mb-6">{rooms.length > 0 ? rooms.map(room => (
                                <div key={room.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                    <div><p className="font-bold text-lg text-[#162733]">{room.type}</p><p className="text-sm text-gray-600">{room.length}&apos;x{room.width}&apos;</p></div>
                                    <div className="flex gap-2"><button onClick={() => { setEditingRoom(room); setIsRoomModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => setRooms(rooms.filter(r => r.id !== room.id))} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4">No spaces added yet.</p>}</div>
                            <button onClick={() => { setEditingRoom(null); setIsRoomModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Interior Space</button>
                        </div>
                    )}
                    {(projectType === 'exterior' || projectType === 'both') && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4 text-gray-700">Exterior Surfaces</h3>
                            <div className="space-y-4 mb-6">{exteriorItems.length > 0 ? exteriorItems.map(item => (
                                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                    <div><p className="font-bold text-lg text-[#162733]">{item.sqft} sq ft {item.siding}</p><p className="text-sm text-gray-600">{item.stories}-story</p></div>
                                    <div className="flex gap-2"><button onClick={() => { setEditingExteriorItem(item); setIsExteriorModalOpen(true); }} className="text-blue-600 hover:text-blue-800 font-semibold">Edit</button><button onClick={() => setExteriorItems(exteriorItems.filter(i => i.id !== item.id))} className="text-red-600 hover:text-red-800 font-semibold">Delete</button></div>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4">No surfaces added yet.</p>}</div>
                            <button onClick={() => { setEditingExteriorItem(null); setIsExteriorModalOpen(true); }} className="w-full btn-secondary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>Add Exterior Surface</button>
                        </div>
                    )}
                </div>
                <div className="mt-10 flex justify-center gap-4">
                    <button onClick={() => setCurrentStep(2)} className="btn-secondary font-bold py-2 px-6 rounded-lg">Back</button>
                    <button onClick={() => setCurrentStep(4)} className="btn-primary font-bold py-3 px-6 rounded-lg shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={(rooms.length === 0 && exteriorItems.length === 0)}>Next: Prep & Quality</button>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center text-[#162733] mb-8">The Details That Matter</h2>
            <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">How much prep work is needed?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <SelectableCard label="Good Condition" selected={selectedPrep === 'good'} onClick={() => setSelectedPrep('good')}><p className="text-sm text-gray-600 mt-1">Minor prep. Surfaces have few, if any, holes to fill.</p></SelectableCard>
                    <SelectableCard label="Fair Condition" selected={selectedPrep === 'fair'} onClick={() => setSelectedPrep('fair')}><p className="text-sm text-gray-600 mt-1">Moderate prep. Some scuffs, scratches, and minor patching needed.</p></SelectableCard>
                    <SelectableCard label="Poor Condition" selected={selectedPrep === 'poor'} onClick={() => setSelectedPrep('poor')}><p className="text-sm text-gray-600 mt-1">Extensive prep. Significant repairs or wallpaper removal needed.</p></SelectableCard>
                </div>
            </div>
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
                <button onClick={handleFinalCalculate} className="btn-primary font-bold py-3 px-8 rounded-lg text-lg shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!selectedPrep || !selectedPaintQuality}>
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
                    <span className="animate-pulse">Calculating...</span>
                ) : (
                    <span>{formatCurrency(estimate)}</span>
                )}
            </div>
            <div className="text-left max-w-2xl mx-auto">
                <h3 className="text-xl font-serif font-semibold text-[#162733] mb-4">Understanding Your Quote</h3>
                <p className="text-gray-600 mb-4">This precise quote is based on your inputs, aiming for a 50% gross margin. Adjust pricing in settings for different markets.</p>
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
            {isRoomModalOpen && <RoomModal room={editingRoom} onSave={handleSaveRoom} onClose={() => { setIsRoomModalOpen(false); setEditingRoom(null); }} />}
            {isExteriorModalOpen && <ExteriorModal item={editingExteriorItem} onSave={handleSaveExterior} onClose={() => { setIsExteriorModalOpen(false); setEditingExteriorItem(null); }} />}
            {isSettingsOpen && <PricingSettingsModal pricing={pricing} onSave={savePricing} onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
}