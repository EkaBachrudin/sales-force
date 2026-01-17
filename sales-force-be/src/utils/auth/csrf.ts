import { randomBytes } from 'crypto';

/**
 * Generate a random CSRF token
 * @returns Random 32-byte hex string
 */
export const generateCsrfToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Generate a random token for general use
 * @param bytes - Number of bytes to generate (default: 32)
 * @returns Random hex string
 */
export const generateRandomToken = (bytes: number = 32): string => {
  return randomBytes(bytes).toString('hex');
};
