import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { runtimeConfig } from "./runtimeConfig";
import { mockUsers, persistMockUsers } from "./mockData";

// ---------------------------------------------------------------
// AuthContext — provides session, user profile, and auth helpers.
// Backed by Supabase Auth + public.users profile table.
// ---------------------------------------------------------------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // App profile (public.users)
  const [loading, setLoading] = useState(true);

  const DEMO_SESSION_KEY = "cfc_demo_session_user";

  const readDemoSession = () => {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeDemoSession = (profile) => {
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const clearDemoSession = () => {
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const loadProfile = async (authUserId) => {
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,phone,role,is_active,created_at")
      .eq("id", authUserId)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  // Admin access is controlled by the admin signup code (during account creation).
  // We intentionally do NOT restrict admin signup/login by email allowlist.

  const getRoleAccessCode = (role) => {
    if (role === 'student') return runtimeConfig.studentSignupCode;
    if (role === 'staff') return runtimeConfig.staffSignupCode;
    return null;
  };

  const assertRoleAccessCodeValid = (role, providedCode, { purpose }) => {
    // purpose: 'signup' (used for error strings)
    if (!['student', 'staff'].includes(role)) return;
    const expected = getRoleAccessCode(role);
    if (!expected) {
      throw new Error(
        `${role[0].toUpperCase() + role.slice(1)} ${purpose} code is not configured. Set VITE_${role.toUpperCase()}_SIGNUP_CODE in .env and restart the dev server.`
      );
    }
    if (!providedCode) {
      throw new Error(`${role[0].toUpperCase() + role.slice(1)} ${purpose} code is required.`);
    }
    if (String(providedCode).trim() !== String(expected).trim()) {
      throw new Error(`Invalid ${role} ${purpose} code.`);
    }
  };

  const repairDemoAdminAccess = () => {
    // In demo mode we keep allowlisted admin accounts always enabled/admin
    // to avoid accidentally locking out the only admin.
    if (!runtimeConfig.demoMode) return;
    const allowlist = runtimeConfig.adminEmailAllowlist || [];
    if (!allowlist.length) return;

    let changed = false;
    for (const allowedEmail of allowlist) {
      const idx = mockUsers.findIndex(
        (u) => String(u.email || "").trim().toLowerCase() === allowedEmail
      );
      if (idx === -1) continue;
      const existing = mockUsers[idx];
      const next = {
        ...existing,
        role: 'admin',
        is_active: true,
      };
      const sameRole = String(existing.role) === String(next.role);
      const sameActive = Boolean(existing.is_active) === Boolean(next.is_active);
      if (!sameRole || !sameActive) {
        mockUsers[idx] = next;
        changed = true;
      }
    }

    if (changed) persistMockUsers();
  };

  const ensureProfile = async (authUser, fallbackRole = 'student') => {
    const existing = await loadProfile(authUser.id);
    if (existing) return existing;

    const nameFromMeta = authUser.user_metadata?.name;
    const phoneFromMeta = authUser.user_metadata?.phone;
    const roleFromMeta = authUser.user_metadata?.role;
    const role = ['student', 'staff', 'admin'].includes(roleFromMeta)
      ? roleFromMeta
      : fallbackRole;

    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      name: nameFromMeta || authUser.email?.split('@')?.[0] || 'User',
      email: authUser.email,
      phone: phoneFromMeta || null,
      role,
      is_active: true,
    });

    if (insertError) {
      // If insert is blocked (RLS/duplicate), still try to read again.
      const profile = await loadProfile(authUser.id);
      return profile;
    }

    return loadProfile(authUser.id);
  };

  const waitForProfile = async (authUserId, { attempts = 10, delayMs = 200 } = {}) => {
    for (let i = 0; i < attempts; i += 1) {
      const profile = await loadProfile(authUserId);
      if (profile) return profile;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  };

  // Restore session on mount + keep in sync
  useEffect(() => {
    let mounted = true;

    if (runtimeConfig.demoMode) {
      repairDemoAdminAccess();
      const demoUser = readDemoSession();
      setUser(demoUser);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const init = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setUser(null);
        setLoading(false);
        return;
      }

      const sessionUser = data.session?.user;
      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await ensureProfile(sessionUser, 'student');
        setUser(profile || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const authUser = session?.user;
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profile = await ensureProfile(authUser, 'student');
        setUser(profile || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /** Sign in with email + password + expected role */
  const signIn = async (email, password, expectedRole) => {
    if (runtimeConfig.demoMode) {
      repairDemoAdminAccess();
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!normalizedEmail) throw new Error("Email is required");
      if (!password) throw new Error("Password is required");

      const profile = mockUsers.find(
        (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
      );
      if (!profile || !profile.demo_password) {
        throw new Error("No account found. Please create an account first.");
      }
      if (String(profile.demo_password) !== String(password)) {
        throw new Error("Invalid email or password");
      }
      if (profile.is_active === false) {
        throw new Error("Your account has been disabled. Contact admin.");
      }
      if (expectedRole && profile.role !== expectedRole) {
        throw new Error("Role mismatch. Please select the correct role.");
      }
      setUser(profile);
      writeDemoSession(profile);
      return profile;
    }

    if (!runtimeConfig.supabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server."
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const authUser = data.user;
    if (!authUser) throw new Error("Login failed");

    const profile = await ensureProfile(authUser, expectedRole || 'student');
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error("No profile found for this account. Contact admin.");
    }
    if (profile.is_active === false) {
      await supabase.auth.signOut();
      throw new Error("Your account has been disabled. Contact admin.");
    }
    if (expectedRole && profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error("Role mismatch. Please select the correct role.");
    }

    setUser(profile);
    return profile;
  };

  /** Sign up (creates Auth user + profile row via DB trigger) */
  const signUp = async (name, email, phone, password, role = 'student', accessCode, adminCode) => {
    assertRoleAccessCodeValid(role, accessCode, { purpose: 'signup' });

    if (role === 'admin') {
      const expectedAdminCode = runtimeConfig.adminSignupCode;
      if (!expectedAdminCode) {
        throw new Error('Admin signup is disabled. Set VITE_ADMIN_SIGNUP_CODE in .env');
      }
      if (!adminCode) {
        throw new Error('Admin code is required');
      }
      if (String(adminCode).trim() !== String(expectedAdminCode).trim()) {
        throw new Error('Invalid admin code');
      }
    }

    if (runtimeConfig.demoMode) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!normalizedEmail) throw new Error("Email is required");
      if (!password) throw new Error("Password is required");

      const normalizedRole = ["student", "staff", "admin"].includes(role)
        ? role
        : "student";

      const existingIdx = mockUsers.findIndex(
        (u) => String(u.email || "").trim().toLowerCase() === normalizedEmail
      );
      if (existingIdx !== -1) {
        const existingUser = mockUsers[existingIdx];
        if (existingUser.demo_password) {
          throw new Error("Account already exists. Please sign in.");
        }
        if (existingUser.role && existingUser.role !== normalizedRole) {
          throw new Error("Role mismatch. Please select the correct role.");
        }

        const claimed = {
          ...existingUser,
          name: name || existingUser.name,
          phone: phone || existingUser.phone || null,
          is_active: existingUser.is_active ?? true,
          demo_password: String(password),
        };
        mockUsers[existingIdx] = claimed;
        persistMockUsers();
        setUser(claimed);
        writeDemoSession(claimed);
        return claimed;
      }

      const newUser = {
        id: `u_demo_${Date.now()}`,
        name: name || normalizedEmail.split("@")[0] || "User",
        email: normalizedEmail,
        phone: phone || null,
        role: normalizedRole,
        created_at: new Date().toISOString(),
        is_active: true,
        demo_password: String(password),
      };

      mockUsers.push(newUser);
      persistMockUsers();
      setUser(newUser);
      writeDemoSession(newUser);
      return newUser;
    }

    if (!runtimeConfig.supabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role,
        },
      },
    });
    if (error) throw error;

    const authUser = data.user;
    if (!authUser) {
      throw new Error("Signup failed");
    }

    // If email confirmations are enabled, Supabase may not return a session immediately.
    if (!data.session) {
      throw new Error("Signup successful. Please verify your email, then sign in.");
    }

    const profile = await waitForProfile(authUser.id);
    if (!profile) {
      throw new Error("Account created, but profile setup is pending. Please sign in again in a moment.");
    }
    setUser(profile);
    return profile;
  };

  /** Update profile (name/phone) */
  const updateProfile = async (updates) => {
    if (runtimeConfig.demoMode) {
      if (!user?.id) throw new Error("Not logged in");
      const idx = mockUsers.findIndex((u) => u.id === user.id);
      if (idx === -1) throw new Error("User not found");
      const updated = {
        ...mockUsers[idx],
        name: updates?.name ?? mockUsers[idx].name,
        phone: updates?.phone ?? mockUsers[idx].phone,
      };
      mockUsers[idx] = updated;
      persistMockUsers();
      setUser(updated);
      writeDemoSession(updated);
      return updated;
    }

    if (!user?.id) throw new Error("Not logged in");
    const { data, error } = await supabase
      .from("users")
      .update({
        name: updates?.name ?? user.name,
        phone: updates?.phone ?? user.phone,
      })
      .eq("id", user.id)
      .select("id,name,email,phone,role,is_active,created_at")
      .single();
    if (error) throw error;
    setUser(data);
    return data;
  };

  /** Sign out */
  const signOut = async () => {
    if (runtimeConfig.demoMode) {
      clearDemoSession();
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      session: user,
      profile: user,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to consume the AuthContext */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}


