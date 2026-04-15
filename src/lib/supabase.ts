import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** OAuth redirect for Supabase: custom scheme on native iOS, web origin elsewhere. */
export function getOAuthRedirectUrl(): string {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    return "com.pace.runapp://";
  }
  return `${window.location.origin}/`;
}
