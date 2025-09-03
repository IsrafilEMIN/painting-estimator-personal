// lib/invoiceUtils.ts
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface InvoiceData {
  uid: string;
  clientInfo: {
    name: string;
    address: string;
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate invoice');
    }

    const data = await response.json();
    console.log('Received response:', { 
      success: data.success, 
      filename: data.filename, 
      size: data.size 
    });
    
    // Convert base64 to blob
    const binaryString = atob(data.pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    console.log('Created blob:', { size: blob.size, type: blob.type });

    // Create download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(url);
    
    console.log('Invoice downloaded successfully');
    return { success: true, invoiceNumber: data.invoiceNumber };

  } catch (error) {
    console.error('Invoice generation failed:', error);
    throw error;
  }
};