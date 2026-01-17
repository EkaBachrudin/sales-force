import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a random refresh token
 * @returns Random 64-character hex string
 */
export const generateRefreshToken = (): string => {
  return Buffer.from(`${Date.now()}-${Math.random()}-${crypto.randomUUID()}`).toString('base64');
};

/**
 * Hash a refresh token
 * @param token - Refresh token
 * @returns Hashed token
 */
export const hashRefreshToken = async (token: string): Promise<string> => {
  return await bcrypt.hash(token, SALT_ROUNDS);
};

/**
 * Verify a refresh token against a hash
 * @param token - Plain text refresh token
 * @param hash - Hashed refresh token
 * @returns True if token matches hash
 */
export const verifyRefreshToken = async (token: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(token, hash);
};
