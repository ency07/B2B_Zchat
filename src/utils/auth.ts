import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { queryOne } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!!"
);

const SESSION_COOKIE = "erp_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ==========================================
// Password hashing
// ==========================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==========================================
// JWT Session management
// ==========================================

export interface SessionPayload {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setJti(uuidv4())
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ==========================================
// Auth database operations
// ==========================================

export async function getUserByEmail(email: string) {
  return queryOne<{
    id: string;
    email: string;
    password_hash: string;
    name: string;
    tenant_id: string;
    is_active: boolean;
  }>(
    `SELECT u.id, u.email, u.password_hash, u.name, u.tenant_id, u.is_active
     FROM users u
     WHERE u.email = $1 AND u.deleted_at IS NULL
     LIMIT 1`,
    email.toLowerCase().trim()
  );
}

export async function getUserRole(userId: string, tenantId: string) {
  return queryOne<{ role_name: string }>(
    `SELECT r.name as role_name
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1 AND ur.tenant_id = $2
     LIMIT 1`,
    userId,
    tenantId
  );
}

// ==========================================
// RBAC permission check
// ==========================================

export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<string[]> {
  // Direct role permissions + individual user permissions
  const rows = await queryOne<{ permissions: string[] }>(
    `SELECT array_agg(DISTINCT p.name) as permissions
     FROM (
       -- Role-based permissions
       SELECT p.name
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2
       UNION
       -- Direct user permissions
       SELECT p.name
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1 AND up.tenant_id = $2
     ) sub`,
    userId,
    tenantId
  );

  return rows?.permissions || [];
}

export async function hasPermission(
  userId: string,
  tenantId: string,
  permission: string
): Promise<boolean> {
  const perms = await getUserPermissions(userId, tenantId);
  return perms.includes(permission);
}
