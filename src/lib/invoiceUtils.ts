// src/lib/invoiceUtils.ts

import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface InvoiceData {
  uid: string;
  clientInfo: {
    name: string;
    address: string;
    address2: string; // Added missing property from the modal
    email: string;
    phone: string;
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
}

export const generateAndDownloadInvoice = async (invoiceData: InvoiceData, idToken: string) => {
  try {
    console.log('Generating invoice...');
    
    const response = await fetch('/api/generate-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(invoiceData)
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
    const blob = await response.blob();
    console.log('Received blob:', { size: blob.size, type: blob.type });

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `invoice-${new Date().toISOString().slice(0, 10)}.pdf`;
    if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
      filename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
    }

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    window.URL.revokeObjectURL(url);
    
    console.log('Invoice downloaded successfully');
    return { success: true, filename: filename };

  } catch (error) {
    console.error('Invoice generation failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate and download invoice: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during invoice generation.');
    }
  }
};