import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key';
// const JWT_ACCESS_EXPIRY = '15m'; // 15 minutes
const JWT_REFRESH_EXPIRY_DAYS = 7; // 7 days

/**
 * Generate an access token (JWT)
 * @param payload - User data to encode in token (must include session_id)
 * @returns JWT access token
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>): string => {
  const jti = `${Date.now()}-${payload.sub}-${Math.random().toString(36).substring(2)}`;
  const fullPayload: JwtPayload = {
    ...payload,
    jti,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };

  return jwt.sign(fullPayload, JWT_SECRET, { algorithm: 'HS256' });
};

/**
 * Verify and decode an access token
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Get token expiration time for refresh token cookie
 * @returns Max age in milliseconds (7 days)
 */
export const getRefreshTokenMaxAge = (): number => {
  return JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
};

/**
 * Get token expiration time for access token cookie
 * @returns Max age in milliseconds (15 minutes)
 */
export const getAccessTokenMaxAge = (): number => {
  return 15 * 60 * 1000;
};

/**
 * Get CSRF token max age
 * @returns Max age in milliseconds (15 minutes)
 */
export const getCsrfTokenMaxAge = (): number => {
  return 15 * 60 * 1000;
};
