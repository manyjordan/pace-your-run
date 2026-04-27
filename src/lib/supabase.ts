import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables");
    }
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

/** Backward compat: first property access instantiates the client (not at import time). */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});

/** OAuth redirect for Supabase: app deep link on native iOS (hash tokens via appUrlOpen), web origin elsewhere. */
export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    return "com.pace.runapp://";
  }
  return `${window.location.origin}/`;
}
