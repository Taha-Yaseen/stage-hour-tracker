import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function isConfigured(): boolean {
  return Boolean(url && key);
}

export const supabase: SupabaseClient | null = isConfigured()
  ? createClient(url, key)
  : null;
