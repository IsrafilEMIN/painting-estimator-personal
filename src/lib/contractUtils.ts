// src/lib/contractUtils.ts
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

export interface ServiceDescription {
  roomId: string;
  serviceId: string;
  roomName: string;
  serviceType: string;
  description: string;
}

export interface PaymentSchedule {
  depositAmount: number;
  depositDate: string;
  depositUseCustomDate: boolean;
  depositCustomDate: string;
  secondAmount: number;
  secondDate: string;
  secondUseCustomDate: boolean;
  secondCustomDate: string;
  finalAmount: number;
  finalDate: string;
  finalUseCustomDate: boolean;
  finalCustomDate: string;
}

export interface ContractData {
  uid: string;
  contractInfo: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectAddress: string;
    startDate: string;
    completionDate: string;
    warrantyPeriod: string; // Added warrantyPeriod to match modal state shape
  };
  breakdown: DetailedBreakdownItem[];
  subtotal: number;
  tax: number;
  total: number;
  discountAmount: number;
  adjustedSubtotal: number;
  paintCost: number;
  primerCost: number;
  asbestosCost: number;
  serviceDescriptions: ServiceDescription[];
  paymentSchedule: PaymentSchedule;
}

export const generateAndDownloadContract = async (data: ContractData, idToken: string) => {
  try {
    console.log('Sending contract generation request...');
    
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Contract API Response:', result);

    if (!result.success || !result.pdf) {
      throw new Error('Invalid response format from contract generation API');
    }

    // Convert base64 to blob and download
    const pdfBlob = new Blob([
      Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))
    ], { type: 'application/pdf' });

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename || 'contract.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return result;
  } catch (error) {
    console.error('Error in generateAndDownloadContract:', error);
    throw error;
  }
};
