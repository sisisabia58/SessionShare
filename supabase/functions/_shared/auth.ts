import { createUserClient, createAdminClient } from "./supabase-client.ts";
import { createErrorResponse } from "./errors.ts";
import type { AuthenticatedUser, UserRole } from "./types.ts";

export async function getAuthenticatedUser(
  req: Request,
): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: createErrorResponse(401, "UNAUTHORIZED", "Missing or invalid authorization header"),
    };
  }

  const supabase = createUserClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: createErrorResponse(401, "UNAUTHORIZED", "Invalid or expired token"),
    };
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: createErrorResponse(500, "INTERNAL_ERROR", "Failed to fetch user profile"),
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      role: profile.role as UserRole,
    },
  };
}

export function requireRole(
  user: AuthenticatedUser,
  requiredRole: UserRole,
): Response | null {
  if (user.role !== requiredRole) {
    return createErrorResponse(
      403,
      "FORBIDDEN",
      `This endpoint requires '${requiredRole}' role`,
    );
  }
  return null;
}
