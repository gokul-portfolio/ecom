import { SignJWT, jwtVerify, JWTPayload } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "enterprise-ecommerce-secret-key-32-chars-min";
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface AdminTokenPayload extends JWTPayload {
  adminId: string;
  email: string;
  fullName: string;
  departmentCode: string;
  departmentName: string;
  roleSlug: string;
  roleName: string;
  permissions: string[];
  hasCompletedOnboarding: boolean;
}

export interface CustomerTokenPayload extends JWTPayload {
  customerId: string;
  email: string;
  firstName: string;
}

/**
 * Signs an Edge-compatible JWT for an administrative staff user
 */
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setSubject(payload.adminId)
    .sign(JWT_KEY);
}

/**
 * Verifies an administrative JWT at the Edge or Node.js runtime
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Signs an Edge-compatible JWT for a storefront customer
 */
export async function signCustomerToken(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setSubject(payload.customerId)
    .sign(JWT_KEY);
}

/**
 * Verifies a customer JWT at the Edge or Node.js runtime
 */
export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    return payload as CustomerTokenPayload;
  } catch {
    return null;
  }
}
