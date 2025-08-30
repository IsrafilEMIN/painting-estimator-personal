// src/components/modals/ServiceModal.tsx
import React, { useState } from 'react';
import type { Room, Service, ServiceType } from '@/types/paintingEstimator';
import WallModal from './WallModal';
import CeilingModal from './CeilingModal';
import PopcornModal from './PopcornModal';
import TrimModal from './TrimModal';
import AdditionalModal from './AdditionalModal';
// Add other specific modals as needed for crown, door, etc. For now, use Additional for those

interface ServiceModalProps {
  room?: Room;
  service?: Service;
  onSave: (service: Service) => void;
  onClose: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ service, onSave, onClose }) => {
  const [selectedType, setSelectedType] = useState<ServiceType | ''>(service?.type || '');

  const handleTypeChange = (type: ServiceType) => {
    setSelectedType(type);
  };

  const serviceTypes: ServiceType[] = [
    'wallPainting', 'ceilingPainting', 'popcornRemoval', 'crownMolding', 'trims', 'doorPainting', 'vanityDoors', 'vanityDrawers', 'cabinetDoors', 'cabinetDrawers', 'fireplaceMantel'
  ];

  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Select Service Type</h3>
          <div className="grid grid-cols-2 gap-4">
            {serviceTypes.map(type => (
              <button key={type} onClick={() => handleTypeChange(type)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  switch (selectedType) {
    case 'wallPainting':
      return <WallModal wall={service} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
    case 'ceilingPainting':
      return <CeilingModal service={service} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
    case 'popcornRemoval':
      return <PopcornModal service={service} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
    case 'trims':
      return <TrimModal intendedType={selectedType} service={service} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
    case 'crownMolding':
      return <TrimModal intendedType={selectedType} service={service} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
    default:
      return <AdditionalModal service={service} serviceType={selectedType} onSave={onSave} onClose={onClose} onBack={() => setSelectedType('')} />;
  }
};

export default ServiceModal;