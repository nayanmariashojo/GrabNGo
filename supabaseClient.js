import { createClient } from "@supabase/supabase-js";
import { runtimeConfig } from "./runtimeConfig";

// Read credentials from environment variables (prefixed with VITE_ so Vite exposes them)
const supabaseUrl = runtimeConfig.supabaseUrl;
const supabaseAnonKey = runtimeConfig.supabaseAnonKey;

const isPlaceholderUrl =
  typeof supabaseUrl === "string" &&
  (supabaseUrl.includes("your-project-id") || supabaseUrl.includes("<"));

const isPlaceholderKey =
  typeof supabaseAnonKey === "string" &&
  (supabaseAnonKey.includes("your-anon-key") || supabaseAnonKey.includes("<"));

const looksLikeSupabaseUrl =
  typeof supabaseUrl === "string" &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl);

const hasWorkingSupabaseConfig =
  runtimeConfig.supabaseConfigured &&
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  looksLikeSupabaseUrl &&
  !isPlaceholderUrl &&
  !isPlaceholderKey;

if (!runtimeConfig.demoMode && !hasWorkingSupabaseConfig) {
  // Don't crash the whole UI; allow the app to render and surface fetch errors.
  // Login/data calls will fail until real Supabase credentials are provided.
  console.warn(
    "Supabase is not configured. Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart `npm run dev`."
  );
}

// Single shared Supabase client instance used throughout the app.
// In demo mode, this is a harmless dummy client that should not be used.
const effectiveUrl = hasWorkingSupabaseConfig
  ? supabaseUrl
  : "https://dummy.supabase.co";
const effectiveAnonKey = hasWorkingSupabaseConfig ? supabaseAnonKey : "dummy";

export const supabase = createClient(effectiveUrl, effectiveAnonKey);


