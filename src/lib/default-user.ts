import { supabaseAdmin } from "./supabase";

/**
 * Default placeholder user for unauthenticated mode.
 * All tenant-scoped tables reference this user until real auth is added.
 */
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

let ensured = false;

/**
 * Ensures the default placeholder user exists in the users table.
 * Idempotent — only runs the upsert once per server lifetime.
 */
export async function ensureDefaultUser(): Promise<void> {
  if (ensured) return;

  const { error } = await supabaseAdmin.from("users").upsert(
    {
      id: DEFAULT_USER_ID,
      email: "demo@bakery.local",
      name: "Demo Baker",
      business_name: "My Bakery",
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Failed to ensure default user:", error.message);
    throw error;
  }

  ensured = true;
}
