// src/components/steps/Step2.tsx
import React from 'react';
import type { Room, Service } from '@/types/paintingEstimator';

interface Step2Props {
  rooms: Room[];
  openRoomModal: (room?: Room) => void;
  duplicateRoom: (room: Room) => void;
  deleteRoom: (roomId: number) => void;
  openServiceModal: (roomId: number, service?: Service) => void;
  deleteService: (roomId: number, serviceId: number) => void;
  setCurrentStep: (step: number) => void;
  canProceed: boolean;
  setIsLoading: (loading: boolean) => void;
}

const Step2: React.FC<Step2Props> = ({
  rooms,
  openRoomModal,
  duplicateRoom,
  deleteRoom,
  openServiceModal,
  deleteService,
  setCurrentStep,
  canProceed,
  setIsLoading
}) => {
  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Rooms</h2>
      {rooms.map((room) => (
        <div key={room.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
          <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200">{room.name}</h3>
          <p className="text-gray-600 dark:text-gray-400">{room.length}x{room.width}x{room.height}</p>
          <div className="mt-2 space-x-3 text-sm">
            <button onClick={() => openRoomModal(room)} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
            <button onClick={() => duplicateRoom(room)} className="text-green-600 dark:text-green-400 hover:underline">Duplicate</button>
            <button onClick={() => deleteRoom(room.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Services</h4>
            {room.services.map(service => (
              <div key={service.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                <span className="text-gray-700 dark:text-gray-300">{formatTypeLabel(service.type)}</span>
                <div className="space-x-3 text-sm">
                  <button onClick={() => openServiceModal(room.id, service)} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                  <button onClick={() => deleteService(room.id, service.id)} className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            ))}
            <button onClick={() => openServiceModal(room.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mt-2">+ Add Service</button>
          </div>
        </div>
      ))}
      <button onClick={() => openRoomModal()} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-6 rounded-lg w-full transition">
        + Add Room
      </button>
      <div className="flex justify-between">
        <button onClick={() => setCurrentStep(1)} className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition">Back</button>
        <button onClick={() => { setIsLoading(true); setCurrentStep(3); }} disabled={!canProceed} className={`bg-green-500 dark:bg-green-600 text-white py-2 px-6 rounded-lg transition ${!canProceed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600 dark:hover:bg-green-700'}`}>
          Calculate Estimate
        </button>
      </div>
    </div>
  );
};

export default Step2;