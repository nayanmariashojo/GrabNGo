// Central place for runtime feature flags / environment detection.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminEmailAllowlistRaw = import.meta.env.VITE_ADMIN_EMAIL_ALLOWLIST;

const parseCsv = (value) => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
};

const isLikelyPlaceholder = (value) => {
  if (!value || typeof value !== "string") return true;
  const v = value.trim();
  if (!v) return true;
  return (
    v.includes("your-project-id") ||
    v.includes("your-anon-key") ||
    v.includes("placeholder")
  );
};

export const runtimeConfig = {
  supabaseUrl,
  supabaseAnonKey,
  // Whether Supabase credentials are configured (non-placeholder).
  supabaseConfigured:
    !isLikelyPlaceholder(supabaseUrl) && !isLikelyPlaceholder(supabaseAnonKey),
  // Demo mode must be enabled explicitly.
  demoMode: String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true",
  adminSignupCode: import.meta.env.VITE_ADMIN_SIGNUP_CODE,
  studentSignupCode: import.meta.env.VITE_STUDENT_SIGNUP_CODE,
  staffSignupCode: import.meta.env.VITE_STAFF_SIGNUP_CODE,
  // Comma-separated list of allowed admin emails (e.g. "a@x.com,b@y.com").
  adminEmailAllowlist: parseCsv(adminEmailAllowlistRaw),
};


