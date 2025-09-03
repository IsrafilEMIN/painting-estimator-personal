// app/api/generate-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteerCore, { LaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { adminDb, admin } from '@/lib/firebaseAdmin';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface RequestBody {
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

const COMPANY_INFO = {
  name: 'Your Company Name',
  address: '123 Company St, City, State, ZIP',
  email: 'info@company.com',
  phone: '(123) 456-7890',
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
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #007bff; color: white; }
      </style>
    </head>
    <body>
      <h1>Invoice #${invoiceNumber}</h1>
      <div style="display: flex; justify-content: space-between;">
        <div>
          <h2>Billed From:</h2>
          <p>${COMPANY_INFO.name}</p>
          <p>${COMPANY_INFO.address}</p>
          <p>${COMPANY_INFO.email}</p>
          <p>${COMPANY_INFO.phone}</p>
        </div>
        <div>
          <h2>Billed To:</h2>
          <p>${clientInfo.name}</p>
          <p>${clientInfo.address}</p>
          <p>${clientInfo.email}</p>
          <p>${clientInfo.phone}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: right;">Labor</th>
            <th style="text-align: right;">Material</th>
            <th style="text-align: right;">Total</th>
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
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const data: RequestBody = await req.json();
    const { uid } = data;

    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get and increment invoice number using adminDb
    const counterRef = adminDb.doc(`users/${uid}/counters/invoice`);
    const counterDoc = await counterRef.get();
    let count = 1;
    if (counterDoc.exists) {
      count = (counterDoc.data()?.count || 0) + 1;
    }
    await counterRef.set({ count }, { merge: true });
    const formattedInvoiceNumber = count.toString().padStart(5, '0');

    // Generate HTML
    const html = getInvoiceHtml(data, formattedInvoiceNumber);

    // Launch Puppeteer with Chromium for Vercel
    const executablePath = await chromium.executablePath();
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: 'shell',
      acceptInsecureCerts: true,
    } as LaunchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();

    return new NextResponse(pdfBuffer as Buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${formattedInvoiceNumber}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error in generate-invoice API:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}