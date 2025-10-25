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

  const handleDeleteRoom = (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      deleteRoom(roomId);
    }
  };

  const handleDeleteService = (roomId: number, serviceId: number) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      deleteService(roomId, serviceId);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Rooms</h2>
      {rooms.map((room) => (
        <div key={room.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200">{room.name}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => openRoomModal(room)} 
                className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => duplicateRoom(room)} 
                className="px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
              >
                Duplicate
              </button>
              <button 
                onClick={() => handleDeleteRoom(room.id)} 
                className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Services</h4>
              <button 
                onClick={() => openServiceModal(room.id)} 
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="text-sm">+</span> Add Service
              </button>
            </div>
            
            <div className="space-y-2">
              {room.services.map(service => (
                <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{service.name || formatTypeLabel(service.type)}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openServiceModal(room.id, service)} 
                      className="px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteService(room.id, service.id)} 
                      className="px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      
      <button 
        onClick={() => openRoomModal()} 
        className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-4 px-6 rounded-xl w-full transition-all shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
      >
        + Add Room
      </button>
      
      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setCurrentStep(1)} 
          className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors shadow-sm"
        >
          Back
        </button>
        <button 
          onClick={() => { setIsLoading(true); setCurrentStep(3); }} 
          disabled={!canProceed} 
          className={`bg-green-500 dark:bg-green-600 text-white font-semibold py-2.5 px-8 rounded-lg transition-all shadow-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600 dark:hover:bg-green-700 hover:shadow-md'}`}
        >
          Calculate Estimate
        </button>
      </div>
    </div>
  );
};

export default Step2;