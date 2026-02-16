import type { DetailedBreakdownItem, Pricing, Room } from '@/types/paintingEstimator';

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const calculateEstimate = (rooms: Room[], pricing: Pricing) => {
  let totalMaterialCost = 0;
  let totalLaborCost = 0;
  const breakdown: DetailedBreakdownItem[] = [];

  rooms.forEach((room) => {
    const roomServices: DetailedBreakdownItem['services'] = [];
    let roomTotal = 0;

    const prepHours = Number(room.prepHours) || 0;
    if (prepHours > 0) {
      const prepLaborCost = prepHours * pricing.laborRate;
      totalLaborCost += prepLaborCost;
      roomTotal += prepLaborCost;
      roomServices.push({
        serviceId: -1,
        serviceType: 'prep',
        name: 'Room Preparation',
        total: roundMoney(prepLaborCost),
      });
    }

    room.services.forEach((service) => {
      let serviceMaterial = 0;
      let serviceLabor = 0;

      switch (service.type) {
        case 'wallPainting': {
          const area = Number(service.surfaceArea) || 0;
          serviceMaterial = area * pricing.materialRates.wallPainting;
          serviceLabor = (area / pricing.productionRates.wallPainting) * pricing.laborRate;
          break;
        }
        case 'ceilingPainting': {
          const area = Number(service.surfaceArea) || 0;
          serviceMaterial = area * pricing.materialRates.ceilingPainting;
          serviceLabor = (area / pricing.productionRates.ceilingPainting) * pricing.laborRate;
          break;
        }
        case 'trims': {
          const linearFeet = Number(service.lnFt) || 0;
          serviceMaterial = linearFeet * pricing.materialRates.trims;
          serviceLabor = (linearFeet / pricing.productionRates.trims) * pricing.laborRate;
          break;
        }
        case 'additional': {
          const quantity = Number(service.quantity) || 0;
          const unitCost = Number(service.cost) || 0;
          serviceMaterial = quantity * unitCost;
          serviceLabor = 0;
          break;
        }
        default:
          break;
      }

      const serviceTotal = serviceMaterial + serviceLabor;
      totalMaterialCost += serviceMaterial;
      totalLaborCost += serviceLabor;
      roomTotal += serviceTotal;

      roomServices.push({
        serviceId: service.id,
        serviceType: service.type,
        name: service.name,
        total: roundMoney(serviceTotal),
      });
    });

    breakdown.push({
      roomId: room.id,
      roomName: room.name,
      roomTotal: roundMoney(roomTotal),
      services: roomServices,
    });
  });

  const baseCost = totalMaterialCost + totalLaborCost;
  const overheadCost = baseCost * pricing.overheadRate;
  const profitAmount = (baseCost + overheadCost) * pricing.profitMarginRate;
  const total = baseCost + overheadCost + profitAmount;

  return {
    total: roundMoney(total),
    breakdown,
    materialCost: roundMoney(totalMaterialCost),
    laborCost: roundMoney(totalLaborCost),
    overheadCost: roundMoney(overheadCost),
    profitAmount: roundMoney(profitAmount),
    baseCost: roundMoney(baseCost),
  };
};

