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
    if (formData.length <= 0) return alert("Length > 0");
    if (formData.width <= 0) return alert("Width > 0");
    if (formData.height <= 0) return alert("Height > 0");
    onSave(formData as Room);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">{room ? 'Edit' : 'Add'} Room</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Room Name</label>
            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border-2 border-gray-400 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#093373] focus:border-[#093373] text-gray-900" />
          </div>
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-gray-700">Length (ft)</label>
            <input type="number" min="0" step="0.1" id="length" name="length" value={formData.length ?? ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.length ? 'border-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.length && <p className="text-red-500 text-sm">{fieldErrors.length}</p>}
          </div>
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700">Width (ft)</label>
            <input type="number" min="0" step="0.1" id="width" name="width" value={formData.width ?? ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.width ? 'border-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.width && <p className="text-red-500 text-sm">{fieldErrors.width}</p>}
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (ft)</label>
            <input type="number" min="0" step="0.1" id="height" name="height" value={formData.height ?? ''} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm border-2 border-gray-400 focus:ring-[#093373] text-gray-900 ${fieldErrors.height ? 'border-red-500' : 'focus:border-[#093373]'}`} />
            {fieldErrors.height && <p className="text-red-500 text-sm">{fieldErrors.height}</p>}
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

export default RoomModal;