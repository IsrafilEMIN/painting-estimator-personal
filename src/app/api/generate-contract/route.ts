export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { chromium as playwrightChromium } from 'playwright';
import { chromium as playwrightCoreChromium } from 'playwright-core';
import sparticuzChromium from '@sparticuz/chromium';
import { adminDb, admin } from '@/lib/firebaseAdmin';
import type { DetailedBreakdownItem } from '@/types/paintingEstimator';

interface ServiceDescription {
  roomId: string;
  serviceId: string;
  roomName: string;
  serviceType: string;
  description: string;
}

interface PaymentSchedule {
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

interface RequestBody {
  uid: string;
  contractInfo: {
    clientName: string;
    projectAddress: string;
    clientEmail: string;
    clientPhone: string;
    startDate: string;
    completionDate: string;
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

const COMPANY_INFO = {
  name: 'Atlas HomeServices Inc.',
  address: '54 Walter Sinclair Crt',
  address2: 'Richmond Hill, ON L4E 0X1',
  email: 'info@atlas-paint.com',
  phone: '(647) 916-0826',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

const formatTypeLabel = (type: string) => type.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase());

const formatDate = (dateString: string) => {
  if (!dateString) return 'To be determined';
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getCurrentDateFormatted = () => {
  const now = new Date();
  const monthName = now.toLocaleDateString('en-CA', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  return `${monthName} ${day}, ${year}`;
};

const getContractHtml = (data: RequestBody) => {
  const { contractInfo, breakdown, subtotal, serviceDescriptions, paymentSchedule } = data;
  
  // Get current date
  const currentDate = getCurrentDateFormatted();

  // Generate scope of work table
  let scopeOfWorkTable = '';
  breakdown.forEach(item => {
    const roomServices = item.services.map(svc => formatTypeLabel(svc.serviceType)).join(', ');
    const roomDescriptions = item.services.map(svc => {
      // Fix: Convert both roomId and serviceId to string for comparison
      const desc = serviceDescriptions.find(d => 
        d.roomId === String(item.roomId) && d.serviceId === String(svc.serviceId)
      );
      return desc?.description || 'Standard service';
    }).join(' | ');

    scopeOfWorkTable += `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${item.roomName}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${roomServices}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${roomDescriptions}</td>
      </tr>
    `;
  });

  // Generate payment schedule
  let paymentScheduleSection = '';
  if (paymentSchedule.depositAmount > 0) {
    paymentScheduleSection += `<li><strong>Initial Deposit:</strong> ${formatCurrency(paymentSchedule.depositAmount)}${paymentSchedule.depositDate ? ` due ${formatDate(paymentSchedule.depositDate)}` : ` due ${paymentSchedule.depositCustomDate}`}</li>`;
  }
  if (paymentSchedule.secondAmount > 0) {
    paymentScheduleSection += `<li><strong>Second Payment:</strong> ${formatCurrency(paymentSchedule.secondAmount)}${paymentSchedule.secondDate ? ` due ${formatDate(paymentSchedule.secondDate)}` : ` due ${paymentSchedule.secondCustomDate}`}</li>`;
  }
  if (paymentSchedule.finalAmount > 0) {
    paymentScheduleSection += `<li><strong>Final Payment:</strong> ${formatCurrency(paymentSchedule.finalAmount)}${paymentSchedule.finalDate ? ` due ${formatDate(paymentSchedule.finalDate)}` : ` due ${paymentSchedule.finalCustomDate}`}</li>`;
  }

  // Use the generated payment schedule
  const paymentItems = paymentScheduleSection;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Residential Painting Agreement</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: #fff;
                padding: 40px;
                border: 1px solid #ddd;
                box-shadow: 0 0 15px rgba(0,0,0,0.05);
            }
            h1, h2 {
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
                margin-top: 30px;
                margin-bottom: 20px;
            }
            h1 {
                text-align: center;
                font-size: 24px;
            }
            h2 {
                font-size: 20px;
            }
            .fill-in {
                display: inline-block;
                border-bottom: 1px solid #333;
                min-width: 200px;
                padding: 0 5px;
                font-weight: bold;
            }
            .parties-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
            .party p {
                margin: 5px 0;
            }
            .scope-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .scope-table th, .scope-table td {
                border: 1px solid #333;
                padding: 12px;
                text-align: left;
            }
            .scope-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .cpa-notice {
                background-color: #f0f7ff;
                border: 1px solid #b3d7ff;
                padding: 20px;
                margin-top: 30px;
            }
            .signature-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 200px;
                margin-top: 50px;
            }
            .signature-box {
                border-top: 1px solid #333;
            }
            .special-instructions {
                background-color: #fffbe6;
                border: 1px solid #ffe58f;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
            }
            .special-instructions h4 {
                margin-top: 0;
                color: #8a6d3b;
            }
            @media print {
                body {
                    background-color: #fff;
                    padding: 0;
                }
                .container {
                    box-shadow: none;
                    border: none;
                }
                .disclaimer {
                    display: none;
                }
            }
        </style>
    </head>
    <body>

        <div class="container">

            <h1>Residential Painting Agreement</h1>

            <p>This agreement is made on this <span class="fill-in">${new Date(currentDate).getDate()}</span> day of <span class="fill-in">${currentDate.split(' ')[0]}</span>, <span class="fill-in">${currentDate.split(' ')[2]}</span>.</p>

            <h2>1. Parties</h2>
            <div class="parties-grid">
                <div class="party">
                    <strong>BETWEEN (The Contractor):</strong>
                    <p>Name/Company: <span class="fill-in">${COMPANY_INFO.name}</span></p>
                    <p>Address: <span class="fill-in">${COMPANY_INFO.address}</span></p>
                    <p>Phone: <span class="fill-in">${COMPANY_INFO.phone}</span></p>
                    <p>Email: <span class="fill-in">${COMPANY_INFO.email}</span></p>
                </div>
                <div class="party">
                    <strong>AND (The Homeowner):</strong>
                    <p>Name(s): <span class="fill-in">${contractInfo.clientName ?? 'N/A'}</span></p>
                    <p>Property Address: <span class="fill-in">${contractInfo.projectAddress ?? 'N/A'}</span></p>
                    <p>Phone: <span class="fill-in">${contractInfo.clientPhone ?? 'N/A'}</span></p>
                    <p>Email: <span class="fill-in">${contractInfo.clientEmail ?? 'N/A'}</span></p>
                </div>
            </div>

            <h2>2. Scope of Work</h2>
            <p>The Contractor agrees to perform the following painting services:</p>
            
            <table class="scope-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Room</th>
                        <th style="width: 35%;">Services</th>
                        <th style="width: 40%;">Description</th>
                    </tr>
                </thead>
                <tbody>
                    ${scopeOfWorkTable}
                </tbody>
            </table>

            <h2>3. Timeline</h2>
            <ul>
                <li><strong>Estimated Start Date:</strong> <span class="fill-in">${formatDate(contractInfo.startDate)}</span></li>
                <li><strong>Estimated Completion Date:</strong> <span class="fill-in">${formatDate(contractInfo.completionDate)}</span></li>
            </ul>

            <h2>4. Price & Payment</h2>
            <p><strong>Total Contract Price: $<span class="fill-in">${subtotal.toFixed(2)}</span> (CAD) + HST (13%)</strong></p>
            <p><strong>Payment Schedule:</strong></p>
            <ul>
                ${paymentItems}
            </ul>
            <p><small>The final price will not exceed the total price above by more than 10% unless the Homeowner agrees to changes in writing.</small></p>

            <h2>5. Changes to the Work</h2>
            <p>Any changes to the scope of work described in Section 2 must be agreed to in writing (email is acceptable) by both parties before the new work begins. The written change must include a description of the new work and its cost.</p>

            <h2>6. Your Rights Under the <em>Consumer Protection Act, 2002</em></h2>
            <p>You may cancel this agreement at any time during the period that ends ten (10) days after the day you receive a written copy of the agreement. You do not need a reason to cancel.</p>
            <p>If you cancel, the Contractor has fifteen (15) days to refund any payment you have made.</p>
            <p>To cancel, you must give notice of cancellation to the Contractor at the address set out in Section 1, by any means that allows you to prove the date you gave notice, including registered mail, fax, or personal delivery.</p>

            <h2>7. Agreement</h2>
            <p>By signing below, both parties confirm they have read, understood, and agree to the terms of this contract.</p>

            <div class="signature-section">
                <div class="signature-box">
                    <p><strong>Contractor Signature</strong></p>
                    <p>Print Name: <span class="fill-in">${COMPANY_INFO.name}</span></p>
                    <p>Date: <span class="fill-in">&nbsp;</span></p>
                </div>
                <div class="signature-box">
                    <p><strong>Homeowner Signature</strong></p>
                    <p>Print Name: <span class="fill-in">${contractInfo.clientName ?? 'N/A'}</span></p>
                    <p>Date: <span class="fill-in">&nbsp;</span></p>
                </div>
            </div>

        </div>

    </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  let browser;

  try {
    console.log('Starting contract generation...');
    
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

    // Add validation for required fields to prevent future errors
    if (!data.contractInfo) {
      throw new Error('Missing contractInfo in request body');
    }
    const { clientName = 'unknown-client', projectAddress = 'unknown-address' } = data.contractInfo;

    console.log('Getting contract number...');
    const counterRef = adminDb.doc(`users/${uid}/counters/contract`);
    const counterDoc = await counterRef.get();
    let count = 1;
    if (counterDoc.exists) {
      count = (counterDoc.data()?.count || 0) + 1;
    }
    await counterRef.set({ count }, { merge: true });

    console.log('Generating HTML...');
    const html = getContractHtml(data);

    console.log('Launching browser...');
    if (process.env.NODE_ENV === 'development') {
      console.log('Using local playwright...');
      browser = await playwrightChromium.launch({ headless: true });
    } else {
      console.log('Using sparticuz-chromium...');
      browser = await playwrightCoreChromium.launch({
        args: sparticuzChromium.args,
        executablePath: await sparticuzChromium.executablePath(),
        headless: true,
      });
    }

    console.log('Creating page...');
    const page = await browser.newPage({
      ignoreHTTPSErrors: true,
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    console.log('Setting content...');
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: true,
    });

    console.log('Closing browser...');
    await browser.close();
    browser = null;

    console.log('PDF generated successfully, size:', pdfBuffer.length);

    const base64Pdf = pdfBuffer.toString('base64');

    // Use fallbacks and ensure strings before replace
    const safeClientName = (clientName || 'unknown').replace(/[^a-zA-Z0-9]/g, '-');
    const safeClientAddress = (projectAddress || 'unknown').replace(/[^a-zA-Z0-9]/g, '-');

    return NextResponse.json(
      {
        success: true,
        pdf: base64Pdf,
        filename: `contract-${safeClientName}-${safeClientAddress}.pdf`,
        size: pdfBuffer.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in generate-contract API:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate contract',
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}