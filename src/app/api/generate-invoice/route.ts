// app/api/generate-invoice/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import { adminDb, admin } from '@/lib/firebaseAdmin';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface RequestBody {
  uid: string;
  clientInfo: {
    name: string;
    address: string;
    address2: string;
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

const COMPANY_INFO = {
  name: 'Atlas HomeServices Inc.',
  address: '54 Walter Sinclair Crt',
  address2: 'Richmond Hill, ON L4E 0X1',
  email: 'info@atlas-paint.com',
  phone: '(647) 916-0826',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

const getInvoiceHtml = (data: RequestBody, invoiceNumber: string) => {
  const { clientInfo, breakdown, subtotal, tax, total, discountAmount, adjustedSubtotal, paintCost, primerCost, asbestosCost } = data;

  let tableRows = '';
  breakdown.forEach(item => {
    tableRows += `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td>${item.roomName}</td>
        <td style="text-align: right;">${formatCurrency(item.baseLabor)}</td>
        <td style="text-align: right;">${formatCurrency(item.baseMaterial)}</td>
        <td style="text-align: right;">${formatCurrency(item.baseTotal)}</td>
      </tr>
    `;
    item.services.forEach(svc => {
      tableRows += `
        <tr>
          <td style="padding-left: 20px;">› ${formatTypeLabel(svc.serviceType)}</td>
          <td style="text-align: right;">${formatCurrency(svc.laborCost)}</td>
          <td style="text-align: right;">${formatCurrency(svc.materialCost)}</td>
          <td style="text-align: right;">${formatCurrency(svc.total)}</td>
        </tr>
      `;
    });
    tableRows += `
      <tr style="background-color: #e0e0e0; font-weight: bold;">
        <td>${item.roomName} Subtotal</td>
        <td></td>
        <td></td>
        <td style="text-align: right;">${formatCurrency(item.roomTotal)}</td>
      </tr>
    `;
  });

  if (paintCost > 0) {
    tableRows += `
      <tr>
        <td>Paint (Global)</td>
        <td></td>
        <td style="text-align: right;">${formatCurrency(paintCost)}</td>
        <td style="text-align: right;">${formatCurrency(paintCost)}</td>
      </tr>
    `;
  }
  if (primerCost > 0) {
    tableRows += `
      <tr>
        <td>Primer (Global)</td>
        <td></td>
        <td style="text-align: right;">${formatCurrency(primerCost)}</td>
        <td style="text-align: right;">${formatCurrency(primerCost)}</td>
      </tr>
    `;
  }
  if (asbestosCost > 0) {
    tableRows += `
      <tr>
        <td>Asbestos Check Fee</td>
        <td></td>
        <td style="text-align: right;">${formatCurrency(asbestosCost)}</td>
        <td style="text-align: right;">${formatCurrency(asbestosCost)}</td>
      </tr>
    `;
  }

  let footerRows = `
    <tr style="background-color: #f0f0f0; font-weight: bold;">
      <td>Subtotal</td>
      <td colspan="3" style="text-align: right;">${formatCurrency(subtotal)}</td>
    </tr>
  `;
  if (discountAmount > 0) {
    footerRows += `
      <tr>
        <td>Discount Applied</td>
        <td colspan="3" style="text-align: right;">-${formatCurrency(discountAmount)}</td>
      </tr>
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td>Adjusted Subtotal</td>
        <td colspan="3" style="text-align: right;">${formatCurrency(adjustedSubtotal)}</td>
      </tr>
    `;
  }
  footerRows += `
    <tr>
      <td>Tax</td>
      <td colspan="3" style="text-align: right;">${formatCurrency(tax)}</td>
    </tr>
    <tr style="background-color: #f0f0f0; font-weight: bold; font-size: 1.2em;">
      <td>Total</td>
      <td colspan="3" style="text-align: right;">${formatCurrency(total)}</td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.4;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px 8px;
          vertical-align: top;
        }
        th { 
          background-color: #007bff; 
          color: white; 
          font-weight: bold;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .company-info, .client-info {
          flex: 1;
        }
        .company-info {
          margin-right: 40px;
        }
        h1 {
          color: #007bff;
          margin-bottom: 30px;
        }
        h2 {
          color: #333;
          font-size: 16px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Invoice #${invoiceNumber}</h1>
      <div class="header-section">
        <div class="company-info">
          <h2>Billed From:</h2>
          <p>${COMPANY_INFO.name}<br>
          ${COMPANY_INFO.address}<br>
          ${COMPANY_INFO.address2}<br>
          ${COMPANY_INFO.email}<br>
          ${COMPANY_INFO.phone}</p>
        </div>
        <div class="client-info">
          <h2>Billed To:</h2>
          <p>${clientInfo.name}<br>
          ${clientInfo.address}<br>
          ${clientInfo.address2}<br>
          ${clientInfo.email}<br>
          ${clientInfo.phone}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Item</th>
            <th style="text-align: right; width: 16%;">Labor</th>
            <th style="text-align: right; width: 17%;">Material</th>
            <th style="text-align: right; width: 17%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          ${footerRows}
        </tfoot>
      </table>
    </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  let browser;
  
  try {
    console.log('Starting invoice generation...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    console.log('Verifying auth token...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const data: RequestBody = await req.json();
    const { uid } = data;

    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting invoice number...');
    // Get and increment invoice number using adminDb
    const counterRef = adminDb.doc(`users/${uid}/counters/invoice`);
    const counterDoc = await counterRef.get();
    let count = 1;
    if (counterDoc.exists) {
      count = (counterDoc.data()?.count || 0) + 1;
    }
    await counterRef.set({ count }, { merge: true });
    const formattedInvoiceNumber = count.toString().padStart(5, '0');

    console.log('Generating HTML...');
    // Generate HTML
    const html = getInvoiceHtml(data, formattedInvoiceNumber);

    console.log('Launching browser...');
    // Launch Playwright browser with environment-specific configuration
    const isDev = process.env.NODE_ENV === 'development';
    
    browser = await chromium.launch({
      headless: true,
      args: isDev ? [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ] : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync'
      ]
    });

    console.log('Creating page...');
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewportSize({ width: 1280, height: 800 });
    
    console.log('Setting content...');
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait a moment for fonts and styles to load
    await page.waitForTimeout(1000);
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '20px', 
        right: '20px', 
        bottom: '20px', 
        left: '20px' 
      },
      preferCSSPageSize: true
    });

    console.log('Closing browser...');
    await browser.close();
    browser = null;

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // Convert to base64 string for reliable Vercel transmission
    const base64Pdf = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      pdf: base64Pdf,
      filename: `invoice-${formattedInvoiceNumber}.pdf`,
      invoiceNumber: formattedInvoiceNumber,
      size: pdfBuffer.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in generate-invoice API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Ensure browser is closed on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to generate invoice',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}