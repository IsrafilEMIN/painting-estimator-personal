// src/components/modals/RoomModal.tsx
import React, { useState } from 'react';
import type { Room } from '@/types/paintingEstimator';

interface RoomModalProps {
  room?: Room;
  onSave: (room: Room) => void;
  onClose: () => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, onSave, onClose }) => {
  const initialState: Partial<Room> = {
    id: room?.id || Date.now(),
    name: room?.name || '',
    length: Number(room?.length) || 0,
    width: Number(room?.width) || 0,
    height: Number(room?.height) || 0,
    services: room?.services || [],
  };
  const [formData, setFormData] = useState<Partial<Room>>(initialState);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }
    const num = parseFloat(value) || 0;
    if (value !== '' && !isNaN(num) && num < 0) {
      setFieldErrors(prev => ({ ...prev, [name]: 'Cannot be negative' }));
      return;
    } else {
      setFieldErrors(prev => { const p = { ...prev }; delete p[name]; return p; });
    }
    setFormData(prev => ({ ...prev, [name]: num }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) return alert("Enter room name");
    if ((formData.length ?? 0) <= 0) return alert("Length > 0");
    if ((formData.width ?? 0) <= 0) return alert("Width > 0");
    if ((formData.height ?? 0) <= 0) return alert("Height > 0");
    onSave(formData as Room);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{room ? 'Edit' : 'Add'} Room</h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Room Name</label>
            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
          </div>
          <div>
            <label htmlFor="length" className="block text-sm font-semibold text-gray-700 mb-1">Length (ft)</label>
            <input type="number" min="0" step="0.1" id="length" name="length" value={formData.length ?? ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.length ? 'border-red-500' : ''}`} />
            {fieldErrors.length && <p className="text-red-500 text-sm mt-1">{fieldErrors.length}</p>}
          </div>
          <div>
            <label htmlFor="width" className="block text-sm font-semibold text-gray-700 mb-1">Width (ft)</label>
            <input type="number" min="0" step="0.1" id="width" name="width" value={formData.width ?? ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.width ? 'border-red-500' : ''}`} />
            {fieldErrors.width && <p className="text-red-500 text-sm mt-1">{fieldErrors.width}</p>}
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-semibold text-gray-700 mb-1">Height (ft)</label>
            <input type="number" min="0" step="0.1" id="height" name="height" value={formData.height ?? ''} onChange={handleChange} className={`block w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition ${fieldErrors.height ? 'border-red-500' : ''}`} />
            {fieldErrors.height && <p className="text-red-500 text-sm mt-1">{fieldErrors.height}</p>}
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;