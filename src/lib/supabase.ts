import { createClient } from "@supabase/supabase-js";
import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role (full access)
// Uses fallback to anon key on client side to prevent crash during module evaluation
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// Client-side client with anon key (RLS enforced)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Browser client for client components (cookie-based auth)
export function createBrowserClient() {
  return createSSRBrowserClient(supabaseUrl, supabaseAnonKey);
}
