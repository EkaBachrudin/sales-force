import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/submit-interest
 * API endpoint untuk handle form submission "Saya Tertarik!" dari features page
 * Data akan diteruskan ke Google Sheets via Google Apps Script
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, whatsapp, message } = body;

    // Validate required fields
    if (!email || !whatsapp) {
      return NextResponse.json(
        { error: 'Email dan WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    // Google Apps Script Web App URL
    // Ganti dengan URL dari Google Apps Script yang sudah di-deploy
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

    if (!GOOGLE_SCRIPT_URL) {
      console.error('GOOGLE_SCRIPT_URL is not configured');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Prepare data for Google Sheets
    const formData = new FormData();
    formData.append('email', email);
    formData.append('whatsapp', whatsapp);
    formData.append('message', message || '');
    formData.append('timestamp', new Date().toISOString());
    formData.append('source', 'features_page');

    // Send to Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to send data to Google Sheets');
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil disimpan'
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Submit interest form API. Use POST to submit interest form.'
  });
}
