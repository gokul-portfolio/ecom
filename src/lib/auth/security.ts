import bcrypt from "bcryptjs";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password using bcrypt with 12 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain-text password with a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Cookie security options for Admin Portal (Strict, HttpOnly, 8-hour shift lifetime)
 */
export function getAdminCookieOptions(): Partial<ResponseCookie> {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
  };
}

/**
 * Cookie security options for Storefront Customers (Lax for 3D-Secure payment returns, 30 days)
 */
export function getCustomerCookieOptions(): Partial<ResponseCookie> {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };
}
