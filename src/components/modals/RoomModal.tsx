// src/components/modals/RoomModal.tsx
import React, { useState } from 'react';
import type { Room } from '@/types/paintingEstimator';

interface RoomModalProps {
  room?: Room;
  onSave: (room: Room) => void;
  onClose: () => void;
}

// Define a state type that allows empty strings for number fields
type RoomFormData = Omit<Room, 'length' | 'width' | 'height'> & {
    length: number | '';
    width: number | '';
    height: number | '';
};

const RoomModal: React.FC<RoomModalProps> = ({ room, onSave, onClose }) => {
  // --- New initial state logic ---
  const initialState: RoomFormData = {
    id: room?.id || Date.now(),
    name: room?.name || '',
    length: room?.length ?? '', // Use '' if new
    width: room?.width ?? '',   // Use '' if new
    height: room?.height ?? '', // Use '' if new
    services: room?.services || [],
  };

  const [formData, setFormData] = useState<RoomFormData>(initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear previous error
    const newErrors = { ...fieldErrors };
    delete newErrors[name];
    setFieldErrors(newErrors);

    if (name === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
      return;
    }

    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
        // You might want to show an error for non-numeric input
        return;
    }
    
    if (num < 0) {
      setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
    }
    
    setFormData(prev => ({ ...prev, [name]: num }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
        alert("Please enter a room name.");
        return;
    }

    // --- New validation logic for saving ---
    const length = Number(formData.length);
    const width = Number(formData.width);
    const height = Number(formData.height);

    if (isNaN(length) || length <= 0) {
        alert("Length must be a positive number.");
        return;
    }
    if (isNaN(width) || width <= 0) {
        alert("Width must be a positive number.");
        return;
    }
    if (isNaN(height) || height <= 0) {
        alert("Height must be a positive number.");
        return;
    }

    onSave({
        ...formData,
        length,
        width,
        height,
    } as Room);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{room ? 'Edit' : 'Add'} Room</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Room Name</label>
            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label htmlFor="length" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Length (ft)</label>
            <input type="number" min="0" step="0.1" id="length" name="length" value={formData.length} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.length ? 'border-red-500' : ''}`} />
            {fieldErrors.length && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.length}</p>}
          </div>
          <div>
            <label htmlFor="width" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Width (ft)</label>
            <input type="number" min="0" step="0.1" id="width" name="width" value={formData.width} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.width ? 'border-red-500' : ''}`} />
            {fieldErrors.width && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.width}</p>}
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Height (ft)</label>
            <input type="number" min="0" step="0.1" id="height" name="height" value={formData.height} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${fieldErrors.height ? 'border-red-500' : ''}`} />
            {fieldErrors.height && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{fieldErrors.height}</p>}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button onClick={onClose} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 dark:hover:bg-blue-900 text-white py-2 px-4 rounded-lg transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;