import { NextRequest, NextResponse } from 'next/server';
import { submitInterestLimiter } from '@/lib/security/rate-limiter';
import {
  validateEmail,
  validateWhatsApp,
  validateMessage,
  validateHoneypot,
  validateCSRFToken,
  getClientIP
} from '@/lib/security/validation';

/**
 * Blocked IPs storage (in production, use Redis or database)
 */
const blockedIPs = new Map<string, { until: number; reason: string }>();

/**
 * Suspicious patterns for additional detection
 */
const SUSPICIOUS_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b)/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /eval\(/i,
  /document\./i,
  /window\./i,
];

/**
 * Check if IP is blocked
 */
function isIPBlocked(ip: string): { blocked: boolean; reason?: string; retryAfter?: number } {
  const blockEntry = blockedIPs.get(ip);
  if (blockEntry && blockEntry.until > Date.now()) {
    return {
      blocked: true,
      reason: blockEntry.reason,
      retryAfter: Math.ceil((blockEntry.until - Date.now()) / 1000)
    };
  }
  if (blockEntry && blockEntry.until <= Date.now()) {
    blockedIPs.delete(ip);
  }
  return { blocked: false };
}

/**
 * Block an IP address
 */
function blockIP(ip: string, reason: string, durationMs: number = 3600000): void {
  blockedIPs.set(ip, {
    until: Date.now() + durationMs,
    reason
  });
}

/**
 * POST /api/submit-interest
 * API endpoint untuk handle form submission "Saya Tertarik!" dari features page
 * Data akan diteruskan ke Google Sheets via Google Apps Script
 *
 * Security measures:
 * - Rate limiting (5 requests per minute per IP)
 * - Input sanitization and validation
 * - Honeypot field for bot detection
 * - CSRF token validation
 * - IP-based blocking
 * - Request timeout protection
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get client IP
    const clientIP = getClientIP(request);

    // Check if IP is blocked
    const ipCheck = isIPBlocked(clientIP);
    if (ipCheck.blocked) {
      const headers = new Headers();
      headers.set('Retry-After', ipCheck.retryAfter?.toString() || '300');
      headers.set('X-RateLimit-Limit', '5');
      headers.set('X-RateLimit-Remaining', '0');

      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        {
          status: 429,
          headers
        }
      );
    }

    // Rate limiting check
    const rateLimit = submitInterestLimiter.check(clientIP);
    if (!rateLimit.allowed) {
      const headers = new Headers();
      headers.set('Retry-After', rateLimit.retryAfter?.toString() || '300');
      headers.set('X-RateLimit-Limit', '5');
      headers.set('X-RateLimit-Remaining', '0');

      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.' },
        {
          status: 429,
          headers
        }
      );
    }

    // Parse request body with timeout
    const bodyPromise = request.json();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    let body: any;
    try {
      body = await Promise.race([bodyPromise, timeoutPromise]) as { email: string; whatsapp: string; message?: string; website?: string; csrfToken?: string };
    } catch {
      blockIP(clientIP, 'Request timeout', 300000); // Block for 5 minutes
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }

    const { email, whatsapp, message, website, csrfToken } = body;

    // Validate honeypot field (should be empty or not present)
    const honeypotCheck = validateHoneypot(website);
    if (!honeypotCheck.valid) {
      // Block bot IPs
      blockIP(clientIP, 'Honeypot triggered', 1800000); // Block for 30 minutes
      console.warn(`Bot detected from IP: ${clientIP} (honeypot filled)`);
      return NextResponse.json(
        { error: honeypotCheck.error },
        { status: 400 }
      );
    }

    // Validate CSRF token (basic implementation)
    if (csrfToken) {
      const sessionToken = request.headers.get('x-csrf-token');
      const csrfCheck = validateCSRFToken(csrfToken, sessionToken);
      if (!csrfCheck.valid) {
        return NextResponse.json(
          { error: csrfCheck.error },
          { status: 403 }
        );
      }
    }

    // Validate and sanitize email
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { error: emailCheck.error || 'Email tidak valid' },
        { status: 400 }
      );
    }

    // Validate and sanitize WhatsApp
    const whatsappCheck = validateWhatsApp(whatsapp);
    if (!whatsappCheck.valid) {
      return NextResponse.json(
        { error: whatsappCheck.error || 'Nomor WhatsApp tidak valid' },
        { status: 400 }
      );
    }

    // Validate and sanitize message
    const messageCheck = validateMessage(message || '');
    if (!messageCheck.valid) {
      return NextResponse.json(
        { error: messageCheck.error || 'Pesan tidak valid' },
        { status: 400 }
      );
    }

    // Additional security checks
    const combinedInput = `${emailCheck.sanitized} ${whatsappCheck.sanitized} ${messageCheck.sanitized || ''}`;
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(combinedInput)) {
        blockIP(clientIP, 'Malicious input detected', 3600000); // Block for 1 hour
        console.warn(`Malicious input detected from IP: ${clientIP}`);
        return NextResponse.json(
          { error: 'Input tidak valid' },
          { status: 400 }
        );
      }
    }

    // Google Apps Script Web App URL
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

    if (!GOOGLE_SCRIPT_URL) {
      console.error('GOOGLE_SCRIPT_URL is not configured');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Prepare sanitized data for Google Sheets
    const formData = new FormData();
    formData.append('email', emailCheck.sanitized!);
    formData.append('whatsapp', whatsappCheck.sanitized!);
    formData.append('message', messageCheck.sanitized || '');
    formData.append('timestamp', new Date().toISOString());
    formData.append('source', 'features_page');
    formData.append('ip_address', clientIP);

    // Send to Google Apps Script with timeout
    const fetchPromise = fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    const fetchTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('External service timeout')), 15000)
    );

    const response = await Promise.race([fetchPromise, fetchTimeout]) as Response;

    if (!response.ok) {
      throw new Error('Failed to send data to Google Sheets');
    }

    // Log successful submission for monitoring
    const duration = Date.now() - startTime;
    console.log(`Form submitted successfully from IP: ${clientIP} (${duration}ms)`);

    // Get remaining rate limit
    const status = submitInterestLimiter.getStatus(clientIP);

    const headers = new Headers();
    headers.set('X-RateLimit-Limit', '5');
    headers.set('X-RateLimit-Remaining', status.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(status.resetTime).toISOString());

    return NextResponse.json({
      success: true,
      message: 'Data berhasil disimpan'
    }, {
      headers
    });

  } catch (error) {
    console.error('Error submitting form:', error);

    // Don't block on server errors, but log them
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
