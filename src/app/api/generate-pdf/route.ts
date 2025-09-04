// src/app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { SavingsReportPDF } from '@/lib/pdf/SavingsReportPDF';
import { processPDFData } from '@/lib/pdf/pdf-data-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Prosessoi data mappingien mukaan
    const pdfData = await processPDFData(formData);
    
    // Generoi PDF
    // Render the component to get the Document element
    const component = React.createElement(SavingsReportPDF, { data: pdfData });
    // The pdf() function expects the Document element directly,
    // so we need to pass the rendered result (which is a Document)
    const asPdf = pdf(component as any);
    const bufferStream = await asPdf.toBuffer();
    // Convert ReadableStream to Buffer
    const chunks = [];
    for await (const chunk of bufferStream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Palauta PDF
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="saastolaskelma-${pdfData.calculationNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}