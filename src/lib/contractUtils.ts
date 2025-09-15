// src/lib/contractUtils.ts
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

export interface RoomDescription {
  roomId: string;
  roomName: string;
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
    warrantyPeriod: string;
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
  roomDescriptions: RoomDescription[];
  paymentSchedule: PaymentSchedule;
}

export const generateAndDownloadContract = async (contractData: ContractData, idToken: string) => {
  try {
    console.log('Generating contract...');
   
    const response = await fetch('/api/generate-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(contractData)
    });
    if (!response.ok) {
      let msg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        msg = errorData.error || msg;
        if (errorData.details) {
          msg += `: ${errorData.details}`;
        }
      } catch (jsonError) {
        let text = '';
        try {
          text = await response.text();
        } catch {}
        if (text) {
          msg = text;
        }
      }
      throw new Error(msg);
    }
    // Correctly process the binary PDF response as a Blob
    const pdfBuffer = await response.blob();
    console.log('Received blob:', { size: pdfBuffer.size, type: pdfBuffer.type });
    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `contract-${new Date().toISOString().slice(0, 10)}.pdf`;
    if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
      filename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
    }
    // Create a URL for the blob
    const url = window.URL.createObjectURL(pdfBuffer);
   
    // Detect if mobile device
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
   
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
   
    if (isMobile) {
      // On mobile, open in new tab (no download attribute to allow viewing)
      link.target = '_blank';
    } else {
      // On desktop, force download
      link.download = filename;
    }
   
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
   
    // Clean up the object URL
    window.URL.revokeObjectURL(url);
   
    console.log('Contract handled successfully');
    return { success: true, filename: filename };
  } catch (error) {
    console.error('Contract generation failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate and download contract: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during contract generation.');
    }
  }
};