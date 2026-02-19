/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize email address
 */
export function validateEmail(email: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const sanitized = sanitizeString(email.trim(), 254); // Max email length per RFC

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Double dots
    /@.*@/,  // Multiple @ symbols
    /\+.*@/, // Plus addressing (often used for spam)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, error: 'Invalid email format' };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize WhatsApp number
 */
export function validateWhatsApp(phone: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'WhatsApp number is required' };
  }

  const sanitized = sanitizeString(phone.trim(), 20);

  // Remove common separators and spaces
  const cleaned = sanitized.replace(/[\s\-\(\)\+]/g, '');

  // Indonesian phone number validation (starts with 08, 628, or +628)
  // Length should be between 10-15 digits after cleaning
  const phoneRegex = /^(\+?62|0)[0-9]{9,13}$/;

  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid WhatsApp number format. Use format: 08123456789' };
  }

  return { valid: true, sanitized: cleaned };
}

/**
 * Validate message text
 */
export function validateMessage(message: string, maxLength: number = 200): { valid: boolean; sanitized?: string; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: true, sanitized: '' }; // Message is optional
  }

  const sanitized = sanitizeString(message.trim(), maxLength);

  // Check for suspicious patterns (SQL injection attempts, etc.)
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|SCRIPT)\b)/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/i, // Event handlers like onclick=
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return { valid: false, error: 'Message contains invalid content' };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Validate honeypot field (should be empty)
 */
export function validateHoneypot(value: any): { valid: boolean; error?: string } {
  // If honeypot has any value, it's likely a bot
  if (value && (typeof value === 'string' ? value.trim() : true)) {
    return { valid: false, error: 'Suspicious activity detected' };
  }
  return { valid: true };
}

/**
 * Validate CSRF token (basic implementation)
 */
export function validateCSRFToken(token: string | null, sessionToken: string | null): { valid: boolean; error?: string } {
  if (!token || !sessionToken) {
    return { valid: false, error: 'Invalid security token' };
  }

  if (token !== sessionToken) {
    return { valid: false, error: 'Security token mismatch' };
  }

  // Check token age (should be within 1 hour)
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    const tokenAge = Date.now() - tokenData.timestamp;

    if (tokenAge > 3600000) { // 1 hour
      return { valid: false, error: 'Security token expired' };
    }
  } catch {
    return { valid: false, error: 'Invalid security token' };
  }

  return { valid: true };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const tokenData = {
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}
