import { AuthUser, UserRole } from "../types/field-service";

/**
 * Extracts authenticated user context from HTTP headers.
 * Supports development mock headers:
 * - x-user-id
 * - x-user-role (MANAGER | TECHNICIAN | CUSTOMER | ADMIN)
 * - x-user-name
 * - x-user-email
 * - x-company-id
 * - x-technician-id
 * - x-customer-id
 *
 * Defaults to Manager role on comp-apex-01 if unspecified.
 */
export function extractAuthUser(request: Request): AuthUser {
  const headers = request.headers;

  const role = (headers.get("x-user-role")?.toUpperCase() as UserRole) || "MANAGER";
  const id = headers.get("x-user-id") || "user-manager-1";
  const name = headers.get("x-user-name") || "Operations Manager";
  const email = headers.get("x-user-email") || "manager@apex-facilities.com";
  const companyId = headers.get("x-company-id") || "comp-apex-01";
  const technicianId = headers.get("x-technician-id") || (role === "TECHNICIAN" ? id : undefined);
  const customerId = headers.get("x-customer-id") || (role === "CUSTOMER" ? id : undefined);

  return {
    id,
    name,
    email,
    role,
    companyId,
    technicianId,
    customerId,
  };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function errorResponse(err: unknown): Response {
  if (typeof err === "object" && err !== null && "status" in err) {
    const errorObj = err as { status?: number; code?: string; message?: string };
    const status = errorObj.status || 500;
    return new Response(JSON.stringify(errorObj), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  return new Response(JSON.stringify({ status: 500, code: "SERVER_ERROR", message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
