// src/types/paintingEstimator.ts
export type ServiceType = 'wallPainting' | 'ceilingPainting' | 'trims' | 'additional';

export interface Service {
  id: number;
  type: ServiceType;
  surfaceArea?: number | string;
  lnFt?: number;
  quantity?: number;
  cost?: number;
  name?: string;
}

export interface Room {
  id: number;
  name: string;
  height: number;
  prepHours: number;
  services: Service[];
}

export interface DetailedBreakdownItem {
  roomId: number;
  roomName: string;
  roomTotal: number;
  services: Array<{
    serviceId: number;
    serviceType: string;
    name?: string;
    total: number;
  }>;
}

export interface Pricing {
  laborRate: number;
  overheadRate: number;
  profitMarginRate: number;
  materialRates: {
    wallPainting: number;
    ceilingPainting: number;
    trims: number;
  };
  productionRates: {
    wallPainting: number;
    ceilingPainting: number;
    trims: number;
  };
}

export interface Customer {
  id: string; // Firestore document ID
  name: string;
  email: string; // Now mandatory
  phone: string; // Now mandatory
  address?: string; // Optional: Could be billing address later
  createdAt: Date; // Keep track of when customer was added
}

// Type for data passed back from modal when creating a NEW customer
export type NewCustomerInput = Omit<Customer, 'id' | 'createdAt' | 'address'>;

export type EstimateStatus = 'Draft' | 'Sent' | 'Approved' | 'Archived';

export interface Estimate {
  id: string; // Firestore document ID
  customerId: string; // Link to the Customer document ID
  customerName: string; // Denormalized for easy display
  projectAddress: string; // Mandatory project address
  estimateNumber: string; // e.g., "00001", "00002"
  status: EstimateStatus;
  createdAt: Date;
  lastModified: Date;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  profitAmount: number;
  total: number;
  rooms: Room[]; // Embed the rooms directly in the estimate document
}
