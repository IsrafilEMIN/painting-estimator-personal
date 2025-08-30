// src/hooks/useEstimatorState.ts
import { useState } from 'react';
import type { Room, Service, DetailedBreakdownItem } from '@/types/paintingEstimator';

export const useEstimatorState = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<{ roomId: number; service?: Service } | null>(null);
  const [estimate, setEstimate] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [breakdown, setBreakdown] = useState<DetailedBreakdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openRoomModal = (room?: Room) => {
    setEditingRoom(room ?? undefined);
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (room: Room) => {
    setRooms(prev => 
      editingRoom 
        ? prev.map(r => r.id === room.id ? room : r)
        : [...prev, { ...room, id: Date.now() }]
    );
    setIsRoomModalOpen(false);
    setEditingRoom(undefined);
  };

  const duplicateRoom = (room: Room) => {
    setRooms(prev => [...prev, { ...room, id: Date.now(), name: `${room.name} (Copy)` }]);
  };

  const deleteRoom = (roomId: number) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const openServiceModal = (roomId: number, service?: Service) => {
    setEditingService({ roomId, service });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (service: Service) => {
    if (!editingService) return;
    const { roomId } = editingService;
    setRooms(prevRooms => prevRooms.map(room => {
      if (room.id === roomId) {
        const services = editingService.service
          ? room.services.map(s => s.id === service.id ? service : s)
          : [...room.services, { ...service, id: Date.now() }];
        return { ...room, services };
      }
      return room;
    }));
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const deleteService = (roomId: number, serviceId: number) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, services: r.services.filter(s => s.id !== serviceId) } : r));
  };

  const startOver = () => {
    setCurrentStep(1);
    setRooms([]);
    setEstimate(0);
    setSubtotal(0);
    setTax(0);
    setBreakdown([]);
  };

  return {
    currentStep, setCurrentStep,
    rooms, setRooms,
    isRoomModalOpen, setIsRoomModalOpen,
    editingRoom, setEditingRoom, openRoomModal, handleSaveRoom, duplicateRoom, deleteRoom,
    isServiceModalOpen, setIsServiceModalOpen,
    editingService, setEditingService, openServiceModal, handleSaveService, deleteService,
    estimate, setEstimate,
    subtotal, setSubtotal,
    tax, setTax,
    breakdown, setBreakdown,
    isLoading, setIsLoading,
    startOver,
  };
};