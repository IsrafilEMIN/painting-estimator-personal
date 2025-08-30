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
}

const Step2: React.FC<Step2Props> = ({
  rooms,
  openRoomModal,
  duplicateRoom,
  deleteRoom,
  openServiceModal,
  deleteService,
  setCurrentStep,
  canProceed
}) => {
  const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Rooms</h2>
      {rooms.map((room) => (
        <div key={room.id} className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-bold text-lg">{room.name}</h3>
          <p>{room.length}x{room.width}x{room.height}</p>
          <div className="mt-2 space-x-2">
            <button onClick={() => openRoomModal(room)} className="text-sm text-blue-500">Edit</button>
            <button onClick={() => duplicateRoom(room)} className="text-sm text-green-500">Duplicate</button>
            <button onClick={() => deleteRoom(room.id)} className="text-sm text-red-500">Delete</button>
          </div>
          <div className="mt-4">
            <h4 className="font-bold">Services</h4>
            {room.services.map(service => (
              <div key={service.id} className="flex justify-between">
                <span>{formatTypeLabel(service.type)}</span>
                <div>
                  <button onClick={() => openServiceModal(room.id, service)} className="text-sm text-blue-500">Edit</button>
                  <button onClick={() => deleteService(room.id, service.id)} className="text-sm text-red-500 ml-2">Delete</button>
                </div>
              </div>
            ))}
            <button onClick={() => openServiceModal(room.id)} className="text-sm text-indigo-500 mt-2">+ Add Service</button>
          </div>
        </div>
      ))}
      <button onClick={() => openRoomModal()} className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded-lg w-full mb-4">
        + Add Room
      </button>
      <div className="flex justify-between">
        <button onClick={() => setCurrentStep(1)} className="bg-gray-500 text-white py-2 px-4 rounded">Back</button>
        <button onClick={() => setCurrentStep(3)} disabled={!canProceed} className={`bg-green-500 text-white py-2 px-4 rounded ${!canProceed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}>
          Calculate Estimate
        </button>
      </div>
    </div>
  );
};

export default Step2;