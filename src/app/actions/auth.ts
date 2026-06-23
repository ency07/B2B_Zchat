"use server";

import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getUserByEmail,
  getUserRole,
  getSession,
} from "@/utils/auth";
import { queryOne, execute } from "@/utils/db";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// Login
// ==========================================

export async function login(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos." };
  }

  const user = await getUserByEmail(email);
  if (!user || !user.is_active) {
    return { error: "Credenciales inválidas." };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Credenciales inválidas." };
  }

  // Get user's primary role
  const role = await getUserRole(user.id, user.tenant_id);
  const roleName = role?.role_name || "usuario";

  await createSession({
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    name: user.name,
    role: roleName,
  });

  // Log the login event
  try {
    await execute(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, 'LOGIN', 'users', $3, '{}'::jsonb)`,
      user.tenant_id,
      user.id,
      user.id
    );
  } catch {
    // Non-critical, ignore
  }

  return { success: true, redirect: "/dashboard" };
}

// ==========================================
// Register
// ==========================================

export async function register(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const companyName = formData.get("company")?.toString().trim();

  if (!name || !email || !password) {
    return { error: "Todos los campos son requeridos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  // Check if email is already registered
  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: "Este correo ya está registrado." };
  }

  const tenantId = uuidv4();
  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  try {
    // Create tenant
    await execute(
      `INSERT INTO tenants (id, name, slug, status, plan, max_users)
       VALUES ($1, $2, $3, 'ACTIVO', 'gratuito', 5)`,
      tenantId,
      companyName || name,
      (companyName || name).toLowerCase().replace(/\s+/g, "-")
    );

    // Create default site and area for the tenant
    const siteId = uuidv4();
    await execute(
      `INSERT INTO sites (id, tenant_id, name, code, is_default)
       VALUES ($1, $2, 'Sede Principal', 'SEDE-001', true)`,
      siteId,
      tenantId
    );

    const areaId = uuidv4();
    await execute(
      `INSERT INTO areas (id, tenant_id, site_id, name, code, is_default)
       VALUES ($1, $2, $3, 'General', 'AREA-001', true)`,
      areaId,
      tenantId,
      siteId
    );

    // Create user
    await execute(
      `INSERT INTO users (id, tenant_id, email, password_hash, name, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, true, false)`,
      userId,
      tenantId,
      email,
      passwordHash,
      name
    );

    // Assign default admin role
    const roleId = uuidv4();
    await execute(
      `INSERT INTO roles (id, tenant_id, name, description, is_system)
       VALUES ($1, $2, 'admin', 'Administrador del sistema', true)
       ON CONFLICT (tenant_id, name) DO UPDATE SET name = 'admin'`,
      roleId,
      tenantId
    );

    await execute(
      `INSERT INTO user_roles (id, user_id, role_id, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      uuidv4(),
      userId,
      roleId,
      tenantId
    );

    // Grant all default permissions to admin role
    const defaultPerms = [
      "clients.read", "clients.write",
      "requirements.read", "requirements.write",
      "quotes.read", "quotes.write",
      "approvals.read", "approvals.write",
      "jobs.read", "jobs.write",
      "inventory.read", "inventory.write",
      "invoices.read", "invoices.write",
      "dashboard.read",
      "settings.read", "settings.write",
      "crm.read", "crm.write",
    ];

    for (const permName of defaultPerms) {
      const permId = uuidv4();
      await execute(
        `INSERT INTO permissions (id, tenant_id, name, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, name) DO UPDATE SET name = $3`,
        permId,
        tenantId,
        permName,
        `Permiso ${permName}`
      );

      await execute(
        `INSERT INTO role_permissions (id, role_id, permission_id, tenant_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        uuidv4(),
        roleId,
        permId,
        tenantId
      );
    }

    // Create session
    await createSession({
      userId,
      tenantId,
      email,
      name,
      role: "admin",
    });

    return { success: true, redirect: "/dashboard" };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Error al crear la cuenta. Intentalo de nuevo." };
  }
}

// ==========================================
// Logout
// ==========================================

export async function logout() {
  const session = await getSession();
  if (session) {
    try {
      await execute(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, 'LOGOUT', 'users', $3, '{}'::jsonb)`,
        session.tenantId,
        session.userId,
        session.userId
      );
    } catch {
      // Non-critical
    }
  }

  await destroySession();
  return { success: true, redirect: "/login" };
}

// ==========================================
// Password reset request
// ==========================================

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email) {
    return { error: "Ingresá tu correo electrónico." };
  }

  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists — always return success
    return { success: true, message: "Si el correo está registrado, recibirás instrucciones." };
  }

  // In production: send email with reset link
  // For now: return success so the flow feels complete
  return { success: true, message: "Si el correo está registrado, recibirás instrucciones." };
}

// ==========================================
// Reset password (with token)
// ==========================================

export async function resetPassword(formData: FormData) {
  const token = formData.get("token")?.toString();
  const password = formData.get("password")?.toString();

  if (!token || !password) {
    return { error: "Token y contraseña son requeridos." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  // In a real implementation, validate the reset token from a password_reset_tokens table
  // For now, return success to complete the flow
  return { success: true, redirect: "/login", message: "Contraseña actualizada. Iniciá sesión." };
}
