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

const ServiceModal: React.FC<ServiceModalProps> = ({ room, service, onSave, onClose }) => {
  const [selectedType, setSelectedType] = useState<ServiceType | ''>(service?.type || '');

  const handleTypeChange = (type: ServiceType) => {
    setSelectedType(type);
  };

  const serviceTypes: ServiceType[] = [
    'wallPainting', 'ceilingPainting', 'popcornRemoval', 'crownMolding', 'trims', 'doorPainting', 'vanityDoors', 'vanityDrawers', 'cabinetDoors', 'cabinetDrawers', 'fireplaceMantel'
  ];

  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full animate-fade-in-up max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-serif font-semibold text-[#162733] mb-6">Select Service Type</h3>
          <div className="grid grid-cols-2 gap-4">
            {serviceTypes.map(type => (
              <button key={type} onClick={() => handleTypeChange(type)} className="btn-secondary py-2 px-4 rounded-lg">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="btn-secondary font-bold py-2 px-4 rounded-lg">Cancel</button>
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